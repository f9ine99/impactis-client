'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getPostAuthRedirectPath } from '@/modules/auth'
import { getOnboardingQuestionsPath } from '@/modules/onboarding'
import {
    createOrganizationWithOwner,
    getPrimaryOrganizationMembershipByUserId,
    parseIndustryTags,
    type OrganizationType,
} from '@/modules/organizations'

export type OnboardingActionState = {
    error: string | null
}

function normalizeText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function normalizeOrganizationType(value: FormDataEntryValue | null): OrganizationType | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    if (normalized === 'startup' || normalized === 'investor' || normalized === 'advisor') {
        return normalized
    }

    return null
}

export async function completeOnboardingAction(
    _previousState: OnboardingActionState,
    formData: FormData
): Promise<OnboardingActionState> {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    const user = session?.user as any

    if (!user) {
        return { error: 'Your session has expired. Please log in again.' }
    }

    const existingMembership = await getPrimaryOrganizationMembershipByUserId(null as any, user.id)
    if (existingMembership) {
        redirect(getPostAuthRedirectPath(true, { skipCache: true }))
    }

    const type = normalizeOrganizationType(formData.get('organizationType'))
    const name = normalizeText(formData.get('organizationName'))
    const location = normalizeText(formData.get('organizationLocation'))
    const industryTags = parseIndustryTags(String(formData.get('organizationIndustryTags') ?? ''))

    if (!type) {
        return { error: 'Please select an organization type.' }
    }

    if (!name || name.length < 2) {
        return { error: 'Organization name must be at least 2 characters.' }
    }

    try {
        await createOrganizationWithOwner(null as any, {
            type,
            name,
            location,
            industryTags,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to complete onboarding right now.'
        return { error: message }
    }

    // After org creation, go to role-based onboarding questions (user can skip there).
    redirect(getOnboardingQuestionsPath())
}

/** Creates a default organization for users who completed the 6-step onboarding but never created an org, then redirects to dashboard. */
export async function createDefaultOrganizationAndRedirect(companyNameFromDb?: string | null): Promise<{ error: string | null }> {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    const user = session?.user as any

    if (!user) {
        return { error: 'Your session has expired. Please log in again.' }
    }

    const existingMembership = await getPrimaryOrganizationMembershipByUserId(null as any, user.id)
    if (existingMembership) {
        redirect(getPostAuthRedirectPath(true, { skipCache: true }))
        return { error: null }
    }

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>
    const role =
        typeof meta.role === 'string'
            ? meta.role
            : typeof meta.intended_org_type === 'string'
                ? meta.intended_org_type
                : 'startup'
    const type = normalizeOrganizationType(role) ?? 'startup'
    const onboardingData = meta.onboardingData && typeof meta.onboardingData === 'object' ? (meta.onboardingData as Record<string, unknown>) : {}
    const roleData = onboardingData[role] && typeof onboardingData[role] === 'object' ? (onboardingData[role] as Record<string, unknown>) : {}
    const nameFromMeta = typeof roleData.companyName === 'string' && roleData.companyName.trim().length >= 2
        ? roleData.companyName.trim()
        : null
    const companyName = nameFromMeta ?? (typeof companyNameFromDb === 'string' && companyNameFromDb.trim().length >= 2 ? companyNameFromDb.trim() : null) ?? 'My Organization'
    const location = typeof roleData.countryOfIncorporation === 'string' && roleData.countryOfIncorporation.trim()
        ? roleData.countryOfIncorporation.trim()
        : null

    try {
        await createOrganizationWithOwner(null as any, {
            type,
            name: companyName,
            location,
            industryTags: [],
        })
    } catch (error) {
        const raw = error instanceof Error ? error.message : 'Unable to create organization right now.'
        const message =
            /failed to fetch|network error|load failed/i.test(raw)
                ? 'Cannot reach the server. Make sure the backend is running (e.g. npm run start:dev in impactis-server) and try again.'
                : raw
        return { error: message }
    }

    redirect(getPostAuthRedirectPath(true, { skipCache: true }))
    return { error: null }
}
