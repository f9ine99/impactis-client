'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkspaceTheme } from '@/app/workspace/WorkspaceThemeContext'
import { cn } from '@/lib/utils'
import { listDealRooms, type DealRoomView } from '@/modules/deal-room/deal-room.repository'

export default function WorkspaceDealRoomIndexPage() {
    const { isLight } = useWorkspaceTheme()
    const [loading, setLoading] = useState(true)
    const [rooms, setRooms] = useState<DealRoomView[]>([])

    useEffect(() => {
        setLoading(true)
        listDealRooms()
            .then(setRooms)
            .finally(() => setLoading(false))
    }, [])

    const panelClass = isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-white/10 bg-slate-900/80'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className={textMutedClass}>Loading deal rooms…</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-6 max-w-3xl mx-auto">
            <div>
                <h1 className={cn('text-2xl font-black tracking-tight', textMainClass)}>
                    Deal Room
                </h1>
                <p className={cn('text-sm mt-1', textMutedClass)}>
                    Chat, update stages, and track progress with your investors and founders.
                </p>
            </div>

            {rooms.length === 0 ? (
                <div className={cn('rounded-2xl border p-8 text-center', panelClass)}>
                    <MessageCircle className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className={cn('mt-3 font-semibold', textMainClass)}>No deal rooms yet</p>
                    <p className={cn('mt-1 text-sm', textMutedClass)}>
                        Start a deal discussion from Discovery, or accept one in Notifications.
                    </p>
                    <Button asChild className="mt-4 rounded-xl">
                        <Link href="/workspace/discovery">Go to Discovery</Link>
                    </Button>
                </div>
            ) : (
                <ul className="space-y-2">
                    {rooms.map((r) => (
                        <li key={r.id} className={cn('rounded-xl border p-4', panelClass)}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className={cn('font-bold', textMainClass)}>{r.other_org_name}</p>
                                    <p className={cn('text-xs mt-0.5', textMutedClass)}>
                                        Stage: {String(r.stage).replace(/_/g, ' ')}
                                    </p>
                                </div>
                                <Button asChild size="sm" className="rounded-lg">
                                    <Link href={`/workspace/deal-room/${encodeURIComponent(r.id)}`}>Open</Link>
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

