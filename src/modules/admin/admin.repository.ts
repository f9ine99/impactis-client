import { apiRequest } from '@/lib/api/rest-client'
import { getBetterAuthTokenClient } from '@/lib/better-auth-token-client'

async function getToken(): Promise<string | null> {
    return getBetterAuthTokenClient()
}

export async function adminMe(): Promise<{ user_id: string; role: string; is_active: boolean } | null> {
    const token = await getToken()
    if (!token) return null
    return apiRequest<any>({ path: '/admin/me', method: 'GET', accessToken: token })
}

export async function adminStats(): Promise<any | null> {
    const token = await getToken()
    if (!token) return null
    return apiRequest<any>({ path: '/admin/stats', method: 'GET', accessToken: token })
}

export async function adminOrganizations(params?: { type?: string; status?: string; limit?: number }): Promise<any[]> {
    const token = await getToken()
    if (!token) return []
    const q = new URLSearchParams()
    if (params?.type) q.set('type', params.type)
    if (params?.status) q.set('status', params.status)
    if (typeof params?.limit === 'number') q.set('limit', String(params.limit))
    const qs = q.toString()
    const data = await apiRequest<any[]>({ path: `/admin/organizations${qs ? `?${qs}` : ''}`, method: 'GET', accessToken: token })
    return Array.isArray(data) ? data : []
}

export async function adminOrgDetail(orgId: string): Promise<any | null> {
    const token = await getToken()
    if (!token) return null
    return apiRequest<any>({ path: `/admin/organizations/${encodeURIComponent(orgId)}`, method: 'GET', accessToken: token })
}

export async function adminForceTier(orgId: string, planCode: 'free' | 'pro' | 'elite'): Promise<boolean> {
    const token = await getToken()
    if (!token) return false
    const res = await apiRequest<any>({ path: `/admin/organizations/${encodeURIComponent(orgId)}/tier`, method: 'PATCH', accessToken: token, body: { planCode } })
    return !!res && (res as any).success === true
}

export async function adminUpdateOrgStatus(orgId: string, status: 'active' | 'suspended' | 'deleted', reason?: string | null): Promise<boolean> {
    const token = await getToken()
    if (!token) return false
    const res = await apiRequest<any>({ path: `/admin/organizations/${encodeURIComponent(orgId)}/status`, method: 'PATCH', accessToken: token, body: { status, reason: reason ?? null } })
    return !!res && (res as any).success === true
}

export async function adminDealRooms(limit = 200): Promise<any[]> {
    const token = await getToken()
    if (!token) return []
    const data = await apiRequest<any[]>({ path: `/admin/deal-rooms?limit=${encodeURIComponent(String(limit))}`, method: 'GET', accessToken: token })
    return Array.isArray(data) ? data : []
}

export async function adminSubscriptions(limit = 200): Promise<any[]> {
    const token = await getToken()
    if (!token) return []
    const data = await apiRequest<any[]>({ path: `/admin/subscriptions?limit=${encodeURIComponent(String(limit))}`, method: 'GET', accessToken: token })
    return Array.isArray(data) ? data : []
}

export async function adminTickets(limit = 200): Promise<any[]> {
    const token = await getToken()
    if (!token) return []
    const data = await apiRequest<any[]>({ path: `/admin/tickets?limit=${encodeURIComponent(String(limit))}`, method: 'GET', accessToken: token })
    return Array.isArray(data) ? data : []
}

export async function adminAssignTicket(ticketId: string, assignedTo?: string | null): Promise<boolean> {
    const token = await getToken()
    if (!token) return false
    const res = await apiRequest<any>({
        path: `/admin/tickets/${encodeURIComponent(ticketId)}/assign`,
        method: 'PATCH',
        accessToken: token,
        body: { assignedTo: assignedTo ?? null },
    })
    return !!res && (res as any).success === true
}

export async function adminAudit(limit = 200): Promise<any[]> {
    const token = await getToken()
    if (!token) return []
    const data = await apiRequest<any[]>({ path: `/admin/audit?limit=${encodeURIComponent(String(limit))}`, method: 'GET', accessToken: token })
    return Array.isArray(data) ? data : []
}

