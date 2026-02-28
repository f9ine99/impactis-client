import type {
    BillingCurrentPlanSnapshot,
    BillingPlan,
    BillingPlanFeature,
    BillingUsageCounter,
} from './types'

export const CONSULTANT_REQUESTS_FEATURE_KEY = 'consultant_requests_per_month'
export const ADVISOR_PROPOSALS_FEATURE_KEY = 'proposals_per_month'
export const INVESTOR_PROFILE_VIEWS_FEATURE_KEY = 'full_profile_views_per_month'
export const DATA_ROOM_DOCUMENTS_FEATURE_KEY = 'data_room_documents_limit'

export type BillingMeteredFeatureGateReason =
    | 'ok'
    | 'missing_plan'
    | 'missing_plan_definition'
    | 'missing_feature'
    | 'disabled'
    | 'limit_reached'

export type BillingMeteredFeatureGateResult = {
    featureKey: string
    allowed: boolean
    reason: BillingMeteredFeatureGateReason
    limit: number | null
    used: number
    remaining: number | null
    unlimited: boolean
    message: string
}

function normalizeFeatureKey(value: string): string {
    return value.trim().toLowerCase()
}

function normalizeFeatureLimit(value: number | null): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null
    }

    return Math.max(0, Math.round(value))
}

function normalizeUsageCount(value: number): number {
    if (!Number.isFinite(value)) {
        return 0
    }

    return Math.max(0, Math.round(value))
}

function findCurrentPlanDefinition(
    currentPlan: BillingCurrentPlanSnapshot | null,
    plans: BillingPlan[]
): BillingPlan | null {
    if (!currentPlan) {
        return null
    }

    const currentPlanCode = normalizeFeatureKey(currentPlan.plan.code)
    return plans.find((plan) => normalizeFeatureKey(plan.plan_code) === currentPlanCode) ?? null
}

function findPlanFeature(plan: BillingPlan, featureKey: string): BillingPlanFeature | null {
    const normalizedFeatureKey = normalizeFeatureKey(featureKey)
    return plan.features.find(
        (feature) => normalizeFeatureKey(feature.key) === normalizedFeatureKey
    ) ?? null
}

function getFeatureUsageCount(usage: BillingUsageCounter[], featureKey: string): number {
    const normalizedFeatureKey = normalizeFeatureKey(featureKey)
    const counter = usage.find(
        (entry) => normalizeFeatureKey(entry.feature_key) === normalizedFeatureKey
    )

    if (!counter) {
        return 0
    }

    return normalizeUsageCount(counter.usage_count)
}

export function resolveMeteredFeatureGate(input: {
    currentPlan: BillingCurrentPlanSnapshot | null
    plans: BillingPlan[]
    usage?: BillingUsageCounter[]
    featureKey: string
    featureLabel: string
}): BillingMeteredFeatureGateResult {
    const featureKey = normalizeFeatureKey(input.featureKey)
    const usage = input.usage ?? []

    if (!input.currentPlan) {
        return {
            featureKey,
            allowed: false,
            reason: 'missing_plan',
            limit: null,
            used: 0,
            remaining: null,
            unlimited: false,
            message: `No active plan was found to validate ${input.featureLabel}.`,
        }
    }

    const planDefinition = findCurrentPlanDefinition(input.currentPlan, input.plans)
    if (!planDefinition) {
        return {
            featureKey,
            allowed: false,
            reason: 'missing_plan_definition',
            limit: null,
            used: 0,
            remaining: null,
            unlimited: false,
            message: `Unable to load feature rules for plan ${input.currentPlan.plan.name}.`,
        }
    }

    const feature = findPlanFeature(planDefinition, featureKey)
    if (!feature) {
        return {
            featureKey,
            allowed: false,
            reason: 'missing_feature',
            limit: null,
            used: 0,
            remaining: null,
            unlimited: false,
            message: `${input.featureLabel} are not included in your current plan.`,
        }
    }

    if (feature.unlimited) {
        return {
            featureKey,
            allowed: true,
            reason: 'ok',
            limit: null,
            used: 0,
            remaining: null,
            unlimited: true,
            message: `${input.featureLabel} are unlimited on your current plan.`,
        }
    }

    const limit = normalizeFeatureLimit(feature.limit)
    if (limit === null) {
        return {
            featureKey,
            allowed: false,
            reason: 'disabled',
            limit: 0,
            used: 0,
            remaining: 0,
            unlimited: false,
            message: `${input.featureLabel} are not enabled for your current plan.`,
        }
    }

    const used = getFeatureUsageCount(usage, featureKey)
    const remaining = Math.max(0, limit - used)
    if (remaining <= 0) {
        return {
            featureKey,
            allowed: false,
            reason: 'limit_reached',
            limit,
            used,
            remaining: 0,
            unlimited: false,
            message: `You have reached your monthly limit for ${input.featureLabel}.`,
        }
    }

    return {
        featureKey,
        allowed: true,
        reason: 'ok',
        limit,
        used,
        remaining,
        unlimited: false,
        message: `${remaining} ${input.featureLabel} remaining this period.`,
    }
}

export function resolveConsultantRequestFeatureGate(input: {
    currentPlan: BillingCurrentPlanSnapshot | null
    plans: BillingPlan[]
    usage?: BillingUsageCounter[]
}): BillingMeteredFeatureGateResult {
    return resolveMeteredFeatureGate({
        currentPlan: input.currentPlan,
        plans: input.plans,
        usage: input.usage,
        featureKey: CONSULTANT_REQUESTS_FEATURE_KEY,
        featureLabel: 'consultant requests',
    })
}

export function resolveAdvisorProposalFeatureGate(input: {
    currentPlan: BillingCurrentPlanSnapshot | null
    plans: BillingPlan[]
    usage?: BillingUsageCounter[]
}): BillingMeteredFeatureGateResult {
    return resolveMeteredFeatureGate({
        currentPlan: input.currentPlan,
        plans: input.plans,
        usage: input.usage,
        featureKey: ADVISOR_PROPOSALS_FEATURE_KEY,
        featureLabel: 'advisor proposals',
    })
}

export function resolveInvestorProfileViewFeatureGate(input: {
    currentPlan: BillingCurrentPlanSnapshot | null
    plans: BillingPlan[]
    usage?: BillingUsageCounter[]
}): BillingMeteredFeatureGateResult {
    return resolveMeteredFeatureGate({
        currentPlan: input.currentPlan,
        plans: input.plans,
        usage: input.usage,
        featureKey: INVESTOR_PROFILE_VIEWS_FEATURE_KEY,
        featureLabel: 'full startup profile views',
    })
}

export function resolveDataRoomDocumentsFeatureGate(input: {
    currentPlan: BillingCurrentPlanSnapshot | null
    plans: BillingPlan[]
    usage?: BillingUsageCounter[]
}): BillingMeteredFeatureGateResult {
    return resolveMeteredFeatureGate({
        currentPlan: input.currentPlan,
        plans: input.plans,
        usage: input.usage,
        featureKey: DATA_ROOM_DOCUMENTS_FEATURE_KEY,
        featureLabel: 'data room documents',
    })
}
