import { apiRequest } from '@/lib/api/rest-client'
import { getBetterAuthTokenClient } from '@/lib/better-auth-token-client'

export type SyndicateStatus = 'forming' | 'active' | 'closed' | 'cancelled'

export type SyndicateView = {
    id: string
    lead_org_id: string
    startup_org_id: string | null
    name: string
    description: string | null
    status: SyndicateStatus
    created_at: string
    updated_at: string
}

export type SyndicateMemberView = {
    id: string
    syndicate_id: string
    org_id: string
    org_name: string
    committed_usd: string | null
    status: string
    joined_at: string | null
    created_at: string
}

export type SyndicateInviteView = {
    id: string
    syndicate_id: string
    invitee_org_id: string
    invitee_org_name: string
    message: string | null
    status: string
    created_at: string
    responded_at: string | null
}

async function getAccessToken(): Promise<string | null> {
    return getBetterAuthTokenClient()
}

export async function listMySyndicates(): Promise<SyndicateView[]> {
    const token = await getAccessToken()
    if (!token) return []
    try {
        const data = await apiRequest<SyndicateView[]>({
            path: '/syndicates',
            method: 'GET',
            accessToken: token,
        })
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}

export async function createSyndicate(input: {
    name: string
    description?: string | null
    startupOrgId?: string | null
}): Promise<SyndicateView | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    try {
        const data = await apiRequest<SyndicateView>({
            path: '/syndicates',
            method: 'POST',
            accessToken: token,
            body: {
                name: input.name,
                description: input.description ?? null,
                startupOrgId: input.startupOrgId ?? null,
            },
            throwOnError: true,
        })
        if (!data) return { error: 'Failed to create syndicate' }
        return data
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Failed to create syndicate' }
    }
}

export async function getSyndicateDetails(
    syndicateId: string
): Promise<{ syndicate: SyndicateView; members: SyndicateMemberView[]; invites: SyndicateInviteView[] } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    try {
        const data = await apiRequest<{
            syndicate: SyndicateView
            members: SyndicateMemberView[]
            invites: SyndicateInviteView[]
        }>({
            path: `/syndicates/${encodeURIComponent(syndicateId)}`,
            method: 'GET',
            accessToken: token,
            throwOnError: true,
        })
        if (!data) return { error: 'Failed to load syndicate' }
        return data
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Failed to load syndicate' }
    }
}

export async function inviteToSyndicate(
    syndicateId: string,
    input: { inviteeOrgId: string; message?: string | null }
): Promise<SyndicateInviteView | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    try {
        const data = await apiRequest<SyndicateInviteView>({
            path: `/syndicates/${encodeURIComponent(syndicateId)}/invites`,
            method: 'POST',
            accessToken: token,
            body: { inviteeOrgId: input.inviteeOrgId, message: input.message ?? null },
            throwOnError: true,
        })
        if (!data) return { error: 'Failed to send invite' }
        return data
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Failed to send invite' }
    }
}

export async function acceptSyndicateInvite(inviteId: string): Promise<{ success: boolean } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    try {
        const data = await apiRequest<{ success: boolean }>({
            path: `/syndicates/invites/${encodeURIComponent(inviteId)}/accept`,
            method: 'POST',
            accessToken: token,
            body: {},
            throwOnError: true,
        })
        if (!data) return { error: 'Failed to accept' }
        return data
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Failed to accept' }
    }
}

export async function declineSyndicateInvite(inviteId: string): Promise<{ success: boolean } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    try {
        const data = await apiRequest<{ success: boolean }>({
            path: `/syndicates/invites/${encodeURIComponent(inviteId)}/decline`,
            method: 'POST',
            accessToken: token,
            body: {},
            throwOnError: true,
        })
        if (!data) return { error: 'Failed to decline' }
        return data
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Failed to decline' }
    }
}

export async function updateSyndicateStatus(
    syndicateId: string,
    status: SyndicateStatus
): Promise<{ success: boolean } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    try {
        const data = await apiRequest<{ success: boolean }>({
            path: `/syndicates/${encodeURIComponent(syndicateId)}/status`,
            method: 'PATCH',
            accessToken: token,
            body: { status },
            throwOnError: true,
        })
        if (!data) return { error: 'Failed to update status' }
        return data
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Failed to update status' }
    }
}

export async function commitToSyndicate(syndicateId: string, amountUsd: number): Promise<{ success: boolean } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    try {
        const data = await apiRequest<{ success: boolean }>({
            path: `/syndicates/${encodeURIComponent(syndicateId)}/commit`,
            method: 'POST',
            accessToken: token,
            body: { amountUsd },
            throwOnError: true,
        })
        if (!data) return { error: 'Failed to commit amount' }
        return data
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Failed to commit amount' }
    }
}
