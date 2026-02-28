const API_URL = process.env.NEXT_PUBLIC_IMPACTIS_API_URL
const ETAG_CACHE_TTL_MS = 5 * 60 * 1000
const ETAG_CACHE_MAX_ENTRIES = 1000

type EtagCacheEntry = {
    etag: string
    payload: unknown
    expiresAt: number
}

const etagCache = new Map<string, EtagCacheEntry>()

function normalizeApiBasePath(path: string): string {
    const trimmed = path.replace(/\/+$/, '')
    if (/\/api\/v\d+$/i.test(trimmed)) {
        return trimmed
    }

    if (/\/api$/i.test(trimmed)) {
        return `${trimmed}/v1`
    }

    return `${trimmed}/api/v1`
}

export function resolveApiBaseUrl(value: string | undefined): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    if (trimmed.length === 0) {
        return null
    }

    return normalizeApiBasePath(trimmed)
}

type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

function hashToken(value: string): string {
    let hash = 2166136261
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
    }

    return (hash >>> 0).toString(36)
}

function buildEtagCacheKey(url: string, accessToken?: string | null): string {
    const token =
        typeof accessToken === 'string' && accessToken.trim().length > 0
            ? hashToken(accessToken.trim())
            : 'anon'
    return `${url}::${token}`
}

function readEtagCacheEntry(key: string): EtagCacheEntry | null {
    const entry = etagCache.get(key)
    if (!entry) {
        return null
    }

    if (entry.expiresAt <= Date.now()) {
        etagCache.delete(key)
        return null
    }

    return entry
}

function pruneEtagCache(): void {
    if (etagCache.size <= ETAG_CACHE_MAX_ENTRIES) {
        return
    }

    const now = Date.now()
    for (const [key, entry] of etagCache.entries()) {
        if (entry.expiresAt <= now) {
            etagCache.delete(key)
        }
    }

    while (etagCache.size > ETAG_CACHE_MAX_ENTRIES) {
        const oldestKey = etagCache.keys().next().value
        if (!oldestKey) {
            return
        }
        etagCache.delete(oldestKey)
    }
}

function writeEtagCacheEntry(key: string, etag: string, payload: unknown): void {
    pruneEtagCache()
    etagCache.set(key, {
        etag,
        payload,
        expiresAt: Date.now() + ETAG_CACHE_TTL_MS,
    })
}

function deleteEtagCacheEntry(key: string): void {
    etagCache.delete(key)
}

export async function apiRequest<T>(input: {
    path: string
    method?: ApiMethod
    accessToken?: string | null
    body?: unknown
    throwOnError?: boolean
}): Promise<T | null> {
    const apiBaseUrl = resolveApiBaseUrl(API_URL)
    if (!apiBaseUrl) {
        if (input.throwOnError) {
            throw new Error('API base URL is not configured. Set NEXT_PUBLIC_IMPACTIS_API_URL.')
        }
        return null
    }

    const normalizedPath = input.path.startsWith('/') ? input.path : `/${input.path}`
    const method = input.method ?? 'GET'

    const url = `${apiBaseUrl}${normalizedPath}`
    const shouldUseConditionalGet = method === 'GET'
    const etagCacheKey = shouldUseConditionalGet ? buildEtagCacheKey(url, input.accessToken) : null
    const etagEntry = etagCacheKey ? readEtagCacheEntry(etagCacheKey) : null

    const headers: Record<string, string> = {}
    if (input.accessToken) {
        headers.authorization = `Bearer ${input.accessToken}`
    }
    if (etagEntry?.etag) {
        headers['if-none-match'] = etagEntry.etag
    }
    if (input.body !== undefined) {
        headers['content-type'] = 'application/json'
    }

    try {
        const requestBody = input.body === undefined ? undefined : JSON.stringify(input.body)
        const executeFetch = (requestHeaders: Record<string, string>) =>
            fetch(url, {
                method,
                headers: requestHeaders,
                body: requestBody,
                cache: 'no-store',
            })

        let response = await executeFetch(headers)
        if (response.status === 304 && etagCacheKey) {
            const cached = readEtagCacheEntry(etagCacheKey)
            if (cached) {
                writeEtagCacheEntry(etagCacheKey, cached.etag, cached.payload)
                return cached.payload as T | null
            }

            const retryHeaders = { ...headers }
            delete retryHeaders['if-none-match']
            response = await executeFetch(retryHeaders)
        }

        if (!response.ok) {
            if (input.throwOnError) {
                const rawBody = await response.text()
                let message = `Request failed (${response.status})`

                if (rawBody) {
                    try {
                        const parsed = JSON.parse(rawBody) as { message?: unknown }
                        if (typeof parsed?.message === 'string' && parsed.message.trim().length > 0) {
                            message = parsed.message.trim()
                        }
                    } catch {
                        message = rawBody
                    }
                }

                throw new Error(message)
            }

            return null
        }

        const rawBody = await response.text()
        const payload = rawBody ? (JSON.parse(rawBody) as T) : null

        if (etagCacheKey) {
            const responseEtag = response.headers.get('etag')?.trim() ?? ''
            if (responseEtag.length > 0) {
                writeEtagCacheEntry(etagCacheKey, responseEtag, payload)
            } else {
                deleteEtagCacheEntry(etagCacheKey)
            }
        }

        return payload
    } catch (error) {
        if (input.throwOnError && error instanceof Error) {
            throw error
        }

        return null
    }
}
