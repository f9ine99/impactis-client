import { apiRequest } from '@/lib/api/rest-client'
import { getBetterAuthTokenClient } from '@/lib/better-auth-token-client'

async function token(): Promise<string | null> {
    return getBetterAuthTokenClient()
}

export type AiMatchView = {
    to_org_id: string
    overall_score: number
    reasons: string[]
}

export async function listAiMatches(): Promise<AiMatchView[]> {
    const accessToken = await token()
    if (!accessToken) return []
    const data = await apiRequest<unknown>({
        path: '/discovery/matches',
        method: 'GET',
        accessToken,
    })
    if (!Array.isArray(data)) return []
    return data
        .map((row) => {
            const r = (row ?? {}) as Record<string, unknown>
            const toOrgId = typeof r.to_org_id === 'string' ? r.to_org_id : ''
            const score = typeof r.overall_score === 'number' ? r.overall_score : 0
            const reasons = Array.isArray(r.reasons) ? r.reasons.filter((x) => typeof x === 'string') as string[] : []
            return { to_org_id: toOrgId, overall_score: score, reasons }
        })
        .filter((m) => m.to_org_id.length > 0)
}

export async function sendAiMatchFeedback(input: { targetOrgId: string; feedbackType: 'interested' | 'passed' | 'not_interested'; declineReason?: string | null }): Promise<boolean> {
    const accessToken = await token()
    if (!accessToken) return false
    const res = await apiRequest<any>({
        path: '/discovery/feedback',
        method: 'POST',
        accessToken,
        body: {
            targetOrgId: input.targetOrgId,
            feedbackType: input.feedbackType,
            declineReason: input.declineReason ?? null,
        },
    })
    return !!res && typeof res === 'object' && res.success === true
}

