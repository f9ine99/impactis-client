'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { apiRequest } from '@/lib/api/rest-client'
import { getBetterAuthToken } from '@/lib/better-auth-token'
import { getPostAuthRedirectPath } from '@/modules/auth'

type QuestionnaireState = {
    error: string | null
}

function normalizeJson(value: string | null): Record<string, unknown> {
    if (!value) return {}
    try {
        const parsed = JSON.parse(value)
        return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
    } catch {
        return {}
    }
}

export async function saveOnboardingQuestionnaireAction(
    _previousState: QuestionnaireState,
    formData: FormData
): Promise<QuestionnaireState> {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    const user = session?.user as any
    if (!user?.id) {
        return { error: 'Your session has expired. Please log in again.' }
    }

    const answersRaw = typeof formData.get('answers') === 'string' ? (formData.get('answers') as string) : null
    const scoreRaw = typeof formData.get('score') === 'string' ? (formData.get('score') as string) : null
    const completedRaw = typeof formData.get('completed') === 'string' ? (formData.get('completed') as string) : null
    const skippedRaw = typeof formData.get('skipped') === 'string' ? (formData.get('skipped') as string) : null

    const answers = normalizeJson(answersRaw)
    const score = scoreRaw ? Math.max(0, Math.min(100, Number(scoreRaw))) : 0
    const completed = completedRaw === 'true'
    const skipped = skippedRaw === 'true'

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>
    try {
        const roleRaw = (meta.role ?? meta.intended_org_type ?? null) as string | null
        const role =
            roleRaw === 'startup' || roleRaw === 'investor' || roleRaw === 'advisor'
                ? roleRaw
                : 'startup'

        const token = await getBetterAuthToken()
        if (!token) {
            return { error: 'Your session has expired. Please log in again.' }
        }

        const res = await apiRequest<{ success: boolean; error?: string }>({
            path: '/v1/onboarding/answers',
            method: 'PUT',
            accessToken: token,
            body: {
                role,
                answers,
                completed,
                skipped,
                score: Number.isFinite(score) ? Math.round(score) : 0,
            },
        })
        if (!res?.success) {
            return { error: res?.error ?? 'Unable to save onboarding answers right now.' }
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save onboarding answers right now.'
        return { error: message }
    }

    if (completed || skipped) {
        redirect(getPostAuthRedirectPath(true, { skipCache: true }))
    }

    return { error: null }
}

