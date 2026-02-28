'use client'

import { useMemo, useState } from 'react'
import {
    ArrowRight,
    Bookmark,
    MapPin,
    Search,
    X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { StartupDiscoveryFeedItem } from '@/modules/startups'

type StartupDiscoveryFeedPanelProps = {
    currentOrgId: string
    feed: StartupDiscoveryFeedItem[]
    isLight: boolean
    cardClassName: string
    mutedCardClassName: string
    textMainClassName: string
    textMutedClassName: string
}

const PAGE_SIZE = 6

function normalizeToken(value: string): string {
    return value.trim().toLowerCase()
}

function formatRelative(value: string | null): string {
    if (!value) {
        return 'Updated recently'
    }

    const parsed = Date.parse(value)
    if (Number.isNaN(parsed)) {
        return 'Updated recently'
    }

    const diffMs = Date.now() - parsed
    if (diffMs <= 0) {
        return 'Updated just now'
    }

    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diffMs < hour) {
        const minutes = Math.max(1, Math.floor(diffMs / minute))
        return `Updated ${minutes}m ago`
    }

    if (diffMs < day) {
        const hours = Math.max(1, Math.floor(diffMs / hour))
        return `Updated ${hours}h ago`
    }

    const days = Math.max(1, Math.floor(diffMs / day))
    return `Updated ${days}d ago`
}

function truncateText(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
        return value
    }

    return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

export default function StartupDiscoveryFeedPanel(input: StartupDiscoveryFeedPanelProps) {
    const [query, setQuery] = useState('')
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

    const sourceFeed = useMemo(
        () => input.feed.filter((item) => item.startup_org_id !== input.currentOrgId),
        [input.feed, input.currentOrgId]
    )

    const filteredFeed = useMemo(() => {
        const normalizedQuery = normalizeToken(query)

        return sourceFeed.filter((item) => {
            if (!normalizedQuery) {
                return true
            }

            const searchable = [
                item.startup_org_name,
                item.title,
                item.summary,
                item.stage ?? '',
                item.location ?? '',
                ...item.industry_tags,
            ].join(' ').toLowerCase()

            return searchable.includes(normalizedQuery)
        })
    }, [query, sourceFeed])

    const visibleFeed = filteredFeed.slice(0, visibleCount)
    const hasMore = visibleCount < filteredFeed.length

    const searchFieldClass = input.isLight
        ? 'border-slate-200/90 bg-white/90 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.55)]'
        : 'border-slate-700/70 bg-slate-900/65 shadow-[0_16px_32px_-24px_rgba(2,6,23,0.95)]'
    const searchInputClass = input.isLight
        ? 'text-slate-900 placeholder:text-slate-400'
        : 'text-slate-100 placeholder:text-slate-500'
    const searchIconClass = input.isLight
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-emerald-500/10 text-emerald-400'
    const searchHintClass = input.isLight
        ? 'border-slate-200 bg-slate-100 text-slate-500'
        : 'border-slate-700 bg-slate-800 text-slate-400'
    const clearButtonClass = input.isLight
        ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
        : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'

    function resetAllFilters() {
        setQuery('')
        setVisibleCount(PAGE_SIZE)
    }

    function onQueryChange(value: string) {
        setQuery(value)
        setVisibleCount(PAGE_SIZE)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className={`group relative flex h-12 items-center gap-3 rounded-2xl border px-3 transition-all duration-200 focus-within:-translate-y-0.5 focus-within:border-emerald-500/60 focus-within:ring-4 focus-within:ring-emerald-500/10 ${searchFieldClass}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${searchIconClass}`}>
                    <Search className="h-4 w-4" />
                </div>
                <input
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="Search startups or keywords..."
                    aria-label="Search startups"
                    className={`w-full bg-transparent text-sm font-semibold outline-none ${searchInputClass}`}
                />
                {query ? (
                    <button
                        type="button"
                        onClick={() => onQueryChange('')}
                        aria-label="Clear search"
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${clearButtonClass}`}
                    >
                        <X className="h-4 w-4" />
                    </button>
                ) : null}
                <kbd className={`hidden select-none rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide md:inline-flex ${searchHintClass}`}>
                    /
                </kbd>
            </div>

            {/* Visual Bento Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {visibleFeed.map((item, index) => {
                    // Mock "Signal Strength" based on index or name length for visual effect
                    const signalLevel = ((item.startup_org_name.length * 7) % 30) + 70;
                    const signalColor = signalLevel > 85 ? 'text-emerald-500' : 'text-blue-500';
                    const signalBg = signalLevel > 85 ? 'bg-emerald-500' : 'bg-blue-500';

                    return (
                        <div
                            key={item.id}
                            className={`group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white p-2 transition-all hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5 dark:border-slate-800/60 dark:bg-slate-900/60 ws-fade-in-d${Math.min(index + 1, 4)}`}
                        >
                            <div className="relative h-40 w-full overflow-hidden rounded-[2rem] bg-slate-50 dark:bg-slate-950">
                                {/* Decorative Background Pattern */}
                                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                                    style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '24px 24px' }}
                                />

                                {/* Top Content Over Image/Background */}
                                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                                    <Badge className="bg-white/80 dark:bg-black/50 backdrop-blur-md border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                                        {item.stage || 'Seed'}
                                    </Badge>
                                    <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md text-slate-400 hover:text-emerald-500 transition-colors">
                                        <Bookmark className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Brand Avatar */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-white to-slate-50 text-3xl font-black text-emerald-600 shadow-xl dark:from-slate-800 dark:to-slate-900 ring-4 ring-white/50 dark:ring-slate-800/50">
                                        {item.startup_org_name.slice(0, 1).toUpperCase()}
                                    </div>
                                </div>

                                {/* Bottom Info Over Image */}
                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <div className="flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md px-2.5 py-1 w-fit">
                                        <MapPin className="h-3 w-3 text-emerald-500" />
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{item.location || 'Global'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col p-6 pt-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className={`text-xl font-black tracking-tight ${input.textMainClassName} group-hover:text-emerald-500 transition-colors`}>
                                            {item.startup_org_name}
                                        </h3>
                                        {item.startup_verification_status === 'approved' && (
                                            <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">Verified Partner</p>
                                        )}
                                    </div>
                                </div>

                                <p className={`mt-4 text-sm font-medium leading-relaxed line-clamp-2 ${input.textMutedClassName}`}>
                                    {item.summary}
                                </p>

                                {/* Signal Strength Visualizer */}
                                <div className="mt-6 space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                                        <span>Signal Strength</span>
                                        <span className={signalColor}>{signalLevel}%</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className={`h-full rounded-full ${signalBg} transition-all duration-1000 ws-fade-in`}
                                            style={{ width: `${signalLevel}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-6">
                                    <div className="flex gap-1.5">
                                        {item.industry_tags.slice(0, 1).map(tag => (
                                            <span key={tag} className="text-[10px] font-bold text-slate-400">#{tag.toLowerCase()}</span>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="h-auto p-0 text-xs font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 hover:bg-transparent no-underline"
                                    >
                                        Explore <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Optional "Add New" or Empty State logic could go here */}
            </div>

            {hasMore ? (
                <div className="flex justify-center pt-8">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="h-14 gap-4 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 px-10 text-xs font-black uppercase tracking-[0.25em] transition-all hover:border-emerald-500 hover:bg-emerald-500 hover:text-white dark:hover:text-slate-900"
                        onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}
                    >
                        Load More Signals
                    </Button>
                </div>
            ) : visibleFeed.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-slate-200 p-20 dark:border-slate-800">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 dark:bg-slate-900">
                        <Search className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="mt-6 text-base font-bold text-slate-500">No matching pipelines found</p>
                    <button onClick={resetAllFilters} className="mt-2 text-xs font-black uppercase tracking-widest text-emerald-500">Reset Filters</button>
                </div>
            ) : null}
        </div>
    )
}
