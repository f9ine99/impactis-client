import type { SupabaseClient, User } from '@supabase/supabase-js'
import { apiRequest } from '@/lib/api/rest-client'
import type {
    OrganizationCapability,
    OrganizationCapabilityGateResult,
    OrganizationCapabilityGateReason,
    CreateOrganizationInput,
    OrganizationMemberDirectoryEntry,
    Organization,
    OrganizationInvite,
    OrganizationInviteStatus,
    OrganizationMembership,
    OrganizationMemberRole,
    OrganizationMembershipStatus,
    OrganizationOutgoingInvite,
    OrganizationType,
    OrganizationVerification,
    OrganizationVerificationOverview,
    OrganizationVerificationStatus,
} from './types'

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
const ORGANIZATION_INVITE_STATUSES = new Set<OrganizationInviteStatus>([
    'pending',
    'accepted',
    'expired',
    'cancelled',
    'revoked',
])

type OrganizationRow = {
    id: string
    type: string
    name: string
    location: string | null
    logo_url: string | null
    industry_tags: string[] | null
    created_at: string
}

type OrganizationMembershipRow = {
    org_id: string
    user_id: string
    member_role: string
    status: string
    created_at: string
}

type OrganizationMembershipWithOrganizationRow = OrganizationMembershipRow & {
    organization: OrganizationRow | OrganizationRow[] | null
}

type OrganizationVerificationRow = {
    org_id: string
    status: string
    reviewed_by: string | null
    reviewed_at: string | null
    notes: string | null
}

type OrganizationInviteRow = {
    id: string
    org_id: string
    organization_name: string
    organization_type: string
    member_role: string
    invited_email: string
    invited_by: string
    expires_at: string
    created_at: string
}

type OrganizationOutgoingInviteRow = {
    id: string
    org_id: string
    invited_email: string
    member_role: string
    status: string
    invited_by: string
    accepted_by: string | null
    expires_at: string
    created_at: string
    responded_at: string | null
}

type OrganizationMemberDirectoryRow = {
    user_id: string
    member_role: string
    status: string
    created_at?: string | null
    joined_at: string | null
    full_name?: string | null
    avatar_url?: string | null
    location?: string | null
}

type OrganizationMutationResult = {
    success: boolean
    message: string | null
    orgId?: string | null
    inviteId?: string | null
    inviteToken?: string | null
}

type MembershipCheckOptions = {
    failOpenOnRequestError?: boolean
    throwOnRequestError?: boolean
}

async function getAccessToken(supabase: SupabaseClient): Promise<string | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return null
    }

    const {
        data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
        return session.access_token
    }

    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
        return null
    }

    return data.session?.access_token ?? null
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

function normalizeOrganizationType(value: unknown): OrganizationType | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_TYPES.has(normalized as OrganizationType) ? (normalized as OrganizationType) : null
}

function normalizeOrganizationMemberRole(value: unknown): OrganizationMemberRole | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_MEMBER_ROLES.has(normalized as OrganizationMemberRole)
        ? (normalized as OrganizationMemberRole)
        : null
}

function normalizeOrganizationMembershipStatus(value: unknown): OrganizationMembershipStatus | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_MEMBERSHIP_STATUSES.has(normalized as OrganizationMembershipStatus)
        ? (normalized as OrganizationMembershipStatus)
        : null
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

function normalizeOrganizationInviteStatus(value: unknown): OrganizationInviteStatus | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_INVITE_STATUSES.has(normalized as OrganizationInviteStatus)
        ? (normalized as OrganizationInviteStatus)
        : null
}

function mapOrganization(row: OrganizationRow): Organization | null {
    const type = normalizeOrganizationType(row.type)
    const name = normalizeText(row.name)

    if (!type || !name) {
        return null
    }

    return {
        id: row.id,
        type,
        name,
        location: normalizeText(row.location),
        logo_url: normalizeText(row.logo_url),
        industry_tags: normalizeArray(row.industry_tags),
        created_at: row.created_at,
    }
}

function mapOrganizationMembershipWithOrganization(
    row: OrganizationMembershipWithOrganizationRow
): OrganizationMembership | null {
    const memberRole = normalizeOrganizationMemberRole(row.member_role)
    const membershipStatus = normalizeOrganizationMembershipStatus(row.status)
    if (!memberRole || !membershipStatus) {
        return null
    }

    const organizationRow = Array.isArray(row.organization)
        ? row.organization[0] ?? null
        : row.organization
    if (!organizationRow) {
        return null
    }

    const organization = mapOrganization(organizationRow)
    if (!organization) {
        return null
    }

    return {
        org_id: row.org_id,
        user_id: row.user_id,
        member_role: memberRole,
        status: membershipStatus,
        created_at: row.created_at,
        organization,
    }
}

function mapOrganizationMemberDirectoryRow(
    row: OrganizationMemberDirectoryRow
): OrganizationMemberDirectoryEntry | null {
    const memberRole = normalizeOrganizationMemberRole(row.member_role)
    const membershipStatus = normalizeOrganizationMembershipStatus(row.status)
    if (!memberRole || !membershipStatus) {
        return null
    }

    return {
        user_id: row.user_id,
        member_role: memberRole,
        status: membershipStatus,
        joined_at: normalizeText(row.joined_at) ?? normalizeText(row.created_at),
        full_name: normalizeText(row.full_name),
        avatar_url: normalizeText(row.avatar_url),
        location: normalizeText(row.location),
    }
}

function getDefaultVerification(orgId: string): OrganizationVerification {
    return {
        org_id: orgId,
        status: 'unverified',
        reviewed_by: null,
        reviewed_at: null,
        notes: null,
    }
}

function mapOrganizationVerification(row: OrganizationVerificationRow): OrganizationVerification {
    return {
        org_id: row.org_id,
        status: normalizeOrganizationVerificationStatus(row.status),
        reviewed_by: normalizeText(row.reviewed_by),
        reviewed_at: normalizeText(row.reviewed_at),
        notes: normalizeText(row.notes),
    }
}

function mapOrganizationInvite(row: OrganizationInviteRow): OrganizationInvite | null {
    const organizationType = normalizeOrganizationType(row.organization_type)
    const memberRole = normalizeOrganizationMemberRole(row.member_role)
    const invitedEmail = normalizeText(row.invited_email)
    const organizationName = normalizeText(row.organization_name)

    if (!organizationType || !memberRole || !invitedEmail || !organizationName) {
        return null
    }

    return {
        id: row.id,
        org_id: row.org_id,
        organization_name: organizationName,
        organization_type: organizationType,
        member_role: memberRole,
        invited_email: invitedEmail,
        invited_by: row.invited_by,
        expires_at: row.expires_at,
        created_at: row.created_at,
    }
}

function mapOrganizationOutgoingInvite(row: OrganizationOutgoingInviteRow): OrganizationOutgoingInvite | null {
    const memberRole = normalizeOrganizationMemberRole(row.member_role)
    const inviteStatus = normalizeOrganizationInviteStatus(row.status)
    const invitedEmail = normalizeText(row.invited_email)
    if (!memberRole || !inviteStatus || !invitedEmail) {
        return null
    }

    return {
        id: row.id,
        org_id: row.org_id,
        invited_email: invitedEmail,
        member_role: memberRole,
        status: inviteStatus,
        invited_by: row.invited_by,
        accepted_by: normalizeText(row.accepted_by),
        expires_at: row.expires_at,
        created_at: row.created_at,
        responded_at: normalizeText(row.responded_at),
    }
}

export function mapAppRoleToOrganizationType(role: unknown): OrganizationType | null {
    if (typeof role !== 'string') {
        return null
    }

    const normalized = role.trim().toLowerCase()
    if (normalized === 'founder' || normalized === 'startup') {
        return 'startup'
    }

    if (normalized === 'investor') {
        return 'investor'
    }

    if (normalized === 'advisor') {
        return 'advisor'
    }

    return null
}

export function parseIndustryTags(rawValue: string): string[] {
    return Array.from(
        new Set(
            rawValue
                .split(',')
                .map((segment) => segment.trim())
                .filter((segment) => segment.length > 0)
        )
    )
}

function getRequiredOrganizationTypeForCapability(capability: OrganizationCapability): OrganizationType {
    if (capability === 'advisor_intro_send') {
        return 'advisor'
    }

    return 'investor'
}

function getCapabilityDescription(capability: OrganizationCapability): string {
    if (capability === 'advisor_intro_send') {
        return 'send investor intro requests'
    }

    if (capability === 'investor_intro_receive') {
        return 'receive advisor intros'
    }

    return 'accept advisor intros'
}

function buildCapabilityResult(input: {
    capability: OrganizationCapability
    reason: OrganizationCapabilityGateReason
    organizationType: OrganizationType | null
    verificationStatus: OrganizationVerificationStatus | null
}): OrganizationCapabilityGateResult {
    const requiredOrganizationType = getRequiredOrganizationTypeForCapability(input.capability)
    const capabilityDescription = getCapabilityDescription(input.capability)

    if (input.reason === 'ok') {
        return {
            capability: input.capability,
            allowed: true,
            reason: input.reason,
            requiredOrganizationType,
            organizationType: input.organizationType,
            verificationStatus: input.verificationStatus,
            message: `Organization is verified and can ${capabilityDescription}.`,
        }
    }

    if (input.reason === 'missing_membership') {
        return {
            capability: input.capability,
            allowed: false,
            reason: input.reason,
            requiredOrganizationType,
            organizationType: input.organizationType,
            verificationStatus: input.verificationStatus,
            message: 'Organization membership is required.',
        }
    }

    if (input.reason === 'wrong_org_type') {
        return {
            capability: input.capability,
            allowed: false,
            reason: input.reason,
            requiredOrganizationType,
            organizationType: input.organizationType,
            verificationStatus: input.verificationStatus,
            message: `Only ${requiredOrganizationType} organizations can ${capabilityDescription}.`,
        }
    }

    return {
        capability: input.capability,
        allowed: false,
        reason: input.reason,
        requiredOrganizationType,
        organizationType: input.organizationType,
        verificationStatus: input.verificationStatus,
        message: 'Organization verification approval is required.',
    }
}

export function evaluateOrganizationCapability(input: {
    capability: OrganizationCapability
    organizationType: OrganizationType | null
    verificationStatus: OrganizationVerificationStatus | null
}): OrganizationCapabilityGateResult {
    if (!input.organizationType) {
        return buildCapabilityResult({
            capability: input.capability,
            reason: 'missing_membership',
            organizationType: input.organizationType,
            verificationStatus: input.verificationStatus,
        })
    }

    const requiredOrganizationType = getRequiredOrganizationTypeForCapability(input.capability)
    if (input.organizationType !== requiredOrganizationType) {
        return buildCapabilityResult({
            capability: input.capability,
            reason: 'wrong_org_type',
            organizationType: input.organizationType,
            verificationStatus: input.verificationStatus,
        })
    }

    if (input.verificationStatus !== 'approved') {
        return buildCapabilityResult({
            capability: input.capability,
            reason: 'verification_required',
            organizationType: input.organizationType,
            verificationStatus: input.verificationStatus,
        })
    }

    return buildCapabilityResult({
        capability: input.capability,
        reason: 'ok',
        organizationType: input.organizationType,
        verificationStatus: input.verificationStatus,
    })
}

export async function getPrimaryOrganizationMembershipByUserId(
    supabase: SupabaseClient,
    userId: string
): Promise<OrganizationMembership | null> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        return null
    }

    let membershipData: OrganizationMembershipWithOrganizationRow | null = null
    try {
        membershipData = await apiRequest<OrganizationMembershipWithOrganizationRow | null>({
            path: '/organizations/me/membership',
            method: 'GET',
            accessToken,
            throwOnError: true,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown membership lookup error'
        console.warn(`[organizations] Failed to load primary membership for user ${userId}: ${message}`)
        return null
    }

    if (!membershipData) {
        return null
    }

    const membershipRow = membershipData as OrganizationMembershipWithOrganizationRow
    const organizationData = Array.isArray(membershipRow.organization)
        ? membershipRow.organization[0] ?? null
        : membershipRow.organization

    if (!organizationData) {
        return null
    }

    return mapOrganizationMembershipWithOrganization({
        ...membershipRow,
        organization: organizationData as OrganizationRow,
    })
}

export async function getPrimaryOrganizationMembershipForUser(
    supabase: SupabaseClient,
    user: User
): Promise<OrganizationMembership | null> {
    return getPrimaryOrganizationMembershipByUserId(supabase, user.id)
}

export async function hasOrganizationMembershipForUser(
    supabase: SupabaseClient,
    user: User,
    options?: MembershipCheckOptions
): Promise<boolean> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        return false
    }

    try {
        const data = await apiRequest<{ hasMembership: boolean } | null>({
            path: '/organizations/me/membership/exists',
            method: 'GET',
            accessToken,
            throwOnError: true,
        })

        if (!data) {
            return false
        }

        return data.hasMembership === true
    } catch (error) {
        if (options?.throwOnRequestError) {
            throw error
        }

        const message = error instanceof Error ? error.message : 'Unknown membership check error'
        console.warn(`[organizations] Failed to check membership for user ${user.id}: ${message}`)
        return options?.failOpenOnRequestError === true
    }
}

export async function getOrganizationVerificationByOrgId(
    supabase: SupabaseClient,
    orgId: string
): Promise<OrganizationVerification> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        return getDefaultVerification(orgId)
    }

    const data = await apiRequest<OrganizationVerificationRow | null>({
        path: `/organizations/${encodeURIComponent(orgId)}/verification`,
        method: 'GET',
        accessToken,
    })
    if (!data) {
        console.warn(`[organizations] Failed to load verification for org ${orgId}`)
        return getDefaultVerification(orgId)
    }

    return mapOrganizationVerification(data as OrganizationVerificationRow)
}

export async function getOrganizationVerificationStatusByOrgId(
    supabase: SupabaseClient,
    orgId: string
): Promise<OrganizationVerificationStatus> {
    const verification = await getOrganizationVerificationByOrgId(supabase, orgId)
    return verification.status
}

export async function evaluateOrganizationCapabilityForUser(
    supabase: SupabaseClient,
    user: User,
    capability: OrganizationCapability
): Promise<OrganizationCapabilityGateResult> {
    const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
    if (!membership) {
        return evaluateOrganizationCapability({
            capability,
            organizationType: null,
            verificationStatus: null,
        })
    }

    const verificationStatus = await getOrganizationVerificationStatusByOrgId(supabase, membership.org_id)

    return evaluateOrganizationCapability({
        capability,
        organizationType: membership.organization.type,
        verificationStatus,
    })
}

export async function assertOrganizationCapabilityForUser(
    supabase: SupabaseClient,
    user: User,
    capability: OrganizationCapability
): Promise<OrganizationCapabilityGateResult> {
    const result = await evaluateOrganizationCapabilityForUser(supabase, user, capability)
    if (!result.allowed) {
        throw new Error(result.message)
    }

    return result
}

export async function listOrganizationsWithVerification(
    supabase: SupabaseClient,
    limit = 100
): Promise<OrganizationVerificationOverview[]> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const data = await apiRequest<OrganizationVerificationOverview[] | null>({
        path: `/organizations/admin/verification-overview?limit=${Math.max(1, Math.trunc(limit))}`,
        method: 'GET',
        accessToken,
        throwOnError: true,
    })
    if (!data) {
        return []
    }

    return data
        .map((entry) => {
            if (!entry || typeof entry !== 'object') {
                return null
            }

            const raw = entry as {
                organization?: OrganizationRow | null
                verification?: OrganizationVerificationRow | null
            }
            if (!raw.organization) {
                return null
            }

            const organization = mapOrganization(raw.organization)
            if (!organization) {
                return null
            }

            return {
                organization,
                verification: raw.verification
                    ? mapOrganizationVerification(raw.verification)
                    : getDefaultVerification(organization.id),
            }
        })
        .filter((entry): entry is OrganizationVerificationOverview => !!entry)
}

export async function setOrganizationVerificationStatusByOrgId(
    supabase: SupabaseClient,
    input: {
        orgId: string
        status: OrganizationVerificationStatus
        reviewedByUserId?: string | null
        notes?: string | null
    }
): Promise<OrganizationVerification> {
    const orgId = normalizeText(input.orgId)
    if (!orgId) {
        throw new Error('Organization id is required.')
    }

    const status = normalizeOrganizationVerificationStatus(input.status)
    const notes = normalizeText(input.notes ?? null)
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const data = await apiRequest<OrganizationVerificationRow | null>({
        path: `/organizations/admin/verification/${encodeURIComponent(orgId)}`,
        method: 'PATCH',
        accessToken,
        body: {
            status,
            notes,
        },
        throwOnError: true,
    })
    if (!data) {
        throw new Error('Unable to update organization verification right now.')
    }

    return mapOrganizationVerification(data as OrganizationVerificationRow)
}

export async function createOrganizationInviteForCurrentUser(
    supabase: SupabaseClient,
    input: { invitedEmail: string; memberRole?: OrganizationMemberRole; expiresAt?: string | null }
): Promise<{ inviteId: string; inviteToken: string }> {
    const invitedEmail = normalizeText(input.invitedEmail)
    if (!invitedEmail) {
        throw new Error('Invited email is required.')
    }

    const memberRole = normalizeOrganizationMemberRole(input.memberRole ?? 'member')
    if (!memberRole) {
        throw new Error('Invalid member role.')
    }

    const expiresAt = normalizeText(input.expiresAt ?? null)
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<OrganizationMutationResult>({
        path: '/organizations/invites',
        method: 'POST',
        accessToken,
        body: {
            invitedEmail,
            memberRole,
            expiresAt,
        },
    })

    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to create organization invite right now.')
    }

    const inviteId = normalizeText(result.inviteId)
    const inviteToken = normalizeText(result.inviteToken)
    if (!inviteId || !inviteToken) {
        throw new Error('Unexpected response while creating organization invite.')
    }

    return { inviteId, inviteToken }
}

export async function listMyOrganizationInvites(
    supabase: SupabaseClient
): Promise<OrganizationInvite[]> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        console.warn('[organizations] Failed to list organization invites: missing access token')
        return []
    }

    const data = await apiRequest<OrganizationInviteRow[]>({
        path: '/organizations/invites/my',
        method: 'GET',
        accessToken,
    })
    if (!data) {
        console.warn('[organizations] Failed to list organization invites')
        return []
    }

    return data
        .map((row) => mapOrganizationInvite(row))
        .filter((invite): invite is OrganizationInvite => !!invite)
}

export async function listOrganizationInvitesForOrg(
    supabase: SupabaseClient,
    input: {
        orgId: string
        statuses?: OrganizationInviteStatus[]
    }
): Promise<OrganizationOutgoingInvite[]> {
    const orgId = normalizeText(input.orgId)
    if (!orgId) {
        throw new Error('Organization id is required.')
    }

    const statuses = (input.statuses ?? [])
        .map((status) => normalizeOrganizationInviteStatus(status))
        .filter((status): status is OrganizationInviteStatus => !!status)
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        console.warn('[organizations] Failed to list organization invites: missing access token')
        return []
    }

    const query = statuses.length > 0
        ? `?statuses=${encodeURIComponent(statuses.join(','))}`
        : ''
    const data = await apiRequest<OrganizationOutgoingInviteRow[] | null>({
        path: `/organizations/${encodeURIComponent(orgId)}/invites/outgoing${query}`,
        method: 'GET',
        accessToken,
    })
    if (!data) {
        console.warn('[organizations] Failed to list organization invites for org')
        return []
    }

    return (data ?? [])
        .map((row) => mapOrganizationOutgoingInvite(row))
        .filter((invite): invite is OrganizationOutgoingInvite => !!invite)
}

export async function countOrganizationInvitesForOrg(
    supabase: SupabaseClient,
    input: {
        orgId: string
        statuses?: OrganizationInviteStatus[]
    }
): Promise<number> {
    const orgId = normalizeText(input.orgId)
    if (!orgId) {
        throw new Error('Organization id is required.')
    }

    const statuses = (input.statuses ?? [])
        .map((status) => normalizeOrganizationInviteStatus(status))
        .filter((status): status is OrganizationInviteStatus => !!status)
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        return 0
    }

    const query = statuses.length > 0
        ? `?statuses=${encodeURIComponent(statuses.join(','))}`
        : ''
    const data = await apiRequest<{ count: number } | null>({
        path: `/organizations/${encodeURIComponent(orgId)}/invites/outgoing/count${query}`,
        method: 'GET',
        accessToken,
    })
    if (!data) {
        console.warn('[organizations] Failed to count organization invites for org')
        return 0
    }

    return typeof data.count === 'number' && Number.isFinite(data.count)
        ? Math.max(0, Math.trunc(data.count))
        : 0
}

export async function listActiveOrganizationMembersForOrg(
    supabase: SupabaseClient,
    input: { orgId: string }
): Promise<OrganizationMemberDirectoryEntry[]> {
    const orgId = normalizeText(input.orgId)
    if (!orgId) {
        throw new Error('Organization id is required.')
    }

    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        return []
    }

    const data = await apiRequest<OrganizationMemberDirectoryRow[] | null>({
        path: `/organizations/${encodeURIComponent(orgId)}/members/active`,
        method: 'GET',
        accessToken,
    })
    if (!data) {
        console.warn('[organizations] Failed to list organization members for org')
        return []
    }

    return (data ?? [])
        .map((row) => mapOrganizationMemberDirectoryRow(row))
        .filter((member): member is OrganizationMemberDirectoryEntry => !!member)
}

export async function acceptOrganizationInviteForCurrentUser(
    supabase: SupabaseClient,
    inviteToken: string
): Promise<string> {
    const normalizedInviteToken = normalizeText(inviteToken)
    if (!normalizedInviteToken) {
        throw new Error('Invite token is required.')
    }

    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<OrganizationMutationResult>({
        path: '/organizations/invites/accept',
        method: 'POST',
        accessToken,
        body: {
            inviteToken: normalizedInviteToken,
        },
    })

    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to accept organization invite right now.')
    }

    const orgId = normalizeText(result.orgId)
    if (!orgId) {
        throw new Error('Unexpected response while accepting organization invite.')
    }

    return orgId
}

export async function revokeOrganizationInviteForCurrentUser(
    supabase: SupabaseClient,
    inviteId: string
): Promise<void> {
    const normalizedInviteId = normalizeText(inviteId)
    if (!normalizedInviteId) {
        throw new Error('Invite id is required.')
    }

    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<OrganizationMutationResult>({
        path: `/organizations/invites/${encodeURIComponent(normalizedInviteId)}`,
        method: 'DELETE',
        accessToken,
    })

    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to revoke invite right now.')
    }
}

export async function createOrganizationWithOwner(
    supabase: SupabaseClient,
    input: CreateOrganizationInput
): Promise<string> {
    const name = normalizeText(input.name)
    if (!name) {
        throw new Error('Organization name is required.')
    }

    const type = normalizeOrganizationType(input.type)
    if (!type) {
        throw new Error('Invalid organization type.')
    }

    const location = normalizeText(input.location ?? null)
    const industryTags = normalizeArray(input.industryTags)

    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<OrganizationMutationResult>({
        path: '/organizations',
        method: 'POST',
        accessToken,
        body: {
            name,
            type,
            location,
            industryTags,
        },
        throwOnError: true,
    })

    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to create organization right now.')
    }

    const orgId = normalizeText(result.orgId)
    if (!orgId) {
        throw new Error('Unexpected response while creating organization.')
    }

    return orgId
}

export async function updateMyOrganizationSettings(
    supabase: SupabaseClient,
    input: {
        name: string
        location?: string | null
        logoUrl?: string | null
        industryTags?: string[]
    }
): Promise<string> {
    const name = normalizeText(input.name)
    if (!name || name.length < 2) {
        throw new Error('Organization name must be at least 2 characters.')
    }

    const location = normalizeText(input.location ?? null)
    const logoUrl = normalizeText(input.logoUrl ?? null)
    const industryTags = normalizeArray(input.industryTags)

    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<OrganizationMutationResult>({
        path: '/organizations/identity',
        method: 'PATCH',
        accessToken,
        body: {
            name,
            location,
            logoUrl,
            industryTags,
        },
    })

    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to update organization settings right now.')
    }

    const orgId = normalizeText(result.orgId)
    if (!orgId) {
        throw new Error('Unexpected response while updating organization settings.')
    }

    return orgId
}
