import { resolveApiBaseUrl } from '@/lib/api/rest-client'

export type ReadinessBlockedPayload = {
    code: 'READINESS_BLOCKED'
    requiredScore?: number
    score?: number
    missing?: string[]
    message?: string
}

export type CapabilityOrUsageErrorPayload =
  | ReadinessBlockedPayload
  | {
        code: 'CAPABILITY_BLOCKED'
        message?: string
        featureKey?: string
        planCode?: string
    }
  | {
        code: 'USAGE_LIMIT_REACHED'
        message?: string
        featureKey?: string
        current?: number
        limit?: number | null
        planCode?: string
    }

export function isReadinessBlockedPayload(value: unknown): value is ReadinessBlockedPayload {
    if (!value || typeof value !== 'object') return false
    const v = value as any
    return v.code === 'READINESS_BLOCKED'
}

export function isCapabilityOrUsageErrorPayload(
    value: unknown
): value is CapabilityOrUsageErrorPayload {
    if (!value || typeof value !== 'object') return false
    const v = value as any
    return v.code === 'READINESS_BLOCKED' || v.code === 'CAPABILITY_BLOCKED' || v.code === 'USAGE_LIMIT_REACHED'
}

export function formatMissingChecklist(missing: string[] | null | undefined): string[] {
    if (!Array.isArray(missing)) return []
    return missing
        .map((m) => (typeof m === 'string' ? m.trim() : ''))
        .filter((m) => m.length > 0)
        .slice(0, 20)
}

export async function apiFetchJson<T>(input: {
    path: string
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    accessToken?: string | null
    body?: unknown
}): Promise<{ ok: boolean; status: number; data: T | CapabilityOrUsageErrorPayload | null }> {
    const base = resolveApiBaseUrl(process.env.NEXT_PUBLIC_IMPACTIS_API_URL)
    if (!base) {
        return { ok: false, status: 0, data: null }
    }
    const normalizedPath = input.path.startsWith('/') ? input.path : `/${input.path}`
    const url = `${base}${normalizedPath}`
    const method = input.method ?? 'GET'

    const headers: Record<string, string> = {}
    if (input.accessToken) headers.authorization = `Bearer ${input.accessToken}`
    if (input.body !== undefined) headers['content-type'] = 'application/json'

    const res = await fetch(url, {
        method,
        headers,
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
        cache: 'no-store',
        credentials: 'omit',
    })

    const raw = await res.text()
    let parsed: any = null
    if (raw) {
        try {
            parsed = JSON.parse(raw)
        } catch {
            parsed = null
        }
    }

  if (!res.ok && isCapabilityOrUsageErrorPayload(parsed)) {
    return { ok: false, status: res.status, data: parsed }
  }

  return { ok: res.ok, status: res.status, data: (parsed as T) ?? null }
}

