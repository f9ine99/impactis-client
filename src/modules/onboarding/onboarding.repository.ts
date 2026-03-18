import { apiRequest } from '@/lib/api/rest-client'
import { getBetterAuthTokenClient } from '@/lib/better-auth-token-client'

export type OnboardingRole = 'startup' | 'investor' | 'advisor'

export type OrgScoreSnapshot = {
    overall_score: number
    onboarding_score: number
    profile_score: number
    verification_score: number
    activity_score: number
    missing_fields: string[]
    score_details: Record<string, unknown>
    calculated_at: string | null
}

export type OnboardingMeView = {
    user_id: string
    org_id: string
    org_type: OnboardingRole
    onboarding: {
        step1_completed: boolean
        onboarding_completed: boolean
        blocked: boolean
        missing: string[]
    }
    scores: OrgScoreSnapshot | null
}

export async function getOnboardingMeClient(): Promise<OnboardingMeView | null> {
    const token = await getBetterAuthTokenClient()
    if (!token) return null
    return apiRequest<OnboardingMeView>({
        path: '/v1/onboarding/me',
        method: 'GET',
        accessToken: token,
    })
}

export async function saveOnboardingStep1Client(input: {
    role: OnboardingRole
    values: Record<string, unknown>
}): Promise<{ success: boolean; me?: OnboardingMeView; error?: string } | null> {
    const token = await getBetterAuthTokenClient()
    if (!token) return { success: false, error: 'Unauthorized' }
    return apiRequest<{ success: boolean; me?: OnboardingMeView; error?: string }>({
        path: '/v1/onboarding/step1',
        method: 'POST',
        accessToken: token,
        body: input,
    })
}

export async function saveOnboardingProgressClient(input: {
    stepKey: string
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
    stepNumber?: number
}): Promise<{ success: boolean; me?: OnboardingMeView; error?: string } | null> {
    const token = await getBetterAuthTokenClient()
    if (!token) return { success: false, error: 'Unauthorized' }
    return apiRequest<{ success: boolean; me?: OnboardingMeView; error?: string }>({
        path: '/v1/onboarding/progress',
        method: 'POST',
        accessToken: token,
        body: input,
    })
}

export async function upsertOnboardingAnswersClient(input: {
    role: OnboardingRole
    answers: Record<string, unknown>
    completed?: boolean
    skipped?: boolean
    score?: number
}): Promise<{ success: boolean; me?: OnboardingMeView; error?: string } | null> {
    const token = await getBetterAuthTokenClient()
    if (!token) return { success: false, error: 'Unauthorized' }
    return apiRequest<{ success: boolean; me?: OnboardingMeView; error?: string }>({
        path: '/v1/onboarding/answers',
        method: 'PUT',
        accessToken: token,
        body: input,
    })
}

export async function getOnboardingScoreClient(): Promise<OrgScoreSnapshot | null> {
    const token = await getBetterAuthTokenClient()
    if (!token) return null
    return apiRequest<OrgScoreSnapshot>({
        path: '/v1/onboarding/score',
        method: 'GET',
        accessToken: token,
    })
}

