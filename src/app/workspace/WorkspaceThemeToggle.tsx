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
        <div className={cn('flex items-center', className)}>
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleThemeChange(nextTheme)}
                className={cn(
                    'rounded-full shadow-sm transition-all duration-300',
                    isLight
                        ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:shadow-md'
                        : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:shadow-md hover:shadow-emerald-500/10'
                )}
                data-workspace-theme-toggle={theme}
                aria-label={toggleLabel}
                title={toggleLabel}
            >
                <span className="relative inline-flex h-4 w-4 items-center justify-center transition-transform duration-300">
                    <Sun
                        className={cn(
                            'absolute h-4 w-4 transition-all duration-300',
                            isLight ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                        )}
                    />
                    <Moon
                        className={cn(
                            'absolute h-4 w-4 transition-all duration-300',
                            isLight ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
                        )}
                    />
                </span>
            </Button>
        </div>
    )
}
