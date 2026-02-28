function normalizeOptionalText(value: string | undefined): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

export function getSupabaseUrlOrThrow(): string {
    const url = normalizeOptionalText(process.env.NEXT_PUBLIC_SUPABASE_URL)
    if (!url) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL is required.')
    }

    return url
}

export function getSupabasePublishableOrAnonKeyOrThrow(): string {
    const publishableKey = normalizeOptionalText(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    if (publishableKey) {
        return publishableKey
    }

    const anonKey = normalizeOptionalText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    if (anonKey) {
        return anonKey
    }

    throw new Error(
        'Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
}

export function getSupabaseServiceRoleKeyOrNull(): string | null {
    return normalizeOptionalText(process.env.SUPABASE_SERVICE_ROLE_KEY)
}
