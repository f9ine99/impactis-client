'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Bot, Loader2, Send, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWorkspaceTheme } from '@/app/workspace/WorkspaceThemeContext'
import { cn } from '@/lib/utils'
import { isUuid } from '@/lib/uuid'
import {
    analyzeDealRoom,
    completeDealRoomMilestone,
    createDealRoomAgreement,
    createDealRoomMilestone,
    getDealRoomDetails,
    linkDealRoomDataRoom,
    listDealRoomAgreements,
    listDealRoomMessages,
    listDealRoomMilestones,
    sendDealRoomMessage,
    signDealRoomAgreement,
    updateDealRoomStage,
    inviteDealRoomParticipant,
    type DealRoomAiAnalysis,
    type DealRoomAgreementRow,
    type DealRoomMessageView,
    type DealRoomMilestoneRow,
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
    const [agreements, setAgreements] = useState<DealRoomAgreementRow[]>([])
    const [milestones, setMilestones] = useState<DealRoomMilestoneRow[]>([])
    const [agreementTitle, setAgreementTitle] = useState('')
    const [milestoneTitle, setMilestoneTitle] = useState('')
    const [linkStartupOrgId, setLinkStartupOrgId] = useState('')
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [inviteOrgId, setInviteOrgId] = useState('')
    const [aiAnalysis, setAiAnalysis] = useState<DealRoomAiAnalysis | null>(null)
    const [aiAnalyzing, setAiAnalyzing] = useState(false)
    const seededDataRoomLink = useRef(false)

    const panelClass = isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-white/10 bg-slate-900/80'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'

    const refresh = useCallback(async () => {
        if (!dealRoomId) return
        setLoading(true)
        const [details, msgs, ag, ms] = await Promise.all([
            getDealRoomDetails(dealRoomId),
            listDealRoomMessages(dealRoomId),
            listDealRoomAgreements(dealRoomId),
            listDealRoomMilestones(dealRoomId),
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
        if (ag && typeof ag === 'object' && 'error' in ag) {
            setAgreements([])
        } else {
            setAgreements(Array.isArray(ag) ? ag : [])
        }
        if (ms && typeof ms === 'object' && 'error' in ms) {
            setMilestones([])
        } else {
            setMilestones(Array.isArray(ms) ? ms : [])
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

    const handleAiAnalyze = useCallback(async () => {
        if (!dealRoomId) return
        setAiAnalyzing(true)
        const res = await analyzeDealRoom(dealRoomId)
        setAiAnalyzing(false)
        if (res && 'error' in res) {
            toast.error((res as any).error || 'AI analysis failed')
            return
        }
        setAiAnalysis(res as DealRoomAiAnalysis)
        toast.success('AI analysis complete')
    }, [dealRoomId])

    const startupOrgIdGuess = useMemo(() => {
        const founder = participants.find((p) => p.role.toLowerCase().includes('startup'))
        return founder?.org_id ?? ''
    }, [participants])

    useEffect(() => {
        if (!seededDataRoomLink.current && startupOrgIdGuess) {
            setLinkStartupOrgId(startupOrgIdGuess)
            seededDataRoomLink.current = true
        }
    }, [startupOrgIdGuess])

    const hasSignedAgreement = useMemo(
        () => agreements.some((a) => a.status === 'signed' || a.status === 'executed'),
        [agreements]
    )

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
                <Button type="button" variant="ghost" size="icon" asChild className="rounded-xl">
                    <Link href="/workspace/deal-room">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <p className={textMutedClass}>Deal room not found or you don’t have access.</p>
            </div>
        )
    }

    return (
        <>
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" size="icon" asChild className="rounded-xl">
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

            <div className={cn('rounded-2xl border p-4', panelClass)}>
                <p className={cn('text-sm font-black uppercase tracking-widest', textMutedClass)}>Deal lifecycle (v3)</p>
                <ul className={cn('mt-2 list-inside list-disc space-y-1 text-sm', textMainClass)}>
                    <li>After alignment in chat, record an agreement and sign it.</li>
                    <li>Move stage to <strong>due diligence</strong> when you begin formal DD (unlocks Data Room workflow per platform rules).</li>
                    <li>
                        Investors (Elite): request Data Room access from the startup — open{' '}
                        <Link className="text-emerald-600 underline hover:text-emerald-700" href="/workspace/data-room">
                            Data Room
                        </Link>
                        .
                    </li>
                    <li>Track checkpoints with milestones; close the deal by setting stage to closed when finished.</li>
                </ul>
                {hasSignedAgreement && room.stage === 'interest' ? (
                    <p className={cn('mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100')}>
                        Agreement signed — consider advancing the stage to <strong>due diligence</strong> using the panel on the right, then proceed with Data Room access if applicable.
                    </p>
                ) : null}
            </div>

            
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: Chat */}
                <div className={cn('rounded-2xl border p-4 lg:col-span-1 flex flex-col', panelClass)}>
                    <div className="flex items-center justify-between">
                        <p className={cn('text-sm font-black uppercase tracking-widest', textMutedClass)}>Discussion</p>
                    </div>
                    <div className="mt-3 flex-1 min-h-[420px] overflow-y-auto space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-slate-950/40">
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
                    <div className="mt-4 shrink-0 flex gap-2">
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
                        <Button type="button" onClick={handleSend} disabled={sending || messageBody.trim().length === 0} className="rounded-xl gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* Right Side: 2 Columns */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* Row 1: Deal Details & Syndicate Panel */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Deal Details */}
                        <div className={cn('rounded-2xl border p-4 flex flex-col', panelClass, isLight ? 'bg-slate-50/50' : 'bg-slate-900/40')}>
                            <div className="flex items-center justify-between mb-4">
                                <p className={cn('text-sm font-black uppercase tracking-widest', textMutedClass)}>Deal Details</p>
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className={cn('text-[10px] uppercase font-bold tracking-widest', textMutedClass)}>Target Investment</p>
                                        <p className={cn('text-base font-black mt-1', textMainClass)}>
                                            {room.target_amount ? '$' + Number(room.target_amount).toLocaleString() : 'TBD'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={cn('text-[10px] uppercase font-bold tracking-widest', textMutedClass)}>Committed</p>
                                        <p className={cn('text-base font-black mt-1 text-emerald-600 dark:text-emerald-500')}>
                                            {room.committed_total ? '$' + Number(room.committed_total).toLocaleString() : '$0'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={cn('text-[10px] uppercase font-bold tracking-widest', textMutedClass)}>Equity</p>
                                        <p className={cn('text-sm font-semibold mt-1', textMainClass)}>TBD</p>
                                    </div>
                                    <div>
                                        <p className={cn('text-[10px] uppercase font-bold tracking-widest', textMutedClass)}>Valuation</p>
                                        <p className={cn('text-sm font-semibold mt-1', textMainClass)}>TBD</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className={cn('text-[10px] uppercase font-bold tracking-widest', textMutedClass)}>Timeline</p>
                                        <p className={cn('text-sm font-semibold mt-1', textMainClass)}>{new Date(room.created_at).toLocaleDateString()} — {room.closed_at ? new Date(room.closed_at).toLocaleDateString() : 'Ongoing'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Syndicate Panel (Participants) */}
                        <div className={cn('rounded-2xl border p-4 flex flex-col', panelClass)}>
                            <p className={cn('text-sm font-black uppercase tracking-widest', textMutedClass)}>Syndicate Panel</p>
                            <ul className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[220px]">
                                {participants.map((p) => (
                                    <li key={p.id} className={cn('rounded-xl border p-3 flex items-center justify-between', isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-slate-950/40')}>
                                        <div className="min-w-0">
                                            <p className={cn('font-bold text-sm truncate', textMainClass)}>{p.org_name}</p>
                                            <p className={cn('text-[10px] font-black uppercase tracking-widest mt-0.5 text-emerald-600 dark:text-emerald-500')}>{p.role.replace(/_/g, ' ')}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                                <Button variant="outline" className="w-full rounded-xl text-xs font-bold shadow-sm">
                                    + Invite Co-Investor
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Milestones & Agreements */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Milestones */}
                        <div className={cn('rounded-2xl border p-4 flex flex-col', panelClass)}>
                            <p className={cn('text-sm font-black uppercase tracking-widest', textMutedClass)}>Milestones</p>
                            <ul className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[200px]">
                                {milestones.length === 0 ? (
                                    <li className={cn('text-xs', textMutedClass)}>No milestones yet.</li>
                                ) : (
                                    milestones.map((m) => (
                                        <li
                                            key={m.id}
                                            className={cn('flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 text-sm', isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-slate-900/50')}
                                        >
                                            <span className={cn(textMainClass, m.completed_at ? 'line-through opacity-70' : '')}>
                                                {m.title}
                                            </span>
                                            {!m.completed_at ? (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                                                    onClick={async () => {
                                                        const res = await completeDealRoomMilestone(dealRoomId, m.id)
                                                        if (res && 'error' in res) toast.error(res.error)
                                                        else {
                                                            toast.success('Marked complete')
                                                            refresh()
                                                        }
                                                    }}
                                                >
                                                    Complete
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 pr-2">Done</span>
                                            )}
                                        </li>
                                    ))
                                )}
                            </ul>
                            <div className="mt-4 flex gap-2">
                                <Input
                                    value={milestoneTitle}
                                    onChange={(e) => setMilestoneTitle(e.target.value)}
                                    placeholder="New milestone..."
                                    className="rounded-lg h-9 text-xs"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            const t = milestoneTitle.trim()
                                            if (!t) return
                                            createDealRoomMilestone(dealRoomId, t).then(res => {
                                                if (res && 'error' in res) toast.error(res.error)
                                                else { toast.success('Added'); setMilestoneTitle(''); refresh() }
                                            })
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    className="h-9 shrink-0 rounded-lg bg-emerald-600 px-3 text-white text-xs font-bold shadow-sm"
                                    onClick={async () => {
                                        const t = milestoneTitle.trim()
                                        if (!t) return
                                        const res = await createDealRoomMilestone(dealRoomId, t)
                                        if (res && 'error' in res) toast.error(res.error)
                                        else {
                                            toast.success('Added')
                                            setMilestoneTitle('')
                                            refresh()
                                        }
                                    }}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>

                        {/* Agreements */}
                        <div className={cn('rounded-2xl border p-4 flex flex-col', panelClass)}>
                            <p className={cn('text-sm font-black uppercase tracking-widest', textMutedClass)}>Agreements</p>
                            <ul className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[200px]">
                                {agreements.length === 0 ? (
                                    <li className={cn('text-xs', textMutedClass)}>No agreements yet.</li>
                                ) : (
                                    agreements.map((a) => (
                                        <li
                                            key={a.id}
                                            className={cn('flex flex-col gap-2 rounded-lg border p-3 text-sm', isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-slate-900/50')}
                                        >
                                            <div className="flex justify-between items-start">
                                                <Link href={`/workspace/deal-room/${dealRoomId}/agreements/${a.id}`} className={cn('font-semibold hover:underline', textMainClass)}>{a.title}</Link>
                                                <span className={cn('text-[9px] uppercase font-black px-2 py-0.5 rounded-full tracking-widest', 
                                                    a.status === 'draft' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' 
                                                  : a.status === 'review' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                )}>
                                                    {a.status}
                                                </span>
                                            </div>
                                            {(a.status === 'draft' || a.status === 'review') ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="mt-1 h-8 w-full rounded-md text-xs font-bold"
                                                    onClick={async () => {
                                                        const res = await signDealRoomAgreement(dealRoomId, a.id)
                                                        if (res && 'error' in res) toast.error(res.error)
                                                        else {
                                                            toast.success('Signed')
                                                            refresh()
                                                        }
                                                    }}
                                                >
                                                    Sign Agreement
                                                </Button>
                                            ) : null}
                                        </li>
                                    ))
                                )}
                            </ul>
                            <div className="mt-4 flex gap-2">
                                <Input
                                    value={agreementTitle}
                                    onChange={(e) => setAgreementTitle(e.target.value)}
                                    placeholder="Draft agreement..."
                                    className="rounded-lg h-9 text-xs"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            const t = agreementTitle.trim()
                                            if (!t) return
                                            createDealRoomAgreement(dealRoomId, t).then(res => {
                                                if (res && 'error' in res) toast.error(res.error)
                                                else { toast.success('Added'); setAgreementTitle(''); refresh() }
                                            })
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    className="h-9 shrink-0 rounded-lg bg-emerald-600 px-3 text-white text-xs font-bold shadow-sm"
                                    onClick={async () => {
                                        const t = agreementTitle.trim()
                                        if (!t) return
                                        const res = await createDealRoomAgreement(dealRoomId, t)
                                        if (res && 'error' in res) toast.error(res.error)
                                        else {
                                            toast.success('Added')
                                            setAgreementTitle('')
                                            refresh()
                                        }
                                    }}
                                >
                                    Draft
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Deal Stage & Data Room Link */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Data Room Link */}
                        <div className={cn('rounded-2xl border p-5 flex flex-col justify-center', panelClass, isLight ? 'bg-gradient-to-br from-white to-slate-50' : 'bg-gradient-to-br from-slate-900 to-slate-950')}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                                <p className={cn('text-sm font-black uppercase tracking-widest', textMainClass)}>Data Room Access</p>
                            </div>
                            <p className={cn('text-xs mb-4 leading-relaxed', textMutedClass)}>
                                Elite investors can access confidential diligence folders and verified assets linked to this deal.
                            </p>
                            
                            <div className="flex gap-2">
                                <Button asChild className="w-full rounded-xl gap-2 font-bold shadow-sm bg-indigo-600 text-white hover:bg-indigo-700">
                                    <Link href={linkStartupOrgId ? `/workspace/data-room?startupId=${linkStartupOrgId}` : '/workspace/data-room'}>
                                        Open Data Room
                                    </Link>
                                </Button>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                                <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-2', textMutedClass)}>Link to Startup ID</p>
                                <div className="flex gap-2">
                                    <Input
                                        className="rounded-lg font-mono text-xs h-9 bg-white/50 dark:bg-black/20"
                                        value={linkStartupOrgId}
                                        onChange={(e) => setLinkStartupOrgId(e.target.value)}
                                        placeholder="Startup UUID"
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="h-9 px-3 rounded-lg text-xs font-bold"
                                        onClick={async () => {
                                            const id = linkStartupOrgId.trim()
                                            if (!id) {
                                                toast.error('Startup org UUID required')
                                                return
                                            }
                                            if (!isUuid(id)) {
                                                toast.error('Invalid format', { description: 'Startup org ID must be a valid UUID' })
                                                return
                                            }
                                            const res = await linkDealRoomDataRoom(dealRoomId, id)
                                            if (res && 'error' in res) toast.error(res.error)
                                            else {
                                                toast.success('Linked')
                                            }
                                        }}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Deal Stage Management */}
                        <div className={cn('rounded-2xl border p-5', panelClass)}>
                            <p className={cn('text-sm font-black uppercase tracking-widest mb-4', textMutedClass)}>Deal Stage</p>
                            <div className="grid grid-cols-2 gap-3">
                                {STAGES.map((s) => (
                                    <Button
                                        key={s}
                                        type="button"
                                        size="sm"
                                        variant={room.stage === s ? 'default' : 'outline'}
                                        className={cn(
                                            "rounded-xl justify-start h-10 text-[11px] font-bold tracking-wide uppercase shadow-sm transition-all",
                                            room.stage === s ? "ring-2 ring-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white border-0" : ""
                                        )}
                                        disabled={stageUpdating}
                                        onClick={() => handleStageChange(s)}
                                    >
                                        {String(s).replace(/_/g, ' ')}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Row 4: AI Analysis */}
                    <div className={cn('rounded-2xl border p-5 flex flex-col gap-4', panelClass)}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={cn('text-sm font-black uppercase tracking-widest', textMainClass)}>AI Deal Analysis</p>
                                    <p className={cn('text-xs', textMutedClass)}>Risk flags &amp; deal summary generated by AI</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                disabled={aiAnalyzing}
                                onClick={() => void handleAiAnalyze()}
                                className="rounded-xl gap-2 bg-violet-600 text-white hover:bg-violet-700 shadow-sm text-xs font-bold"
                            >
                                {aiAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                                {aiAnalysis ? 'Re-analyze' : 'Run AI Analysis'}
                            </Button>
                        </div>

                        {aiAnalysis ? (
                            <div className="space-y-4">
                                {aiAnalysis.ai_summary && (
                                    <div className={cn('rounded-xl border p-4', isLight ? 'border-violet-200 bg-violet-50/60' : 'border-violet-500/20 bg-violet-500/8')}>
                                        <p className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2">Summary</p>
                                        <p className={cn('text-sm leading-relaxed', textMainClass)}>{aiAnalysis.ai_summary}</p>
                                    </div>
                                )}
                                {aiAnalysis.ai_risk_flags && aiAnalysis.ai_risk_flags.length > 0 && (
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Risk Flags</p>
                                        <ul className="space-y-2">
                                            {aiAnalysis.ai_risk_flags.map((flag, i) => (
                                                <li key={i} className={cn('flex items-start gap-2 rounded-lg border p-2.5 text-sm', isLight ? 'border-amber-200 bg-amber-50/70' : 'border-amber-500/20 bg-amber-500/8')}>
                                                    <ShieldAlert className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                                    <span className={textMainClass}>{flag}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {aiAnalysis.analyzed_at && (
                                    <p className={cn('text-[10px]', textMutedClass)}>Analyzed at {new Date(aiAnalysis.analyzed_at).toLocaleString()}</p>
                                )}
                            </div>
                        ) : (
                            <p className={cn('text-sm', textMutedClass)}>Click &ldquo;Run AI Analysis&rdquo; to analyze messages, agreements, and milestones for insights and risk flags.</p>
                        )}
                    </div>

                </div>
            </div>
        </div>

            {inviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className={cn("w-full max-w-sm rounded-2xl p-6 shadow-xl", isLight ? "bg-white" : "bg-slate-900 border border-white/10")}>
                        <h3 className={cn("text-lg font-black", textMainClass)}>Invite Co-Investor</h3>
                        <p className={cn("text-xs mt-2 mb-4", textMutedClass)}>Enter the Organization UUID to invite them securely into this deal room.</p>
                        <Input 
                            placeholder="Organization UUID" 
                            value={inviteOrgId} 
                            onChange={(e) => setInviteOrgId(e.target.value)}
                            className="mb-4 font-mono text-xs"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setInviteModalOpen(false)}>Cancel</Button>
                            <Button 
                                onClick={async () => {
                                    const id = inviteOrgId.trim()
                                    if (!id || !isUuid(id)) {
                                        toast.error('Invalid Organization UUID')
                                        return
                                    }
                                    const res = await inviteDealRoomParticipant(dealRoomId, id, 'co_investor')
                                    if (res && 'error' in res) toast.error((res as any).error)
                                    else {
                                        toast.success('Investor invited!')
                                        setInviteModalOpen(false)
                                        setInviteOrgId('')
                                        refresh()
                                    }
                                }}
                                className="bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                                Send Invite
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
