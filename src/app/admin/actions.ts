'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdminUser } from '@/modules/admin'
import {
    setOrganizationVerificationStatusByOrgId,
    type OrganizationVerificationStatus,
} from '@/modules/organizations'

function normalizeStatus(value: FormDataEntryValue | null): OrganizationVerificationStatus | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    if (
        normalized === 'unverified'
        || normalized === 'pending'
        || normalized === 'approved'
        || normalized === 'rejected'
    ) {
        return normalized
    }

    return null
}

function normalizeText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

export async function updateOrganizationVerificationAction(formData: FormData): Promise<void> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user || !isPlatformAdminUser(user)) {
        throw new Error('Unauthorized')
    }

    const orgId = normalizeText(formData.get('orgId'))
    const status = normalizeStatus(formData.get('nextStatus'))
    const notes = normalizeText(formData.get('notes'))

    if (!orgId || !status) {
        throw new Error('Missing verification update parameters.')
    }

    await setOrganizationVerificationStatusByOrgId(supabase, {
        orgId,
        status,
        reviewedByUserId: user.id,
        notes,
    })

    revalidatePath('/admin')
    revalidatePath('/workspace')
}
