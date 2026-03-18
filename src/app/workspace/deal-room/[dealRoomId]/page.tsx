'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWorkspaceTheme } from '@/app/workspace/WorkspaceThemeContext'
import { cn } from '@/lib/utils'
import {
    getDealRoomDetails,
    listDealRoomMessages,
    sendDealRoomMessage,
    updateDealRoomStage,
    type DealRoomMessageView,
    type DealRoomParticipantView,
    type DealRoomView,
} from '@/modules/deal-room/deal-room.repository'

const STAGES = ['interest', 'due_diligence', 'negotiation', 'commitment', 'closing', 'closed'] as const

export default function DealRoomPage() {
    const { isLight } = useWorkspaceTheme()
    const params = useParams()
    const dealRoomId = typeof params?.dealRoomId === 'string' ? params.dealRoomId : ''

    const [loading, setLoading] = useState(true)
    const [room, setRoom] = useState<DealRoomView | null>(null)
    const [participants, setParticipants] = useState<DealRoomParticipantView[]>([])
    const [messages, setMessages] = useState<DealRoomMessageView[]>([])
    const [messageBody, setMessageBody] = useState('')
    const [sending, setSending] = useState(false)
    const [stageUpdating, setStageUpdating] = useState(false)

    const panelClass = isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-white/10 bg-slate-900/80'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'

    const refresh = useCallback(async () => {
        if (!dealRoomId) return
        setLoading(true)
        const [details, msgs] = await Promise.all([
            getDealRoomDetails(dealRoomId),
            listDealRoomMessages(dealRoomId),
        ])
        if (details && typeof details === 'object' && 'error' in details) {
            toast.error(details.error || 'Failed to load deal room')
            setRoom(null)
            setParticipants([])
        } else {
            setRoom((details as any).room)
            setParticipants((details as any).participants ?? [])
        }
        if (msgs && typeof msgs === 'object' && 'error' in msgs) {
            toast.error(msgs.error || 'Failed to load messages')
            setMessages([])
        } else {
            setMessages(Array.isArray(msgs) ? (msgs as any) : [])
        }
        setLoading(false)
    }, [dealRoomId])

    useEffect(() => {
        refresh()
    }, [refresh])

    const handleSend = useCallback(async () => {
        const body = messageBody.trim()
        if (!body || !dealRoomId) return
        setSending(true)
        const res = await sendDealRoomMessage(dealRoomId, body)
        setSending(false)
        if (res && typeof res === 'object' && 'error' in res) {
            toast.error(res.error || 'Failed to send')
            return
        }
        setMessageBody('')
        setMessages((prev) => [...prev, res as any])
    }, [dealRoomId, messageBody])

    const handleStageChange = useCallback(async (stage: string) => {
        if (!dealRoomId) return
        setStageUpdating(true)
        const res = await updateDealRoomStage(dealRoomId, stage)
        setStageUpdating(false)
        if (res && typeof res === 'object' && 'error' in res) {
            toast.error(res.error || 'Failed to update stage')
            return
        }
        toast.success('Stage updated')
        refresh()
    }, [dealRoomId, refresh])

    if (!dealRoomId) {
        return (
            <div className="p-6">
                <p className={textMutedClass}>Invalid deal room.</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className={textMutedClass}>Loading deal room…</p>
            </div>
        )
    }

    if (!room) {
        return (
            <div className="p-6 max-w-3xl mx-auto space-y-4">
                <Button variant="ghost" size="icon" asChild className="rounded-xl">
                    <Link href="/workspace/deal-room">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <p className={textMutedClass}>Deal room not found or you don’t have access.</p>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="rounded-xl">
                    <Link href="/workspace/deal-room">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="min-w-0">
                    <h1 className={cn('text-2xl font-black tracking-tight', textMainClass)}>{room.other_org_name}</h1>
                    <p className={cn('text-xs mt-0.5', textMutedClass)}>
                        Stage: {String(room.stage).replace(/_/g, ' ')}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className={cn('rounded-2xl border p-4 md:col-span-2', panelClass)}>
                    <div className="flex items-center justify-between">
                        <p className={cn('text-sm font-black uppercase tracking-widest', textMutedClass)}>Discussion</p>
                    </div>
                    <div className="mt-3 h-[420px] overflow-y-auto space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-slate-950/40">
                        {messages.length === 0 ? (
                            <p className={textMutedClass}>No messages yet.</p>
                        ) : (
                            messages.map((m) => (
                                <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/60">
                                    <p className={cn('text-xs font-bold', textMutedClass)}>{m.sender_email ?? m.sender_user_id}</p>
                                    <p className={cn('mt-1', textMainClass)}>{m.body}</p>
                                    <p className={cn('mt-1 text-[11px]', textMutedClass)}>{new Date(m.created_at).toLocaleString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-3 flex gap-2">
                        <Input
                            value={messageBody}
                            onChange={(e) => setMessageBody(e.target.value)}
                            placeholder="Message…"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                        />
                        <Button onClick={handleSend} disabled={sending || messageBody.trim().length === 0} className="rounded-xl gap-2">
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Send
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className={cn('rounded-2xl border p-4', panelClass)}>
                        <p className={cn('text-sm font-black uppercase tracking-widest', textMutedClass)}>Participants</p>
                        <ul className="mt-3 space-y-2">
                            {participants.map((p) => (
                                <li key={p.id} className={cn('rounded-xl border p-3', isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-slate-950/40')}>
                                    <p className={cn('font-bold', textMainClass)}>{p.org_name}</p>
                                    <p className={cn('text-xs', textMutedClass)}>{p.role.replace(/_/g, ' ')}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={cn('rounded-2xl border p-4', panelClass)}>
                        <p className={cn('text-sm font-black uppercase tracking-widest', textMutedClass)}>Deal Stage</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            {STAGES.map((s) => (
                                <Button
                                    key={s}
                                    size="sm"
                                    variant={room.stage === s ? 'default' : 'outline'}
                                    className="rounded-lg justify-start"
                                    disabled={stageUpdating}
                                    onClick={() => handleStageChange(s)}
                                >
                                    {String(s).replace(/_/g, ' ')}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

