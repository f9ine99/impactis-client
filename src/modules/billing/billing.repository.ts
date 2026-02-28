import type { SupabaseClient } from '@supabase/supabase-js'
import { apiRequest } from '@/lib/api/rest-client'
import type {
    BillingStripeRedirectResult,
    BillingStripeRedirectMode,
    CreateStripeCheckoutSessionInput,
    CreateStripePortalSessionInput,
    BillingSubscriptionMutationResult,
    BillingCurrentPlanSnapshot,
    BillingInterval,
    BillingMeSnapshot,
    BillingPlan,
    BillingPlanFeature,
    BillingPlansSnapshot,
    BillingSegment,
    BillingSubscriptionStatus,
    BillingUsageCounter,
    UpdateBillingSubscriptionInput,
} from './types'

const BILLING_SEGMENTS = new Set<BillingSegment>(['startup', 'investor', 'advisor'])
const BILLING_INTERVALS = new Set<BillingInterval>(['monthly', 'annual'])
const BILLING_SUBSCRIPTION_STATUSES = new Set<BillingSubscriptionStatus>([
    'trialing',
    'active',
    'past_due',
    'paused',
    'canceled',
    'incomplete',
])
const BILLING_STRIPE_REDIRECT_MODES = new Set<BillingStripeRedirectMode>([
    'manual_applied',
    'stripe_checkout',
    'stripe_portal',
])

function normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function normalizeBoolean(value: unknown): boolean {
    return value === true
}

function normalizeNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(0, Math.round(value))
    }

    if (typeof value === 'string') {
        const parsed = Number.parseInt(value.trim(), 10)
        if (Number.isFinite(parsed)) {
            return Math.max(0, parsed)
        }
    }

    return 0
}

function normalizeNullableNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.round(value)
    }

    if (typeof value === 'string') {
        const parsed = Number.parseInt(value.trim(), 10)
        if (Number.isFinite(parsed)) {
            return parsed
        }
    }

    return null
}

function normalizeBillingSegment(value: unknown): BillingSegment | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    if (normalized === 'consultant') {
        return 'advisor'
    }

    return BILLING_SEGMENTS.has(normalized as BillingSegment)
        ? (normalized as BillingSegment)
        : null
}

function normalizeBillingInterval(value: unknown): BillingInterval | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return BILLING_INTERVALS.has(normalized as BillingInterval)
        ? (normalized as BillingInterval)
        : null
}

function normalizeBillingSubscriptionStatus(
    value: unknown
): BillingSubscriptionStatus | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return BILLING_SUBSCRIPTION_STATUSES.has(normalized as BillingSubscriptionStatus)
        ? (normalized as BillingSubscriptionStatus)
        : null
}

function normalizeBillingStripeRedirectMode(
    value: unknown
): BillingStripeRedirectMode | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return BILLING_STRIPE_REDIRECT_MODES.has(normalized as BillingStripeRedirectMode)
        ? (normalized as BillingStripeRedirectMode)
        : null
}

function mapBillingPlanFeature(value: unknown): BillingPlanFeature | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const row = value as Record<string, unknown>
    const key = normalizeText(row.key)
    const label = normalizeText(row.label)
    if (!key || !label) {
        return null
    }

    return {
        key,
        label,
        value: normalizeText(row.value),
        limit: normalizeNullableNumber(row.limit),
        unlimited: normalizeBoolean(row.unlimited),
    }
}

function mapBillingPlan(value: unknown): BillingPlan | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const row = value as Record<string, unknown>
    const segment = normalizeBillingSegment(row.segment)
    const planCode = normalizeText(row.plan_code)
    const displayName = normalizeText(row.display_name)
    const pricing = row.pricing && typeof row.pricing === 'object'
        ? (row.pricing as Record<string, unknown>)
        : null
    if (!segment || !planCode || !displayName || !pricing) {
        return null
    }

    const features = Array.isArray(row.features)
        ? row.features
            .map((feature) => mapBillingPlanFeature(feature))
            .filter((feature): feature is BillingPlanFeature => !!feature)
        : []

    return {
        segment,
        plan_code: planCode,
        display_name: displayName,
        tier: normalizeNumber(row.tier),
        is_default: normalizeBoolean(row.is_default),
        pricing: {
            currency: normalizeText(pricing.currency)?.toUpperCase() ?? 'USD',
            monthly_price_cents: normalizeNullableNumber(pricing.monthly_price_cents),
            annual_price_cents: normalizeNullableNumber(pricing.annual_price_cents),
        },
        features,
    }
}

function mapBillingUsageCounter(value: unknown): BillingUsageCounter | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const row = value as Record<string, unknown>
    const featureKey = normalizeText(row.feature_key)
    const periodStart = normalizeText(row.period_start)
    const periodEnd = normalizeText(row.period_end)
    if (!featureKey || !periodStart || !periodEnd) {
        return null
    }

    return {
        feature_key: featureKey,
        usage_count: normalizeNumber(row.usage_count),
        period_start: periodStart,
        period_end: periodEnd,
    }
}

export function mapBillingCurrentPlan(value: unknown): BillingCurrentPlanSnapshot | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const row = value as Record<string, unknown>
    const orgId = normalizeText(row.org_id)
    const orgType = normalizeBillingSegment(row.org_type)
    const plan = row.plan && typeof row.plan === 'object'
        ? (row.plan as Record<string, unknown>)
        : null
    const subscription = row.subscription && typeof row.subscription === 'object'
        ? (row.subscription as Record<string, unknown>)
        : null
    if (!orgId || !orgType || !plan || !subscription) {
        return null
    }

    const planId = normalizeText(plan.id)
    const planCode = normalizeText(plan.code)
    const planName = normalizeText(plan.name)
    if (!planId || !planCode || !planName) {
        return null
    }

    return {
        org_id: orgId,
        org_type: orgType,
        plan: {
            id: planId,
            code: planCode,
            name: planName,
            tier: normalizeNumber(plan.tier),
            currency: normalizeText(plan.currency)?.toUpperCase() ?? 'USD',
            monthly_price_cents: normalizeNullableNumber(plan.monthly_price_cents),
            annual_price_cents: normalizeNullableNumber(plan.annual_price_cents),
        },
        subscription: {
            id: normalizeText(subscription.id),
            status: normalizeBillingSubscriptionStatus(subscription.status),
            billing_interval: normalizeBillingInterval(subscription.billing_interval),
            started_at: normalizeText(subscription.started_at),
            current_period_start: normalizeText(subscription.current_period_start),
            current_period_end: normalizeText(subscription.current_period_end),
            cancel_at_period_end: normalizeBoolean(subscription.cancel_at_period_end),
            canceled_at: normalizeText(subscription.canceled_at),
            is_fallback_free: normalizeBoolean(subscription.is_fallback_free),
        },
    }
}

async function getAccessToken(supabase: SupabaseClient): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token ?? null
}

export async function getBillingPlansForCurrentUser(
    supabase: SupabaseClient,
    input?: { segment?: BillingSegment | 'consultant' | null }
): Promise<BillingPlansSnapshot> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        return {
            segment: 'all',
            plans: [],
        }
    }

    const querySegment = normalizeText(input?.segment ?? null)
    const query = querySegment ? `?segment=${encodeURIComponent(querySegment)}` : ''

    const row = await apiRequest<unknown>({
        path: `/billing/plans${query}`,
        method: 'GET',
        accessToken,
    })

    if (!row || typeof row !== 'object') {
        return {
            segment: 'all',
            plans: [],
        }
    }

    const payload = row as Record<string, unknown>
    const normalizedSegment = normalizeText(payload.segment)?.toLowerCase()
    const segment = normalizedSegment === 'all'
        ? 'all'
        : (normalizeBillingSegment(normalizedSegment) ?? 'all')

    const plans = Array.isArray(payload.plans)
        ? payload.plans
            .map((plan) => mapBillingPlan(plan))
            .filter((plan): plan is BillingPlan => !!plan)
        : []

    return {
        segment,
        plans,
    }
}

export async function getBillingMeForCurrentUser(
    supabase: SupabaseClient
): Promise<BillingMeSnapshot | null> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        return null
    }

    const row = await apiRequest<unknown>({
        path: '/billing/me',
        method: 'GET',
        accessToken,
    })
    if (!row || typeof row !== 'object') {
        return null
    }

    const payload = row as Record<string, unknown>
    const currentPlan = mapBillingCurrentPlan(payload)
    if (!currentPlan) {
        return null
    }

    const usage = Array.isArray(payload.usage)
        ? payload.usage
            .map((item) => mapBillingUsageCounter(item))
            .filter((item): item is BillingUsageCounter => !!item)
        : []

    return {
        ...currentPlan,
        usage,
    }
}

export async function updateBillingSubscriptionForCurrentUser(
    supabase: SupabaseClient,
    input: UpdateBillingSubscriptionInput
): Promise<BillingSubscriptionMutationResult> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        return {
            success: false,
            message: 'Your session has expired. Please log in again.',
            currentPlan: null,
        }
    }

    const planCode = normalizeText(input.planCode)?.toLowerCase() ?? null
    if (!planCode) {
        return {
            success: false,
            message: 'Plan code is required.',
            currentPlan: null,
        }
    }

    const billingInterval = normalizeBillingInterval(input.billingInterval ?? null)
    const row = await apiRequest<unknown>({
        path: '/billing/subscription',
        method: 'PATCH',
        accessToken,
        body: {
            planCode,
            billingInterval,
        },
    })
    if (!row || typeof row !== 'object') {
        return {
            success: false,
            message: 'Unable to update subscription right now.',
            currentPlan: null,
        }
    }

    const payload = row as Record<string, unknown>
    const success = payload.success === true
    const message = normalizeText(payload.message)

    return {
        success,
        message: message ?? (success ? 'Subscription updated.' : 'Unable to update subscription right now.'),
        currentPlan: mapBillingCurrentPlan(payload.currentPlan),
    }
}

export async function createStripeCheckoutSessionForCurrentUser(
    supabase: SupabaseClient,
    input: CreateStripeCheckoutSessionInput
): Promise<BillingStripeRedirectResult> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        return {
            success: false,
            message: 'Your session has expired. Please log in again.',
            mode: null,
            redirectUrl: null,
            currentPlan: null,
        }
    }

    const planCode = normalizeText(input.planCode)?.toLowerCase() ?? null
    if (!planCode) {
        return {
            success: false,
            message: 'Plan code is required.',
            mode: null,
            redirectUrl: null,
            currentPlan: null,
        }
    }

    const billingInterval = normalizeBillingInterval(input.billingInterval ?? null)
    const successUrl = normalizeText(input.successUrl ?? null)
    const cancelUrl = normalizeText(input.cancelUrl ?? null)

    const row = await apiRequest<unknown>({
        path: '/billing/stripe/checkout-session',
        method: 'POST',
        accessToken,
        body: {
            planCode,
            billingInterval,
            successUrl,
            cancelUrl,
        },
    })

    if (!row || typeof row !== 'object') {
        return {
            success: false,
            message: 'Unable to start Stripe checkout right now.',
            mode: null,
            redirectUrl: null,
            currentPlan: null,
        }
    }

    const payload = row as Record<string, unknown>
    const success = payload.success === true

    return {
        success,
        message: normalizeText(payload.message) ?? (success ? 'Checkout session created.' : 'Unable to start Stripe checkout right now.'),
        mode: normalizeBillingStripeRedirectMode(payload.mode),
        redirectUrl: normalizeText(payload.redirectUrl),
        currentPlan: mapBillingCurrentPlan(payload.currentPlan),
    }
}

export async function createStripePortalSessionForCurrentUser(
    supabase: SupabaseClient,
    input?: CreateStripePortalSessionInput
): Promise<BillingStripeRedirectResult> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        return {
            success: false,
            message: 'Your session has expired. Please log in again.',
            mode: null,
            redirectUrl: null,
            currentPlan: null,
        }
    }

    const returnUrl = normalizeText(input?.returnUrl ?? null)
    const row = await apiRequest<unknown>({
        path: '/billing/stripe/portal-session',
        method: 'POST',
        accessToken,
        body: {
            returnUrl,
        },
    })

    if (!row || typeof row !== 'object') {
        return {
            success: false,
            message: 'Unable to open Stripe billing portal right now.',
            mode: null,
            redirectUrl: null,
            currentPlan: null,
        }
    }

    const payload = row as Record<string, unknown>
    const success = payload.success === true

    return {
        success,
        message: normalizeText(payload.message) ?? (success ? 'Billing portal ready.' : 'Unable to open Stripe billing portal right now.'),
        mode: normalizeBillingStripeRedirectMode(payload.mode),
        redirectUrl: normalizeText(payload.redirectUrl),
        currentPlan: mapBillingCurrentPlan(payload.currentPlan),
    }
}
