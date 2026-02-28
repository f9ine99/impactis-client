import type { User } from '@supabase/supabase-js'

const ADMIN_PATH = '/admin'

function getConfiguredAdminEmails(): Set<string> {
    const raw = process.env.ADMIN_EMAILS ?? ''
    const emails = raw
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0)

    return new Set(emails)
}

export function getAdminPath(): string {
    return ADMIN_PATH
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
    if (!email) {
        return false
    }

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
        return false
    }

    return getConfiguredAdminEmails().has(normalizedEmail)
}

export function isPlatformAdminUser(user: Pick<User, 'email'> | null | undefined): boolean {
    return isPlatformAdminEmail(user?.email)
}
