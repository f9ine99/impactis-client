export type SignupRole = 'founder' | 'investor' | 'advisor'

export const SIGNUP_ROLES: SignupRole[] = ['founder', 'investor', 'advisor']

export type SignupFormPayload = {
    fullName: string
    role: string
}

const AUTH_CALLBACK_PATH = '/auth/callback'
const UPDATE_PASSWORD_PATH = '/auth/update-password'

type SignupMetadata = {
    full_name: string
    intended_org_type: 'startup' | 'investor' | 'advisor' | null
}

function isSignupRole(value: unknown): value is SignupRole {
    return typeof value === 'string' && SIGNUP_ROLES.includes(value as SignupRole)
}

function getIntendedOrgType(role: SignupRole | null): SignupMetadata['intended_org_type'] {
    if (role === 'founder') {
        return 'startup'
    }

    if (role === 'investor') {
        return 'investor'
    }

    if (role === 'advisor') {
        return 'advisor'
    }

    return null
}

function normalizeBaseUrl(value: string): string {
    return value.trim().replace(/\/+$/, '')
}

export function getSignupRoleFromSearchParams(searchParams: { get: (name: string) => string | null }): SignupRole | null {
    const roleParam = searchParams.get('role')
    return isSignupRole(roleParam) ? roleParam : null
}

export function buildSignupMetadata(formData: SignupFormPayload): SignupMetadata {
    const role = isSignupRole(formData.role) ? formData.role : null

    // This metadata only seeds `public.profiles` at signup time via DB trigger.
    // It is scrubbed from `auth.users.raw_user_meta_data` after sync.
    return {
        full_name: formData.fullName,
        intended_org_type: getIntendedOrgType(role),
    }
}

export function getAuthRedirectBaseUrl(origin: string): string {
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!configuredSiteUrl) {
        return normalizeBaseUrl(origin)
    }

    const normalizedConfiguredSiteUrl = normalizeBaseUrl(configuredSiteUrl)
    if (!normalizedConfiguredSiteUrl) {
        return normalizeBaseUrl(origin)
    }

    try {
        return new URL(normalizedConfiguredSiteUrl).origin
    } catch {
        return normalizedConfiguredSiteUrl
    }
}

export function getSignupEmailRedirectUrl(origin: string): string {
    return `${getAuthRedirectBaseUrl(origin)}${AUTH_CALLBACK_PATH}`
}

export function getSignupEmailRedirectUrlWithNext(origin: string, nextPath: string): string {
    const encodedNextPath = encodeURIComponent(nextPath)
    return `${getAuthRedirectBaseUrl(origin)}${AUTH_CALLBACK_PATH}?next=${encodedNextPath}`
}

export function getResetPasswordEmailRedirectUrl(origin: string): string {
    const nextPath = encodeURIComponent(UPDATE_PASSWORD_PATH)
    return `${getAuthRedirectBaseUrl(origin)}${AUTH_CALLBACK_PATH}?next=${nextPath}`
}

export function getPostSignupRedirectPath(nextPath?: string | null): string {
    const sanitizedNextPath = typeof nextPath === 'string' ? nextPath.trim() : ''
    if (!sanitizedNextPath) {
        return '/auth/login?registered=true'
    }

    return `/auth/login?registered=true&next=${encodeURIComponent(sanitizedNextPath)}`
}
