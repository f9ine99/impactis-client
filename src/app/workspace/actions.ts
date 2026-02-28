'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logServerTelemetry } from '@/lib/telemetry/server'
import {
    getOrganizationVerificationStatusByOrgId,
    getPrimaryOrganizationMembershipForUser,
} from '@/modules/organizations'
import { apiRequest } from '@/lib/api/rest-client'

function normalizeText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function normalizeDecision(value: FormDataEntryValue | null): 'accepted' | 'rejected' | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    if (normalized === 'accepted' || normalized === 'rejected') {
        return normalized
    }

    return null
}

export async function sendEngagementRequestAction(formData: FormData): Promise<void> {
    const telemetryContext: {
        userId: string | null
        orgType: string | null
        memberRole: string | null
    } = {
        userId: null,
        orgType: null,
        memberRole: null,
    }

    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }
        telemetryContext.userId = user.id

        const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
        if (!membership || membership.organization.type !== 'startup') {
            throw new Error('Only startup organizations can send engagement requests.')
        }
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        const advisorOrgId = normalizeText(formData.get('advisorOrgId'))
        if (!advisorOrgId) {
            throw new Error('Advisor organization is required.')
        }

        const {
            data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token ?? null
        if (!accessToken) {
            throw new Error('Your session has expired. Please log in again.')
        }

        const result = await apiRequest<{ success: boolean; message: string | null }>({
            path: '/engagements/requests',
            method: 'POST',
            accessToken,
            body: { advisorOrgId },
        })

        if (!result?.success) {
            const message = result?.message ?? 'Unable to send engagement request right now.'
            throw new Error(message)
        }
        revalidatePath('/workspace')
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to send engagement request right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace',
            action: 'sendEngagementRequestAction',
            level: 'error',
            message,
            userId: telemetryContext.userId,
            orgType: telemetryContext.orgType,
            memberRole: telemetryContext.memberRole,
        })
        throw error
    }
}

export async function cancelEngagementRequestAction(formData: FormData): Promise<void> {
    const telemetryContext: {
        userId: string | null
        orgType: string | null
        memberRole: string | null
    } = {
        userId: null,
        orgType: null,
        memberRole: null,
    }

    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }
        telemetryContext.userId = user.id

        const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
        if (!membership || membership.organization.type !== 'startup') {
            throw new Error('Only startup organizations can cancel engagement requests.')
        }
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        const requestId = normalizeText(formData.get('requestId'))
        if (!requestId) {
            throw new Error('Engagement request id is required.')
        }

        const {
            data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token ?? null
        if (!accessToken) {
            throw new Error('Your session has expired. Please log in again.')
        }

        const result = await apiRequest<{ success: boolean; message: string | null }>({
            path: '/engagements/requests/cancel',
            method: 'POST',
            accessToken,
            body: { requestId },
        })

        if (!result?.success) {
            const message = result?.message ?? 'Unable to cancel engagement request right now.'
            throw new Error(message)
        }
        revalidatePath('/workspace')
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to cancel engagement request right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace',
            action: 'cancelEngagementRequestAction',
            level: 'error',
            message,
            userId: telemetryContext.userId,
            orgType: telemetryContext.orgType,
            memberRole: telemetryContext.memberRole,
        })
        throw error
    }
}

export async function respondEngagementRequestAction(formData: FormData): Promise<void> {
    const telemetryContext: {
        userId: string | null
        orgType: string | null
        memberRole: string | null
    } = {
        userId: null,
        orgType: null,
        memberRole: null,
    }

    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }
        telemetryContext.userId = user.id

        const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
        if (!membership || membership.organization.type !== 'advisor') {
            throw new Error('Only advisor organizations can process engagement requests.')
        }
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        const verificationStatus = await getOrganizationVerificationStatusByOrgId(supabase, membership.org_id)
        if (verificationStatus !== 'approved') {
            throw new Error('Advisor verification approval is required before processing requests.')
        }

        const requestId = normalizeText(formData.get('requestId'))
        const decision = normalizeDecision(formData.get('decision'))
        if (!requestId || !decision) {
            throw new Error('Missing engagement response parameters.')
        }

        const {
            data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token ?? null
        if (!accessToken) {
            throw new Error('Your session has expired. Please log in again.')
        }

        const result = await apiRequest<{ success: boolean; message: string | null }>({
            path: '/engagements/requests/respond',
            method: 'POST',
            accessToken,
            body: { requestId, decision },
        })

        if (!result?.success) {
            const message = result?.message ?? 'Unable to respond to engagement request right now.'
            throw new Error(message)
        }

        revalidatePath('/workspace')
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to respond to engagement request right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace',
            action: 'respondEngagementRequestAction',
            level: 'error',
            message,
            userId: telemetryContext.userId,
            orgType: telemetryContext.orgType,
            memberRole: telemetryContext.memberRole,
        })
        throw error
    }
}
