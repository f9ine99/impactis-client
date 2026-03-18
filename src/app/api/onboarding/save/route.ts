import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { resolveApiBaseUrl } from '@/lib/api/rest-client'
import { getBetterAuthToken } from '@/lib/better-auth-token'

type SaveOnboardingPayload = {
    role: string
    stepIndex: number
    totalSteps?: number
    values: Record<string, unknown>
    completed?: boolean
    skipped?: boolean
}

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })
        const user = session?.user as any
        if (!user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = (await request.json()) as SaveOnboardingPayload
        const role = typeof body.role === 'string' ? body.role.trim() : ''
        const stepIndex = Number.isFinite(body.stepIndex) ? body.stepIndex : 0
        const totalSteps = Number.isFinite(body.totalSteps) && body.totalSteps! > 0 ? Math.min(20, Math.round(body.totalSteps!)) : 6
        const completed = body.completed === true
        const skipped = body.skipped === true
        const values = body.values && typeof body.values === 'object' && body.values !== null ? body.values : {}

        const meta = (user.user_metadata ?? {}) as Record<string, unknown>
        const existingOnboardingData =
            meta.onboardingData && typeof meta.onboardingData === 'object' && meta.onboardingData !== null
                ? (meta.onboardingData as Record<string, unknown>)
                : {}

        const roleKey = role || (meta.role as string | undefined) || (meta.intended_org_type as string | undefined) || 'unknown'
        const existingRoleData =
            existingOnboardingData[roleKey] && typeof existingOnboardingData[roleKey] === 'object'
                ? (existingOnboardingData[roleKey] as Record<string, unknown>)
                : {}

        const nextRoleData = {
            ...existingRoleData,
            ...values,
            updated_at: new Date().toISOString(),
        }

        const onboardingCompleted = completed || skipped
        const safeScore =
            typeof (meta as any)?.onboarding_questionnaire?.score === 'number'
                ? Number.isFinite((meta as any).onboarding_questionnaire.score)
                    ? Math.round((meta as any).onboarding_questionnaire.score)
                    : 0
                : 0
        const nextMeta = {
            ...meta,
            onboardingRole: roleKey,
            onboardingCompleted,
            onboardingSkipped: skipped,
            onboardingStep: onboardingCompleted ? stepIndex : stepIndex,
            onboardingData: {
                ...existingOnboardingData,
                [roleKey]: nextRoleData,
            },
            // Keep legacy questionnaire shape in sync so existing gating logic
            // in /onboarding/questions/page.tsx can redirect users who have
            // completed or skipped onboarding.
            onboarding_questionnaire: {
                ...(typeof (meta as any).onboarding_questionnaire === 'object'
                    ? ((meta as any).onboarding_questionnaire as Record<string, unknown>)
                    : {}),
                role: roleKey,
                completed: onboardingCompleted,
                skipped,
                score: safeScore,
                updated_at: new Date().toISOString(),
            },
        }

        // Compatibility proxy: store progress in the NestJS onboarding module (authoritative).
        // We keep nextMeta computed here to avoid breaking older pages that still read it.
        // New flows should call /api/v1/onboarding/* directly.
        const token = await getBetterAuthToken()
        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }
        const apiBaseUrl = resolveApiBaseUrl(process.env.NEXT_PUBLIC_IMPACTIS_API_URL)
        if (!apiBaseUrl) {
            return NextResponse.json({ message: 'API URL not configured' }, { status: 502 })
        }
        const url = `${apiBaseUrl}/onboarding/progress`
        const progressRes = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                stepKey: 'wizard',
                stepNumber: Math.max(1, stepIndex + 1),
                status: onboardingCompleted ? 'completed' : 'in_progress',
            }),
            cache: 'no-store',
        })
        if (!progressRes.ok) {
            const text = await progressRes.text()
            return NextResponse.json({ message: text || `API returned ${progressRes.status}` }, { status: progressRes.status })
        }

        return NextResponse.json({
            ok: true,
            onboardingCompleted,
            onboardingSkipped: skipped,
            onboardingStep: stepIndex,
            legacyMetaPreview: nextMeta,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save onboarding data right now.'
        return NextResponse.json({ message }, { status: 500 })
    }
}

