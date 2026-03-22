type User = {
    id: string
    email?: string | null
    last_sign_in_at?: string | null
}
import { apiRequest } from '@/lib/api/rest-client'
import { getBetterAuthToken } from '@/lib/better-auth-token'
import type {
    OrganizationMembership,
    OrganizationMemberDirectoryEntry,
    OrganizationMemberRole,
    OrganizationMembershipStatus,
    OrganizationType,
    OrganizationVerificationStatus,
} from '@/modules/organizations'
import type { UserProfile } from '@/modules/profiles'
import type {
    StartupDiscoveryFeedItem,
    StartupDiscoveryVerificationStatus,
    StartupReadiness,
    StartupReadinessSectionScore,
    StartupReadinessStep,
} from '@/modules/startups'
import { mapBillingCurrentPlan } from '@/modules/billing'
import type {
    UnifiedDiscoveryCard,
    WorkspaceBootstrapSnapshot,
    WorkspaceOrganizationReadinessSnapshot,
} from './types'

export const WORKSPACE_IDENTITY_CACHE_TAG = 'workspace-identity'

export type OnboardingProgressSnapshot = {
    total_stages: number
    completed_stages: number
    is_completed: boolean
}

export type WorkspaceIdentitySnapshot = {
    profile: UserProfile
    onboarding_progress: OnboardingProgressSnapshot | null
    /** Onboarding form details per org type (e.g. startup: { companyName, websiteUrl, ... }). */
    onboarding_details: Record<string, Record<string, unknown>> | null
    membership: OrganizationMembership | null
}

const ORGANIZATION_TYPES = new Set<OrganizationType>(['startup', 'investor', 'advisor'])
const ORGANIZATION_MEMBER_ROLES = new Set<OrganizationMemberRole>(['owner', 'admin', 'member'])
const ORGANIZATION_MEMBERSHIP_STATUSES = new Set<OrganizationMembershipStatus>([
    'pending',
    'active',
    'left',
    'removed',
    'expired',
    'cancelled',
])
const ORGANIZATION_VERIFICATION_STATUSES = new Set<OrganizationVerificationStatus>([
    'unverified',
    'pending',
    'approved',
    'rejected',
])
const STARTUP_READINESS_STEPS = new Set<StartupReadinessStep>([
    'upload_pitch_deck',
    'add_team_info',
    'upload_financial_doc',
    'upload_legal_doc',
    'complete_profile_70',
    'reach_score_60',
    'upload_required_docs',
])
const STARTUP_DISCOVERY_VERIFICATION_STATUSES = new Set<StartupDiscoveryVerificationStatus>([
    'unverified',
    'pending',
    'approved',
    'rejected',
])

const WORKSPACE_SNAPSHOT_CACHE_TTL_MS = 60_000
const WORKSPACE_SNAPSHOT_CACHE_MAX_ENTRIES = 500

type WorkspaceIdentityApiResponse = {
    profile: unknown
    onboarding_progress?: unknown
    onboarding_details?: unknown
    membership: unknown
}

function mapOnboardingProgress(value: unknown): OnboardingProgressSnapshot | null {
    if (!value || typeof value !== 'object') return null
    const row = value as Record<string, unknown>
    const total = typeof row.total_stages === 'number' && row.total_stages >= 1 ? Math.min(20, row.total_stages) : 0
    const completed = typeof row.completed_stages === 'number' && row.completed_stages >= 0 ? Math.min(total, row.completed_stages) : 0
    if (total === 0) return null
    return {
        total_stages: total,
        completed_stages: completed,
        is_completed: row.is_completed === true,
    }
}

function mapOnboardingDetails(value: unknown): Record<string, Record<string, unknown>> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const outer = value as Record<string, unknown>
    const result: Record<string, Record<string, unknown>> = {}
    for (const key of Object.keys(outer)) {
        const v = outer[key]
        if (v && typeof v === 'object' && !Array.isArray(v)) result[key] = v as Record<string, unknown>
    }
    return Object.keys(result).length ? result : null
}

type WorkspaceBootstrapApiResponse = {
    profile: unknown
    membership: unknown
    verification_status: unknown
    current_plan: unknown
    organization_core_team: unknown
    organization_readiness: unknown
    startup_discovery_feed: unknown
    discovery_feed: unknown
    startup_readiness: unknown
}

type SnapshotCacheEntry<T> = {
    value: T
    expiresAt: number
}

const workspaceIdentitySnapshotCache = new Map<string, SnapshotCacheEntry<WorkspaceIdentitySnapshot>>()
const workspaceBootstrapSnapshotCache = new Map<string, SnapshotCacheEntry<WorkspaceBootstrapSnapshot>>()

function getCacheEntryValue<T>(
    cache: Map<string, SnapshotCacheEntry<T>>,
    key: string
): T | null {
    const entry = cache.get(key)
    if (!entry) {
        return null
    }

    if (entry.expiresAt <= Date.now()) {
        cache.delete(key)
        return null
    }

    return entry.value
}

function pruneSnapshotCache<T>(cache: Map<string, SnapshotCacheEntry<T>>): void {
    if (cache.size <= WORKSPACE_SNAPSHOT_CACHE_MAX_ENTRIES) {
        return
    }

    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
        if (entry.expiresAt <= now) {
            cache.delete(key)
        }
    }

    while (cache.size > WORKSPACE_SNAPSHOT_CACHE_MAX_ENTRIES) {
        const firstKey = cache.keys().next().value
        if (!firstKey) {
            return
        }
        cache.delete(firstKey)
    }
}

function setCacheEntryValue<T>(
    cache: Map<string, SnapshotCacheEntry<T>>,
    key: string,
    value: T
): void {
    pruneSnapshotCache(cache)
    cache.set(key, {
        value,
        expiresAt: Date.now() + WORKSPACE_SNAPSHOT_CACHE_TTL_MS,
    })
}

export function invalidateWorkspaceIdentityCache(userId: string): void {
    const cacheKey = `identity:${userId}`
    workspaceIdentitySnapshotCache.delete(cacheKey)
}

export function invalidateWorkspaceBootstrapCache(userId: string): void {
    const cacheKey = `bootstrap:${userId}`
    workspaceBootstrapSnapshotCache.delete(cacheKey)
}


function normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function normalizeArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return []
    }

    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === 'string')
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
        )
    )
}

function normalizeOrgType(value: unknown): OrganizationType | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_TYPES.has(normalized as OrganizationType)
        ? (normalized as OrganizationType)
        : null
}

function normalizeMemberRole(value: unknown): OrganizationMemberRole | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_MEMBER_ROLES.has(normalized as OrganizationMemberRole)
        ? (normalized as OrganizationMemberRole)
        : null
}

function normalizeMembershipStatus(value: unknown): OrganizationMembershipStatus | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_MEMBERSHIP_STATUSES.has(normalized as OrganizationMembershipStatus)
        ? (normalized as OrganizationMembershipStatus)
        : null
}

function normalizePreferredContactMethod(
    value: unknown
): UserProfile['preferred_contact_method'] {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    if (normalized === 'email' || normalized === 'phone' || normalized === 'linkedin') {
        return normalized
    }

    return null
}

function normalizeBoolean(value: unknown): boolean {
    return value === true
}

function normalizeNumber(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return 0
    }

    return Math.max(0, Math.round(value))
}

function normalizeOrganizationVerificationStatus(value: unknown): OrganizationVerificationStatus {
    if (typeof value !== 'string') {
        return 'unverified'
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_VERIFICATION_STATUSES.has(normalized as OrganizationVerificationStatus)
        ? (normalized as OrganizationVerificationStatus)
        : 'unverified'
}

function normalizeStartupReadinessSteps(value: unknown): StartupReadinessStep[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().toLowerCase())
        .filter((item): item is StartupReadinessStep => STARTUP_READINESS_STEPS.has(item as StartupReadinessStep))
}

function normalizeStartupReadinessSectionScores(value: unknown): StartupReadinessSectionScore[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((item): StartupReadinessSectionScore | null => {
            if (!item || typeof item !== 'object') {
                return null
            }

            const row = item as Record<string, unknown>
            const section = normalizeText(row.section)
            if (!section) {
                return null
            }

            return {
                section,
                weight: normalizeNumber(row.weight),
                completion_percent: normalizeNumber(row.completion_percent),
                score_contribution: normalizeNumber(row.score_contribution),
            }
        })
        .filter((item): item is StartupReadinessSectionScore => !!item)
}

function normalizeProfileCompletenessPercent(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    const n = Math.round(value)
    return n >= 0 && n <= 100 ? n : null
}

function getEmptyProfileFallback(userId: string): UserProfile {
    return {
        id: userId,
        full_name: null,
        location: null,
        bio: null,
        avatar_url: null,
        phone: null,
        headline: null,
        website_url: null,
        linkedin_url: null,
        timezone_name: null,
        preferred_contact_method: null,
        profile_completeness_percent: null,
    }
}

function mapProfile(value: unknown, userId: string): UserProfile {
    if (!value || typeof value !== 'object') {
        return getEmptyProfileFallback(userId)
    }

    const row = value as Record<string, unknown>
    return {
        id: normalizeText(row.id) ?? userId,
        full_name: normalizeText(row.full_name),
        location: normalizeText(row.location),
        bio: normalizeText(row.bio),
        avatar_url: normalizeText(row.avatar_url),
        phone: normalizeText(row.phone),
        headline: normalizeText(row.headline),
        website_url: normalizeText(row.website_url),
        linkedin_url: normalizeText(row.linkedin_url),
        timezone_name: normalizeText(row.timezone_name),
        preferred_contact_method: normalizePreferredContactMethod(row.preferred_contact_method),
        profile_completeness_percent: normalizeProfileCompletenessPercent(row.profile_completeness_percent),
    }
}

function mapMembership(value: unknown): OrganizationMembership | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const row = value as Record<string, unknown>
    const organization = row.organization && typeof row.organization === 'object'
        ? (row.organization as Record<string, unknown>)
        : null
    if (!organization) {
        return null
    }

    const orgType = normalizeOrgType(organization.type)
    const memberRole = normalizeMemberRole(row.member_role)
    const status = normalizeMembershipStatus(row.status)
    const orgId = normalizeText(row.org_id)
    const userId = normalizeText(row.user_id)
    const createdAt = normalizeText(row.created_at)
    const orgName = normalizeText(organization.name)
    const orgCreatedAt = normalizeText(organization.created_at)
    const organizationId = normalizeText(organization.id)

    if (
        !orgType
        || !memberRole
        || !status
        || !orgId
        || !userId
        || !createdAt
        || !orgName
        || !orgCreatedAt
        || !organizationId
    ) {
        return null
    }

    return {
        org_id: orgId,
        user_id: userId,
        member_role: memberRole,
        status,
        created_at: createdAt,
        organization: {
            id: organizationId,
            type: orgType,
            name: orgName,
            location: normalizeText(organization.location),
            logo_url: normalizeText(organization.logo_url),
            industry_tags: normalizeArray(organization.industry_tags),
            created_at: orgCreatedAt,
        },
    }
}

function mapOrganizationCoreTeamMember(value: unknown): OrganizationMemberDirectoryEntry | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const row = value as Record<string, unknown>
    const userId = normalizeText(row.user_id)
    const memberRole = normalizeMemberRole(row.member_role)
    const status = normalizeMembershipStatus(row.status)
    if (!userId || !memberRole || !status) {
        return null
    }

    return {
        user_id: userId,
        member_role: memberRole,
        status,
        joined_at: normalizeText(row.joined_at),
        full_name: normalizeText(row.full_name),
        avatar_url: normalizeText(row.avatar_url),
        location: normalizeText(row.location),
    }
}

function mapStartupReadiness(value: unknown): StartupReadiness | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const row = value as Record<string, unknown>
    const startupOrgId = normalizeText(row.startup_org_id)
    if (!startupOrgId) {
        return null
    }

    return {
        startup_org_id: startupOrgId,
        has_startup_post: normalizeBoolean(row.has_startup_post),
        has_pitch_deck: normalizeBoolean(row.has_pitch_deck),
        has_team_info: normalizeBoolean(row.has_team_info),
        has_financial_doc: normalizeBoolean(row.has_financial_doc),
        has_legal_doc: normalizeBoolean(row.has_legal_doc),
        profile_completion_percent: Math.min(100, normalizeNumber(row.profile_completion_percent)),
        readiness_score: Math.min(100, normalizeNumber(row.readiness_score)),
        required_docs_uploaded: normalizeBoolean(row.required_docs_uploaded),
        eligible_for_discovery_post: normalizeBoolean(row.eligible_for_discovery_post),
        is_ready: normalizeBoolean(row.is_ready),
        missing_steps: normalizeStartupReadinessSteps(row.missing_steps),
        section_scores: normalizeStartupReadinessSectionScores(row.section_scores),
    }
}

function normalizeStartupDiscoveryVerificationStatus(
    value: unknown
): StartupDiscoveryVerificationStatus {
    if (typeof value !== 'string') {
        return 'unverified'
    }

    const normalized = value.trim().toLowerCase()
    return STARTUP_DISCOVERY_VERIFICATION_STATUSES.has(normalized as StartupDiscoveryVerificationStatus)
        ? (normalized as StartupDiscoveryVerificationStatus)
        : 'unverified'
}

function mapOrganizationReadiness(
    value: unknown
): WorkspaceOrganizationReadinessSnapshot | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const row = value as Record<string, unknown>
    const orgId = normalizeText(row.org_id)
    const orgType = normalizeOrgType(row.org_type)
    if (!orgId || !orgType) {
        return null
    }

    return {
        org_id: orgId,
        org_type: orgType,
        readiness_score: Math.min(100, normalizeNumber(row.readiness_score)),
        is_ready: normalizeBoolean(row.is_ready),
        missing_steps: normalizeArray(row.missing_steps),
        rules_version: normalizeText(row.rules_version) ?? 'unknown',
        computed_at: normalizeText(row.computed_at),
    }
}

function mapStartupDiscoveryFeedItem(value: unknown): StartupDiscoveryFeedItem | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const row = value as Record<string, unknown>
    const id = normalizeText(row.id)
    const startupOrgId = normalizeText(row.startup_org_id)
    const startupOrgName = normalizeText(row.startup_org_name)
    const title = normalizeText(row.title)
    const summary = normalizeText(row.summary)
    if (!id || !startupOrgId || !startupOrgName || !title || !summary) {
        return null
    }

    const needAdvisor = row.need_advisor === true
    return {
        id,
        startup_org_id: startupOrgId,
        startup_org_name: startupOrgName,
        title,
        summary,
        stage: normalizeText(row.stage),
        location: normalizeText(row.location),
        industry_tags: normalizeArray(row.industry_tags),
        published_at: normalizeText(row.published_at),
        startup_verification_status: normalizeStartupDiscoveryVerificationStatus(
            row.startup_verification_status
        ),
        need_advisor: needAdvisor,
        logo_url: normalizeText(row.logo_url),
    }
}

function mapUnifiedDiscoveryCard(value: unknown): UnifiedDiscoveryCard | null {
    if (!value || typeof value !== 'object') return null
    const row = value as Record<string, unknown>
    const org_id = normalizeText(row.org_id)
    const org_type = row.org_type === 'startup' || row.org_type === 'investor' || row.org_type === 'advisor' ? row.org_type : null
    const name = normalizeText(row.name)
    const description = normalizeText(row.description) ?? ''
    if (!org_id || !org_type || !name) return null
    return {
        org_id,
        org_type,
        name,
        description,
        industry_or_expertise: normalizeArray(row.industry_or_expertise),
        stage: normalizeText(row.stage),
        location: normalizeText(row.location),
        image_url: normalizeText(row.image_url),
        id: normalizeText(row.id) ?? undefined,
    }
}

function mapArray<T>(value: unknown, mapItem: (item: unknown) => T | null): T[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((item) => mapItem(item))
        .filter((item): item is T => !!item)
}

async function getAccessToken(): Promise<string | null> {
    return getBetterAuthToken()
}

export async function getWorkspaceIdentityForUser(
    user: User,
    input?: {
        accessToken?: string | null
    }
): Promise<WorkspaceIdentitySnapshot> {
    const cacheKey = `identity:${user.id}`
    const cached = getCacheEntryValue(workspaceIdentitySnapshotCache, cacheKey)
    if (cached) {
        return cached
    }

    const accessToken = input?.accessToken ?? await getAccessToken()
    if (!accessToken) {
        return {
            profile: getEmptyProfileFallback(user.id),
            onboarding_progress: null,
            onboarding_details: null,
            membership: null,
        }
    }

    const data = await apiRequest<WorkspaceIdentityApiResponse | null>({
        path: '/workspace/identity',
        method: 'GET',
        accessToken,
    })

    if (!data) {
        const fallback: WorkspaceIdentitySnapshot = {
            profile: getEmptyProfileFallback(user.id),
            onboarding_progress: null,
            onboarding_details: null,
            membership: null,
        }
        setCacheEntryValue(workspaceIdentitySnapshotCache, cacheKey, fallback)
        return fallback
    }

    const snapshot: WorkspaceIdentitySnapshot = {
        profile: mapProfile(data.profile, user.id),
        onboarding_progress: mapOnboardingProgress(data.onboarding_progress),
        onboarding_details: mapOnboardingDetails(data.onboarding_details),
        membership: mapMembership(data.membership),
    }
    setCacheEntryValue(workspaceIdentitySnapshotCache, cacheKey, snapshot)
    return snapshot
}

function buildSnapshotFromBootstrapResponse(
    data: WorkspaceBootstrapApiResponse,
    userId: string
): WorkspaceBootstrapSnapshot {
    return {
        profile: mapProfile(data.profile, userId),
        membership: mapMembership(data.membership),
        verification_status: normalizeOrganizationVerificationStatus(data.verification_status),
        current_plan: mapBillingCurrentPlan(data.current_plan),
        organization_core_team: mapArray(data.organization_core_team, mapOrganizationCoreTeamMember),
        organization_readiness: mapOrganizationReadiness(data.organization_readiness),
        startup_discovery_feed: mapArray(data.startup_discovery_feed, mapStartupDiscoveryFeedItem),
        discovery_feed: mapArray(data.discovery_feed, mapUnifiedDiscoveryCard),
        startup_readiness: mapStartupReadiness(data.startup_readiness),
    }
}

export async function getWorkspaceBootstrapForCurrentUser(
    user: User,
    input?: {
        accessToken?: string | null
        /** When true, skip cache so the next request always hits the API (e.g. after "Try again"). */
        skipCache?: boolean
        /** When direct API fails, try fetching via Next.js proxy (same-origin). */
        proxyOptions?: { cookieHeader: string; appOrigin: string }
    }
): Promise<WorkspaceBootstrapSnapshot> {
    const cacheKey = `bootstrap:${user.id}`
    if (!input?.skipCache) {
        const cached = getCacheEntryValue(workspaceBootstrapSnapshotCache, cacheKey)
        if (cached) {
            return cached
        }
    }

    const emptyPayload: WorkspaceBootstrapSnapshot = {
        profile: getEmptyProfileFallback(user.id),
        membership: null,
        verification_status: 'unverified',
        current_plan: null,
        organization_core_team: [],
        organization_readiness: null,
        startup_discovery_feed: [],
        discovery_feed: [],
        startup_readiness: null,
    }

    const accessToken = input?.accessToken ?? await getAccessToken()
    if (accessToken) {
        const data = await apiRequest<WorkspaceBootstrapApiResponse | null>({
            path: '/workspace/bootstrap',
            method: 'GET',
            accessToken,
        })
        if (data) {
            const snapshot = buildSnapshotFromBootstrapResponse(data, user.id)
            setCacheEntryValue(workspaceBootstrapSnapshotCache, cacheKey, snapshot)
            return snapshot
        }
    }

    if (input?.proxyOptions?.cookieHeader && input.proxyOptions?.appOrigin) {
        const proxyUrl = `${input.proxyOptions.appOrigin.replace(/\/+$/, '')}/api/workspace/bootstrap`
        try {
            const res = await fetch(proxyUrl, {
                method: 'GET',
                headers: { cookie: input.proxyOptions.cookieHeader },
                cache: 'no-store',
            })
            if (res.ok) {
                const data = (await res.json()) as WorkspaceBootstrapApiResponse
                const snapshot = buildSnapshotFromBootstrapResponse(data, user.id)
                setCacheEntryValue(workspaceBootstrapSnapshotCache, cacheKey, snapshot)
                return snapshot
            }
        } catch {
            // fall through to identity fallback
        }
    }

    const identitySnapshot = await getWorkspaceIdentityForUser(user, input?.accessToken ? { accessToken: input.accessToken } : undefined)
    if (identitySnapshot.membership) {
        const minimalSnapshot: WorkspaceBootstrapSnapshot = {
            profile: identitySnapshot.profile,
            membership: identitySnapshot.membership,
            verification_status: 'unverified',
            current_plan: null,
            organization_core_team: [],
            organization_readiness: null,
            startup_discovery_feed: [],
            discovery_feed: [],
            startup_readiness: null,
        }
        setCacheEntryValue(workspaceBootstrapSnapshotCache, cacheKey, minimalSnapshot)
        return minimalSnapshot
    }

    return emptyPayload
}
