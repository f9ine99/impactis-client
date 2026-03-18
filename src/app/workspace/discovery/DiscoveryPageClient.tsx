'use client'

import { useEffect, useState } from 'react'
import DiscoveryFeedPanel from './DiscoveryFeedPanel'
import type { UnifiedDiscoveryCard } from '@/modules/workspace/types'
import { getBetterAuthTokenClient } from '@/lib/better-auth-token-client'
import { apiFetchJson, formatMissingChecklist, isReadinessBlockedPayload } from '@/modules/onboarding/readiness'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AiMatchesPanel from './AiMatchesPanel'

type ViewerOrgType = 'startup' | 'investor' | 'advisor'

type Props = {
    viewerOrgId: string
    viewerOrgType: ViewerOrgType
    initialFeed?: UnifiedDiscoveryCard[]
}

export default function DiscoveryPageClient({ viewerOrgId, viewerOrgType, initialFeed = [] }: Props) {
    const [feed, setFeed] = useState<UnifiedDiscoveryCard[]>(initialFeed)
    const [blocked, setBlocked] = useState<{ missing: string[]; score: number | null } | null>(null)

    useEffect(() => {
        let cancelled = false
        async function load() {
            try {
                const accessToken = await getBetterAuthTokenClient()
                if (!accessToken) return
                const res = await apiFetchJson<unknown[]>({
                    path: '/workspace/discovery/feed',
                    method: 'GET',
                    accessToken,
                })
                if (!cancelled) {
                    if (!res.ok && isReadinessBlockedPayload(res.data)) {
                        const missing = formatMissingChecklist(res.data.missing)
                        const score = typeof res.data.score === 'number' ? res.data.score : null
                        setBlocked({ missing, score })
                        return
                    }
                    if (Array.isArray(res.data)) {
                        setBlocked(null)
                        setFeed(res.data as UnifiedDiscoveryCard[])
                    }
                }
            } catch {
                // keep current feed on errors
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [])

    if (blocked) {
        return (
            <div className="p-6 max-w-3xl mx-auto">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <h2 className="text-lg font-black text-amber-900">
                        Discovery is locked until onboarding is complete{blocked.score !== null ? ` (Score: ${blocked.score}%)` : ''}.
                    </h2>
                    {blocked.missing.length > 0 ? (
                        <p className="mt-2 text-sm text-amber-800">
                            Missing: {blocked.missing.slice(0, 8).join(', ')}
                            {blocked.missing.length > 8 ? ` (+${blocked.missing.length - 8} more)` : ''}
                        </p>
                    ) : (
                        <p className="mt-2 text-sm text-amber-800">
                            Please complete onboarding Step 1 and your profile.
                        </p>
                    )}
                    <a
                        href="/onboarding/questions"
                        className="inline-flex mt-4 rounded-xl bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800"
                    >
                        Continue onboarding
                    </a>
                </div>
            </div>
        )
    }

    return (
        <Tabs defaultValue="feed">
            <TabsList>
                <TabsTrigger value="feed">Feed</TabsTrigger>
                <TabsTrigger value="matches">AI Matches</TabsTrigger>
            </TabsList>
            <TabsContent value="feed">
                <DiscoveryFeedPanel feed={feed} viewerOrgId={viewerOrgId} viewerOrgType={viewerOrgType} />
            </TabsContent>
            <TabsContent value="matches">
                <AiMatchesPanel />
            </TabsContent>
        </Tabs>
    )
}

