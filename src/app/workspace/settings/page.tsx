import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowUpRight,
    Building2,
    CircleDollarSign,
    ClipboardList,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getOnboardingPath } from '@/modules/onboarding'
import {
    type OrganizationOutgoingInvite,
    type OrganizationVerificationStatus,
} from '@/modules/organizations'
import {
    getBillingPlansForCurrentUser,
    type BillingCurrentPlanSnapshot,
    type BillingPlan,
} from '@/modules/billing'
import {
    getWorkspaceBootstrapForCurrentUser,
    getWorkspaceIdentityForUser,
    getWorkspaceSettingsSnapshotForCurrentUser,
} from '@/modules/workspace'
import WorkspaceUserMenu from '../WorkspaceUserMenu'
import BillingPlanManager from './BillingPlanManager'
import OrganizationInvitesPanel from './OrganizationInvitesPanel'
import SettingsSectionNavigator, { type SettingsSectionItem } from './SettingsSectionNavigator'
import SettingsForm from './SettingsForm'

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
            title: 'Startup Readiness Fields',
            description: 'Maintain startup profile fields used to compute readiness and request eligibility.',
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
            title: 'Readiness Rules',
            description: 'Track each readiness requirement that controls startup visibility and engagement.',
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
            { id: 'settings-startup-readiness', label: 'Startup Readiness', icon: 'readiness' },
            { id: 'settings-discovery', label: 'Discovery Post', icon: 'discovery' },
            { id: 'settings-invites', label: 'Team Invites', icon: 'invites' },
            { id: 'settings-permissions', label: 'Permission Rules', icon: 'permissions' },
            { id: 'settings-readiness-rules', label: 'Readiness Rules', icon: 'rules' },
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
        && (activeSectionId === 'settings-startup-readiness' || activeSectionId === 'settings-discovery')
    const shouldLoadStartupPost = isStartupOrganization
        && (activeSectionId === 'settings-startup-readiness' || activeSectionId === 'settings-discovery')
    const shouldLoadStartupReadiness = isStartupOrganization
    const shouldLoadBillingPlans = activeSectionId === 'settings-billing'

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
    const organizationReadiness = bootstrapSnapshot?.organization_readiness ?? null
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
    const billingPlans: BillingPlan[] = billingPlansSnapshot?.plans ?? []

    const pendingInvitesTotal = shouldLoadPendingInvitesList ? pendingInvites.length : pendingInvitesCount
    const verificationMeta = getVerificationMeta(verificationStatus)
    const hasReadinessData = Boolean(startupReadiness)
    const readinessScore = startupReadiness?.readiness_score ?? null
    const readinessCompletion = startupReadiness?.profile_completion_percent ?? null
    const readinessScoreForBar = readinessScore ?? 0
    const readinessCompletionForBar = readinessCompletion ?? 0
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
    const heroGradientClass = isLight
        ? 'bg-[radial-gradient(circle_at_10%_8%,rgba(16,185,129,0.08),transparent_36%),radial-gradient(circle_at_86%_0%,rgba(37,99,235,0.08),transparent_36%)]'
        : 'bg-[radial-gradient(circle_at_10%_8%,rgba(16,185,129,0.24),transparent_36%),radial-gradient(circle_at_86%_0%,rgba(59,130,246,0.24),transparent_36%)]'
    const panelClass = isLight
        ? 'border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/40'
        : 'border-slate-800 bg-slate-900/70'
    const mutedPanelClass = isLight
        ? 'border-slate-200 bg-slate-50/90'
        : 'border-slate-800 bg-slate-950/70'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const titleMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const activeSectionPresentation = getSectionPresentation(activeSectionId)
    const ActiveSectionIcon = activeSectionPresentation.icon
    const isOrganizationEditorSection = activeSectionId === 'settings-identity'
        || activeSectionId === 'settings-startup-readiness'
        || activeSectionId === 'settings-discovery'
    const settingsFormSectionView = activeSectionId === 'settings-startup-readiness'
        ? 'readiness'
        : activeSectionId === 'settings-discovery'
            ? 'discovery'
            : 'identity'

    return (
        <main data-workspace-root="true" className={`relative min-h-screen overflow-hidden ${pageShellClass}`}>
            {/* Ambient Background Elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className={`absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full ${isLight ? 'bg-emerald-500/5' : 'bg-emerald-500/10'} blur-[120px] ws-float`} />
                <div className={`absolute right-[-10%] top-[40%] h-[340px] w-[340px] rounded-full ${isLight ? 'bg-blue-400/5' : 'bg-emerald-400/5'} blur-[100px] ws-float-delayed-1`} />
            </div>

            <div className="relative mx-auto max-w-[1400px] px-6 py-8 md:py-12">
                <div className="flex flex-col gap-10">
                    {/* Immersive Settings Hero */}
                    <header className={`relative overflow-hidden rounded-[2.5rem] border p-8 md:p-12 shadow-2xl transition-all duration-500 ${panelClass} backdrop-blur-3xl`}>
                        <div className="relative z-10 flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
                                {/* Organization Logo Workspace */}
                                <div className="relative group">
                                    <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 opacity-20 blur-sm transition-all group-hover:opacity-40" />
                                    <Avatar className={`relative h-28 w-28 border-4 ${isLight ? 'border-white shadow-xl' : 'border-slate-900 shadow-2xl'}`}>
                                        <AvatarImage src={membership.organization.logo_url ?? undefined} alt="Org logo" />
                                        <AvatarFallback className={`text-2xl font-black ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {getAcronym(membership.organization.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="text-center lg:text-left">
                                    <div className="mb-4 flex items-center justify-center lg:justify-start">
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="sm"
                                            className={`h-8 rounded-full border px-4 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-500 hover:text-white ${isLight
                                                ? 'border-slate-200 bg-white text-slate-500'
                                                : 'border-slate-800 bg-slate-950 text-slate-400'
                                                }`}
                                        >
                                            <Link href="/workspace">
                                                <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                                                Return to Dashboard
                                            </Link>
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-center gap-3 lg:justify-start">
                                        <Badge variant={verificationMeta.variant} className="rounded-lg px-2 py-0.5 text-[10px] font-black uppercase">
                                            {verificationMeta.label}
                                        </Badge>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${textMutedClass}`}>
                                            {toTitleCase(membership.member_role)} View
                                        </span>
                                    </div>
                                    <h1 className={`mt-4 text-4xl font-black tracking-tight md:text-5xl ${textMainClass}`}>
                                        {membership.organization.name}
                                    </h1>
                                    <p className={`mt-3 max-w-xl text-sm font-medium leading-relaxed ${textMutedClass}`}>
                                        Manage your organization&apos;s core identity, discovery presence, and team alignment from one centralized hub.
                                    </p>
                                </div>
                            </div>

                            {/* Verification Intelligence Card + Account Portal */}
                            <div className={`flex flex-col gap-6 rounded-[2.25rem] border p-6 lg:w-[350px] ${mutedPanelClass} shadow-lg transition-all hover:shadow-xl`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${textMainClass}`}>Verification Portal</span>
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className={`h-4 w-4 ${verificationStatus === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`} />
                                            <p className={`text-sm font-black ${textMainClass}`}>{verificationMeta.label}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <WorkspaceUserMenu
                                            displayName={profile.full_name?.trim() || membership.organization.name}
                                            email={user.email ?? null}
                                            avatarUrl={profile.avatar_url}
                                            isLight={isLight}
                                        />
                                    </div>
                                </div>

                                <div className={`rounded-2xl border bg-white/50 p-4 transition-all dark:bg-slate-950/30`}>
                                    <p className={`text-[10px] font-bold leading-relaxed ${textMutedClass}`}>
                                        {verificationStatus === 'approved'
                                            ? 'Verified organization Status: Active. Your profile is public and discoverable.'
                                            : 'Action Required: Complete your identity profile to unlock full network discovery.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
                        {/* Settings Navigation Sidebar */}
                        <aside className="space-y-6">
                            <div className={`flex flex-col gap-2 rounded-3xl border p-3 ${panelClass} backdrop-blur-xl`}>
                                <SettingsSectionNavigator
                                    sections={settingsProperties}
                                    isLight={isLight}
                                />
                            </div>

                            <CurrentPlanSidebarCard
                                currentPlan={currentPlan}
                                isLight={isLight}
                                panelClass={panelClass}
                                mutedPanelClass={mutedPanelClass}
                                textMainClass={textMainClass}
                                textMutedClass={textMutedClass}
                            />

                            {/* Readiness Intelligence (Startups Only) */}
                            {isStartupOrganization && (
                                <div className={`flex flex-col gap-6 rounded-[2.5rem] border p-6 ${panelClass} backdrop-blur-xl`}>
                                    <div className="flex items-center gap-6">
                                        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                                            <svg className="h-full w-full -rotate-90 transform">
                                                <circle
                                                    cx="32"
                                                    cy="32"
                                                    r="28"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="transparent"
                                                    className={isLight ? 'text-slate-100' : 'text-slate-800'}
                                                />
                                                <circle
                                                    cx="32"
                                                    cy="32"
                                                    r="28"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="transparent"
                                                    strokeDasharray={2 * Math.PI * 28}
                                                    strokeDashoffset={2 * Math.PI * 28 - (readinessScoreForBar / 100) * (2 * Math.PI * 28)}
                                                    strokeLinecap="round"
                                                    className="text-emerald-500 transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            <div className="absolute flex flex-col items-center">
                                                <span className={`text-[13px] font-black tracking-tight ${textMainClass}`}>
                                                    {readinessScore === null ? 'N/A' : `${readinessScore}%`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${textMainClass}`}>Readiness</span>
                                                <Badge variant={readinessStatusVariant} className="rounded-lg px-2 py-0 text-[8px] font-black uppercase">
                                                    {readinessStatusLabel}
                                                </Badge>
                                            </div>
                                            <div className={`h-1 w-full overflow-hidden rounded-full ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                                                <div
                                                    className="h-full bg-emerald-50 transition-all duration-1000 ws-shimmer"
                                                    style={{ width: `${readinessScoreForBar}%` }}
                                                />
                                            </div>
                                            <p className={`text-[8px] font-bold leading-tight ${textMutedClass}`}>
                                                {hasReadinessData
                                                    ? `Completion ${readinessCompletionForBar}% · Score ${readinessScoreForBar}%`
                                                    : 'Readiness score will appear after startup data is available.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Readiness Intelligence (Investors/Advisors) */}
                            {!isStartupOrganization && organizationReadiness ? (
                                <div className={`flex flex-col gap-4 rounded-[2.5rem] border p-6 ${panelClass} backdrop-blur-xl`}>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${textMainClass}`}>
                                            Readiness
                                        </p>
                                        <Badge variant={organizationReadiness.is_ready ? 'success' : 'secondary'} className="rounded-lg px-2 py-0 text-[8px] font-black uppercase">
                                            {organizationReadiness.is_ready ? 'Ready' : 'In Progress'}
                                        </Badge>
                                    </div>
                                    <div className={`h-1.5 w-full overflow-hidden rounded-full ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-1000"
                                            style={{ width: `${organizationReadiness.readiness_score}%` }}
                                        />
                                    </div>
                                    <p className={`text-[11px] font-semibold ${textMainClass}`}>
                                        Score {organizationReadiness.readiness_score}%
                                    </p>
                                    <p className={`text-[10px] leading-relaxed ${textMutedClass}`}>
                                        {organizationReadiness.missing_steps.length > 0
                                            ? `Missing: ${organizationReadiness.missing_steps.join(', ')}`
                                            : 'All readiness requirements are complete.'}
                                    </p>
                                </div>
                            ) : null}

                        </aside>

                        {/* Main Settings Content */}
                        <section className="space-y-8">
                            {/* Section Status Bar */}
                            <div className={`flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border p-6 ${panelClass} backdrop-blur-xl`}>
                                <div className="flex items-center gap-4">
                                    <div className={`rounded-2xl border p-3 ${mutedPanelClass}`}>
                                        <ActiveSectionIcon className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h2 className={`text-xl font-black tracking-tight ${textMainClass}`}>{activeSectionPresentation.title}</h2>
                                        <p className={`text-sm ${textMutedClass}`}>{activeSectionPresentation.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-500">
                                        Active Section
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {isOrganizationEditorSection ? (
                                    <SettingsForm
                                        organizationType={membership.organization.type}
                                        defaultOrganizationName={membership.organization.name}
                                        defaultOrganizationLocation={membership.organization.location ?? ''}
                                        defaultOrganizationLogoUrl={membership.organization.logo_url ?? ''}
                                        defaultOrganizationIndustryTags={membership.organization.industry_tags.join(', ')}
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
                                        defaultStartupPostLocation={startupPost?.location ?? membership.organization.location ?? ''}
                                        defaultStartupPostIndustryTags={
                                            startupPost?.industry_tags.join(', ')
                                            ?? membership.organization.industry_tags.join(', ')
                                        }
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
                                    <div className="grid gap-6 xl:grid-cols-2">
                                        <Card id="settings-snapshot" className={`${panelClass} rounded-[2rem] overflow-hidden`}>
                                            <CardHeader className="p-8">
                                                <CardTitle className={`${textMainClass} flex items-center gap-2 text-lg font-black`}>
                                                    <Building2 className="h-5 w-5 text-emerald-500" /> Organization Snapshot
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="px-8 pb-8 space-y-4">
                                                <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${titleMutedClass}`}>Organization Type</p>
                                                    <p className={`mt-1 text-sm font-bold ${textMainClass}`}>{toTitleCase(membership.organization.type)}</p>
                                                </div>
                                                <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${titleMutedClass}`}>Membership Role</p>
                                                    <p className={`mt-1 text-sm font-bold ${textMainClass}`}>{toTitleCase(membership.member_role)}</p>
                                                </div>
                                                <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${titleMutedClass}`}>Industry Tags</p>
                                                    <p className={`mt-1 text-sm font-bold ${textMainClass}`}>{industryTags}</p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card id="settings-permissions" className={`${panelClass} rounded-[2rem] overflow-hidden`}>
                                            <CardHeader className="p-8">
                                                <CardTitle className={`${textMainClass} flex items-center gap-2 text-lg font-black`}>
                                                    <ShieldCheck className="h-5 w-5 text-emerald-500" /> Permission Rules
                                                </CardTitle>
                                                <CardDescription className={textMutedClass}>
                                                    Access control and actions are enforced by organization membership role.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="px-8 pb-8 space-y-4">
                                                <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                                    <p className={`text-sm font-bold ${textMainClass}`}>Owner-only commands</p>
                                                    <p className={`mt-1 text-[11px] leading-relaxed ${textMutedClass}`}>Update organization settings, manage invites, and govern identity assets.</p>
                                                </div>
                                                <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                                    <p className={`text-sm font-bold ${textMainClass}`}>Active membership gate</p>
                                                    <p className={`mt-1 text-[11px] leading-relaxed ${textMutedClass}`}>Only active members can view workspace settings, rooms, and collaboration data.</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : null}

                                {activeSectionId === 'settings-team-access' ? (
                                    <Card id="settings-team-access" className={`${panelClass} rounded-[2.5rem] overflow-hidden`}>
                                        <CardHeader className="p-8">
                                            <CardTitle className={`${textMainClass} flex items-center gap-2 text-lg font-black`}>
                                                <Users className="h-5 w-5 text-emerald-500" /> Team Access
                                            </CardTitle>
                                            <CardDescription className={textMutedClass}>
                                                Recommended structure for scalable collaboration with centralized ownership.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid gap-4 p-8 pt-0 md:grid-cols-3">
                                            <div className={`rounded-2xl border p-5 ${mutedPanelClass}`}>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${titleMutedClass}`}>Owner</p>
                                                <p className={`mt-2 text-sm font-bold ${textMainClass}`}>Strategic control</p>
                                                <p className={`mt-1 text-[11px] leading-relaxed ${textMutedClass}`}>Owns identity, invite lifecycle, and governance settings.</p>
                                            </div>
                                            <div className={`rounded-2xl border p-5 ${mutedPanelClass}`}>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${titleMutedClass}`}>Admin</p>
                                                <p className={`mt-2 text-sm font-bold ${textMainClass}`}>Execution support</p>
                                                <p className={`mt-1 text-[11px] leading-relaxed ${textMutedClass}`}>Supports operational updates where role permissions allow.</p>
                                            </div>
                                            <div className={`rounded-2xl border p-5 ${mutedPanelClass}`}>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${titleMutedClass}`}>Member</p>
                                                <p className={`mt-2 text-sm font-bold ${textMainClass}`}>Collaboration access</p>
                                                <p className={`mt-1 text-[11px] leading-relaxed ${textMutedClass}`}>Participates in rooms and workspace actions granted by policy.</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : null}

                                {activeSectionId === 'settings-readiness-rules' && membership.organization.type === 'startup' ? (
                                    <Card id="settings-readiness-rules" className={`${panelClass} rounded-[2.5rem] overflow-hidden`}>
                                        <CardHeader className="p-8">
                                            <CardTitle className={`${textMainClass} flex items-center gap-2 text-lg font-black`}>
                                                <Settings2 className="h-5 w-5 text-emerald-500" /> Readiness Requirements
                                            </CardTitle>
                                            <CardDescription className={textMutedClass}>
                                                Discovery and engagement gates are evaluated from saved startup data.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="px-8 pb-8 space-y-3">
                                            <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-sm font-bold ${textMainClass}`}>Profile completion threshold</p>
                                                    <Badge variant={(startupReadiness?.profile_completion_percent ?? 0) >= 70 ? 'success' : 'warning'}>
                                                        {startupReadiness?.profile_completion_percent ?? 0}% / 70%
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-sm font-bold ${textMainClass}`}>Readiness score threshold</p>
                                                    <Badge variant={(startupReadiness?.readiness_score ?? 0) >= 60 ? 'success' : 'warning'}>
                                                        {startupReadiness?.readiness_score ?? 0}% / 60%
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-sm font-bold ${textMainClass}`}>Required docs uploaded</p>
                                                    <Badge variant={startupReadiness?.required_docs_uploaded ? 'success' : 'warning'}>
                                                        {startupReadiness?.required_docs_uploaded ? 'Yes' : 'No'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {startupReadiness?.section_scores?.length ? (
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {startupReadiness.section_scores.map((section) => (
                                                        <div key={section.section} className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className={`text-sm font-bold ${textMainClass}`}>
                                                                    {readinessSectionLabelMap[section.section] ?? toTitleCase(section.section.replace(/_/g, ' '))}
                                                                </p>
                                                                <Badge variant="outline">{section.weight}%</Badge>
                                                            </div>
                                                            <p className={`mt-1 text-[11px] ${textMutedClass}`}>
                                                                Completion {section.completion_percent}% · Contribution {section.score_contribution}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                            {startupReadiness?.missing_steps?.length ? (
                                                <p className={`text-sm ${textMutedClass}`}>
                                                    Missing: {startupReadiness.missing_steps.join(', ')}
                                                </p>
                                            ) : null}
                                        </CardContent>
                                    </Card>
                                ) : null}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    )
}
