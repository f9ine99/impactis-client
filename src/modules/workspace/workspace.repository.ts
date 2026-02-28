import type { SupabaseClient } from '@supabase/supabase-js'
import { apiRequest } from '@/lib/api/rest-client'
import type {
    OrganizationMemberDirectoryEntry,
    OrganizationMemberRole,
    OrganizationMembershipStatus,
    OrganizationOutgoingInvite,
    OrganizationInviteStatus,
    OrganizationVerificationStatus,
} from '@/modules/organizations'
import type {
    StartupDiscoveryFeedItem,
    StartupDiscoveryVerificationStatus,
    StartupPitchDeckMediaKind,
    StartupPost,
    StartupPostStatus,
    StartupProfile,
    StartupReadiness,
    StartupReadinessSectionScore,
    StartupReadinessStep,
} from '@/modules/startups'
import { mapBillingCurrentPlan } from '@/modules/billing'
import type {
    WorkspaceDashboardSnapshot,
    WorkspaceOrganizationReadinessSnapshot,
    WorkspaceSettingsSnapshot,
} from './types'

const ORGANIZATION_VERIFICATION_STATUSES = new Set<OrganizationVerificationStatus>([
    'unverified',
    'pending',
    'approved',
    'rejected',
])
const ORGANIZATION_MEMBER_ROLES = new Set<OrganizationMemberRole>([
    'owner',
    'admin',
    'member',
])
const ORGANIZATION_MEMBERSHIP_STATUSES = new Set<OrganizationMembershipStatus>([
    'pending',
    'active',
    'left',
    'removed',
    'expired',
    'cancelled',
])
const ORGANIZATION_INVITE_STATUSES = new Set<OrganizationInviteStatus>([
    'pending',
    'accepted',
    'expired',
    'cancelled',
    'revoked',
])
const STARTUP_POST_STATUSES = new Set<StartupPostStatus>([
    'draft',
    'published',
])
const STARTUP_PITCH_DECK_MEDIA_KINDS = new Set<StartupPitchDeckMediaKind>([
    'document',
    'video',
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

const WORKSPACE_SETTINGS_SNAPSHOT_CACHE_TTL_MS = 60_000
const WORKSPACE_SETTINGS_SNAPSHOT_CACHE_MAX_ENTRIES = 500

type WorkspaceSettingsSnapshotRow = {
    verification_status: unknown
    current_plan: unknown
    pending_invites_count: unknown
    pending_invites: unknown
    startup_profile: unknown
    startup_post: unknown
    startup_readiness: unknown
}

type WorkspaceDashboardSnapshotRow = {
    verification_status: unknown
    current_plan: unknown
    organization_core_team: unknown
    organization_readiness: unknown
    startup_discovery_feed: unknown
    startup_readiness: unknown
}

type WorkspaceCoreTeamMemberRow = {
    user_id: unknown
    member_role: unknown
    status: unknown
    joined_at: unknown
    full_name: unknown
    avatar_url: unknown
    location: unknown
}

type SnapshotCacheEntry<T> = {
    value: T
    expiresAt: number
}

const workspaceSettingsSnapshotCache = new Map<string, SnapshotCacheEntry<WorkspaceSettingsSnapshot | null>>()

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
    if (cache.size <= WORKSPACE_SETTINGS_SNAPSHOT_CACHE_MAX_ENTRIES) {
        return
    }

    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
        if (entry.expiresAt <= now) {
            cache.delete(key)
        }
    }

    while (cache.size > WORKSPACE_SETTINGS_SNAPSHOT_CACHE_MAX_ENTRIES) {
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
        expiresAt: Date.now() + WORKSPACE_SETTINGS_SNAPSHOT_CACHE_TTL_MS,
    })
}

async function getAccessToken(supabase: SupabaseClient): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token ?? null
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

function normalizeBoolean(value: unknown): boolean {
    return value === true
}

function normalizeNumber(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return 0
    }

    return Math.max(0, Math.round(value))
}

function normalizeNullableNumber(value: unknown): number | null {
    if (typeof value === 'number' && !Number.isNaN(value)) {
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

function normalizeOrganizationVerificationStatus(value: unknown): OrganizationVerificationStatus {
    if (typeof value !== 'string') {
        return 'unverified'
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_VERIFICATION_STATUSES.has(normalized as OrganizationVerificationStatus)
        ? (normalized as OrganizationVerificationStatus)
        : 'unverified'
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

function normalizeInviteStatus(value: unknown): OrganizationInviteStatus | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_INVITE_STATUSES.has(normalized as OrganizationInviteStatus)
        ? (normalized as OrganizationInviteStatus)
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

function normalizeStartupPostStatus(value: unknown): StartupPostStatus | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return STARTUP_POST_STATUSES.has(normalized as StartupPostStatus)
        ? (normalized as StartupPostStatus)
        : null
}

function normalizeStartupPitchDeckMediaKind(value: unknown): StartupPitchDeckMediaKind | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return STARTUP_PITCH_DECK_MEDIA_KINDS.has(normalized as StartupPitchDeckMediaKind)
        ? (normalized as StartupPitchDeckMediaKind)
        : null
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
    const orgType = normalizeText(row.org_type)
    if (!orgId || (orgType !== 'startup' && orgType !== 'advisor' && orgType !== 'investor')) {
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

function mapStartupProfile(value: unknown): StartupProfile | null {
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
        website_url: normalizeText(row.website_url),
        pitch_deck_url: normalizeText(row.pitch_deck_url),
        pitch_deck_media_kind: normalizeStartupPitchDeckMediaKind(row.pitch_deck_media_kind),
        pitch_deck_file_name: normalizeText(row.pitch_deck_file_name),
        pitch_deck_file_size_bytes: normalizeNullableNumber(row.pitch_deck_file_size_bytes),
        team_overview: normalizeText(row.team_overview),
        company_stage: normalizeText(row.company_stage),
        founding_year: normalizeNullableNumber(row.founding_year),
        team_size: normalizeNullableNumber(row.team_size),
        target_market: normalizeText(row.target_market),
        business_model: normalizeText(row.business_model),
        traction_summary: normalizeText(row.traction_summary),
        financial_summary: normalizeText(row.financial_summary),
        legal_summary: normalizeText(row.legal_summary),
        financial_doc_url: normalizeText(row.financial_doc_url),
        financial_doc_file_name: normalizeText(row.financial_doc_file_name),
        financial_doc_file_size_bytes: normalizeNullableNumber(row.financial_doc_file_size_bytes),
        legal_doc_url: normalizeText(row.legal_doc_url),
        legal_doc_file_name: normalizeText(row.legal_doc_file_name),
        legal_doc_file_size_bytes: normalizeNullableNumber(row.legal_doc_file_size_bytes),
        updated_at: normalizeText(row.updated_at),
    }
}

function mapStartupPost(value: unknown): StartupPost | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const row = value as Record<string, unknown>
    const id = normalizeText(row.id)
    const startupOrgId = normalizeText(row.startup_org_id)
    const title = normalizeText(row.title)
    const summary = normalizeText(row.summary)
    const status = normalizeStartupPostStatus(row.status)
    const updatedAt = normalizeText(row.updated_at)
    if (!id || !startupOrgId || !title || !summary || !status || !updatedAt) {
        return null
    }

    return {
        id,
        startup_org_id: startupOrgId,
        title,
        summary,
        stage: normalizeText(row.stage),
        location: normalizeText(row.location),
        industry_tags: normalizeArray(row.industry_tags),
        status,
        published_at: normalizeText(row.published_at),
        updated_at: updatedAt,
    }
}

function mapOrganizationOutgoingInvite(value: unknown): OrganizationOutgoingInvite | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const row = value as Record<string, unknown>
    const id = normalizeText(row.id)
    const orgId = normalizeText(row.org_id)
    const invitedEmail = normalizeText(row.invited_email)
    const memberRole = normalizeMemberRole(row.member_role)
    const status = normalizeInviteStatus(row.status)
    const invitedBy = normalizeText(row.invited_by)
    const expiresAt = normalizeText(row.expires_at)
    const createdAt = normalizeText(row.created_at)
    if (
        !id
        || !orgId
        || !invitedEmail
        || !memberRole
        || !status
        || !invitedBy
        || !expiresAt
        || !createdAt
    ) {
        return null
    }

    return {
        id,
        org_id: orgId,
        invited_email: invitedEmail,
        member_role: memberRole,
        status,
        invited_by: invitedBy,
        accepted_by: normalizeText(row.accepted_by),
        expires_at: expiresAt,
        created_at: createdAt,
        responded_at: normalizeText(row.responded_at),
    }
}

function mapOrganizationCoreTeamMember(value: unknown): OrganizationMemberDirectoryEntry | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const row = value as WorkspaceCoreTeamMemberRow
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

function mapArray<T>(value: unknown, mapItem: (item: unknown) => T | null): T[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((item) => mapItem(item))
        .filter((item): item is T => !!item)
}

export async function getWorkspaceDashboardForCurrentUser(
    supabase: SupabaseClient
): Promise<WorkspaceDashboardSnapshot | null> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        console.warn('[workspace] Failed to load workspace dashboard snapshot: missing access token')
        return null
    }

    const row = await apiRequest<WorkspaceDashboardSnapshotRow | null>({
        path: '/workspace/dashboard',
        method: 'GET',
        accessToken,
    })
    if (!row) {
        console.warn('[workspace] Failed to load workspace dashboard snapshot')
        return null
    }

    return {
        verification_status: normalizeOrganizationVerificationStatus(row.verification_status),
        current_plan: mapBillingCurrentPlan(row.current_plan),
        organization_core_team: mapArray(row.organization_core_team, mapOrganizationCoreTeamMember),
        organization_readiness: mapOrganizationReadiness(row.organization_readiness),
        startup_discovery_feed: mapArray(row.startup_discovery_feed, mapStartupDiscoveryFeedItem),
        startup_readiness: mapStartupReadiness(row.startup_readiness),
    }
}

export async function listWorkspaceOrganizationCoreTeamForCurrentUser(
    supabase: SupabaseClient,
    input?: { orgId?: string | null }
): Promise<OrganizationMemberDirectoryEntry[]> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        console.warn('[workspace] Failed to load workspace core team: missing access token')
        return []
    }

    const normalizedOrgId = normalizeText(input?.orgId ?? null)
    const query = normalizedOrgId ? `?orgId=${encodeURIComponent(normalizedOrgId)}` : ''

    const rows = await apiRequest<unknown[]>({
        path: `/workspace/core-team${query}`,
        method: 'GET',
        accessToken,
    })
    if (!rows) {
        console.warn('[workspace] Failed to load workspace core team')
        return []
    }

    return rows
        .map((row) => mapOrganizationCoreTeamMember(row))
        .filter((entry): entry is OrganizationMemberDirectoryEntry => !!entry)
}

export async function getWorkspaceSettingsSnapshotForCurrentUser(
    supabase: SupabaseClient,
    input: { section?: string | null; accessToken?: string | null; userId?: string | null }
): Promise<WorkspaceSettingsSnapshot | null> {
    const section = normalizeText(input.section)
    const userId = normalizeText(input.userId ?? null)
    const cacheKey = userId ? `${userId}:${section ?? '__default__'}` : null
    if (cacheKey) {
        const cached = getCacheEntryValue(workspaceSettingsSnapshotCache, cacheKey)
        if (cached) {
            return cached
        }
    }

    const accessToken = input.accessToken ?? await getAccessToken(supabase)
    if (!accessToken) {
        console.warn('[workspace] Failed to load workspace settings snapshot: missing access token')
        return null
    }

    const query = section ? `?section=${encodeURIComponent(section)}` : ''
    const row = await apiRequest<WorkspaceSettingsSnapshotRow | null>({
        path: `/workspace/settings-snapshot${query}`,
        method: 'GET',
        accessToken,
    })
    if (!row) {
        console.warn('[workspace] Failed to load workspace settings snapshot')
        return null
    }

    const snapshot: WorkspaceSettingsSnapshot = {
        verification_status: normalizeOrganizationVerificationStatus(row.verification_status),
        current_plan: mapBillingCurrentPlan(row.current_plan),
        pending_invites_count: normalizeNumber(row.pending_invites_count),
        pending_invites: mapArray(row.pending_invites, mapOrganizationOutgoingInvite),
        startup_profile: mapStartupProfile(row.startup_profile),
        startup_post: mapStartupPost(row.startup_post),
        startup_readiness: mapStartupReadiness(row.startup_readiness),
    }
    if (cacheKey) {
        setCacheEntryValue(workspaceSettingsSnapshotCache, cacheKey, snapshot)
    }

    return snapshot
}
