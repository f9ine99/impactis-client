'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkspaceTheme } from '@/app/workspace/WorkspaceThemeContext'
import WorkspaceThemeToggle from './WorkspaceThemeToggle'
import WorkspaceUserMenu from './WorkspaceUserMenu'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getNotificationsUnreadCount } from '@/modules/notifications/notifications.repository'

type WorkspaceHeaderProps = {
    workspaceLabel: string
    displayName: string
    email: string | null
    avatarUrl: string | null
    initialIsLight: boolean
    organizationType?: 'startup' | 'investor' | 'advisor'
}

const PATH_TITLES: Record<string, string> = {
    '/workspace': 'Dashboard',
    '/workspace/profile': 'Profile',
    '/workspace/settings': 'Organization',
    '/workspace/preferences': 'Settings',
    '/workspace/help': 'Help & Support',
    '/workspace/notifications': 'Notifications',
    '/workspace/discovery': 'Discovery',
    '/workspace/connections': 'Deal Room',
    '/workspace/admin': 'Admin',
}

function getPageTitle(pathname: string): string {
    const normalized = pathname.replace(/\/$/, '') || '/workspace'
    return PATH_TITLES[normalized] ?? 'Workspace'
}

export default function WorkspaceHeader({
    workspaceLabel,
    displayName,
    email,
    avatarUrl,
    initialIsLight,
    organizationType,
}: WorkspaceHeaderProps) {
    const pathname = usePathname()
    const pageTitle = getPageTitle(pathname ?? '/workspace')
    const { isLight } = useWorkspaceTheme(initialIsLight)
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const [unreadCount, setUnreadCount] = useState<number>(0)

    useEffect(() => {
        getNotificationsUnreadCount().then(setUnreadCount)
    }, [pathname])

    return (
        <header
            className={cn(
                'sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b backdrop-blur-xl',
                'px-4 sm:px-6 md:px-10',
                isLight ? 'border-slate-200 bg-white/95' : 'border-white/5 bg-[#070b14]/80'
            )}
        >
            <nav className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                <Link href="/" className="truncate opacity-40 hover:opacity-70 transition-opacity" title="Back to home">
                    {workspaceLabel}
                </Link>
                <span className="shrink-0 opacity-20">/</span>
                <Link href={pathname ?? '/workspace'} className={cn('truncate hover:opacity-80 transition-opacity', textMainClass)}>
                    {pageTitle}
                </Link>
            </nav>

            <div className="flex shrink-0 items-center gap-3 sm:gap-4 md:gap-6">
                <div className="hidden sm:flex items-center gap-3">
                    <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className={`relative h-9 w-9 rounded-full ${isLight ? 'border-slate-200 bg-white text-slate-400 hover:text-emerald-500 hover:bg-slate-50' : 'border-white/5 bg-slate-900/40 text-slate-400 hover:text-emerald-500 hover:bg-slate-800/60'}`}
                        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
                    >
                        <Link href="/workspace/notifications">
                            <Bell className="h-4 w-4" />
                            {unreadCount > 0 ? (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white dark:border-slate-900">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            ) : null}
                        </Link>
                    </Button>
                    <WorkspaceThemeToggle />
                </div>
                <div className="flex items-center gap-3">
                    {organizationType === 'startup' && (
                        <Button
                            asChild
                            className="h-9 gap-2 rounded-xl bg-emerald-500 px-4 text-[11px] font-black uppercase tracking-widest text-slate-950 hover:bg-emerald-400"
                        >
                            <Link href="/workspace">
                                <Share2 className="h-3.5 w-3.5" />
                                Public Profile
                            </Link>
                        </Button>
                    )}
                    <WorkspaceUserMenu
                        displayName={displayName}
                        email={email}
                        avatarUrl={avatarUrl}
                        isLight={isLight}
                    />
                </div>
            </div>
        </header>
    )
}
