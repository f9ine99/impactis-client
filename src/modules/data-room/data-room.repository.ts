import { getBetterAuthTokenClient } from '@/lib/better-auth-token-client'
import { apiFetchJson, isReadinessBlockedPayload } from '@/modules/onboarding/readiness'

export type DataRoomAccessRequestView = {
    id: string
    startup_org_id: string
    requester_org_id: string
    message: string | null
    status: 'pending' | 'approved' | 'rejected'
    reviewed_at: string | null
    review_note: string | null
    created_at: string
    startup_org_name?: string
    requester_org_name?: string
}

export type DataRoomAccessGrantView = {
    id: string
    startup_org_id: string
    grantee_org_id: string
    permission_level: 'view' | 'view_download'
    terms_accepted_at: string | null
    granted_at: string
    revoked_at: string | null
    expires_at: string | null
}

export type DataRoomFolderView = {
    id: string
    parent_id: string | null
    name: string
    created_at: string
}

export type DataRoomDocumentView = {
    id: string
    startup_org_id: string
    folder_id: string | null
    document_type: string
    title: string
    file_url: string | null
    storage_bucket: string | null
    storage_object_path: string | null
    file_name: string | null
    file_size_bytes: number | null
    content_type: string | null
    created_at: string
    updated_at: string
}

export type DataRoomContentsView = {
    startup_org_id: string
    folders: DataRoomFolderView[]
    documents: DataRoomDocumentView[]
    grant: DataRoomAccessGrantView | null
}

async function getAccessToken(): Promise<string | null> {
    return getBetterAuthTokenClient()
}

export async function requestDataRoomAccess(params: {
    startupOrgId: string
    message?: string | null
}): Promise<DataRoomAccessRequestView | { error: string; code?: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<DataRoomAccessRequestView | { error: string }>({
        path: '/data-room/access-requests',
        method: 'POST',
        accessToken: token,
        body: { startupOrgId: params.startupOrgId, message: params.message ?? null },
    })
    if (!res.ok && isReadinessBlockedPayload(res.data)) {
        return { error: res.data.message ?? 'Complete onboarding to request access.', code: res.data.code }
    }
    return (res.data as any) ?? { error: 'Failed to request access' }
}

export async function listMyDataRoomAccessRequests(): Promise<DataRoomAccessRequestView[]> {
    const token = await getAccessToken()
    if (!token) return []
    const res = await apiFetchJson<DataRoomAccessRequestView[]>({
        path: '/data-room/access-requests/mine',
        method: 'GET',
        accessToken: token,
    })
    return Array.isArray(res.data) ? res.data : []
}

export async function listIncomingDataRoomAccessRequests(): Promise<DataRoomAccessRequestView[]> {
    const token = await getAccessToken()
    if (!token) return []
    const res = await apiFetchJson<DataRoomAccessRequestView[]>({
        path: '/data-room/access-requests/incoming',
        method: 'GET',
        accessToken: token,
    })
    return Array.isArray(res.data) ? res.data : []
}

export async function approveDataRoomAccessRequest(params: {
    requestId: string
    permissionLevel?: 'view' | 'view_download'
    expiresAt?: string | null
    note?: string | null
}): Promise<DataRoomAccessGrantView | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<DataRoomAccessGrantView | { error: string }>({
        path: `/data-room/access-requests/${encodeURIComponent(params.requestId)}/approve`,
        method: 'POST',
        accessToken: token,
        body: {
            permissionLevel: params.permissionLevel,
            expiresAt: params.expiresAt ?? null,
            note: params.note ?? null,
        },
    })
    if (!res.ok) {
        const data = res.data as any
        if (data && typeof data === 'object') {
            if (typeof data.error === 'string' && data.error.trim()) {
                return { error: data.error }
            }
            if (typeof data.message === 'string' && data.message.trim()) {
                return { error: data.message }
            }
            if (Array.isArray(data.message) && data.message.length > 0) {
                return { error: String(data.message[0]) }
            }
        }
        return { error: 'Failed to approve request' }
    }
    return (res.data as any) ?? { error: 'Failed to approve request' }
}

export async function rejectDataRoomAccessRequest(params: {
    requestId: string
    note?: string | null
}): Promise<{ success: boolean } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<{ success: boolean } | { error: string }>({
        path: `/data-room/access-requests/${encodeURIComponent(params.requestId)}/reject`,
        method: 'POST',
        accessToken: token,
        body: { note: params.note ?? null },
    })
    if (!res.ok) {
        const data = res.data as any
        if (data && typeof data === 'object') {
            if (typeof data.error === 'string' && data.error.trim()) {
                return { error: data.error }
            }
            if (typeof data.message === 'string' && data.message.trim()) {
                return { error: data.message }
            }
            if (Array.isArray(data.message) && data.message.length > 0) {
                return { error: String(data.message[0]) }
            }
        }
        return { error: 'Failed to reject request' }
    }
    return (res.data as any) ?? { error: 'Failed to reject request' }
}

export async function revokeDataRoomGrant(params: {
    grantId: string
    note?: string | null
}): Promise<{ success: boolean } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<{ success: boolean } | { error: string }>({
        path: `/data-room/access-grants/${encodeURIComponent(params.grantId)}/revoke`,
        method: 'POST',
        accessToken: token,
        body: { note: params.note ?? null },
    })
    return (res.data as any) ?? { error: 'Failed to revoke grant' }
}

export async function getDataRoomContents(params: {
    startupOrgId: string
}): Promise<DataRoomContentsView | { error: string; code?: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<DataRoomContentsView | { error: string } | { code?: string; message?: string }>({
        path: `/data-room/startups/${encodeURIComponent(params.startupOrgId)}/contents`,
        method: 'GET',
        accessToken: token,
    })
    if (!res.ok && res.data && typeof res.data === 'object' && 'code' in res.data) {
        return { error: (res.data as any).message ?? 'Forbidden', code: (res.data as any).code }
    }
    return (res.data as any) ?? { error: 'Failed to load contents' }
}

export async function acceptDataRoomTerms(params: { startupOrgId: string }): Promise<{ success: boolean } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<{ success: boolean } | { error: string }>({
        path: `/data-room/startups/${encodeURIComponent(params.startupOrgId)}/terms/accept`,
        method: 'POST',
        accessToken: token,
        body: {},
    })
    return (res.data as any) ?? { error: 'Failed to accept terms' }
}

export async function recordDataRoomDocumentView(params: { documentId: string; seconds?: number }): Promise<{ success: boolean } | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<{ success: boolean } | { error: string }>({
        path: `/data-room/documents/${encodeURIComponent(params.documentId)}/view`,
        method: 'POST',
        accessToken: token,
        body: { seconds: typeof params.seconds === 'number' ? params.seconds : undefined },
    })
    return (res.data as any) ?? { error: 'Failed to record view' }
}

export type DataRoomDocumentAnalyticRow = {
    document_id: string
    document_title: string
    total_views: number
    unique_viewers: number
    total_seconds: number
    last_viewed_at: string | null
}

export type DataRoomAnalyticsView = {
    startup_org_id: string
    documents: DataRoomDocumentAnalyticRow[]
}

export async function getDataRoomAnalytics(
    startupOrgId: string,
): Promise<DataRoomAnalyticsView | { error: string }> {
    const token = await getAccessToken()
    if (!token) return { error: 'Unauthorized' }
    const res = await apiFetchJson<DataRoomAnalyticsView | { error: string }>({
        path: `/data-room/startups/${encodeURIComponent(startupOrgId)}/analytics`,
        method: 'GET',
        accessToken: token,
    })
    return (res.data as any) ?? { error: 'Failed to load analytics' }
}

