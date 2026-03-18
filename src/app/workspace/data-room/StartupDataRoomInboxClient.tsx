'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    approveDataRoomAccessRequest,
    listIncomingDataRoomAccessRequests,
    rejectDataRoomAccessRequest,
    type DataRoomAccessRequestView,
} from '@/modules/data-room/data-room.repository'

export default function StartupDataRoomInboxClient() {
    const [incoming, setIncoming] = useState<DataRoomAccessRequestView[]>([])
    const [loading, setLoading] = useState(true)

    const refresh = useCallback(() => {
        setLoading(true)
        listIncomingDataRoomAccessRequests()
            .then(setIncoming)
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    const handleApprove = useCallback(async (id: string) => {
        const res = await approveDataRoomAccessRequest({ requestId: id, permissionLevel: 'view' })
        if (res && typeof res === 'object' && 'error' in res) {
            toast.error(res.error || 'Failed to approve')
            return
        }
        toast.success('Access approved')
        refresh()
    }, [refresh])

    const handleReject = useCallback(async (id: string) => {
        const res = await rejectDataRoomAccessRequest({ requestId: id })
        if (res && typeof res === 'object' && 'error' in res) {
            toast.error(res.error || 'Failed to reject')
            return
        }
        toast.success('Request rejected')
        refresh()
    }, [refresh])

    const panelClass = 'border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/40 dark:border-slate-800 dark:bg-slate-900/70'
    const textMainClass = 'text-slate-900 dark:text-slate-100'
    const textMutedClass = 'text-slate-500 dark:text-slate-400'

    return (
        <Card className={panelClass}>
            <CardHeader>
                <CardTitle className={textMainClass}>Access requests</CardTitle>
                <CardDescription className={textMutedClass}>
                    Approve or reject investors/advisors requesting your Data Room.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className={textMutedClass}>Loading…</p>
                ) : incoming.length === 0 ? (
                    <p className={textMutedClass}>No requests right now.</p>
                ) : (
                    <ul className="space-y-2">
                        {incoming.map((r) => (
                            <li key={r.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-slate-950/40">
                                <p className={`font-bold ${textMainClass}`}>
                                    {r.requester_org_name ?? 'Organization'}{' '}
                                    <span className={`text-xs font-black uppercase tracking-widest ${textMutedClass}`}>({r.status})</span>
                                </p>
                                {r.message ? <p className={`text-sm ${textMutedClass}`}>{r.message}</p> : null}
                                <div className="mt-3 flex gap-2">
                                    <Button size="sm" className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => handleApprove(r.id)}>
                                        Approve (view)
                                    </Button>
                                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => handleReject(r.id)}>
                                        Reject
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}

