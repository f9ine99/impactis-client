'use client'

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useWorkspaceUI } from '@/stores/workspace-ui'
import { useWorkspaceTheme } from '@/app/workspace/WorkspaceThemeContext'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
    PanelLeftClose,
    PanelLeft,
    LayoutDashboard,
    UserRound,
    Building2,
    Settings2,
    LifeBuoy,
    LogOut,
    Menu,
    ArrowLeft,
    ShieldCheck,
    Bell,
    Palette,
    MessageCircle,
    Compass,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import SettingsSectionNavigator, { type SettingsSectionItem } from './settings/SettingsSectionNavigator'
import { isPlatformAdminUser } from '@/modules/admin'
import { Shield } from 'lucide-react'

function getAcronym(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'O'
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase()
}

function toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

type WorkspaceNavItem = {
    href: string
    label: string
    icon: ComponentType<{ className?: string }>
    children?: WorkspaceNavItem[]
    isActive?: (pathname: string, searchParams: URLSearchParams) => boolean
    /** When set, this item is a dropdown parent; click toggles expand/collapse instead of navigating. */
    expandKey?: string
}

type OrgType = 'startup' | 'investor' | 'advisor'

const SETTINGS_SECTIONS_STARTUP: Omit<SettingsSectionItem, 'href' | 'active'>[] = [
    { id: 'settings-identity', label: 'Organization Identity', icon: 'identity' },
]
const SETTINGS_SECTIONS_OTHER: Omit<SettingsSectionItem, 'href' | 'active'>[] = [
    { id: 'settings-identity', label: 'Organization Identity', icon: 'identity' },
    { id: 'settings-team-access', label: 'Team Access', icon: 'team' },
]

const PREFERENCES_SECTIONS = [{ id: 'security', label: 'Security', icon: ShieldCheck }] as const

type SidebarNavLinkProps = {
    href: string
    label: string
    icon: ComponentType<{ className?: string }>
    active?: boolean
    collapsed?: boolean
    activeClassName: string
    idleClassName: string
    className?: string
}

function SidebarNavLink({
    href,
    label,
    icon: Icon,
    active,
    collapsed,
    activeClassName,
    idleClassName,
    className,
}: SidebarNavLinkProps) {
    const router = useRouter()

    function prefetchRoute() {
        router.prefetch(href)
    }

    return (
        <Button
            asChild
            variant="ghost"
            className={cn(
                'h-11 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300',
                'inline-flex items-center gap-3 px-3',
                active ? activeClassName : idleClassName,
                collapsed ? 'w-11 min-w-11 justify-center px-0' : 'w-full justify-start',
                className
            )}
            title={collapsed ? label : undefined}
        >
            <Link href={href} prefetch onMouseEnter={prefetchRoute} onFocus={prefetchRoute} className="inline-flex h-full w-full items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className={cn('h-4 w-4', active ? 'text-emerald-500' : '')} />
                </span>
                <span
                    className={cn(
                        'truncate text-left transition-all duration-200',
                        collapsed ? 'w-0 overflow-hidden opacity-0' : 'min-w-0 flex-1'
                    )}
                    aria-hidden={collapsed}
                >
                    {label}
                </span>
            </Link>
        </Button>
    )
}

type WorkspaceLayoutShellProps = {
    children: ReactNode
    header: ReactNode
    initialIsLight: boolean
    membership: unknown
    profile: unknown
    organizationCoreTeam: unknown
    verificationMeta: unknown
    workspaceLabel: string
    onboardingMe?: {
        onboarding?: { blocked?: boolean; missing?: string[] }
        scores?: { overall_score?: number } | null
    } | null
}

export default function WorkspaceLayoutShell({
    children,
    header,
    initialIsLight,
    membership,
    profile,
    organizationCoreTeam,
    verificationMeta,
    workspaceLabel,
    onboardingMe,
}: WorkspaceLayoutShellProps) {
    const router = useRouter()
    const pathname = usePathname() ?? ''
    const searchParams = useSearchParams()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [expandedNavKeys, setExpandedNavKeys] = useState<Set<string>>(() => new Set())
    const { sidebarCollapsed: isCollapsed, setSidebarCollapsed } = useWorkspaceUI()
    const { isLight } = useWorkspaceTheme(initialIsLight)

    const pageShellClass = isLight ? 'bg-white text-slate-900' : 'bg-[#070b14] text-slate-100'
    const panelClass = isLight ? 'border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/40' : 'border-white/10 bg-slate-900/60'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const navActiveClass = isLight ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-950/20'
    const navIdleClass = isLight ? 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'

    const readinessBlocked = onboardingMe?.onboarding?.blocked === true
    const readinessMissing = Array.isArray(onboardingMe?.onboarding?.missing) ? onboardingMe!.onboarding!.missing! : []
    const readinessScore =
        typeof onboardingMe?.scores?.overall_score === 'number'
            ? Math.max(0, Math.min(100, Math.round(onboardingMe.scores.overall_score)))
            : null

    const orgType = (membership as { organization?: { type?: string } } | null)?.organization?.type as OrgType | undefined
    const isAdmin = isPlatformAdminUser(profile as any)
    const isSettingsRoute = pathname.startsWith('/workspace/settings')
    const isPreferencesRoute = pathname.startsWith('/workspace/preferences')
    const isSubRoute = isSettingsRoute

    const navItems: WorkspaceNavItem[] = useMemo(
        () => [
            { href: '/workspace', label: 'Overview', icon: LayoutDashboard },
            { href: '/workspace/profile', label: 'Profile', icon: UserRound },
            {
                href: '/workspace/organization',
                label: 'Organization',
                icon: Building2,
                expandKey: 'organization',
                isActive: (p) => p.startsWith('/workspace/organization'),
                children: [{ href: '/workspace/organization', label: 'Organization Identity', icon: Building2 }],
            },
            { href: '/workspace/subscription', label: 'Subscription & Billing', icon: Settings2 },
            { href: '/workspace/data-room', label: 'Data Room', icon: Settings2 },
            { href: '/workspace/discovery', label: 'Discovery', icon: Compass },
            { href: '/workspace/connections', label: 'Deal Room', icon: MessageCircle },
            { href: '/workspace/notifications', label: 'Notifications', icon: Bell },
            { href: '/workspace/deal-room/syndicate', label: 'Syndicate', icon: MessageCircle },
            {
                href: '/workspace/preferences?section=security',
                label: 'Security',
                icon: ShieldCheck,
                expandKey: 'security',
                isActive: (p, sp) =>
                    p.startsWith('/workspace/preferences')
                    && (sp.get('section') === 'security' || sp.get('section') === 'notifications' || sp.get('section') === 'appearance'),
                children: [
                    { href: '/workspace/preferences?section=security', label: 'Detail Security', icon: ShieldCheck },
                    { href: '/workspace/preferences?section=notifications', label: 'Notification', icon: Bell },
                    { href: '/workspace/preferences?section=appearance', label: 'Appearance', icon: Palette },
                ],
            },
            { href: '/workspace/preferences', label: 'Settings', icon: Settings2 },
            { href: '/workspace/help', label: 'Help & Support', icon: LifeBuoy },
            ...(isAdmin ? [{ href: '/workspace/admin', label: 'Admin', icon: Shield }] : []),
        ],
        [isAdmin]
    )

    const settingsSections: SettingsSectionItem[] = useMemo(() => {
        if (!isSettingsRoute || !orgType) return []
        const blueprint = orgType === 'startup' ? SETTINGS_SECTIONS_STARTUP : SETTINGS_SECTIONS_OTHER
        const sectionParam = searchParams.get('section')
        // We hide some sections from the Organization sidebar, but still allow
        // deep-linking to them (e.g. Subscription & Billing is accessible from main nav).
        const allowedIds = new Set([...blueprint.map((s) => s.id), 'settings-billing'])
        const activeId = sectionParam && allowedIds.has(sectionParam) ? sectionParam : blueprint[0]?.id ?? 'settings-identity'
        return blueprint.map((s) => ({
            ...s,
            href: `/workspace/settings?section=${s.id}`,
            active: s.id === activeId,
        }))
    }, [isSettingsRoute, orgType, searchParams])

    const isChildActive = (child: WorkspaceNavItem) => {
        if (child.href.includes('?')) {
            const [path, qs] = child.href.split('?')
            const params = new URLSearchParams(qs)
            return pathname === path && params.get('section') === searchParams.get('section')
        }
        return pathname.startsWith(child.href)
    }
    const effectiveExpanded = useMemo(() => {
        const next = new Set(expandedNavKeys)
        navItems.forEach((item) => {
            if (item.expandKey && item.children?.length) {
                const anyChildActive = item.children.some((c) => isChildActive(c))
                if (anyChildActive) next.add(item.expandKey)
            }
        })
        return next
    }, [expandedNavKeys, pathname, searchParams, navItems])
    const toggleExpanded = (key: string) => {
        setExpandedNavKeys((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    useEffect(() => {
        const routes = ['/workspace', '/workspace/profile', '/workspace/settings', '/workspace/preferences', '/workspace/help']
        routes.forEach((r) => router.prefetch(r))
        router.prefetch('/workspace/settings?section=settings-identity')
        router.prefetch('/workspace/preferences?section=security')
    }, [router])

    return (
        <main data-workspace-root="true" className={`flex h-screen overflow-hidden ${pageShellClass}`}>
            {/* Ambient Background Elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className={`absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full ${isLight ? 'bg-emerald-500/5' : 'bg-emerald-500/10'} blur-[120px] ws-float`} />
                <div className={`absolute right-[-10%] top-[40%] h-[340px] w-[340px] rounded-full ${isLight ? 'bg-blue-400/5' : 'bg-emerald-400/5'} blur-[100px] ws-float-delayed-1`} />
            </div>

            {/* Mobile navbar */}
            <div className="fixed inset-x-0 top-0 z-40 md:hidden">
                <div className={cn('flex h-16 items-center justify-between border-b px-4 backdrop-blur-xl', panelClass)}>
                    <div className="flex items-center gap-2">
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="rounded-xl">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0">
                                <div className={cn('h-full p-5', isLight ? 'bg-white' : 'bg-slate-950')}>
                                    <SheetHeader className="mb-4">
                                        <SheetTitle className={cn(isLight ? 'text-slate-900' : 'text-slate-100')}>Impactis</SheetTitle>
                                    </SheetHeader>
                                    <div className="space-y-2">
                                        {navItems.flatMap((item) => [item, ...(item.children ?? [])]).map((item) => (
                                            <Button
                                                key={item.href}
                                                asChild
                                                variant="ghost"
                                                className={cn(
                                                    'w-full justify-start gap-3 rounded-xl',
                                                    navIdleClass,
                                                )}
                                                onClick={() => setMobileOpen(false)}
                                            >
                                                <Link href={item.href}>
                                                    <item.icon className="h-4 w-4" />
                                                    {item.label}
                                                </Link>
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="mt-6 space-y-4">
                                        <Separator className={cn(isLight ? 'bg-slate-200/70' : 'bg-slate-800/60')} />
                                        <form action="/auth/signout" method="post">
                                            <Button type="submit" variant="ghost" className="w-full justify-start gap-3 rounded-xl text-rose-600 hover:bg-rose-500/10">
                                                <LogOut className="h-4 w-4" />
                                                Sign out
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <Link href="/" className="text-sm font-black tracking-tight text-emerald-500 hover:opacity-90">Impactis</Link>
                    </div>
                </div>
            </div>

            {/* Desktop sidebar: one sidebar; on Organization/Settings route it shows section list instead of main nav. Collapse applies to both. */}
            <aside className={cn('hidden md:flex relative flex-col border-r backdrop-blur-3xl ws-fade-in shrink-0 h-full transition-[width] duration-300', panelClass, isCollapsed ? 'w-20' : 'w-[280px]')}>
                <div className={cn('flex flex-col h-full min-h-0 overflow-hidden', isLight ? 'bg-slate-100/20' : 'bg-slate-950/20')}>
                    {/* Header: fixed, not scrollable */}
                    <div className={cn('shrink-0 p-6', isCollapsed ? 'px-3' : '')}>
                        {isSubRoute ? (
                            <div className={cn('flex flex-col gap-4', isCollapsed ? 'items-center' : '')}>
                                <Link
                                    href="/workspace"
                                    className={cn('inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors', isLight ? 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-800' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200', isCollapsed && 'justify-center p-2')}
                                    title="Back to Workspace"
                                >
                                    <ArrowLeft className="h-3 w-3 shrink-0" />
                                    <span className={cn('truncate transition-all duration-200', isCollapsed ? 'w-0 overflow-hidden opacity-0' : '')} aria-hidden={isCollapsed}>Workspace</span>
                                </Link>
                                <div className="flex items-center justify-between gap-3">
                                    <p className={cn('text-lg font-black tracking-tight truncate transition-all duration-200', textMainClass, isCollapsed ? 'w-0 opacity-0 overflow-hidden' : '')} aria-hidden={isCollapsed}>
                                        {isSettingsRoute ? 'Organization' : 'Settings'}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSidebarCollapsed((prev: boolean) => !prev)}
                                        className={cn('rounded-xl hover:bg-emerald-500/10 active:scale-95 shrink-0', navIdleClass)}
                                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                    >
                                        <span className="relative inline-flex h-4 w-4 items-center justify-center">
                                            <PanelLeft className={cn('absolute h-4 w-4 transition-all duration-300', isCollapsed ? 'scale-100 opacity-100' : 'scale-75 opacity-0')} />
                                            <PanelLeftClose className={cn('absolute h-4 w-4 transition-all duration-300', isCollapsed ? 'scale-75 opacity-0' : 'scale-100 opacity-100')} />
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-3">
                                <Link
                                    href="/"
                                    className={cn(
                                        'truncate text-xl font-black tracking-[-0.02em] text-emerald-500 transition-all duration-200 hover:opacity-90',
                                        isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                                    )}
                                    aria-hidden={isCollapsed}
                                    title="Back to home"
                                >
                                    Impactis
                                </Link>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSidebarCollapsed((prev: boolean) => !prev)}
                                    className={cn('rounded-xl hover:bg-emerald-500/10 active:scale-95', navIdleClass)}
                                >
                                    <span className="relative inline-flex h-4 w-4 items-center justify-center">
                                        <PanelLeft className={cn('absolute h-4 w-4 transition-all duration-300', isCollapsed ? 'scale-100 opacity-100' : 'scale-75 opacity-0')} />
                                        <PanelLeftClose className={cn('absolute h-4 w-4 transition-all duration-300', isCollapsed ? 'scale-75 opacity-0' : 'scale-100 opacity-100')} />
                                    </span>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Nav list: scrollable only this part */}
                    <div className={cn('flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-4', isCollapsed ? 'flex flex-col items-center px-2' : 'px-4')}>
                        {isSettingsRoute && settingsSections.length > 0 ? (
                            <div className={cn('space-y-4', isCollapsed ? 'flex flex-col items-center w-full' : '')}>
                                {/* Organization profile / identity block - hidden when collapsed */}
                                {!isCollapsed && (() => {
                                    const m = membership as { organization?: { name?: string; logo_url?: string | null }; member_role?: string } | null
                                    const org = m?.organization
                                    if (!org) return null
                                    return (
                                        <div className={cn('rounded-2xl border p-4', isLight ? 'border-slate-200/80 bg-white/80' : 'border-white/[0.06] bg-slate-900/40')}>
                                            <div className="flex items-center gap-3">
                                                <Avatar className={cn('h-11 w-11 ring-2 shrink-0', isLight ? 'ring-slate-200' : 'ring-slate-800')}>
                                                    <AvatarImage src={org.logo_url ?? undefined} alt="Organization" />
                                                    <AvatarFallback className={cn('text-xs font-black', isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400')}>
                                                        {getAcronym(org.name ?? 'O')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <p className={cn('truncate text-sm font-black tracking-tight', textMainClass)}>
                                                        {org.name ?? 'Organization'}
                                                    </p>
                                                    {m?.member_role && (
                                                        <Badge variant="secondary" className="mt-1 rounded-md px-1.5 py-0 text-[9px] font-black uppercase tracking-wider">
                                                            {toTitleCase(m.member_role)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}
                                {!isCollapsed && (
                                    <p className={cn('px-3 text-[9px] font-black uppercase tracking-[0.25em]', textMutedClass, 'opacity-60')}>
                                        Organization Settings
                                    </p>
                                )}
                                <div className={cn('space-y-1.5', isCollapsed ? 'flex flex-col items-center w-full' : '')}>
                                    <SettingsSectionNavigator sections={settingsSections} isLight={isLight} collapsed={isCollapsed} />
                                </div>
                            </div>
                        ) : (
                            <div className={cn('flex flex-col gap-1', isCollapsed ? 'items-center w-full' : '')}>
                                {navItems.map((item) => {
                                    const active = item.isActive
                                        ? item.isActive(pathname, searchParams)
                                        : item.href === '/workspace'
                                            ? pathname === '/workspace' || pathname === '/workspace/'
                                            : pathname.startsWith(item.href)
                                    const isDropdown = Boolean(item.expandKey && item.children?.length)
                                    const isExpanded = item.expandKey ? effectiveExpanded.has(item.expandKey) : false
                                    return (
                                        <div key={item.href} className={cn('flex flex-col', isCollapsed ? 'items-center' : '')}>
                                            {isDropdown ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => toggleExpanded(item.expandKey!)}
                                                    className={cn(
                                                        'h-11 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300',
                                                        'inline-flex items-center gap-3 px-3',
                                                        active ? navActiveClass : navIdleClass,
                                                        isCollapsed ? 'w-11 min-w-11 justify-center px-0' : 'w-full justify-start'
                                                    )}
                                                    title={isCollapsed ? item.label : undefined}
                                                >
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                                        <item.icon className={cn('h-4 w-4', active ? 'text-emerald-500' : '')} />
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'truncate text-left transition-all duration-200',
                                                            isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'min-w-0 flex-1'
                                                        )}
                                                        aria-hidden={isCollapsed}
                                                    >
                                                        {item.label}
                                                    </span>
                                                    {!isCollapsed && (
                                                        <span
                                                            className={cn(
                                                                'ml-auto transition-transform duration-200',
                                                                isExpanded ? 'rotate-180' : ''
                                                            )}
                                                            aria-hidden
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                </Button>
                                            ) : (
                                                <SidebarNavLink
                                                    href={item.href}
                                                    label={item.label}
                                                    icon={item.icon}
                                                    active={active}
                                                    collapsed={isCollapsed}
                                                    activeClassName={navActiveClass}
                                                    idleClassName={navIdleClass}
                                                />
                                            )}
                                            {!isCollapsed && item.children && item.children.length > 0 && isExpanded ? (
                                                <div className="mt-1 space-y-1 pl-8">
                                                    {item.children.map((child) => (
                                                        <SidebarNavLink
                                                            key={child.href}
                                                            href={child.href}
                                                            label={child.label}
                                                            icon={child.icon}
                                                            active={isChildActive(child)}
                                                            collapsed={false}
                                                            activeClassName={navActiveClass}
                                                            idleClassName={navIdleClass}
                                                            className="h-10 rounded-xl text-[10px] font-extrabold normal-case tracking-normal"
                                                        />
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer: fixed, sign out only (no theme toggle) */}
                    <div className={cn('shrink-0 p-6', isCollapsed ? 'px-3' : '')}>
                        <Separator className={cn('mb-4', isLight ? 'bg-slate-200/70' : 'bg-slate-800/60')} />
                        <form action="/auth/signout" method="post">
                            <Button
                                type="submit"
                                variant="ghost"
                                className={cn(
                                    'w-full items-center gap-3 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-500/10',
                                    isCollapsed ? 'justify-center px-0 w-12 h-12 mx-auto' : 'justify-start'
                                )}
                                title={isCollapsed ? 'Sign out' : undefined}
                            >
                                <LogOut className="h-4 w-4 shrink-0" />
                                <span className={cn('truncate transition-all duration-200', isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100')} aria-hidden={isCollapsed && !isSubRoute}>
                                    Sign out
                                </span>
                            </Button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* Dashboard Workspace */}
            <div className="relative flex flex-1 flex-col min-w-0 overflow-hidden pt-16 md:pt-0">
                {header}
                {readinessBlocked ? (
                    <div className={cn('mx-4 mt-4 rounded-2xl border px-4 py-3 md:mx-6', panelClass)}>
                        <div className="flex flex-col gap-1">
                            <p className={cn('text-sm font-semibold', textMainClass)}>
                                Complete onboarding to unlock the platform{readinessScore !== null ? ` (Score: ${readinessScore}%)` : ''}.
                            </p>
                            {readinessMissing.length > 0 ? (
                                <p className={cn('text-xs', textMutedClass)}>
                                    Missing: {readinessMissing.slice(0, 6).join(', ')}
                                    {readinessMissing.length > 6 ? ` (+${readinessMissing.length - 6} more)` : ''}
                                </p>
                            ) : (
                                <p className={cn('text-xs', textMutedClass)}>
                                    Finish Step 1 and complete your profile (name, photo, bio) to continue.
                                </p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={() => router.push('/onboarding/questions')}
                                    className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    Continue onboarding
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => router.push('/workspace/profile')}
                                    className={cn('rounded-xl', navIdleClass)}
                                >
                                    Update profile
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}
                {children}
            </div>
        </main>
    )
}
