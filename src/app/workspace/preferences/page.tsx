import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Bell, Palette, Shield, Sparkles } from 'lucide-react'
import { apiRequest } from '@/lib/api/rest-client'
import { auth } from '@/lib/auth'
import { getBetterAuthToken } from '@/lib/better-auth-token'
import { Badge } from '@/components/ui/badge'
import { getOnboardingPath } from '@/modules/onboarding'
import { getWorkspaceIdentityForUser } from '@/modules/workspace'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import SecuritySection from './SecuritySection'
import NotificationsSection from './NotificationsSection'

type PreferencesSectionId = 'security' | 'notifications' | 'appearance'

type PreferencesSectionItem = {
    id: PreferencesSectionId
    label: string
    description: string
    icon: typeof Shield
    iconBg: string
    iconColor: string
    statusLabel?: string
    statusVariant?: 'success' | 'warning' | 'muted'
}

const SECTIONS: PreferencesSectionItem[] = [
    {
        id: 'security',
        label: 'Security',
        description: 'Password & authentication',
        icon: Shield,
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        statusLabel: 'Active',
        statusVariant: 'success',
    },
    {
        id: 'notifications',
        label: 'Notifications',
        description: 'Alerts & email digests',
        icon: Bell,
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-500',
        statusLabel: 'Coming Soon',
        statusVariant: 'muted',
    },
    {
        id: 'appearance',
        label: 'Appearance',
        description: 'Theme & display',
        icon: Palette,
        iconBg: 'bg-violet-500/10',
        iconColor: 'text-violet-500',
        statusLabel: 'Coming Soon',
        statusVariant: 'muted',
    },
]

function getAcronym(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'U'
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
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

type ActiveSessionFromApi = {
    id: string
    user_id: string
    ip: string | null
    user_agent: string | null
    created_at: string
    updated_at: string
}

type SessionListResponse = {
    sessions: ActiveSessionFromApi[]
}

export default async function PreferencesPage({
    searchParams,
}: {
    searchParams: Promise<{ section?: string | string[] }>
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        redirect('/auth/login')
    }

    const user = session.user
    const accessToken = await getBetterAuthToken()

    const [identityResult, sessionsResult] = await Promise.all([
        getWorkspaceIdentityForUser(null as any, user as any),
        accessToken
            ? apiRequest<SessionListResponse>({ path: '/sessions', accessToken })
            : Promise.resolve(null),
    ])

    const { profile, membership } = identityResult

    if (!membership) {
        redirect(getOnboardingPath())
    }

    const activeSessions = sessionsResult?.sessions ?? []
    const lastSignIn = activeSessions.length > 0 ? activeSessions[0].updated_at : null

    const resolvedSearchParams = await searchParams
    const requestedSection = resolveSingleSearchParam(resolvedSearchParams.section)
    const validSectionIds = new Set<string>(SECTIONS.map((s) => s.id))
    const activeSectionId: PreferencesSectionId =
        requestedSection && validSectionIds.has(requestedSection)
            ? (requestedSection as PreferencesSectionId)
            : 'security'

    const activeSection = SECTIONS.find((s) => s.id === activeSectionId) ?? SECTIONS[0]

    const cookieStore = await cookies()
    const themeCookie = cookieStore.get('workspace_theme')?.value
    const isLight = themeCookie !== 'dark'

    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'

    const statusBadgeStyles: Record<string, string> = {
        success: 'bg-emerald-500/10 text-emerald-500',
        warning: 'bg-amber-500/10 text-amber-500',
        muted: isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500',
    }

    return (
        <section className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
                {/* Ambient Light */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                    <div className={`absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full ${isLight ? 'bg-blue-500/5' : 'bg-blue-500/10'} blur-[120px]`} />
                </div>

                {/* Content Body (header provided by workspace layout) */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
                    <div className="mx-auto max-w-3xl space-y-8">
                        <div className="flex flex-wrap items-start justify-between gap-4 px-2">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${activeSection.iconBg}`}>
                                    <activeSection.icon className={`h-5 w-5 ${activeSection.iconColor}`} />
                                </div>
                                <div>
                                    <h2 className={`text-sm font-black uppercase tracking-widest ${textMainClass}`}>
                                        {activeSection.label}
                                    </h2>
                                    <p className={`mt-0.5 text-[11px] font-medium ${textMutedClass}`}>
                                        {activeSection.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {SECTIONS.map((section) => {
                                    const isActive = section.id === activeSectionId
                                    return (
                                        <Button
                                            key={section.id}
                                            asChild
                                            variant={isActive ? 'default' : 'outline'}
                                            size="sm"
                                            className={isActive ? 'rounded-full' : 'rounded-full'}
                                        >
                                            <Link href={`/workspace/preferences?section=${section.id}`}>
                                                {section.label}
                                            </Link>
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Active Section Content */}
                        {activeSectionId === 'security' && (
                            <SecuritySection
                                userEmail={user.email ?? 'Unknown'}
                                lastSignIn={lastSignIn}
                                sessions={activeSessions}
                                isLight={isLight}
                            />
                        )}

                        {activeSectionId === 'notifications' && (
                            <NotificationsSection isLight={isLight} />
                        )}

                        {activeSectionId === 'appearance' && (
                            <div className={`overflow-hidden rounded-[2rem] border p-12 text-center ${isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-white/5 bg-slate-900/60'}`}>
                                <div className="flex flex-col items-center gap-5">
                                    <div className="relative">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 ring-4 ring-violet-500/5">
                                            <Palette className="h-8 w-8 text-violet-500" />
                                        </div>
                                        <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10">
                                            <Sparkles className="h-3 w-3 text-violet-500" />
                                        </div>
                                    </div>
                                    <div className="max-w-xs">
                                        <p className={`text-sm font-black uppercase tracking-widest ${textMainClass}`}>
                                            Appearance
                                        </p>
                                        <p className={`mt-2 text-[11px] font-medium leading-relaxed ${textMutedClass}`}>
                                            Theme selection, layout density, and display customization will be available here.
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest">
                                        Coming Soon
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-20" />
                </div>
        </section>
    )
}
