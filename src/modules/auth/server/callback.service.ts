import type { SupabaseClient } from '@supabase/supabase-js'
import { hasOrganizationMembershipForUser } from '@/modules/organizations'
import { getPostAuthRedirectPath, sanitizeNextPath } from '../routing'

export async function resolveCallbackRedirectPath(
    supabase: SupabaseClient,
    nextPathParam: string | null
): Promise<string> {
    const safeNextPath = sanitizeNextPath(nextPathParam)
    if (safeNextPath) {
        return safeNextPath
    }

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
