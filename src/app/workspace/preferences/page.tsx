import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Bell,
    ChevronRight,
    Palette,
    Settings2,
    Shield,
    ShieldCheck,
    Sparkles,
    LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api/rest-client'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getOnboardingPath } from '@/modules/onboarding'
import { getWorkspaceIdentityForUser } from '@/modules/workspace'
import WorkspaceThemeToggle from '../WorkspaceThemeToggle'
import WorkspaceUserMenu from '../WorkspaceUserMenu'
import SecuritySection from './SecuritySection'

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
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const {
        data: { session },
    } = await supabase.auth.getSession()
    const accessToken = session?.access_token ?? null

    const [identityResult, sessionsResult] = await Promise.all([
        getWorkspaceIdentityForUser(supabase, user),
        accessToken
            ? apiRequest<SessionListResponse>({ path: '/sessions', accessToken })
            : Promise.resolve(null),
    ])

    const { profile, membership } = identityResult

    if (!membership) {
        redirect(getOnboardingPath())
    }

    const activeSessions = sessionsResult?.sessions ?? []

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
    const isLight = themeCookie === 'light'

    const pageShellClass = isLight
        ? 'bg-slate-50 text-slate-900'
        : 'bg-[#070b14] text-slate-100'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'

    const statusBadgeStyles: Record<string, string> = {
        success: 'bg-emerald-500/10 text-emerald-500',
        warning: 'bg-amber-500/10 text-amber-500',
        muted: isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500',
    }

    return (
        <main data-workspace-root="true" className={`flex h-screen w-full overflow-hidden ${pageShellClass}`}>
            {/* ═══════════════════ Professional Sidebar ═══════════════════ */}
            <aside className={`relative flex w-[310px] shrink-0 flex-col overflow-hidden z-20 ${isLight
                ? 'border-r border-slate-200/80 bg-white'
                : 'border-r border-white/[0.04] bg-[#0a0e1a]'
                }`}>
                {/* Ambient gradient */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                    <div className={`absolute -left-20 -top-20 h-[280px] w-[280px] rounded-full blur-[100px] ${isLight ? 'bg-emerald-500/[0.04]' : 'bg-emerald-500/[0.06]'}`} />
                    <div className={`absolute -bottom-16 -right-16 h-[200px] w-[200px] rounded-full blur-[80px] ${isLight ? 'bg-blue-500/[0.03]' : 'bg-blue-500/[0.04]'}`} />
                </div>

                {/* ─── Header ─── */}
                <div className={`relative p-6 pb-5 ${isLight ? 'border-b border-slate-100' : 'border-b border-white/[0.04]'}`}>
                    {/* Back Link */}
                    <Link
                        href="/workspace"
                        className={`group mb-6 inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${isLight
                            ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                            }`}
                    >
                        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                        Workspace
                    </Link>

                    {/* Identity */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className={`h-11 w-11 ring-2 ${isLight ? 'ring-slate-200' : 'ring-slate-800'}`}>
                                <AvatarImage src={profile.avatar_url ?? undefined} alt="Avatar" />
                                <AvatarFallback className={`text-xs font-black ${isLight ? 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400' : 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500'}`}>
                                    {getAcronym(profile.full_name ?? 'U')}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${isLight ? 'border-white bg-slate-100' : 'border-[#0a0e1a] bg-slate-800'}`}>
                                <Settings2 className={`h-2.5 w-2.5 ${textMutedClass}`} />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className={`text-[15px] font-black tracking-tight ${textMainClass}`}>
                                Settings
                            </h1>
                            <p className={`mt-0.5 truncate text-[11px] font-medium ${textMutedClass}`}>
                                {profile.full_name?.trim() || 'Your preferences'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ─── Navigation ─── */}
                <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-4 py-6">
                    <p className={`mb-4 px-3 text-[9px] font-black uppercase tracking-[0.25em] ${textMutedClass} opacity-60`}>
                        Preferences
                    </p>
                    <div className="space-y-1.5">
                        {SECTIONS.map((section) => {
                            const Icon = section.icon
                            const isActive = section.id === activeSectionId

                            return (
                                <Link
                                    key={section.id}
                                    href={`/workspace/preferences?section=${section.id}`}
                                    className="block group"
                                >
                                    <div className={`relative flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 transition-all duration-300 ${isActive
                                        ? isLight
                                            ? 'bg-gradient-to-r from-emerald-50 to-white border border-emerald-200/80 shadow-sm shadow-emerald-500/5'
                                            : 'bg-gradient-to-r from-emerald-500/[0.08] to-transparent border border-emerald-500/20 shadow-lg shadow-emerald-900/10'
                                        : isLight
                                            ? 'border border-transparent hover:bg-slate-50 hover:border-slate-200/60'
                                            : 'border border-transparent hover:bg-white/[0.02] hover:border-white/[0.04]'
                                        }`}>
                                        {/* Active Indicator Bar */}
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                        )}

                                        {/* Icon */}
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isActive
                                            ? `${section.iconBg} ring-2 ${isLight ? 'ring-emerald-100' : 'ring-emerald-500/10'}`
                                            : `${isLight ? 'bg-slate-100/80 group-hover:bg-slate-100' : 'bg-slate-800/50 group-hover:bg-slate-800/80'}`
                                            }`}>
                                            <Icon className={`h-4 w-4 transition-colors duration-300 ${isActive ? section.iconColor : textMutedClass
                                                }`} />
                                        </div>

                                        {/* Text */}
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-[12px] font-bold tracking-tight transition-colors ${isActive
                                                ? isLight ? 'text-emerald-700' : 'text-emerald-300'
                                                : `${textMainClass} group-hover:${isLight ? 'text-slate-900' : 'text-white'}`
                                                }`}>
                                                {section.label}
                                            </p>
                                            <p className={`mt-0.5 text-[10px] font-medium transition-colors ${isActive
                                                ? isLight ? 'text-emerald-600/60' : 'text-emerald-400/50'
                                                : `${isLight ? 'text-slate-400' : 'text-slate-600'}`
                                                }`}>
                                                {section.description}
                                            </p>
                                        </div>

                                        {/* Status / Chevron */}
                                        <div className="shrink-0">
                                            {isActive ? (
                                                <ChevronRight className={`h-3.5 w-3.5 ${isLight ? 'text-emerald-400' : 'text-emerald-500/60'}`} />
                                            ) : section.statusLabel ? (
                                                <span className={`rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${statusBadgeStyles[section.statusVariant ?? 'muted']}`}>
                                                    {section.statusLabel}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* ─── Footer Action ─── */}
                <div className={`relative p-4 ${isLight ? 'border-t border-slate-100' : 'border-t border-white/[0.04]'}`}>
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className={`group flex w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all duration-300 ${isLight
                                ? 'border border-rose-100 bg-rose-50/30 text-rose-600 hover:bg-rose-50 hover:border-rose-200 hover:shadow-sm'
                                : 'border border-rose-500/10 bg-rose-500/[0.02] text-rose-400 hover:bg-rose-500/[0.06] hover:border-rose-500/20 hover:shadow-lg hover:shadow-rose-900/5'
                                }`}
                        >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isLight
                                ? 'bg-rose-100/80 group-hover:bg-rose-100'
                                : 'bg-rose-500/10 group-hover:bg-rose-500/20'
                                }`}>
                                <LogOut className="h-4 w-4" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-[12px] font-black uppercase tracking-widest">
                                    Sign Out
                                </p>
                                <p className={`text-[10px] font-medium opacity-60 ${isLight ? 'text-rose-500' : 'text-rose-300'}`}>
                                    End current session
                                </p>
                            </div>
                            <ChevronRight className={`h-3.5 w-3.5 opacity-40 transition-transform group-hover:translate-x-0.5 ${isLight ? 'text-rose-400' : 'text-rose-500'}`} />
                        </button>
                    </form>
                </div>
            </aside>

            {/* ═══════════════════ Main Content ═══════════════════ */}
            <section className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Ambient Light */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                    <div className={`absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full ${isLight ? 'bg-blue-500/5' : 'bg-blue-500/10'} blur-[120px]`} />
                </div>

                {/* Top Nav */}
                <header className={`sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between border-b px-8 backdrop-blur-3xl ${isLight ? 'border-slate-200 bg-white/80' : 'border-white/5 bg-[#070b14]/60'}`}>
                    <div className="flex items-center gap-4">
                        <nav className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                            <span className="opacity-40">Workspace</span>
                            <span className="opacity-20">/</span>
                            <span className="opacity-40">Settings</span>
                            <span className="opacity-20">/</span>
                            <span className={textMainClass}>{activeSection.label}</span>
                        </nav>
                    </div>

                    <div className="flex items-center gap-6">
                        <WorkspaceThemeToggle />
                        <WorkspaceUserMenu
                            displayName={profile.full_name?.trim() || membership.organization.name}
                            email={user.email ?? null}
                            avatarUrl={profile.avatar_url}
                            isLight={isLight}
                        />
                    </div>
                </header>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
                    <div className="mx-auto max-w-3xl space-y-8">
                        {/* Section Header */}
                        <div className="flex items-center gap-4 px-2">
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

                        {/* Active Section Content */}
                        {activeSectionId === 'security' && (
                            <SecuritySection
                                userEmail={user.email ?? 'Unknown'}
                                lastSignIn={user.last_sign_in_at ?? null}
                                sessions={activeSessions}
                                isLight={isLight}
                            />
                        )}

                        {activeSectionId === 'notifications' && (
                            <div className={`overflow-hidden rounded-[2rem] border p-12 text-center ${isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-white/5 bg-slate-900/60'}`}>
                                <div className="flex flex-col items-center gap-5">
                                    <div className="relative">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 ring-4 ring-blue-500/5">
                                            <Bell className="h-8 w-8 text-blue-500" />
                                        </div>
                                        <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
                                            <Sparkles className="h-3 w-3 text-blue-500" />
                                        </div>
                                    </div>
                                    <div className="max-w-xs">
                                        <p className={`text-sm font-black uppercase tracking-widest ${textMainClass}`}>
                                            Notifications
                                        </p>
                                        <p className={`mt-2 text-[11px] font-medium leading-relaxed ${textMutedClass}`}>
                                            Email digests, engagement alerts, and notification preferences will be available here.
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest">
                                        Coming Soon
                                    </Badge>
                                </div>
                            </div>
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
        </main>
    )
}
