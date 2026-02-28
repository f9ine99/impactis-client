'use client'

import { useSyncExternalStore } from 'react'

/**
 * Match a CSS media query string (e.g. "(min-width: 768px)").
 * Returns true when the query matches, false otherwise.
 * Safe for SSR: returns false until mounted.
 */
export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (callback) => {
            if (typeof window === 'undefined') return () => { }
            const mql = window.matchMedia(query)
            mql.addEventListener('change', callback)
            return () => mql.removeEventListener('change', callback)
        },
        () => {
            if (typeof window === 'undefined') return false
            return window.matchMedia(query).matches
        },
        () => false
    )
}
