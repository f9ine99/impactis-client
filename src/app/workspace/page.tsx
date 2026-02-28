import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import {
    Activity,
    ArrowRight,
    Building2,
    CheckCircle2,
    Clock,
    LayoutDashboard,
    Settings2,
    Sparkles,
    Target,
    TrendingUp,
    Trophy,
    Users,
    UserRound,
    XCircle,
    Zap,
    ShieldCheck,
    ChevronRight,
    Bell,
    Share2,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    type EngagementRequest,
    type EngagementRequestStatus,
} from '@/modules/engagements'
import { getOnboardingPath } from '@/modules/onboarding'
import {
    evaluateOrganizationCapability,
    type OrganizationCapabilityGateResult,
    type OrganizationMemberDirectoryEntry,
    type OrganizationMemberRole,
    type OrganizationVerificationStatus,
} from '@/modules/organizations'
import {
    type StartupDiscoveryFeedItem,
    type StartupReadiness,
} from '@/modules/startups'
import {
    getWorkspaceBootstrapForCurrentUser,
} from '@/modules/workspace'
import {
    getBillingMeForCurrentUser,
    getBillingPlansForCurrentUser,
    type BillingMeteredFeatureGateResult,
    resolveAdvisorProposalFeatureGate,
    resolveConsultantRequestFeatureGate,
    resolveInvestorProfileViewFeatureGate,
} from '@/modules/billing'
import StartupDiscoveryFeedPanel from './StartupDiscoveryFeedPanel'
import WorkspaceThemeToggle from './WorkspaceThemeToggle'
import WorkspaceUserMenu from './WorkspaceUserMenu'
import WorkspaceLayoutShell from './WorkspaceLayoutShell'
import {
    respondEngagementRequestAction,
} from './actions'

type StatusMeta = {
    label: string
    variant: BadgeProps['variant']
}

function toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(value: string): string {
    const parsed = Date.parse(value)
    if (Number.isNaN(parsed)) {
        return 'Unknown'
    }

    return new Date(parsed).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    })
}

function getInitials(value: string | null, fallback: string): string {
    if (!value) {
        return fallback
    }

    const parts = value
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
    if (parts.length === 0) {
        return fallback
    }

    return parts.map((part) => part.slice(0, 1).toUpperCase()).join('')
}

function getVerificationMeta(status: OrganizationVerificationStatus): StatusMeta {
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

function getCapabilityMeta(result: OrganizationCapabilityGateResult): StatusMeta {
    if (result.allowed) {
        return { label: 'Enabled', variant: 'success' }
    }

    return { label: 'Blocked', variant: 'destructive' }
}

function getEngagementStatusMeta(status: EngagementRequestStatus): StatusMeta {
    if (status === 'accepted') {
        return { label: 'Accepted', variant: 'success' }
    }

    if (status === 'rejected') {
        return { label: 'Rejected', variant: 'destructive' }
    }

    if (status === 'sent') {
        return { label: 'Pending', variant: 'warning' }
    }

    if (status === 'cancelled') {
        return { label: 'Cancelled', variant: 'secondary' }
    }

    return { label: 'Expired', variant: 'secondary' }
}

function getEngagementStatusHint(status: EngagementRequestStatus): string {
    if (status === 'sent') {
        return 'Waiting for advisor response'
    }

    if (status === 'accepted') {
        return 'Advisor accepted and moved to prep'
    }

    if (status === 'rejected') {
        return 'Advisor declined this request'
    }

    if (status === 'cancelled') {
        return 'Cancelled by your startup team'
    }

    return 'Request expired without a response'
}

function getMemberRoleBadgeVariant(role: OrganizationMemberRole): BadgeProps['variant'] {
    if (role === 'owner') {
        return 'success'
    }

    if (role === 'admin') {
        return 'warning'
    }

    return 'secondary'
}

function getGreetingForHour(hour: number): string {
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

function CommandRibbon(input: {
    firstName: string
    greeting: string
    organizationName: string
    organizationType: string
    tierIdentifier: string
    isLight: boolean
    verificationMeta: StatusMeta
    textMainClassName: string
    textMutedClassName: string
}) {
    return (
        <div className={`relative overflow-hidden rounded-[2.5rem] border p-6 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/5 ${input.isLight ? 'border-slate-200 bg-white' : 'border-white/5 bg-slate-900/40 backdrop-blur-3xl'}`}>
            <div className="relative z-10 flex flex-col items-center justify-between gap-6 lg:flex-row">
                <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className={`text-2xl font-black tracking-tight ${input.textMainClassName}`}>
                            {input.greeting}, <span className="text-emerald-500">{input.firstName}</span>
                        </h1>
                        <p className={`mt-0.5 text-[10px] font-bold uppercase tracking-widest ${input.textMutedClassName}`}>
                            <span className="text-emerald-500/80">{toTitleCase(input.organizationType)}</span>
                            <span className="mx-2 opacity-30">|</span>
                            {input.organizationName}
                            <span className="mx-2 opacity-30">|</span>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${input.verificationMeta.variant === 'success' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' :
                        input.verificationMeta.variant === 'warning' ? 'border-amber-500/20 bg-amber-500/5 text-amber-500' :
                            'border-slate-500/20 bg-slate-500/5 text-slate-500'
                        }`}>
                        <ShieldCheck className="h-4 w-4" />
                        <span>{input.verificationMeta.label}</span>
                        <div className={`ml-1 h-1.5 w-1.5 rounded-full ${input.verificationMeta.variant === 'success' ? 'bg-emerald-500' :
                            input.verificationMeta.variant === 'warning' ? 'bg-amber-500' :
                                'bg-slate-500'
                            } animate-pulse`} />
                    </div>
                    <div className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${input.isLight
                        ? 'border-slate-200 bg-slate-50 text-slate-600'
                        : 'border-slate-700 bg-slate-900 text-slate-300'
                        }`}>
                        {input.tierIdentifier}
                    </div>
                </div>
            </div>
        </div>
    )
}

function ReadinessScoreV2(input: {
    score: number,
    completion: number,
    target: number,
    eligibleForDiscovery: boolean,
    missingSteps: string[],
    isLight: boolean,
    textMainClassName: string,
    textMutedClassName: string
}) {
    const radius = 45
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (input.score / 100) * circumference

    return (
        <div className={`relative overflow-hidden rounded-[3rem] border p-8 transition-all hover:shadow-xl hover:shadow-emerald-500/5 ${input.isLight ? 'border-slate-200 bg-white' : 'border-white/5 bg-slate-900/40 backdrop-blur-3xl'}`}>
            <div className="flex flex-col gap-8 md:flex-row md:items-center">
                {/* Circular Score Visualizer */}
                <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
                    <svg className="h-full w-full -rotate-90 transform">
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-slate-200 dark:text-slate-800"
                        />
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="text-emerald-500 transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className={`text-3xl font-black tracking-tight ${input.textMainClassName}`}>{input.score}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest opacity-40 ${input.textMainClassName}`}>Score</span>
                    </div>
                </div>

                {/* Info & Progress */}
                <div className="flex-1 space-y-4">
                    <div>
                        <h3 className={`text-xl font-black tracking-tight ${input.textMainClassName}`}>Readiness Engine</h3>
                        <p className={`mt-2 text-xs font-medium leading-relaxed ${input.textMutedClassName}`}>
                            Completion <span className="text-emerald-500 font-bold">{input.completion}%</span> and score <span className="text-emerald-500 font-bold">{input.score}%</span>.
                            <br />
                            Discovery status: <span className={input.eligibleForDiscovery ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                                {input.eligibleForDiscovery ? 'Eligible' : 'Blocked'}
                            </span>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className={input.textMutedClassName}>Current: {input.score}</span>
                            <span className={input.textMutedClassName}>Target: {input.target}</span>
                        </div>
                        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-1000 ease-out ws-shimmer"
                                style={{ width: `${input.score}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className={input.textMutedClassName}>Completion</span>
                            <span className={input.textMutedClassName}>Target: 70</span>
                        </div>
                        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                                className="h-full bg-sky-500 transition-all duration-1000 ease-out ws-shimmer"
                                style={{ width: `${input.completion}%` }}
                            />
                        </div>
                    </div>

                    {input.missingSteps.length > 0 ? (
                        <p className={`text-[11px] ${input.textMutedClassName}`}>
                            Missing: {input.missingSteps.slice(0, 3).join(', ')}
                        </p>
                    ) : null}

                    <Link
                        href="/workspace/settings?section=settings-startup-readiness"
                        className={`inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${input.isLight
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                            }`}
                    >
                        Improve score <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

function AdvisoryCreditsCard(input: {
    available: number | null,
    total: number | null,
    used: number,
    isUnlimited: boolean,
    isBlocked: boolean,
    message: string,
    isLight: boolean,
    textMainClassName: string,
    textMutedClassName: string
}) {
    const usageLabel = input.isUnlimited
        ? 'Unlimited'
        : `${input.available ?? 0}/${input.total ?? 0}`
    const usageHint = input.isBlocked
        ? input.message
        : input.isUnlimited
            ? 'No monthly cap on consultant requests.'
            : `${input.used} used this period.`
    const helperClass = input.isBlocked
        ? 'text-rose-500'
        : input.textMutedClassName

    return (
        <div className={`relative overflow-hidden rounded-[2.5rem] border p-6 transition-all hover:shadow-xl hover:shadow-emerald-500/5 ${input.isLight ? 'border-slate-200 bg-white' : 'border-white/5 bg-slate-900/40 backdrop-blur-3xl'}`}>
            <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${input.textMainClassName}`}>Available</div>
            </div>

            <div className="mt-6">
                <p className={`text-sm font-bold ${input.textMutedClassName}`}>Advisory Credits</p>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-4xl font-black tracking-tight ${input.textMainClassName}`}>{usageLabel}</span>
                </div>
                <p className={`mt-2 text-[11px] ${helperClass}`}>{usageHint}</p>
                {input.isBlocked ? (
                    <Link
                        href="/workspace/settings?section=settings-billing"
                        className={`mt-4 inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${input.isLight
                            ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                            }`}
                    >
                        Upgrade Plan <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                ) : null}
            </div>
        </div>
    )
}


function SidebarNavLink(input: {
    href: string
    label: string
    icon: ComponentType<{ className?: string }>
    active?: boolean
    activeClassName: string
    idleClassName: string
}) {
    const Icon = input.icon
    return (
        <Button
            asChild
            variant="ghost"
            className={`group w-full justify-start gap-2.5 border transition-all duration-200 ${input.active
                ? `${input.activeClassName} shadow-sm`
                : `${input.idleClassName} hover:translate-x-0.5`
                }`}
        >
            <Link href={input.href}>
                <span className={`relative flex h-4 w-4 items-center justify-center ${input.active ? 'drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]' : ''
                    }`}>
                    <Icon className="h-4 w-4" />
                </span>
                {input.label}
                {input.active ? (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
                ) : null}
            </Link>
        </Button>
    )
}

function AdvisorInboxPanel(input: {
    incomingRequests: EngagementRequest[]
    verificationStatus: OrganizationVerificationStatus
    proposalFeatureGate: BillingMeteredFeatureGateResult | null
    cardClassName: string
    mutedCardClassName: string
    textMainClassName: string
    textMutedClassName: string
    tableRowClassName: string
}) {
    const proposalGateBlocked = input.proposalFeatureGate ? !input.proposalFeatureGate.allowed : false
    const proposalUsageLabel = input.proposalFeatureGate
        ? input.proposalFeatureGate.unlimited
            ? 'Unlimited proposals'
            : `${input.proposalFeatureGate.remaining ?? 0}/${input.proposalFeatureGate.limit ?? 0} proposals left`
        : null
    const canRespond = input.verificationStatus === 'approved' && !proposalGateBlocked

    return (
        <Card className={input.cardClassName}>
            <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${input.textMainClassName}`}>Engagement Inbox</CardTitle>
                <CardDescription className={`text-xs ${input.textMutedClassName}`}>
                    Review and process startup requests.
                </CardDescription>
                {proposalUsageLabel ? (
                    <p className={`text-[11px] font-medium ${proposalGateBlocked ? 'text-rose-500' : input.textMutedClassName}`}>
                        {proposalGateBlocked ? input.proposalFeatureGate?.message : proposalUsageLabel}
                    </p>
                ) : null}
            </CardHeader>
            <CardContent className="pt-0">
                {input.incomingRequests.length === 0 ? (
                    <div className={`rounded-xl border border-dashed p-6 text-center text-sm font-medium ${input.textMutedClassName}`}>
                        No incoming requests yet.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {input.incomingRequests.map((request) => {
                                const statusMeta = getEngagementStatusMeta(request.status)

                                return (
                                    <div key={request.id} className={`px-4 py-3 transition-colors ${input.tableRowClassName}`}>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className={`truncate text-sm font-semibold ${input.textMainClassName}`}>
                                                    {request.startup_org_name}
                                                </p>
                                                <p className={`mt-0.5 text-[11px] ${input.textMutedClassName}`}>
                                                    Received {formatDate(request.created_at)}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Badge variant={statusMeta.variant} className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-tight">
                                                    {statusMeta.label}
                                                </Badge>
                                            </div>
                                        </div>

                                        {request.status === 'sent' && (
                                            <div className="mt-3">
                                                {canRespond ? (
                                                    <form action={respondEngagementRequestAction} className="flex items-center gap-2">
                                                        <input type="hidden" name="requestId" value={request.id} />
                                                        <Button type="submit" size="sm" name="decision" value="accepted" className="h-7 px-3 text-[11px] font-bold">
                                                            Accept
                                                        </Button>
                                                        <Button type="submit" size="sm" variant="outline" name="decision" value="rejected" className="h-7 px-3 text-[11px]">
                                                            Reject
                                                        </Button>
                                                    </form>
                                                ) : proposalGateBlocked ? (
                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-rose-500">
                                                        <span>{input.proposalFeatureGate?.message}</span>
                                                        <Link
                                                            href="/workspace/settings?section=settings-billing"
                                                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                                                        >
                                                            Upgrade <ArrowRight className="h-3 w-3" />
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] font-medium text-amber-600 dark:text-amber-500/80">
                                                        Account approval required to process requests.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {request.prep_room_id && (
                                            <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                                                <ArrowRight className="h-3.5 w-3.5" /> Prep room active
                                            </p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function InvestorReadinessCard(input: {
    score: number
    isReady: boolean
    missingSteps: string[]
    isLight: boolean
    textMainClassName: string
    textMutedClassName: string
}) {
    const statusVariant: BadgeProps['variant'] = input.isReady ? 'success' : 'secondary'
    const statusLabel = input.isReady ? 'Ready' : 'In Progress'
    const cappedScore = Math.max(0, Math.min(100, input.score))
    const targetScore = 70
    const hasReachedTarget = cappedScore >= targetScore
    const radius = 34
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (cappedScore / 100) * circumference
    const progressGradientClass = 'from-emerald-500 via-emerald-500 to-emerald-400'
    const missingSummary = input.missingSteps.length > 0
        ? `Missing: ${input.missingSteps.slice(0, 3).join(', ')}`
        : 'All investor readiness checkpoints are complete.'

    return (
        <div className={`relative overflow-hidden rounded-3xl border p-5 transition-all hover:shadow-xl hover:shadow-emerald-500/5 sm:p-6 ${input.isLight ? 'border-slate-200 bg-white' : 'border-white/5 bg-slate-900/40 backdrop-blur-3xl'}`}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent" />
            <div className="relative flex items-start justify-between gap-4">
                <div>
                    <p className={`text-sm font-semibold ${input.textMainClassName}`}>Investor Readiness</p>
                    <p className={`mt-1 text-xs ${input.textMutedClassName}`}>Profile and mandate completeness</p>
                </div>
                <Badge variant={statusVariant} className="h-6 px-2.5 text-[10px] font-black uppercase tracking-wide">
                    {statusLabel}
                </Badge>
            </div>

            <div className="relative mt-5 grid gap-4 sm:grid-cols-[auto,1fr] sm:items-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
                    <svg className="h-full w-full -rotate-90 transform">
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className={input.isLight ? 'text-slate-200' : 'text-slate-700'}
                        />
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="text-emerald-500 transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className={`text-lg font-semibold leading-none ${input.textMainClassName}`}>{cappedScore}</span>
                        <span className={`mt-1 text-[10px] font-semibold ${input.textMutedClassName}`}>Score</span>
                    </div>
                </div>
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <p className={`text-xs font-medium ${input.textMutedClassName}`}>Readiness score</p>
                        <p className={`text-base font-semibold ${input.textMainClassName}`}>{cappedScore}%</p>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-800/90">
                        <div
                            className={`h-full rounded-full bg-gradient-to-r ${progressGradientClass} transition-all duration-1000 ease-out`}
                            style={{ width: `${cappedScore}%` }}
                        />
                        <div
                            className="absolute top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-slate-400/70"
                            style={{ left: `${targetScore}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-medium ${input.textMutedClassName}`}>0</span>
                        <span className={`text-[10px] font-semibold ${hasReachedTarget ? 'text-emerald-500' : input.textMutedClassName}`}>Target {targetScore}</span>
                        <span className={`text-[10px] font-medium ${input.textMutedClassName}`}>100</span>
                    </div>
                </div>
            </div>

            <div className={`relative mt-4 rounded-2xl border px-3 py-2.5 ${input.isLight ? 'border-slate-200 bg-slate-50/90' : 'border-white/10 bg-white/5'}`}>
                <p className={`text-xs font-medium leading-relaxed ${input.textMutedClassName}`}>{missingSummary}</p>
            </div>

            <Link
                href="/workspace/profile"
                className={`relative mt-4 inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${input.isLight
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
            >
                Complete profile <ArrowRight className="h-3.5 w-3.5" />
            </Link>
        </div>
    )
}

function InvestorProfileViewsCard(input: {
    featureGate: BillingMeteredFeatureGateResult
    isLight: boolean
    textMainClassName: string
    textMutedClassName: string
}) {
    const usageLabel = input.featureGate.unlimited
        ? 'Unlimited'
        : `${input.featureGate.remaining ?? 0}/${input.featureGate.limit ?? 0}`
    const usageHint = !input.featureGate.allowed
        ? input.featureGate.message
        : input.featureGate.unlimited
            ? 'No monthly cap on full startup profile views.'
            : `${input.featureGate.used} used this period.`

    return (
        <div className={`relative overflow-hidden rounded-[2.5rem] border p-6 transition-all hover:shadow-xl hover:shadow-emerald-500/5 ${input.isLight ? 'border-slate-200 bg-white' : 'border-white/5 bg-slate-900/40 backdrop-blur-3xl'}`}>
            <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${input.textMainClassName}`}>Profile Views</div>
            </div>

            <div className="mt-6">
                <p className={`text-sm font-bold ${input.textMutedClassName}`}>Investor View Credits</p>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-4xl font-black tracking-tight ${input.textMainClassName}`}>{usageLabel}</span>
                </div>
                <p className={`mt-2 text-[11px] ${input.featureGate.allowed ? input.textMutedClassName : 'text-rose-500'}`}>{usageHint}</p>
                {!input.featureGate.allowed ? (
                    <Link
                        href="/workspace/settings?section=settings-billing"
                        className={`mt-4 inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${input.isLight
                            ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                            }`}
                    >
                        Upgrade Plan <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                ) : null}
            </div>
        </div>
    )
}

function CoreTeamPanel(input: {
    members: OrganizationMemberDirectoryEntry[]
    currentUserId: string
    cardClassName: string
    mutedCardClassName: string
    textMainClassName: string
    textMutedClassName: string
    tableRowClassName: string
}) {
    return (
        <Card className={input.cardClassName}>
            <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 text-lg ${input.textMainClassName}`}>
                    <Users className="h-4 w-4 text-emerald-500" /> Core Team
                </CardTitle>
                <CardDescription className={`text-xs ${input.textMutedClassName}`}>
                    Active workspace collaborators.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {input.members.length === 0 ? (
                    <div className={`rounded-xl border border-dashed p-6 text-center text-sm font-medium ${input.textMutedClassName}`}>
                        No members found.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {input.members.map((member) => {
                                const displayName = member.full_name ?? `Member ${member.user_id.slice(0, 8)}`
                                const joinedLabel = member.joined_at ? formatDate(member.joined_at) : 'Unknown'
                                const isCurrentUser = member.user_id === input.currentUserId
                                return (
                                    <div
                                        key={member.user_id}
                                        className={`flex items-center justify-between gap-3 px-3 py-3 transition-colors ${input.tableRowClassName}`}
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800 shadow-sm">
                                                <AvatarImage src={member.avatar_url ?? undefined} alt={displayName} />
                                                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-[10px] font-bold text-white uppercase">
                                                    {getInitials(member.full_name, 'U')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className={`truncate text-sm font-semibold ${input.textMainClassName}`}>{displayName}</p>
                                                <p className={`truncate text-[10px] font-medium ${input.textMutedClassName}`}>
                                                    Joined {joinedLabel}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            {isCurrentUser ? (
                                                <Badge variant="outline" className="h-4 px-1 text-[9px] font-bold uppercase tracking-wider">You</Badge>
                                            ) : null}
                                            <Badge variant={getMemberRoleBadgeVariant(member.member_role)} className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-tight">
                                                {toTitleCase(member.member_role)}
                                            </Badge>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function EngagementActivityTable(input: {
    title: string
    emptyMessage: string
    requests: EngagementRequest[]
    cardClassName: string
    mutedCardClassName: string
    textMainClassName: string
    textMutedClassName: string
    tableHeaderClassName: string
    tableRowClassName: string
}) {
    return (
        <Card className={input.cardClassName}>
            <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${input.textMainClassName}`}>{input.title}</CardTitle>
                <CardDescription className={`text-xs ${input.textMutedClassName}`}>
                    Recent engagement events and outcomes for your organization.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {input.requests.length === 0 ? (
                    <div className={`rounded-xl border border-dashed p-6 text-center text-sm font-medium ${input.textMutedClassName}`}>
                        {input.emptyMessage}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                        <div className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${input.tableHeaderClassName}`}>
                            <p>Request</p>
                            <p className="px-2 text-center">Status</p>
                            <p className="w-24 text-right">Date</p>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                            {input.requests.map((request) => {
                                const statusMeta = getEngagementStatusMeta(request.status)

                                return (
                                    <div key={request.id} className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-3 py-3 transition-colors ${input.tableRowClassName}`}>
                                        <div className="min-w-0">
                                            <p className={`truncate font-semibold ${input.textMainClassName}`}>
                                                {request.startup_org_name} <span className="mx-1 text-slate-400 font-normal">→</span> {request.advisor_org_name}
                                            </p>
                                            <p className={`mt-0.5 text-[10px] ${input.textMutedClassName}`}>
                                                {getEngagementStatusHint(request.status)}
                                            </p>
                                            {request.prep_room_id ? (
                                                <p className="mt-0.5 text-[10px] font-semibold text-emerald-500">Prep room active</p>
                                            ) : null}
                                        </div>
                                        <div className="px-2">
                                            <Badge variant={statusMeta.variant} className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-tight">
                                                {statusMeta.label}
                                            </Badge>
                                        </div>
                                        <div className={`w-24 text-right ${input.textMutedClassName}`}>
                                            <p className="text-[11px] font-medium">{formatDate(request.created_at)}</p>
                                            {request.responded_at ? (
                                                <p className="text-[10px]">Updated {formatDate(request.responded_at)}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default async function WorkspacePage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const bootstrapSnapshot = await getWorkspaceBootstrapForCurrentUser(supabase, user)
    const { profile, membership } = bootstrapSnapshot

    if (!membership) {
        redirect(getOnboardingPath())
    }

    // Read theme from cookies for consistent SSR
    const cookieStore = await cookies()
    const themeCookie = cookieStore.get('workspace_theme')?.value
    const isLight = themeCookie === 'light'

    const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? 'there'
    const workspaceLabel = `${toTitleCase(membership.organization.type)} workspace`
    const verificationStatus: OrganizationVerificationStatus =
        bootstrapSnapshot.verification_status
    const organizationCoreTeam = bootstrapSnapshot.organization_core_team
    const currentPlan = bootstrapSnapshot.current_plan
    const tierIdentifier = currentPlan
        ? `${currentPlan.plan.name} - Tier ${currentPlan.plan.tier}`
        : 'Tier Not Set'
    const startupReadiness: StartupReadiness | null =
        membership.organization.type === 'startup'
            ? (bootstrapSnapshot.startup_readiness ?? null)
            : null
    const organizationReadiness = bootstrapSnapshot.organization_readiness ?? null
    const [billingSnapshot, billingPlansSnapshot] = await Promise.all([
        getBillingMeForCurrentUser(supabase),
        getBillingPlansForCurrentUser(supabase, { segment: membership.organization.type }),
    ])
    const consultantRequestFeatureGate = membership.organization.type === 'startup'
        ? resolveConsultantRequestFeatureGate({
            currentPlan: billingSnapshot ?? currentPlan,
            plans: billingPlansSnapshot.plans,
            usage: billingSnapshot?.usage ?? [],
        })
        : null
    const advisorProposalFeatureGate = membership.organization.type === 'advisor'
        ? resolveAdvisorProposalFeatureGate({
            currentPlan: billingSnapshot ?? currentPlan,
            plans: billingPlansSnapshot.plans,
            usage: billingSnapshot?.usage ?? [],
        })
        : null
    const investorProfileViewFeatureGate = membership.organization.type === 'investor'
        ? resolveInvestorProfileViewFeatureGate({
            currentPlan: billingSnapshot ?? currentPlan,
            plans: billingPlansSnapshot.plans,
            usage: billingSnapshot?.usage ?? [],
        })
        : null
    const advisoryCreditsTotal = consultantRequestFeatureGate
        ? (consultantRequestFeatureGate.unlimited ? null : consultantRequestFeatureGate.limit ?? 0)
        : 0
    const advisoryCreditsAvailable = consultantRequestFeatureGate
        ? (consultantRequestFeatureGate.unlimited ? null : consultantRequestFeatureGate.remaining ?? 0)
        : 0

    const engagementRequests: EngagementRequest[] = []
    const startupDiscoveryFeed: StartupDiscoveryFeedItem[] = bootstrapSnapshot.startup_discovery_feed ?? []

    const verificationMeta = getVerificationMeta(verificationStatus)

    const introCapability =
        membership.organization.type === 'advisor'
            ? evaluateOrganizationCapability({
                capability: 'advisor_intro_send',
                organizationType: membership.organization.type,
                verificationStatus,
            })
            : membership.organization.type === 'investor'
                ? evaluateOrganizationCapability({
                    capability: 'investor_intro_receive',
                    organizationType: membership.organization.type,
                    verificationStatus,
                })
                : null

    const introCapabilityMeta = introCapability ? getCapabilityMeta(introCapability) : null

    const pageShellClass = isLight
        ? 'bg-slate-50 text-slate-900'
        : 'bg-[#070b14] text-slate-100'
    const heroGradientClass = isLight
        ? 'bg-[radial-gradient(circle_at_10%_8%,rgba(16,185,129,0.08),transparent_36%),radial-gradient(circle_at_86%_0%,rgba(37,99,235,0.08),transparent_36%)]'
        : 'bg-[radial-gradient(circle_at_10%_8%,rgba(16,185,129,0.24),transparent_36%),radial-gradient(circle_at_86%_0%,rgba(59,130,246,0.24),transparent_36%)]'
    const panelClass = isLight
        ? 'border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300'
        : 'border-white/5 bg-slate-900/80 shadow-2xl hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300'
    const mutedPanelClass = isLight
        ? 'border-slate-100 bg-slate-100/50'
        : 'border-slate-800 bg-slate-950/40'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const navActiveClass = isLight
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
        : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-950/20'
    const navIdleClass = isLight
        ? 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
    const tableRowClass = isLight
        ? 'border-slate-100 hover:bg-slate-50/50'
        : 'border-slate-800 hover:bg-slate-900/70'

    const currentHour = new Date().getHours()
    const greeting = getGreetingForHour(currentHour)

    return (
        <WorkspaceLayoutShell
            isLight={isLight}
            membership={membership}
            profile={profile}
            organizationCoreTeam={organizationCoreTeam}
            verificationMeta={verificationMeta}
            workspaceLabel={workspaceLabel}
            navActiveClass={navActiveClass}
            navIdleClass={navIdleClass}
            textMainClass={textMainClass}
            textMutedClass={textMutedClass}
            mutedPanelClass={mutedPanelClass}
            panelClass={panelClass}
            pageShellClass={pageShellClass}
            header={
                <header className={`sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between border-b px-10 backdrop-blur-3xl ${isLight ? 'border-slate-200 bg-white' : 'border-white/5 bg-[#070b14]/40'}`}>
                    <div className="flex items-center gap-4">
                        <nav className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                            <span className="opacity-40">Workspace</span>
                            <span className="opacity-20">/</span>
                            <span className={textMainClass}>Operations</span>
                        </nav>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 border-r border-slate-200/20 pr-6 mr-2 dark:border-white/5">
                            <button className="relative p-2 text-slate-400 transition-colors hover:text-emerald-500">
                                <Bell className="h-5 w-5" />
                            </button>
                            <WorkspaceThemeToggle />
                        </div>

                        <div className="flex items-center gap-3">
                            {membership.organization.type === 'startup' ? (
                                <Button className="h-9 gap-2 rounded-xl bg-emerald-500 px-4 text-[11px] font-black uppercase tracking-widest text-slate-950 hover:bg-emerald-400">
                                    <Share2 className="h-3.5 w-3.5" />
                                    Public Profile
                                </Button>
                            ) : null}
                            <WorkspaceUserMenu
                                displayName={profile.full_name?.trim() || membership.organization.name}
                                email={user.email ?? null}
                                avatarUrl={profile.avatar_url}
                                isLight={isLight}
                            />
                        </div>
                    </div>
                </header>
            }
        >
            {/* Dashboard Canvas */}
            <div className="flex-1 overflow-y-auto p-10 ws-dashboard-canvas ws-fade-in-d1">
                <div className="mx-auto max-w-[1440px] space-y-10">
                    {/* Integrated Command Ribbon */}
                    <CommandRibbon
                        firstName={firstName}
                        greeting={greeting}
                        organizationName={membership.organization.name}
                        organizationType={membership.organization.type}
                        tierIdentifier={tierIdentifier}
                        isLight={isLight}
                        verificationMeta={verificationMeta}
                        textMainClassName={textMainClass}
                        textMutedClassName={textMutedClass}
                    />

                    {/* Split Work Environment */}
                    <div className="grid gap-10 xl:grid-cols-[1fr_420px]">
                        {/* Central Intelligence Area: Discovery Hub */}
                        <div className="space-y-10">
                            {membership.organization.type === 'startup' && (
                                <>
                                    <div className="relative">
                                        <div className="mb-6 flex items-center justify-between">
                                            <div>
                                                <h2 className={`text-xl font-black tracking-tight ${textMainClass}`}>Discovery Pipeline</h2>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${textMutedClass}`}>Validated Market Opportunities</p>
                                            </div>
                                        </div>
                                        <StartupDiscoveryFeedPanel
                                            currentOrgId={membership.org_id}
                                            feed={startupDiscoveryFeed}
                                            isLight={isLight}
                                            cardClassName={`${panelClass} border-none shadow-none rounded-[3rem]`}
                                            mutedCardClassName={mutedPanelClass}
                                            textMainClassName={textMainClass}
                                            textMutedClassName={textMutedClass}
                                        />
                                    </div>

                                </>
                            )}

                            {membership.organization.type === 'advisor' && (
                                <AdvisorInboxPanel
                                    incomingRequests={engagementRequests.filter((request) => request.advisor_org_id === membership.org_id)}
                                    verificationStatus={verificationStatus}
                                    proposalFeatureGate={advisorProposalFeatureGate}
                                    cardClassName={`${panelClass} border-none shadow-none rounded-[3rem] p-8`}
                                    mutedCardClassName={mutedPanelClass}
                                    textMainClassName={textMainClass}
                                    textMutedClassName={textMutedClass}
                                    tableRowClassName={tableRowClass}
                                />
                            )}

                            {membership.organization.type === 'investor' && (
                                <div className="relative">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div>
                                            <h2 className={`text-xl font-black tracking-tight ${textMainClass}`}>Discovery Pipeline</h2>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${textMutedClass}`}>Published Startup Opportunities</p>
                                        </div>
                                    </div>
                                    {investorProfileViewFeatureGate && !investorProfileViewFeatureGate.allowed ? (
                                        <div className={`rounded-[2.5rem] border p-8 ${isLight ? 'border-rose-200 bg-rose-50/70' : 'border-rose-500/30 bg-rose-500/10'}`}>
                                            <p className={`text-sm font-bold ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                                                Full startup profile views are currently locked.
                                            </p>
                                            <p className={`mt-2 text-[11px] ${isLight ? 'text-rose-700/80' : 'text-rose-300/80'}`}>
                                                {investorProfileViewFeatureGate.message}
                                            </p>
                                            <Link
                                                href="/workspace/settings?section=settings-billing"
                                                className={`mt-4 inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${isLight
                                                    ? 'border-rose-200 bg-white text-rose-700 hover:bg-rose-100'
                                                    : 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                                                    }`}
                                            >
                                                Upgrade Plan <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    ) : (
                                        <StartupDiscoveryFeedPanel
                                            currentOrgId={membership.org_id}
                                            feed={startupDiscoveryFeed}
                                            isLight={isLight}
                                            cardClassName={`${panelClass} border-none shadow-none rounded-[3rem]`}
                                            mutedCardClassName={mutedPanelClass}
                                            textMainClassName={textMainClass}
                                            textMutedClassName={textMutedClass}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Intelligence Sidebar: Team & Activity Log */}
                        <div className="space-y-10">
                            {membership.organization.type === 'startup' && startupReadiness && (
                                <div className="space-y-8">
                                    <ReadinessScoreV2
                                        score={startupReadiness.readiness_score}
                                        completion={startupReadiness.profile_completion_percent}
                                        target={60}
                                        eligibleForDiscovery={startupReadiness.eligible_for_discovery_post}
                                        missingSteps={startupReadiness.missing_steps}
                                        isLight={isLight}
                                        textMainClassName={textMainClass}
                                        textMutedClassName={textMutedClass}
                                    />

                                    <AdvisoryCreditsCard
                                        available={advisoryCreditsAvailable}
                                        total={advisoryCreditsTotal}
                                        used={consultantRequestFeatureGate?.used ?? 0}
                                        isUnlimited={consultantRequestFeatureGate?.unlimited ?? false}
                                        isBlocked={consultantRequestFeatureGate ? !consultantRequestFeatureGate.allowed : false}
                                        message={consultantRequestFeatureGate?.message ?? 'Unable to load consultant request limits.'}
                                        isLight={isLight}
                                        textMainClassName={textMainClass}
                                        textMutedClassName={textMutedClass}
                                    />
                                </div>
                            )}

                            {membership.organization.type === 'investor' && organizationReadiness && (
                                <InvestorReadinessCard
                                    score={organizationReadiness.readiness_score}
                                    isReady={organizationReadiness.is_ready}
                                    missingSteps={organizationReadiness.missing_steps}
                                    isLight={isLight}
                                    textMainClassName={textMainClass}
                                    textMutedClassName={textMutedClass}
                                />
                            )}

                            {membership.organization.type === 'investor' && investorProfileViewFeatureGate ? (
                                <InvestorProfileViewsCard
                                    featureGate={investorProfileViewFeatureGate}
                                    isLight={isLight}
                                    textMainClassName={textMainClass}
                                    textMutedClassName={textMutedClass}
                                />
                            ) : null}

                            <CoreTeamPanel
                                members={organizationCoreTeam}
                                currentUserId={user.id}
                                cardClassName={`${panelClass} border-none shadow-none rounded-[3rem] p-8`}
                                mutedCardClassName={mutedPanelClass}
                                textMainClassName={textMainClass}
                                textMutedClassName={textMutedClass}
                                tableRowClassName={tableRowClass}
                            />

                        </div>
                    </div>
                </div>
                {/* Workspace Buffer */}
                <div className="h-20" />
            </div>
        </WorkspaceLayoutShell>
    )
}
