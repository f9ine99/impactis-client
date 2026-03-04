'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logServerTelemetry } from '@/lib/telemetry/server'
import {
    getOrganizationVerificationStatusByOrgId,
    getPrimaryOrganizationMembershipForUser,
} from '@/modules/organizations'

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

// NOTE: Engagement-related actions were removed because the backend
// `/api/v1/engagements/*` endpoints are not implemented yet. When we
// build that surface from scratch, new actions should be added here.
