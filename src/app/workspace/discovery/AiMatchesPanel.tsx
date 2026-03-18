'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ThumbsDown, ThumbsUp, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { listAiMatches, sendAiMatchFeedback, type AiMatchView } from '@/modules/discovery/discovery.client'
import { useWorkspaceTheme } from '@/app/workspace/WorkspaceThemeContext'

export default function AiMatchesPanel() {
    const { isLight } = useWorkspaceTheme()
    const [loading, setLoading] = useState(true)
    const [matches, setMatches] = useState<AiMatchView[]>([])

    const textMain = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMuted = isLight ? 'text-slate-500' : 'text-slate-400'

    const refresh = useCallback(() => {
        setLoading(true)
        listAiMatches()
            .then(setMatches)
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    async function feedback(targetOrgId: string, kind: 'interested' | 'passed') {
        const ok = await sendAiMatchFeedback({ targetOrgId, feedbackType: kind })
        if (!ok) {
            toast.error('Failed to save feedback')
            return
        }
        toast.success('Feedback saved')
        refresh()
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className={textMain}>AI Matches</CardTitle>
                            <p className={`mt-1 text-sm ${textMuted}`}>
                                Ranked suggestions based on your profile signals. (Free tier may show none.)
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" className="rounded-xl" onClick={refresh}>Refresh</Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center gap-3 py-10">
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                            <span className={textMuted}>Loading matches…</span>
                        </div>
                    ) : matches.length === 0 ? (
                        <div className={`rounded-2xl border p-8 text-center ${isLight ? 'border-slate-200 bg-slate-50/40' : 'border-white/10 bg-slate-950/30'}`}>
                            <p className={`font-semibold ${textMain}`}>No matches yet</p>
                            <p className={`mt-1 text-sm ${textMuted}`}>Complete onboarding and try again, or upgrade to Pro/Elite.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {matches.map((m) => (
                                <div key={m.to_org_id} className={`rounded-2xl border p-5 ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-slate-950/20'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className={`text-sm font-black ${textMain}`}>Org: {m.to_org_id.slice(0, 8)}…</p>
                                            <p className={`mt-1 text-sm ${textMuted}`}>Score: {m.overall_score}%</p>
                                        </div>
                                        <Badge variant="secondary">{m.overall_score}%</Badge>
                                    </div>
                                    {m.reasons.length > 0 ? (
                                        <ul className={`mt-3 space-y-1 text-sm ${textMuted}`}>
                                            {m.reasons.slice(0, 3).map((r) => (
                                                <li key={r}>- {r}</li>
                                            ))}
                                        </ul>
                                    ) : null}
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button size="sm" className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500" onClick={() => feedback(m.to_org_id, 'interested')}>
                                            <ThumbsUp className="mr-2 h-4 w-4" />
                                            Interested
                                        </Button>
                                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => feedback(m.to_org_id, 'passed')}>
                                            <ThumbsDown className="mr-2 h-4 w-4" />
                                            Pass
                                        </Button>
                                        <Button asChild size="sm" variant="outline" className="rounded-xl">
                                            <Link href={`/workspace/discovery/${m.to_org_id}`}>
                                                View profile
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

