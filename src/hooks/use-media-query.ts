'use client'

import { useEffect, useState } from 'react'

/**
 * Match a CSS media query string (e.g. "(min-width: 768px)").
 * Returns true when the query matches, false otherwise.
 * Safe for SSR: returns false until mounted.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const mql = window.matchMedia(query)
        setMatches(mql.matches)
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [query])

    return matches
}
