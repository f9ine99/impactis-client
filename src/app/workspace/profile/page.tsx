import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
    Building2,
    LayoutDashboard,
    MapPin,
    Settings2,
    UserRound,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getOnboardingPath } from '@/modules/onboarding'
import { getWorkspaceIdentityForUser } from '@/modules/workspace'
import WorkspaceThemeToggle from '../WorkspaceThemeToggle'
import WorkspaceUserMenu from '../WorkspaceUserMenu'
import ProfileForm from './ProfileForm'

function getValue(value: string | null): string {
    return value && value.trim().length > 0 ? value : 'Not set yet'
}

function getInitials(name: string | null): string {
    if (!name) {
        return 'U'
    }

    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) {
        return 'U'
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 1).toUpperCase()
    }

    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase()
}

function getProfileCompleteness(input: {
    fullName: string | null
    location: string | null
    bio: string | null
    headline: string | null
    phone: string | null
    timezoneName: string | null
    websiteUrl: string | null
}): {
    completed: number
    total: number
    percent: number
    label: string
    variant: 'success' | 'warning' | 'secondary'
} {
    const total = 7
    let completed = 0

    if (input.fullName && input.fullName.trim().length > 1) {
        completed += 1
    }

    if (input.location && input.location.trim().length > 1) {
        completed += 1
    }

    if (input.bio && input.bio.trim().length >= 20) {
        completed += 1
    }

    if (input.headline && input.headline.trim().length > 1) {
        completed += 1
    }

    if (input.phone && input.phone.trim().length > 7) {
        completed += 1
    }

    if (input.timezoneName && input.timezoneName.trim().length > 2) {
        completed += 1
    }

    if (input.websiteUrl && input.websiteUrl.trim().length > 8) {
        completed += 1
    }

    const percent = Math.round((completed / total) * 100)

    if (percent === 100) {
        return { completed, total, percent, label: 'Excellent', variant: 'success' }
    }

    if (percent >= 67) {
        return { completed, total, percent, label: 'Good', variant: 'warning' }
    }

    return { completed, total, percent, label: 'Getting Started', variant: 'secondary' }
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
            className={`w-full justify-start gap-2.5 border ${input.active ? input.activeClassName : input.idleClassName}`}
        >
            <Link href={input.href}>
                <Icon className="h-4 w-4" />
                {input.label}
            </Link>
        </Button>
    )
}

export default async function WorkspaceProfilePage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const { profile, membership } = await getWorkspaceIdentityForUser(supabase, user)

    if (!membership) {
        redirect(getOnboardingPath())
    }

    const cookieStore = await cookies()
    const themeCookie = cookieStore.get('workspace_theme')?.value
    const isLight = themeCookie === 'light'

    const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? 'there'
    const completeness = getProfileCompleteness({
        fullName: profile.full_name,
        location: profile.location,
        bio: profile.bio,
        headline: profile.headline,
        phone: profile.phone,
        timezoneName: profile.timezone_name,
        websiteUrl: profile.website_url,
    })

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
    const navActiveClass = isLight
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
        : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
    const navIdleClass = isLight
        ? 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border-transparent'
        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100 border-transparent'

    return (
        <main data-workspace-root="true" className={`relative min-h-screen overflow-hidden ${pageShellClass}`}>
            {/* Ambient Background Elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className={`absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full ${isLight ? 'bg-emerald-500/5' : 'bg-emerald-500/10'} blur-[120px] ws-float`} />
                <div className={`absolute right-[-10%] top-[40%] h-[340px] w-[340px] rounded-full ${isLight ? 'bg-blue-400/5' : 'bg-emerald-400/5'} blur-[100px] ws-float-delayed-1`} />
            </div>

            <div className="relative mx-auto max-w-[1400px] px-6 py-8 md:py-12">
                <div className="flex flex-col gap-10">
                    {/* Immersive Profile Hero */}
                    <header className={`relative overflow-hidden rounded-[2.5rem] border p-8 md:p-12 shadow-2xl transition-all duration-500 ${panelClass} backdrop-blur-3xl`}>
                        <div className="relative z-10 flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
                                {/* Large Avatar Workspace */}
                                <div className="relative group">
                                    <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 opacity-20 blur-sm transition-all group-hover:opacity-40" />
                                    <Avatar className={`relative h-32 w-32 border-4 ${isLight ? 'border-white shadow-xl' : 'border-slate-900 shadow-2xl'}`}>
                                        <AvatarImage src={profile.avatar_url ?? undefined} alt="Profile avatar" />
                                        <AvatarFallback className={`text-3xl font-black ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {getInitials(profile.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="text-center lg:text-left">
                                    <div className="flex items-center justify-center gap-3 lg:justify-start">
                                        <Badge variant="outline" className={`border-emerald-500/30 bg-emerald-500/5 text-[10px] font-black uppercase tracking-widest text-emerald-500`}>
                                            {membership.member_role}
                                        </Badge>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${textMutedClass}`}>
                                            Identity Active
                                        </span>
                                    </div>
                                    <h1 className={`mt-4 text-4xl font-black tracking-tight md:text-5xl ${textMainClass}`}>
                                        {profile.full_name?.trim() || 'No Name Set'}
                                    </h1>
                                    {profile.headline ? (
                                        <p className={`mt-2 text-sm font-semibold ${textMutedClass}`}>
                                            {profile.headline}
                                        </p>
                                    ) : null}
                                    <div className={`mt-3 flex items-center justify-center gap-4 text-sm font-medium lg:justify-start ${textMutedClass}`}>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-emerald-500" />
                                            {getValue(profile.location)}
                                        </div>
                                        <span className="opacity-20">|</span>
                                        <div className="flex items-center gap-1.5">
                                            <LayoutDashboard className="h-4 w-4 text-blue-500" />
                                            {membership.organization.name}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Theme & Meta Controls */}
                        <div className="absolute top-6 right-6 flex items-center gap-3">
                            <WorkspaceThemeToggle />
                            <Link href="/workspace">
                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors">
                                    <Settings2 className="h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                    </header>

                    <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
                        {/* Tab-less Navigation Sidebar */}
                        <aside className="space-y-6">
                            <div className={`flex flex-col gap-2 rounded-3xl border p-3 ${panelClass} backdrop-blur-xl`}>
                                <SidebarNavLink
                                    href="/workspace"
                                    label="Dashboard"
                                    icon={LayoutDashboard}
                                    activeClassName={navActiveClass}
                                    idleClassName={navIdleClass}
                                />
                                <SidebarNavLink
                                    href="/workspace/profile"
                                    label="Profile"
                                    icon={UserRound}
                                    active
                                    activeClassName={navActiveClass}
                                    idleClassName={navIdleClass}
                                />
                                <SidebarNavLink
                                    href="/workspace/settings"
                                    label="Organization"
                                    icon={Building2}
                                    activeClassName={navActiveClass}
                                    idleClassName={navIdleClass}
                                />
                                <SidebarNavLink
                                    href="/workspace/preferences"
                                    label="Settings"
                                    icon={Settings2}
                                    activeClassName={navActiveClass}
                                    idleClassName={navIdleClass}
                                />
                            </div>

                            {/* Integrated Profile Strength */}
                            <div className={`flex flex-col gap-6 rounded-[2.5rem] border p-6 ${panelClass} backdrop-blur-xl`}>
                                <div className="flex items-center gap-6">
                                    {/* Circular Visualizer */}
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
                                                strokeDashoffset={2 * Math.PI * 28 - (completeness.percent / 100) * (2 * Math.PI * 28)}
                                                strokeLinecap="round"
                                                className="text-emerald-500 transition-all duration-1000 ease-out"
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className={`text-[13px] font-black tracking-tight ${textMainClass}`}>
                                                {completeness.percent}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${textMainClass}`}>Strength</span>
                                            <Badge variant={completeness.variant} className="rounded-lg px-2 py-0 text-[8px] font-black uppercase">
                                                {completeness.label}
                                            </Badge>
                                        </div>
                                        <div className={`h-1 w-full overflow-hidden rounded-full ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-1000 ws-shimmer"
                                                style={{ width: `${completeness.percent}%` }}
                                            />
                                        </div>
                                        <p className={`text-[8px] font-bold leading-tight ${textMutedClass}`}>
                                            {completeness.completed}/{completeness.total} Fields
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Card className={`${panelClass} overflow-hidden rounded-3xl`}>
                                <CardHeader className="p-6 pb-4">
                                    <CardTitle className={`text-xs font-black uppercase tracking-widest ${textMainClass}`}>
                                        Active Membership
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                        <p className={`text-[10px] font-black uppercase tracking-widest text-emerald-500`}>Startup Identity</p>
                                        <p className={`mt-2 text-sm font-bold ${textMainClass}`}>{membership.organization.name}</p>
                                        <p className={`mt-1 text-[11px] font-medium ${textMutedClass}`}>Joined {new Date(membership.created_at).toLocaleDateString()}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </aside>

                        {/* Main Interaction Area */}
                        <div className="space-y-8">
                            <ProfileForm
                                defaultFullName={profile.full_name ?? ''}
                                defaultAvatarUrl={profile.avatar_url ?? ''}
                                defaultLocation={profile.location ?? ''}
                                defaultBio={profile.bio ?? ''}
                                defaultPhone={profile.phone ?? ''}
                                defaultHeadline={profile.headline ?? ''}
                                defaultWebsiteUrl={profile.website_url ?? ''}
                                defaultLinkedinUrl={profile.linkedin_url ?? ''}
                                defaultTimezoneName={profile.timezone_name ?? ''}
                                defaultPreferredContactMethod={profile.preferred_contact_method ?? ''}
                                isLight={isLight}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
