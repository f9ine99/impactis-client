import type { SupabaseClient, User } from '@supabase/supabase-js'
import { apiRequest } from '@/lib/api/rest-client'
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
    WorkspaceBootstrapSnapshot,
    WorkspaceOrganizationReadinessSnapshot,
} from './types'

export const WORKSPACE_IDENTITY_CACHE_TAG = 'workspace-identity'

export type WorkspaceIdentitySnapshot = {
    profile: UserProfile
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
    membership: unknown
}

type WorkspaceBootstrapApiResponse = {
    profile: unknown
    membership: unknown
    verification_status: unknown
    current_plan: unknown
    organization_core_team: unknown
    organization_readiness: unknown
    startup_discovery_feed: unknown
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

async function getAccessToken(supabase: SupabaseClient): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    return session?.access_token ?? null
}

export async function getWorkspaceIdentityForUser(
    supabase: SupabaseClient,
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

    const accessToken = input?.accessToken ?? await getAccessToken(supabase)
    if (!accessToken) {
        return {
            profile: getEmptyProfileFallback(user.id),
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
            membership: null,
        }
        setCacheEntryValue(workspaceIdentitySnapshotCache, cacheKey, fallback)
        return fallback
    }

    const snapshot: WorkspaceIdentitySnapshot = {
        profile: mapProfile(data.profile, user.id),
        membership: mapMembership(data.membership),
    }
    setCacheEntryValue(workspaceIdentitySnapshotCache, cacheKey, snapshot)
    return snapshot
}

export async function getWorkspaceBootstrapForCurrentUser(
    supabase: SupabaseClient,
    user: User,
    input?: {
        accessToken?: string | null
    }
): Promise<WorkspaceBootstrapSnapshot> {
    const cacheKey = `bootstrap:${user.id}`
    const cached = getCacheEntryValue(workspaceBootstrapSnapshotCache, cacheKey)
    if (cached) {
        return cached
    }

    const emptyPayload: WorkspaceBootstrapSnapshot = {
        profile: getEmptyProfileFallback(user.id),
        membership: null,
        verification_status: 'unverified',
        current_plan: null,
        organization_core_team: [],
        organization_readiness: null,
        startup_discovery_feed: [],
        startup_readiness: null,
    }

    const accessToken = input?.accessToken ?? await getAccessToken(supabase)
    if (!accessToken) {
        return emptyPayload
    }

    const data = await apiRequest<WorkspaceBootstrapApiResponse | null>({
        path: '/workspace/bootstrap',
        method: 'GET',
        accessToken,
    })

    if (!data) {
        setCacheEntryValue(workspaceBootstrapSnapshotCache, cacheKey, emptyPayload)
        return emptyPayload
    }

    const snapshot: WorkspaceBootstrapSnapshot = {
        profile: mapProfile(data.profile, user.id),
        membership: mapMembership(data.membership),
        verification_status: normalizeOrganizationVerificationStatus(data.verification_status),
        current_plan: mapBillingCurrentPlan(data.current_plan),
        organization_core_team: mapArray(data.organization_core_team, mapOrganizationCoreTeamMember),
        organization_readiness: mapOrganizationReadiness(data.organization_readiness),
        startup_discovery_feed: mapArray(data.startup_discovery_feed, mapStartupDiscoveryFeedItem),
        startup_readiness: mapStartupReadiness(data.startup_readiness),
    }
    setCacheEntryValue(workspaceBootstrapSnapshotCache, cacheKey, snapshot)
    return snapshot
}
