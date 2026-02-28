import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowUpRight,
    Bell,
    Building2,
    CircleDollarSign,
    ClipboardList,
    FolderLock,
    Gauge,
    LayoutDashboard,
    Rocket,
    Settings2,
    ShieldCheck,
    Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getOnboardingPath } from '@/modules/onboarding'
import {
    type OrganizationOutgoingInvite,
    type OrganizationVerificationStatus,
} from '@/modules/organizations'
import {
    getBillingMeForCurrentUser,
    getBillingPlansForCurrentUser,
    resolveDataRoomDocumentsFeatureGate,
    type BillingCurrentPlanSnapshot,
    type BillingPlan,
} from '@/modules/billing'
import {
    getStartupDataRoomDocumentsForCurrentUser,
    type StartupDataRoomDocument,
} from '@/modules/startups'
import {
    getWorkspaceBootstrapForCurrentUser,
    getWorkspaceIdentityForUser,
    getWorkspaceSettingsSnapshotForCurrentUser,
} from '@/modules/workspace'
import WorkspaceUserMenu from '../WorkspaceUserMenu'
import WorkspaceThemeToggle from '../WorkspaceThemeToggle'
import BillingPlanManager from './BillingPlanManager'
import DataRoomSection from './DataRoomSection'
import OrganizationInvitesPanel from './OrganizationInvitesPanel'
import SettingsSectionNavigator, { type SettingsSectionItem } from './SettingsSectionNavigator'
import SettingsForm from './SettingsForm'
import PermissionsSection from './sections/PermissionsSection'
import TeamAccessSection from './sections/TeamAccessSection'
import ReadinessRulesSection from './sections/ReadinessRulesSection'

function toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function getAcronym(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) {
        return 'O'
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 1).toUpperCase()
    }

    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase()
}

function resolveSingleSearchParam(value: string | string[] | undefined): string | null {
    if (typeof value === 'string') {
        const normalized = value.trim()
        return normalized.length > 0 ? normalized : null
    }

    if (Array.isArray(value) && value.length > 0) {
        const first = value[0]?.trim()
        return first && first.length > 0 ? first : null
    }

    return null
}

function getVerificationMeta(status: OrganizationVerificationStatus): {
    label: string
    variant: BadgeProps['variant']
} {
    if (status === 'approved') {
        return { label: 'Approved', variant: 'success' }
    }

    if (status === 'pending') {
        return { label: 'Pending Review', variant: 'warning' }
    }

    if (status === 'rejected') {
        return { label: 'Rejected', variant: 'destructive' }
    }

    return { label: 'Unverified', variant: 'secondary' }
}

function formatDateLabel(value: string): string {
    const parsed = Date.parse(value)
    if (Number.isNaN(parsed)) {
        return 'Not scheduled'
    }

    return new Date(parsed).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    })
}

function formatCurrencyFromCents(cents: number | null, currency: string): string | null {
    if (typeof cents !== 'number' || Number.isNaN(cents)) {
        return null
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100)
}

function normalizeNullableInteger(value: unknown): number | null {
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

function getSubscriptionStatusMeta(
    status: BillingCurrentPlanSnapshot['subscription']['status']
): { label: string; variant: BadgeProps['variant'] } {
    if (status === 'active' || status === 'trialing') {
        return { label: status === 'trialing' ? 'Trialing' : 'Active', variant: 'success' }
    }

    if (status === 'past_due' || status === 'incomplete') {
        return { label: status === 'past_due' ? 'Past Due' : 'Incomplete', variant: 'warning' }
    }

    if (status === 'canceled') {
        return { label: 'Canceled', variant: 'destructive' }
    }

    if (status === 'paused') {
        return { label: 'Paused', variant: 'secondary' }
    }

    return { label: 'Unknown', variant: 'secondary' }
}

function getSectionPresentation(sectionId: string): {
    title: string
    description: string
    badgeVariant: BadgeProps['variant']
    icon: typeof Building2
} {
    if (sectionId === 'settings-startup-readiness') {
        return {
            title: 'Readiness Inputs & Score',
            description: 'Maintain the structured profile and core files used to compute readiness and discovery eligibility.',
            badgeVariant: 'warning',
            icon: Gauge,
        }
    }

    if (sectionId === 'settings-billing') {
        return {
            title: 'Subscription & Billing',
            description: 'Manage current subscription tier, interval, and plan entitlements for your organization.',
            badgeVariant: 'outline',
            icon: CircleDollarSign,
        }
    }

    if (sectionId === 'settings-discovery') {
        return {
            title: 'Startup Discovery Post',
            description: 'Control how your startup appears in advisor and investor discovery feeds.',
            badgeVariant: 'outline',
            icon: Rocket,
        }
    }

    if (sectionId === 'settings-data-room') {
        return {
            title: 'Investor Data Room',
            description: 'Centralize diligence documents for investor review. Data room files do not affect readiness scoring.',
            badgeVariant: 'outline',
            icon: FolderLock,
        }
    }

    if (sectionId === 'settings-invites') {
        return {
            title: 'Team Invites',
            description: 'Invite admins and members with secure, expiring organization links.',
            badgeVariant: 'secondary',
            icon: Users,
        }
    }

    if (sectionId === 'settings-permissions') {
        return {
            title: 'Permission Rules',
            description: 'Review governance rules enforced by membership role and organization status.',
            badgeVariant: 'secondary',
            icon: ShieldCheck,
        }
    }

    if (sectionId === 'settings-team-access') {
        return {
            title: 'Team Access',
            description: 'Define how owners, admins, and members collaborate inside your organization.',
            badgeVariant: 'secondary',
            icon: Users,
        }
    }

    if (sectionId === 'settings-readiness-rules') {
        return {
            title: 'Readiness Qualification Rules',
            description: 'Track rules that evaluate readiness inputs and control startup visibility and engagement.',
            badgeVariant: 'warning',
            icon: ClipboardList,
        }
    }

    return {
        title: 'Organization Identity',
        description: 'Update your core profile, logo, location, and categories in one dedicated editor.',
        badgeVariant: 'secondary',
        icon: Building2,
    }
}

function CurrentPlanSidebarCard(input: {
    currentPlan: BillingCurrentPlanSnapshot | null
    isLight: boolean
    panelClass: string
    mutedPanelClass: string
    textMainClass: string
    textMutedClass: string
}) {
    if (!input.currentPlan) {
        return (
            <div className={`flex flex-col gap-3 rounded-[2.5rem] border p-6 ${input.panelClass} backdrop-blur-xl`}>
                <div className="flex items-center justify-between">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${input.textMainClass}`}>Current Plan</p>
                    <Badge variant="secondary" className="rounded-lg px-2 py-0 text-[8px] font-black uppercase">
                        Missing
                    </Badge>
                </div>
                <p className={`text-[11px] leading-relaxed ${input.textMutedClass}`}>
                    No subscription record was found for this organization.
                </p>
            </div>
        )
    }

    const statusMeta = getSubscriptionStatusMeta(input.currentPlan.subscription.status)
    const billingInterval = input.currentPlan.subscription.billing_interval ?? 'monthly'
    const billedAmountCents = billingInterval === 'annual'
        ? (input.currentPlan.plan.annual_price_cents ?? input.currentPlan.plan.monthly_price_cents)
        : (input.currentPlan.plan.monthly_price_cents ?? input.currentPlan.plan.annual_price_cents)
    const billedAmountLabel = formatCurrencyFromCents(
        billedAmountCents,
        input.currentPlan.plan.currency
    ) ?? 'Custom'
    const renewalLabel = input.currentPlan.subscription.current_period_end
        ? formatDateLabel(input.currentPlan.subscription.current_period_end)
        : 'Not scheduled'

    return (
        <div className={`flex flex-col gap-4 rounded-[2.5rem] border p-6 ${input.panelClass} backdrop-blur-xl`}>
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${input.textMutedClass}`}>Current Plan</p>
                    <p className={`text-lg font-black tracking-tight ${input.textMainClass}`}>{input.currentPlan.plan.name}</p>
                </div>
                <Badge variant={statusMeta.variant} className="rounded-lg px-2 py-0 text-[8px] font-black uppercase">
                    {statusMeta.label}
                </Badge>
            </div>

            <div className="grid gap-3">
                <div className={`rounded-2xl border p-4 ${input.mutedPanelClass}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${input.textMutedClass}`}>Billing</p>
                    <p className={`mt-1 text-sm font-bold ${input.textMainClass}`}>
                        {billedAmountLabel} / {billingInterval === 'annual' ? 'year' : 'month'}
                    </p>
                </div>
                <div className={`rounded-2xl border p-4 ${input.mutedPanelClass}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${input.textMutedClass}`}>Renews On</p>
                    <p className={`mt-1 text-sm font-bold ${input.textMainClass}`}>{renewalLabel}</p>
                </div>
            </div>

            <Link
                href="/workspace/settings?section=settings-billing"
                className={`inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${input.isLight
                    ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
            >
                Manage Plan <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
        </div>
    )
}

export default async function WorkspaceSettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ section?: string | string[] }>
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const resolvedSearchParams = await searchParams
    const requestedSection = resolveSingleSearchParam(resolvedSearchParams.section)
    const requestedSectionForSnapshot = requestedSection ?? 'settings-identity'

    const {
        data: { session },
    } = await supabase.auth.getSession()
    const sharedAccessToken = session?.access_token ?? null

    const [identitySnapshot, provisionalSettingsSnapshot, bootstrapSnapshot] = await Promise.all([
        getWorkspaceIdentityForUser(supabase, user, { accessToken: sharedAccessToken }),
        getWorkspaceSettingsSnapshotForCurrentUser(supabase, {
            section: requestedSectionForSnapshot,
            accessToken: sharedAccessToken,
            userId: user.id,
        }),
        getWorkspaceBootstrapForCurrentUser(supabase, user, { accessToken: sharedAccessToken }),
    ])

    const { profile, membership } = identitySnapshot
    if (!membership) {
        redirect(getOnboardingPath())
    }

    const cookieStore = await cookies()
    const themeCookie = cookieStore.get('workspace_theme')?.value
    const isLight = themeCookie === 'light'

    const canEdit = membership.member_role === 'owner'
    const canManageBilling = membership.member_role === 'owner' || membership.member_role === 'admin'
    const settingsPropertyBlueprint: Omit<SettingsSectionItem, 'href' | 'active'>[] = membership.organization.type === 'startup'
        ? [
            { id: 'settings-identity', label: 'Organization Identity', icon: 'identity' },
            { id: 'settings-billing', label: 'Subscription & Billing', icon: 'billing' },
            { id: 'settings-startup-readiness', label: 'Readiness Inputs & Score', icon: 'readiness' },
            { id: 'settings-discovery', label: 'Discovery Post', icon: 'discovery' },
            { id: 'settings-data-room', label: 'Investor Data Room', icon: 'dataroom' },
            { id: 'settings-invites', label: 'Team Invites', icon: 'invites' },
            { id: 'settings-permissions', label: 'Permission Rules', icon: 'permissions' },
            { id: 'settings-readiness-rules', label: 'Readiness Qualification Rules', icon: 'rules' },
        ]
        : [
            { id: 'settings-identity', label: 'Organization Identity', icon: 'identity' },
            { id: 'settings-billing', label: 'Subscription & Billing', icon: 'billing' },
            { id: 'settings-invites', label: 'Team Invites', icon: 'invites' },
            { id: 'settings-permissions', label: 'Permission Rules', icon: 'permissions' },
            { id: 'settings-team-access', label: 'Team Access', icon: 'team' },
        ]
    const allowedSectionIds = new Set(settingsPropertyBlueprint.map((section) => section.id))
    const activeSectionId = requestedSection && allowedSectionIds.has(requestedSection)
        ? requestedSection
        : settingsPropertyBlueprint[0]?.id ?? 'settings-identity'
    const settingsProperties: SettingsSectionItem[] = settingsPropertyBlueprint.map((section) => ({
        ...section,
        href: `/workspace/settings?section=${section.id}`,
        active: section.id === activeSectionId,
    }))

    const isStartupOrganization = membership.organization.type === 'startup'
    const shouldLoadPendingInvitesList = canEdit && activeSectionId === 'settings-invites'
    const shouldLoadPendingInvitesCount = canEdit && !shouldLoadPendingInvitesList
    const shouldLoadStartupProfile = isStartupOrganization
        && (
            activeSectionId === 'settings-startup-readiness'
            || activeSectionId === 'settings-discovery'
            || activeSectionId === 'settings-data-room'
        )
    const shouldLoadStartupPost = isStartupOrganization
        && (activeSectionId === 'settings-startup-readiness' || activeSectionId === 'settings-discovery')
    const shouldLoadStartupReadiness = isStartupOrganization
    const shouldLoadDataRoomFeatureGate = isStartupOrganization && activeSectionId === 'settings-data-room'
    const shouldLoadStartupDataRoomDocuments = isStartupOrganization && activeSectionId === 'settings-data-room'
    const shouldLoadBillingPlans = activeSectionId === 'settings-billing' || shouldLoadDataRoomFeatureGate

    const settingsSnapshot = activeSectionId === requestedSectionForSnapshot
        ? provisionalSettingsSnapshot
        : await getWorkspaceSettingsSnapshotForCurrentUser(supabase, {
            section: activeSectionId,
            accessToken: sharedAccessToken,
            userId: user.id,
        })

    const verificationStatus: OrganizationVerificationStatus =
        settingsSnapshot?.verification_status ?? 'unverified'
    const pendingInvites: OrganizationOutgoingInvite[] = shouldLoadPendingInvitesList
        ? settingsSnapshot?.pending_invites ?? []
        : []
    const pendingInvitesCount = shouldLoadPendingInvitesCount
        ? settingsSnapshot?.pending_invites_count ?? 0
        : 0
    const startupProfile = shouldLoadStartupProfile
        ? settingsSnapshot?.startup_profile ?? null
        : null
    const startupPost = shouldLoadStartupPost
        ? settingsSnapshot?.startup_post ?? null
        : null
    const startupReadiness = shouldLoadStartupReadiness
        ? settingsSnapshot?.startup_readiness ?? null
        : null
    const currentPlan = settingsSnapshot?.current_plan ?? null
    const isInvestorOrganization = membership.organization.type === 'investor'
    const investorProfileResult = isInvestorOrganization
        ? await supabase
            .from('investor_profiles')
            .select('thesis, sector_tags, check_size_min_usd, check_size_max_usd')
            .eq('investor_org_id', membership.org_id)
            .maybeSingle()
        : { data: null, error: null }
    const investorProfile = investorProfileResult.data
    const investorThesis = typeof investorProfile?.thesis === 'string'
        ? investorProfile.thesis
        : ''
    const investorSectorTags = Array.isArray(investorProfile?.sector_tags)
        ? investorProfile.sector_tags
            .filter((tag): tag is string => typeof tag === 'string')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
            .join(', ')
        : ''
    const investorCheckSizeMinUsd = normalizeNullableInteger(investorProfile?.check_size_min_usd)
    const investorCheckSizeMaxUsd = normalizeNullableInteger(investorProfile?.check_size_max_usd)
    const billingPlansSnapshot = shouldLoadBillingPlans
        ? await getBillingPlansForCurrentUser(supabase, { segment: membership.organization.type })
        : null
    const billingUsageSnapshot = shouldLoadDataRoomFeatureGate
        ? await getBillingMeForCurrentUser(supabase)
        : null
    const billingPlans: BillingPlan[] = billingPlansSnapshot?.plans ?? []
    const dataRoomDocumentsFeatureGate = shouldLoadDataRoomFeatureGate
        ? resolveDataRoomDocumentsFeatureGate({
            currentPlan: billingUsageSnapshot ?? currentPlan,
            plans: billingPlansSnapshot?.plans ?? [],
            usage: billingUsageSnapshot?.usage ?? [],
        })
        : null
    const startupDataRoomDocuments: StartupDataRoomDocument[] = shouldLoadStartupDataRoomDocuments
        ? await getStartupDataRoomDocumentsForCurrentUser(supabase)
        : []

    const verificationMeta = getVerificationMeta(verificationStatus)
    const hasReadinessData = Boolean(startupReadiness)
    const readinessScore = startupReadiness?.readiness_score ?? null
    const readinessScoreForBar = readinessScore ?? 0
    const readinessStatusVariant: BadgeProps['variant'] = startupReadiness
        ? startupReadiness.eligible_for_discovery_post
            ? 'success'
            : 'warning'
        : 'secondary'
    const readinessStatusLabel = startupReadiness
        ? startupReadiness.eligible_for_discovery_post
            ? 'Eligible'
            : 'Blocked'
        : 'No Data'
    const readinessSectionLabelMap: Record<string, string> = {
        team: 'Team',
        product: 'Product',
        market: 'Market',
        traction: 'Traction',
        financials: 'Financials',
        legal: 'Legal',
        pitch_materials: 'Pitch Materials',
    }

    const industryTags =
        membership.organization.industry_tags.length > 0
            ? membership.organization.industry_tags.join(', ')
            : 'No industry tags set'

    const pageShellClass = isLight
        ? 'bg-slate-50 text-slate-900'
        : 'bg-[#070b14] text-slate-100'
    const panelClass = isLight
        ? 'border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/40'
        : 'border-slate-800 bg-slate-900/70'
    const mutedPanelClass = isLight
        ? 'border-slate-200 bg-slate-50/90'
        : 'border-slate-800 bg-slate-950/70'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const titleMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const labelClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const activeSectionPresentation = getSectionPresentation(activeSectionId)
    const isOrganizationEditorSection = activeSectionId === 'settings-identity'
        || activeSectionId === 'settings-startup-readiness'
        || activeSectionId === 'settings-discovery'
    const settingsFormSectionView = activeSectionId === 'settings-startup-readiness'
        ? 'readiness'
        : activeSectionId === 'settings-discovery'
            ? 'discovery'
            : 'identity'

    return (
        <main data-workspace-root="true" className={`flex h-screen w-full overflow-hidden ${pageShellClass}`}>
            {/* Sidebar: Intelligence Column & Navigation */}
            <aside className={`flex w-80 flex-col border-r ${panelClass} backdrop-blur-3xl shadow-2xl z-20`}>
                {/* Sidebar Header: Organization Identity */}
                <div className={`p-6 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar className={`h-12 w-12 border-2 ${isLight ? 'border-white shadow-sm' : 'border-slate-800 shadow-md'}`}>
                            <AvatarImage src={membership.organization.logo_url ?? undefined} alt="Org logo" />
                            <AvatarFallback className={`text-sm font-black ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500'}`}>
                                {getAcronym(membership.organization.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h1 className={`text-sm font-black tracking-tight truncate ${textMainClass}`}>
                                {membership.organization.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant={verificationMeta.variant} className="rounded-md px-1 py-0 text-[8px] font-black uppercase tracking-wider">
                                    {verificationMeta.label}
                                </Badge>
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${textMutedClass}`}>
                                    {toTitleCase(membership.member_role)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start h-9 px-3 text-[10px] font-black uppercase tracking-widest transition-all ${isLight
                            ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                            }`}
                    >
                        <Link href="/workspace">
                            <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                            Back to Workspace
                        </Link>
                    </Button>
                </div>

                {/* Sidebar Content: Navigator + Intelligence */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-8 scrollbar-hide">
                    <div>
                        <p className={`px-4 mb-3 text-[9px] font-black uppercase tracking-[0.2em] ${textMutedClass}`}>System Settings</p>
                        <SettingsSectionNavigator
                            sections={settingsProperties}
                            isLight={isLight}
                        />
                    </div>

                    <div className={`h-px w-full mx-2 ${isLight ? 'bg-slate-200/50' : 'bg-slate-800/50'}`} />

                    <div>
                        <p className={`px-4 mb-4 text-[9px] font-black uppercase tracking-[0.2em] ${textMutedClass}`}>Intelligence</p>
                        <div className="space-y-6 px-2">
                            <CurrentPlanSidebarCard
                                currentPlan={currentPlan}
                                isLight={isLight}
                                panelClass="border-none bg-transparent shadow-none p-0 rounded-none"
                                mutedPanelClass={mutedPanelClass}
                                textMainClass={textMainClass}
                                textMutedClass={textMutedClass}
                            />

                            <div className={`h-px w-full ${isLight ? 'bg-slate-200/50' : 'bg-slate-800/50'}`} />

                            {/* Readiness Intelligence (Startups Only) */}
                            {isStartupOrganization && (
                                <div className="space-y-4 px-2">
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                                            <svg className="h-full w-full -rotate-90 transform">
                                                <circle
                                                    cx="28"
                                                    cy="28"
                                                    r="24"
                                                    stroke="currentColor"
                                                    strokeWidth="3.5"
                                                    fill="transparent"
                                                    className={isLight ? 'text-slate-100' : 'text-slate-800'}
                                                />
                                                <circle
                                                    cx="28"
                                                    cy="28"
                                                    r="24"
                                                    stroke="currentColor"
                                                    strokeWidth="3.5"
                                                    fill="transparent"
                                                    strokeDasharray={2 * Math.PI * 24}
                                                    strokeDashoffset={2 * Math.PI * 24 - (readinessScoreForBar / 100) * (2 * Math.PI * 24)}
                                                    strokeLinecap="round"
                                                    className="text-emerald-500 transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            <div className="absolute flex flex-col items-center">
                                                <span className={`text-[11px] font-black tracking-tight ${textMainClass}`}>
                                                    {readinessScore === null ? 'N/A' : `${readinessScore}%`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${textMainClass}`}>Readiness</span>
                                                <Badge variant={readinessStatusVariant} className="rounded-lg px-2 py-0 text-[7px] font-black uppercase">
                                                    {readinessStatusLabel}
                                                </Badge>
                                            </div>
                                            <div className={`h-1 w-full overflow-hidden rounded-full ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                                                <div
                                                    className="h-full bg-emerald-500 transition-all duration-1000 ws-shimmer"
                                                    style={{ width: `${readinessScoreForBar}%` }}
                                                />
                                            </div>
                                            <p className={`text-[8px] font-bold leading-tight ${textMutedClass}`}>
                                                {hasReadinessData
                                                    ? `Score ${readinessScoreForBar}%`
                                                    : 'Awaiting data...'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </aside>

            {/* Main Content Area */}
            <section className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Ambient Light */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                    <div className={`absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full ${isLight ? 'bg-blue-500/5' : 'bg-blue-500/10'} blur-[120px]`} />
                </div>

                {/* Content Header: Workspace Navbar */}
                <header className={`sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between border-b px-8 backdrop-blur-3xl ${isLight ? 'border-slate-200 bg-white' : 'border-white/5 bg-[#070b14]/40'}`}>
                    <div className="flex items-center gap-4">
                        <nav className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                            <span className="opacity-40">Workspace</span>
                            <span className="opacity-20">/</span>
                            <span className="opacity-40">Settings</span>
                            <span className="opacity-20">/</span>
                            <span className={textMainClass}>{activeSectionPresentation.title}</span>
                        </nav>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 border-r border-slate-200/20 pr-6 mr-2 dark:border-white/5">
                            <button className="relative p-2 text-slate-400 transition-colors hover:text-emerald-500">
                                <Bell className="h-5 w-5" />
                                <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            </button>
                            <WorkspaceThemeToggle />
                        </div>

                        <div className="flex items-center gap-3">
                            <WorkspaceUserMenu
                                displayName={profile?.full_name?.trim() || membership.organization.name}
                                email={user?.email ?? null}
                                avatarUrl={profile?.avatar_url}
                                isLight={isLight}
                            />
                        </div>
                    </div>
                </header>

                {/* Content Body: Scrollable Forms */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
                    <div className="mx-auto max-w-4xl space-y-8">
                        {isOrganizationEditorSection ? (
                            <SettingsForm
                                organizationType={membership.organization.type}
                                defaultOrganizationName={membership.organization.name}
                                defaultOrganizationLocation={membership.organization.location ?? ''}
                                defaultOrganizationLogoUrl={membership.organization.logo_url ?? ''}
                                defaultOrganizationIndustryTags={industryTags}
                                defaultStartupWebsiteUrl={startupProfile?.website_url ?? ''}
                                defaultStartupPitchDeckUrl={startupProfile?.pitch_deck_url ?? ''}
                                defaultStartupPitchDeckMediaKind={startupProfile?.pitch_deck_media_kind ?? null}
                                defaultStartupPitchDeckFileName={startupProfile?.pitch_deck_file_name ?? ''}
                                defaultStartupPitchDeckFileSizeBytes={startupProfile?.pitch_deck_file_size_bytes ?? null}
                                defaultStartupTeamOverview={startupProfile?.team_overview ?? ''}
                                defaultStartupCompanyStage={startupProfile?.company_stage ?? ''}
                                defaultStartupFoundingYear={startupProfile?.founding_year ?? null}
                                defaultStartupTeamSize={startupProfile?.team_size ?? null}
                                defaultStartupTargetMarket={startupProfile?.target_market ?? ''}
                                defaultStartupBusinessModel={startupProfile?.business_model ?? ''}
                                defaultStartupTractionSummary={startupProfile?.traction_summary ?? ''}
                                defaultStartupFinancialSummary={startupProfile?.financial_summary ?? ''}
                                defaultStartupLegalSummary={startupProfile?.legal_summary ?? ''}
                                defaultStartupFinancialDocUrl={startupProfile?.financial_doc_url ?? ''}
                                defaultStartupFinancialDocFileName={startupProfile?.financial_doc_file_name ?? ''}
                                defaultStartupFinancialDocFileSizeBytes={startupProfile?.financial_doc_file_size_bytes ?? null}
                                defaultStartupLegalDocUrl={startupProfile?.legal_doc_url ?? ''}
                                defaultStartupLegalDocFileName={startupProfile?.legal_doc_file_name ?? ''}
                                defaultStartupLegalDocFileSizeBytes={startupProfile?.legal_doc_file_size_bytes ?? null}
                                defaultInvestorThesis={investorThesis}
                                defaultInvestorSectorTags={investorSectorTags}
                                defaultInvestorCheckSizeMinUsd={investorCheckSizeMinUsd}
                                defaultInvestorCheckSizeMaxUsd={investorCheckSizeMaxUsd}
                                defaultStartupPostTitle={startupPost?.title ?? ''}
                                defaultStartupPostSummary={startupPost?.summary ?? ''}
                                defaultStartupPostStage={startupPost?.stage ?? ''}
                                defaultStartupPostLocation={startupPost?.location ?? ''}
                                defaultStartupPostIndustryTags={startupPost?.industry_tags.join(', ') ?? ''}
                                defaultStartupPostStatus={startupPost?.status ?? 'draft'}
                                startupReadiness={startupReadiness}
                                sectionView={settingsFormSectionView}
                                canEdit={canEdit}
                                isLight={isLight}
                            />
                        ) : null}

                        {activeSectionId === 'settings-billing' ? (
                            <BillingPlanManager
                                plans={billingPlans}
                                currentPlan={currentPlan}
                                canManage={canManageBilling}
                                isLight={isLight}
                            />
                        ) : null}

                        {activeSectionId === 'settings-invites' ? (
                            <OrganizationInvitesPanel
                                canManage={canEdit}
                                pendingInvites={pendingInvites}
                                isLight={isLight}
                            />
                        ) : null}

                        {activeSectionId === 'settings-permissions' ? (
                            <PermissionsSection
                                organizationType={membership.organization.type}
                                memberRole={membership.member_role}
                                industryTags={industryTags}
                                isLight={isLight}
                                labelClass={labelClass}
                                textMainClass={textMainClass}
                                textMutedClass={textMutedClass}
                                titleMutedClass={titleMutedClass}
                                mutedPanelClass={mutedPanelClass}
                            />
                        ) : null}

                        {activeSectionId === 'settings-team-access' ? (
                            <TeamAccessSection
                                isLight={isLight}
                                labelClass={labelClass}
                                textMainClass={textMainClass}
                                textMutedClass={textMutedClass}
                                titleMutedClass={titleMutedClass}
                                mutedPanelClass={mutedPanelClass}
                            />
                        ) : null}

                        {activeSectionId === 'settings-data-room' && membership.organization.type === 'startup' ? (
                            <DataRoomSection
                                documents={startupDataRoomDocuments}
                                featureGate={dataRoomDocumentsFeatureGate}
                                canEdit={canEdit}
                                isLight={isLight}
                                panelClass={panelClass}
                                mutedPanelClass={mutedPanelClass}
                                textMainClass={textMainClass}
                                textMutedClass={textMutedClass}
                                titleMutedClass={titleMutedClass}
                                labelClass={labelClass}
                            />
                        ) : null}

                        {activeSectionId === 'settings-readiness-rules' && membership.organization.type === 'startup' ? (
                            <ReadinessRulesSection
                                startupReadiness={startupReadiness}
                                readinessSectionLabelMap={readinessSectionLabelMap}
                                toTitleCase={toTitleCase}
                                isLight={isLight}
                                labelClass={labelClass}
                                textMainClass={textMainClass}
                                textMutedClass={textMutedClass}
                                titleMutedClass={titleMutedClass}
                                mutedPanelClass={mutedPanelClass}
                            />
                        ) : null}
                    </div>
                </div>
            </section>
        </main>
    )
}
