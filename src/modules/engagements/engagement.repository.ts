import type { SupabaseClient } from '@supabase/supabase-js'
import { apiRequest } from '@/lib/api/rest-client'
import type {
    AdvisorDirectoryEntry,
    AdvisorDirectoryVerificationStatus,
    EngagementRequest,
    EngagementRequestDecision,
    EngagementRequestStatus,
} from './types'

const ADVISOR_DIRECTORY_VERIFICATION_STATUSES = new Set<AdvisorDirectoryVerificationStatus>([
    'unverified',
    'pending',
    'approved',
    'rejected',
])
const ENGAGEMENT_REQUEST_STATUSES = new Set<EngagementRequestStatus>([
    'sent',
    'accepted',
    'rejected',
    'expired',
    'cancelled',
])

type AdvisorDirectoryRow = {
    id: string
    name: string
    location: string | null
    industry_tags: string[] | null
    verification_status: string
}

type EngagementRequestRow = {
    id: string
    startup_org_id: string
    startup_org_name: string
    advisor_org_id: string
    advisor_org_name: string
    status: string
    created_at: string
    responded_at: string | null
    prep_room_id: string | null
}

type EngagementMutationResult = {
    success: boolean
    message: string | null
    requestId?: string | null
    roomId?: string | null
}

async function getAccessToken(supabase: SupabaseClient): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token ?? null
}

function normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function normalizeArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return []
    }

    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === 'string')
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
        )
    )
}

function normalizeAdvisorDirectoryVerificationStatus(value: unknown): AdvisorDirectoryVerificationStatus {
    if (typeof value !== 'string') {
        return 'unverified'
    }

    const normalized = value.trim().toLowerCase()
    return ADVISOR_DIRECTORY_VERIFICATION_STATUSES.has(normalized as AdvisorDirectoryVerificationStatus)
        ? (normalized as AdvisorDirectoryVerificationStatus)
        : 'unverified'
}

function normalizeEngagementRequestStatus(value: unknown): EngagementRequestStatus {
    if (typeof value !== 'string') {
        return 'sent'
    }

    const normalized = value.trim().toLowerCase()
    return ENGAGEMENT_REQUEST_STATUSES.has(normalized as EngagementRequestStatus)
        ? (normalized as EngagementRequestStatus)
        : 'sent'
}

function mapAdvisorDirectoryRow(row: AdvisorDirectoryRow): AdvisorDirectoryEntry | null {
    const name = normalizeText(row.name)
    if (!name) {
        return null
    }

    return {
        id: row.id,
        name,
        location: normalizeText(row.location),
        industry_tags: normalizeArray(row.industry_tags),
        verification_status: normalizeAdvisorDirectoryVerificationStatus(row.verification_status),
    }
}

function mapEngagementRequestRow(row: EngagementRequestRow): EngagementRequest | null {
    const startupOrgName = normalizeText(row.startup_org_name)
    const advisorOrgName = normalizeText(row.advisor_org_name)
    if (!startupOrgName || !advisorOrgName) {
        return null
    }

    return {
        id: row.id,
        startup_org_id: row.startup_org_id,
        startup_org_name: startupOrgName,
        advisor_org_id: row.advisor_org_id,
        advisor_org_name: advisorOrgName,
        status: normalizeEngagementRequestStatus(row.status),
        created_at: row.created_at,
        responded_at: normalizeText(row.responded_at),
        prep_room_id: normalizeText(row.prep_room_id),
    }
}

export async function listAdvisorDirectory(supabase: SupabaseClient): Promise<AdvisorDirectoryEntry[]> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        console.warn('[engagements] Failed to load advisor directory: missing access token')
        return []
    }

    const data = await apiRequest<AdvisorDirectoryRow[]>({
        path: '/engagements/advisors',
        method: 'GET',
        accessToken,
    })
    if (!data) {
        console.warn('[engagements] Failed to load advisor directory')
        return []
    }

    return data
        .map((row) => mapAdvisorDirectoryRow(row))
        .filter((entry): entry is AdvisorDirectoryEntry => !!entry)
}

export async function listEngagementRequestsForCurrentUser(supabase: SupabaseClient): Promise<EngagementRequest[]> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        console.warn('[engagements] Failed to load engagement requests: missing access token')
        return []
    }

    const data = await apiRequest<EngagementRequestRow[]>({
        path: '/engagements/requests',
        method: 'GET',
        accessToken,
    })
    if (!data) {
        console.warn('[engagements] Failed to load engagement requests')
        return []
    }

    return data
        .map((row) => mapEngagementRequestRow(row))
        .filter((request): request is EngagementRequest => !!request)
}

export async function createEngagementRequestForCurrentUser(
    supabase: SupabaseClient,
    advisorOrgId: string
): Promise<string> {
    const normalizedAdvisorOrgId = normalizeText(advisorOrgId)
    if (!normalizedAdvisorOrgId) {
        throw new Error('Advisor organization is required.')
    }

    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<EngagementMutationResult>({
        path: '/engagements/requests',
        method: 'POST',
        accessToken,
        body: {
            advisorOrgId: normalizedAdvisorOrgId,
        },
    })

    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to create engagement request right now.')
    }

    const requestId = normalizeText(result.requestId)
    if (!requestId) {
        throw new Error('Unexpected response while creating engagement request.')
    }

    return requestId
}

export async function respondToEngagementRequestForCurrentUser(
    supabase: SupabaseClient,
    input: { requestId: string; decision: EngagementRequestDecision }
): Promise<string | null> {
    const requestId = normalizeText(input.requestId)
    if (!requestId) {
        throw new Error('Engagement request id is required.')
    }

    const decision = input.decision
    if (decision !== 'accepted' && decision !== 'rejected') {
        throw new Error('Invalid engagement decision.')
    }

    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<EngagementMutationResult>({
        path: '/engagements/requests/respond',
        method: 'POST',
        accessToken,
        body: {
            requestId,
            decision,
        },
    })

    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to update engagement request right now.')
    }

    const roomId = normalizeText(result.roomId)
    return roomId
}

export async function cancelEngagementRequestForCurrentUser(
    supabase: SupabaseClient,
    input: { requestId: string; reason?: string | null }
): Promise<string> {
    const requestId = normalizeText(input.requestId)
    if (!requestId) {
        throw new Error('Engagement request id is required.')
    }

    const reason = normalizeText(input.reason ?? null)

    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<EngagementMutationResult>({
        path: '/engagements/requests/cancel',
        method: 'POST',
        accessToken,
        body: {
            requestId,
            reason,
        },
    })

    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to cancel engagement request right now.')
    }

    return requestId
}
