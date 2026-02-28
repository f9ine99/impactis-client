import type {
    AdvisorDirectoryEntry,
    EngagementRequest,
} from '@/modules/engagements'
import type {
    OrganizationMembership,
    OrganizationMemberDirectoryEntry,
    OrganizationOutgoingInvite,
    OrganizationVerificationStatus,
} from '@/modules/organizations'
import type {
    StartupPost,
    StartupDiscoveryFeedItem,
    StartupProfile,
    StartupReadiness,
} from '@/modules/startups'
import type { BillingCurrentPlanSnapshot } from '@/modules/billing'
import type { UserProfile } from '@/modules/profiles'

export type WorkspaceSnapshot = {
    verification_status: OrganizationVerificationStatus
    current_plan: BillingCurrentPlanSnapshot | null
    engagement_requests: EngagementRequest[]
    advisor_directory: AdvisorDirectoryEntry[]
    startup_readiness: StartupReadiness | null
}

export type WorkspaceSettingsSnapshot = {
    verification_status: OrganizationVerificationStatus
    current_plan: BillingCurrentPlanSnapshot | null
    pending_invites_count: number
    pending_invites: OrganizationOutgoingInvite[]
    startup_profile: StartupProfile | null
    startup_post: StartupPost | null
    startup_readiness: StartupReadiness | null
}

export type WorkspaceDashboardSnapshot = {
    verification_status: OrganizationVerificationStatus
    current_plan: BillingCurrentPlanSnapshot | null
    organization_core_team: OrganizationMemberDirectoryEntry[]
    organization_readiness: WorkspaceOrganizationReadinessSnapshot | null
    startup_discovery_feed: StartupDiscoveryFeedItem[]
    startup_readiness: StartupReadiness | null
}

export type WorkspaceOrganizationReadinessSnapshot = {
    org_id: string
    org_type: 'startup' | 'advisor' | 'investor'
    readiness_score: number
    is_ready: boolean
    missing_steps: string[]
    rules_version: string
    computed_at: string | null
}

export type WorkspaceBootstrapSnapshot = {
    profile: UserProfile
    membership: OrganizationMembership | null
    verification_status: OrganizationVerificationStatus
    current_plan: BillingCurrentPlanSnapshot | null
    organization_core_team: OrganizationMemberDirectoryEntry[]
    organization_readiness: WorkspaceOrganizationReadinessSnapshot | null
    startup_discovery_feed: StartupDiscoveryFeedItem[]
    startup_readiness: StartupReadiness | null
}
