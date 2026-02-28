import type { User } from '@supabase/supabase-js'
import { isOnboardingPath } from '@/modules/onboarding'
import {
    getAdminPath,
    getPostAuthRedirectPath,
    isAdminPath,
    isWorkspacePath,
    isAuthEntryPath,
    isPublicPath,
} from './routing'

type MiddlewareContext = {
    pathname: string
    user: User | null
    hasOrganizationMembership: boolean
    isPlatformAdmin: boolean
}

export type MiddlewareDecision =
    | { type: 'allow' }
    | { type: 'redirect'; destination: string }

export function decideMiddlewareNavigation({
    pathname,
    user,
    hasOrganizationMembership,
    isPlatformAdmin,
}: MiddlewareContext): MiddlewareDecision {
    const publicPath = isPublicPath(pathname)

    if (!user && !publicPath) {
        return { type: 'redirect', destination: '/auth/login' }
    }

    if (!user) {
        return { type: 'allow' }
    }

    if (isAdminPath(pathname)) {
        if (isPlatformAdmin) {
            return { type: 'allow' }
        }

        return { type: 'redirect', destination: getPostAuthRedirectPath(hasOrganizationMembership) }
    }

    if (isPlatformAdmin) {
        if (isOnboardingPath(pathname) || isAuthEntryPath(pathname)) {
            return { type: 'redirect', destination: getAdminPath() }
        }

        return { type: 'allow' }
    }

    if (!hasOrganizationMembership) {
        if (isOnboardingPath(pathname)) {
            return { type: 'allow' }
        }

        if (isWorkspacePath(pathname) || isAuthEntryPath(pathname) || !publicPath) {
            return { type: 'redirect', destination: getPostAuthRedirectPath(false) }
        }

        return { type: 'allow' }
    }

    if (isOnboardingPath(pathname)) {
        return { type: 'redirect', destination: getPostAuthRedirectPath(true) }
    }

    if (isAuthEntryPath(pathname)) {
        return { type: 'redirect', destination: getPostAuthRedirectPath(true) }
    }

    return { type: 'allow' }
}
