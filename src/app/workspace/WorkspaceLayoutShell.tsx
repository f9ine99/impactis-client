'use client'

import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import {
    PanelLeftClose,
    PanelLeft,
    LayoutDashboard,
    UserRound,
    Building2,
    Settings2,
    LifeBuoy,
    LogOut
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type SidebarNavLinkProps = {
    href: string
    label: string
    icon: ComponentType<{ className?: string }>
    active?: boolean
    collapsed?: boolean
    activeClassName: string
    idleClassName: string
}

function SidebarNavLink({
    href,
    label,
    icon: Icon,
    active,
    collapsed,
    activeClassName,
    idleClassName,
}: SidebarNavLinkProps) {
    const router = useRouter()

    function prefetchRoute() {
        router.prefetch(href)
    }

    return (
        <Link
            href={href}
            prefetch
            onMouseEnter={prefetchRoute}
            onFocus={prefetchRoute}
            className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${active ? activeClassName : idleClassName
                } ${collapsed ? 'justify-center px-0 w-12 h-12 mx-auto' : ''}`}
            title={collapsed ? label : undefined}
        >
            <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-emerald-500' : ''}`} />
            <span
                className={`truncate transition-all duration-200 ${collapsed ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100'}`}
                aria-hidden={collapsed}
            >
                {label}
            </span>
        </Link>
    )
}

type WorkspaceLayoutShellProps = {
    children: ReactNode
    header: ReactNode
    isLight: boolean
    membership: unknown
    profile: unknown
    organizationCoreTeam: unknown
    verificationMeta: unknown
    workspaceLabel: string
    navActiveClass: string
    navIdleClass: string
    textMainClass: string
    textMutedClass: string
    mutedPanelClass: string
    panelClass: string
    pageShellClass: string
}

export default function WorkspaceLayoutShell({
    children,
    header,
    isLight,
    membership,
    profile,
    organizationCoreTeam,
    verificationMeta,
    workspaceLabel,
    navActiveClass,
    navIdleClass,
    textMainClass,
    textMutedClass,
    mutedPanelClass,
    panelClass,
    pageShellClass
}: WorkspaceLayoutShellProps) {
    const router = useRouter()
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        // Warm up route payloads so sidebar navigation is faster than cold server fetches.
        router.prefetch('/workspace')
        router.prefetch('/workspace/profile')
        router.prefetch('/workspace/settings')
        router.prefetch('/workspace/preferences')
    }, [router])

    return (
        <main data-workspace-root="true" className={`flex h-screen overflow-hidden ${pageShellClass}`}>
            {/* Ambient Background Elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className={`absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full ${isLight ? 'bg-emerald-500/5' : 'bg-emerald-500/10'} blur-[120px] ws-float`} />
                <div className={`absolute right-[-10%] top-[40%] h-[340px] w-[340px] rounded-full ${isLight ? 'bg-blue-400/5' : 'bg-emerald-400/5'} blur-[100px] ws-float-delayed-1`} />
            </div>

            {/* Elite Slim Sidebar */}
            <aside
                className={`relative flex flex-col border-r backdrop-blur-3xl ws-fade-in transition-all duration-500 ease-in-out ${panelClass} border-none rounded-none shadow-none ${isCollapsed ? 'w-20' : 'w-[280px]'
                    }`}
            >
                <div className={`flex flex-col h-full ${isLight ? 'bg-slate-100/20' : 'bg-slate-950/20'}`}>
                    <div className={`p-8 ${isCollapsed ? 'px-4' : ''}`}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-h-[40px] items-center gap-3 overflow-hidden">
                                <p
                                    className={`truncate text-xl font-black tracking-[-0.02em] text-emerald-500 transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}
                                    aria-hidden={isCollapsed}
                                >
                                    Impactis
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCollapsed((previousValue) => !previousValue)}
                                className={`p-2 rounded-xl transition-colors ${navIdleClass} hover:bg-emerald-500/10 active:scale-95`}
                            >
                                <span className="relative inline-flex h-4 w-4 items-center justify-center">
                                    <PanelLeft
                                        className={`absolute h-4 w-4 transition-all duration-300 ${isCollapsed ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
                                    />
                                    <PanelLeftClose
                                        className={`absolute h-4 w-4 transition-all duration-300 ${isCollapsed ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`}
                                    />
                                </span>
                            </button>
                        </div>

                        <div className="mt-12 space-y-10">
                            <div className="space-y-3">
                                <p className={`px-4 text-[10px] font-bold uppercase tracking-widest ${textMutedClass} opacity-50 ${isCollapsed ? 'hidden' : 'block'}`}>
                                    Main Menu
                                </p>
                                <div className="space-y-1">
                                    <SidebarNavLink
                                        href="/workspace"
                                        label="Overview"
                                        icon={LayoutDashboard}
                                        active
                                        collapsed={isCollapsed}
                                        activeClassName={navActiveClass}
                                        idleClassName={navIdleClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className={`px-4 text-[10px] font-bold uppercase tracking-widest ${textMutedClass} opacity-50 ${isCollapsed ? 'hidden' : 'block'}`}>
                                    System Settings
                                </p>
                                <div className="space-y-1">
                                    <SidebarNavLink
                                        href="/workspace/profile"
                                        label="Profile"
                                        icon={UserRound}
                                        collapsed={isCollapsed}
                                        activeClassName={navActiveClass}
                                        idleClassName={navIdleClass}
                                    />
                                    <SidebarNavLink
                                        href="/workspace/settings"
                                        label="Organization"
                                        icon={Building2}
                                        collapsed={isCollapsed}
                                        activeClassName={navActiveClass}
                                        idleClassName={navIdleClass}
                                    />
                                    <SidebarNavLink
                                        href="/workspace/preferences"
                                        label="Settings"
                                        icon={Settings2}
                                        collapsed={isCollapsed}
                                        activeClassName={navActiveClass}
                                        idleClassName={navIdleClass}
                                    />
                                    <SidebarNavLink
                                        href="/workspace/help"
                                        label="Help & Support"
                                        icon={LifeBuoy}
                                        collapsed={isCollapsed}
                                        activeClassName={navActiveClass}
                                        idleClassName={navIdleClass}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`mt-auto p-8 space-y-6 ${isCollapsed ? 'px-4 overflow-hidden' : ''}`}>
                        <form action="/auth/signout" method="post">
                            <button
                                type="submit"
                                className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 text-rose-500 hover:bg-rose-500/10 ${isCollapsed ? 'justify-center px-0 w-12 h-12 mx-auto' : ''}`}
                                title={isCollapsed ? 'Sign out' : undefined}
                            >
                                <LogOut className="h-4 w-4 shrink-0" />
                                <span
                                    className={`truncate transition-all duration-200 ${isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100'}`}
                                    aria-hidden={isCollapsed}
                                >
                                    Sign out
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* Dashboard Workspace */}
            <div className="relative flex flex-1 flex-col min-w-0 overflow-hidden">
                {header}
                {children}
            </div>
        </main>
    )
}
