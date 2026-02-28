'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPostAuthRedirectPath } from '@/modules/auth'
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
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Your session has expired. Please log in again.' }
    }

    const existingMembership = await getPrimaryOrganizationMembershipByUserId(supabase, user.id)
    if (existingMembership) {
        redirect(getPostAuthRedirectPath(true))
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
        await createOrganizationWithOwner(supabase, {
            type,
            name,
            location,
            industryTags,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to complete onboarding right now.'
        return { error: message }
    }

    redirect(getPostAuthRedirectPath(true))
}
