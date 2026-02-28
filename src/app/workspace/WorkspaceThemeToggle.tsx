'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type WorkspaceTheme = 'light' | 'dark'

const WORKSPACE_LIGHT_CLASS = 'workspace-theme-light'
const THEME_STORAGE_KEY = 'workspace-theme'

function applyWorkspaceTheme(theme: WorkspaceTheme) {
    if (typeof document === 'undefined') {
        return
    }

    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle(WORKSPACE_LIGHT_CLASS, theme === 'light')
}

function persistWorkspaceTheme(theme: WorkspaceTheme) {
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme)
        } catch {
            // Ignore storage write failures.
        }
    }

    if (typeof document !== 'undefined') {
        document.cookie = `workspace_theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`

        // Clean up legacy theme query params without triggering navigation.
        const url = new URL(window.location.href)
        if (url.searchParams.has('theme')) {
            url.searchParams.delete('theme')
            window.history.replaceState(window.history.state, '', url.toString())
        }
    }
}

function getCurrentWorkspaceTheme(): WorkspaceTheme {
    if (typeof window !== 'undefined') {
        try {
            const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
            if (stored === 'light' || stored === 'dark') {
                return stored
            }
        } catch {
            // Ignore storage read failures.
        }
    }

    if (typeof document !== 'undefined') {
        const cookieMatch = document.cookie.match(/(?:^|;\s*)workspace_theme=([^;]+)/)
        if (cookieMatch) {
            const cookieTheme = decodeURIComponent(cookieMatch[1] ?? '')
            if (cookieTheme === 'light' || cookieTheme === 'dark') {
                return cookieTheme
            }
        }

        if (document.documentElement.classList.contains(WORKSPACE_LIGHT_CLASS)) {
            return 'light'
        }
    }

    return 'dark'
}

function subscribeHydrationState(): () => void {
    return () => { }
}

function getHydrationSnapshot(): boolean {
    return true
}

function getHydrationServerSnapshot(): boolean {
    return false
}

export default function WorkspaceThemeToggle({ className }: { className?: string }) {
    const hydrated = useSyncExternalStore(
        subscribeHydrationState,
        getHydrationSnapshot,
        getHydrationServerSnapshot
    )
    const router = useRouter()
    const [theme, setTheme] = useState<WorkspaceTheme>(() => getCurrentWorkspaceTheme())

    useEffect(() => {
        if (hydrated) {
            applyWorkspaceTheme(theme)
        }
    }, [theme, hydrated])

    function handleThemeChange(nextTheme: WorkspaceTheme) {
        applyWorkspaceTheme(nextTheme)
        persistWorkspaceTheme(nextTheme)
        setTheme(nextTheme)
        router.refresh()
    }

    if (!hydrated) {
        return <div className={cn('flex items-center justify-center h-9 w-9', className)} />
    }

    const nextTheme: WorkspaceTheme = theme === 'light' ? 'dark' : 'light'
    const isLight = theme === 'light'
    const toggleLabel = isLight ? 'Switch to dark mode' : 'Switch to light mode'

    return (
        <div className={cn('flex items-center gap-1.5 rounded-full border p-1.5',
            isLight ? 'border-slate-200 bg-slate-100/50' : 'border-white/5 bg-slate-950/40',
            className
        )}>
            <button
                type="button"
                onClick={() => theme !== 'light' && handleThemeChange('light')}
                className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300',
                    isLight
                        ? 'bg-blue-600 shadow-lg shadow-blue-500/25 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                )}
                aria-label="Switch to light mode"
            >
                <Sun className="h-3.5 w-3.5" />
            </button>
            <button
                type="button"
                onClick={() => theme !== 'dark' && handleThemeChange('dark')}
                className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300',
                    !isLight
                        ? 'bg-blue-600 shadow-lg shadow-blue-500/25 text-white'
                        : 'text-slate-400 hover:text-slate-600'
                )}
                aria-label="Switch to dark mode"
            >
                <Moon className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}
