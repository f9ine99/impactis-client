'use server'

import { revalidatePath } from 'next/cache'
import { apiRequest } from '@/lib/api/rest-client'
import { getBetterAuthToken } from '@/lib/better-auth-token'

export type AcceptOrganizationInviteActionState = {
    error: string | null
    success: string | null
}

function normalizeText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

export async function acceptOrganizationInviteAction(
    _previousState: AcceptOrganizationInviteActionState,
    formData: FormData
): Promise<AcceptOrganizationInviteActionState> {
    const inviteToken = normalizeText(formData.get('inviteToken'))
    if (!inviteToken) {
        return {
            error: 'Invite token is required.',
            success: null,
        }
    }

    const accessToken = await getBetterAuthToken()
    if (!accessToken) {
        return {
            error: 'Please sign in before accepting this invite.',
            success: null,
        }
    }

    const result = await apiRequest<{ success: boolean; message: string | null }>({
        path: '/organizations/invites/accept',
        method: 'POST',
        accessToken,
        body: { inviteToken },
    })

    if (!result?.success) {
        const message = result?.message ?? 'Unable to accept invite right now.'
        return {
            error: message,
            success: null,
        }
    }

    revalidatePath('/workspace')
    revalidatePath('/onboarding/questions')
    revalidatePath('/invite')

    return {
        error: null,
        success: 'Invite accepted successfully. You can now open your workspace.',
    }
}
