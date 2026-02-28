const PUBLIC_PATHS = new Set([
    '/',
    '/invite',
    '/auth/login',
    '/auth/signup',
    '/auth/signout',
    '/auth/reset-password',
    '/auth/callback',
    '/auth/update-password',
    '/auth/auth-code-error',
])

const AUTH_ENTRY_PATHS = new Set(['/auth/login', '/auth/signup'])
const WORKSPACE_PATH = '/workspace'
const ONBOARDING_PATH = '/onboarding'
const ADMIN_PATH = '/admin'

export function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.has(pathname) || pathname.startsWith('/_next')
}

export function isAuthEntryPath(pathname: string): boolean {
    return AUTH_ENTRY_PATHS.has(pathname)
}

export function getWorkspacePath(): string {
    return WORKSPACE_PATH
}

export function getAdminPath(): string {
    return ADMIN_PATH
}

export function isAdminPath(pathname: string): boolean {
    return pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`)
}

export function isWorkspacePath(pathname: string): boolean {
    return pathname === WORKSPACE_PATH
}

export function sanitizeNextPath(nextPathParam: string | null | undefined): string | null {
    if (!nextPathParam) {
        return null
    }

    if (!nextPathParam.startsWith('/') || nextPathParam.startsWith('//')) {
        return null
    }

    return nextPathParam
}

export function getPostAuthRedirectPath(hasOrganizationMembership: boolean): string {
    return hasOrganizationMembership ? WORKSPACE_PATH : ONBOARDING_PATH
}

export function getDashboardPathForRole(_role: unknown): string {
    void _role
    return WORKSPACE_PATH
}
