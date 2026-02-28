import type { AuthApiError, SupabaseClient } from '@supabase/supabase-js'
import { hasOrganizationMembershipForUser } from '@/modules/organizations'
import { getPostAuthRedirectPath } from '../routing'

type LoginErrorInput = Pick<AuthApiError, 'message' | 'code'>

export function mapLoginErrorMessage(error: LoginErrorInput): string {
    const normalizedMessage = error.message.toLowerCase()
    const normalizedCode = error.code?.toLowerCase()

    if (
        normalizedCode === 'email_not_confirmed'
        || normalizedMessage.includes('email not confirmed')
    ) {
        return 'Your email is not verified yet. Please verify your account from your inbox.'
    }

    if (
        normalizedCode === 'captcha_failed'
        || normalizedMessage.includes('captcha')
    ) {
        return 'Security check failed. Please try the captcha again.'
    }

    if (
        normalizedCode === 'invalid_credentials'
        || normalizedMessage.includes('invalid login credentials')
        || normalizedMessage.includes('invalid credentials')
    ) {
        return 'Incorrect email or password.'
    }

    return error.message
}

export async function resolvePostLoginRedirect(supabase: SupabaseClient): Promise<string> {
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return '/'
    }

    const hasOrganizationMembership = await hasOrganizationMembershipForUser(supabase, user, {
        failOpenOnRequestError: true,
    })
    return getPostAuthRedirectPath(hasOrganizationMembership)
}
