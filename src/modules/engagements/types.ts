export type EngagementRequestStatus = 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
export type EngagementRequestDecision = 'accepted' | 'rejected'
export type AdvisorDirectoryVerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected'

export type AdvisorDirectoryEntry = {
    id: string
    name: string
    location: string | null
    industry_tags: string[]
    verification_status: AdvisorDirectoryVerificationStatus
}

export type EngagementRequest = {
    id: string
    startup_org_id: string
    startup_org_name: string
    advisor_org_id: string
    advisor_org_name: string
    status: EngagementRequestStatus
    created_at: string
    responded_at: string | null
    prep_room_id: string | null
}

export type RequestCreditBalance = {
    period_start_date: string | null
    allocated: number
    consumed: number
    balance: number
}

export type StartupEngagementPipelineStatus = {
    startup_org_id: string
    readiness_score: number
    readiness_is_ready: boolean
    readiness_missing_steps: string[]
    has_startup_post: boolean
    has_pitch_deck: boolean
    has_team_info: boolean
    credit_period_start_date: string | null
    credits_allocated: number
    credits_consumed: number
    credits_balance: number
    pending_requests: number
    accepted_requests: number
    closed_requests: number
    active_prep_rooms: number
    investor_intro_eligible: boolean
}
