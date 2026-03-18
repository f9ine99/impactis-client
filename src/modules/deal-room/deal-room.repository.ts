import { getBetterAuthTokenClient } from '@/lib/better-auth-token-client'
import {
    apiFetchJson,
    isReadinessBlockedPayload,
    isCapabilityOrUsageErrorPayload,
} from '@/modules/onboarding/readiness'

export type DealRoomRequestView = {
    id: string
    startup_org_id: string
    investor_org_id: string
    status: 'pending' | 'accepted' | 'rejected'
    message: string | null
    created_at: string
    responded_at: string | null
    startup_org_name?: string
    investor_org_name?: string
}

export type DealRoomView = {
    id: string
    connection_id: string
    stage: string
    name: string | null
    description: string | null
    created_at: string
    other_org_id: string
    other_org_name: string
}

export type DealRoomParticipantView = {
    id: string
    org_id: string
    role: string
    invited_at: string
    accepted_at: string | null
    left_at: string | null
    org_name: string
}

export type DealRoomMessageView = {
    id: string
    deal_room_id: string
    sender_user_id: string
    sender_email: string | null
    body: string
    created_at: string
}

async function getAccessToken(): Promise<string | null> {
    return getBetterAuthTokenClient()
}

export async function createDealRoomRequest(params: {
    startupOrgId: string
    message?: string | null
}): Promise<DealRoomRequestView | { error: string; code?: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<DealRoomRequestView | { error: string }>({
        path: '/deal-room/requests',
        method: 'POST',
        accessToken: token,
        body: { startupOrgId: params.startupOrgId, message: params.message ?? null },
    })
    if (!res.ok && res.data) {
        if (isReadinessBlockedPayload(res.data)) {
            return {
                error: res.data.message ?? 'Complete onboarding to start a deal discussion.',
                code: res.data.code,
            }
        }
        if (isCapabilityOrUsageErrorPayload(res.data)) {
            if (res.data.code === 'USAGE_LIMIT_REACHED') {
                return {
                    error:
                        res.data.message ??
                        'You have reached the maximum number of Deal Room requests for your current plan.',
                }
            }
            if (res.data.code === 'CAPABILITY_BLOCKED') {
                return {
                    error:
                        res.data.message ??
                        'Your current plan does not allow starting Deal Room discussions. Upgrade to unlock this feature.',
                }
            }
        }
    }
    return (res.data as any) ?? { error: 'Failed to create request' }
}

export async function listIncomingDealRoomRequests(): Promise<DealRoomRequestView[]> {
    const token = await getAccessToken()
    if (!token) return []
    const res = await apiFetchJson<DealRoomRequestView[]>({
        path: '/deal-room/requests/incoming',
        method: 'GET',
        accessToken: token,
    })
    return Array.isArray(res.data) ? res.data : []
}

export async function acceptDealRoomRequest(requestId: string): Promise<{ dealRoomId: string } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<{ dealRoomId: string } | { error: string }>({
        path: `/deal-room/requests/${encodeURIComponent(requestId)}/accept`,
        method: 'POST',
        accessToken: token,
    })
    if (!res.ok && res.data && isCapabilityOrUsageErrorPayload(res.data)) {
        if (res.data.code === 'USAGE_LIMIT_REACHED') {
            return {
                error:
                    res.data.message ??
                    'You have reached the maximum number of Deal Room actions for your current plan.',
            }
        }
        if (res.data.code === 'CAPABILITY_BLOCKED') {
            return {
                error:
                    res.data.message ??
                    'Your current plan does not allow accepting Deal Room requests. Upgrade to unlock this feature.',
            }
        }
    }
    return (res.data as any) ?? { error: 'Failed to accept' }
}

export async function rejectDealRoomRequest(requestId: string, note?: string | null): Promise<{ success: boolean } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<{ success: boolean } | { error: string }>({
        path: `/deal-room/requests/${encodeURIComponent(requestId)}/reject`,
        method: 'POST',
        accessToken: token,
        body: { note: note ?? null },
    })
    if (!res.ok && res.data && isCapabilityOrUsageErrorPayload(res.data)) {
        if (res.data.code === 'USAGE_LIMIT_REACHED') {
            return {
                error:
                    res.data.message ??
                    'You have reached the maximum number of Deal Room actions for your current plan.',
            }
        }
        if (res.data.code === 'CAPABILITY_BLOCKED') {
            return {
                error:
                    res.data.message ??
                    'Your current plan does not allow rejecting Deal Room requests. Upgrade to unlock this feature.',
            }
        }
    }
    return (res.data as any) ?? { error: 'Failed to reject' }
}

export async function listDealRooms(): Promise<DealRoomView[]> {
    const token = await getAccessToken()
    if (!token) return []
    const res = await apiFetchJson<DealRoomView[]>({
        path: '/deal-room',
        method: 'GET',
        accessToken: token,
    })
    if (!res.ok && res.data && isCapabilityOrUsageErrorPayload(res.data)) {
        // For now just return empty list; containers can show upgrade CTAs based on zero rooms.
        return []
    }
    return Array.isArray(res.data) ? res.data : []
}

export async function getDealRoomDetails(dealRoomId: string): Promise<{ room: DealRoomView; participants: DealRoomParticipantView[] } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<{ room: DealRoomView; participants: DealRoomParticipantView[] } | { error: string }>({
        path: `/deal-room/${encodeURIComponent(dealRoomId)}`,
        method: 'GET',
        accessToken: token,
    })
    if (!res.ok && res.data && isCapabilityOrUsageErrorPayload(res.data)) {
        return {
            error:
                (res.data as any).message ??
                'Your current plan does not allow viewing this Deal Room. Upgrade to unlock this feature.',
        }
    }
    return (res.data as any) ?? { error: 'Failed to load room' }
}

export async function listDealRoomMessages(dealRoomId: string): Promise<DealRoomMessageView[] | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<DealRoomMessageView[] | { error: string }>({
        path: `/deal-room/${encodeURIComponent(dealRoomId)}/messages`,
        method: 'GET',
        accessToken: token,
    })
    if (!res.ok && res.data && isCapabilityOrUsageErrorPayload(res.data)) {
        return {
            error:
                (res.data as any).message ??
                'Your current plan does not allow viewing Deal Room messages. Upgrade to unlock this feature.',
        }
    }
    return (res.data as any) ?? []
}

export async function sendDealRoomMessage(dealRoomId: string, body: string): Promise<DealRoomMessageView | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<DealRoomMessageView | { error: string }>({
        path: `/deal-room/${encodeURIComponent(dealRoomId)}/messages`,
        method: 'POST',
        accessToken: token,
        body: { body },
    })
    if (!res.ok && res.data && isCapabilityOrUsageErrorPayload(res.data)) {
        return {
            error:
                (res.data as any).message ??
                'Your current plan does not allow sending Deal Room messages. Upgrade to unlock this feature.',
        }
    }
    return (res.data as any) ?? { error: 'Failed to send message' }
}

export async function updateDealRoomStage(dealRoomId: string, stage: string, note?: string | null): Promise<{ success: boolean } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<{ success: boolean } | { error: string }>({
        path: `/deal-room/${encodeURIComponent(dealRoomId)}/stage`,
        method: 'POST',
        accessToken: token,
        body: { stage, note: note ?? null },
    })
    if (!res.ok && res.data && isCapabilityOrUsageErrorPayload(res.data)) {
        return {
            error:
                (res.data as any).message ??
                'Your current plan does not allow updating Deal Room stages. Upgrade to unlock this feature.',
        }
    }
    return (res.data as any) ?? { error: 'Failed to update stage' }
}

