'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, Check, Loader2, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    listNotifications,
    markNotificationRead,
    type NotificationView,
} from '@/modules/notifications/notifications.repository'
import {
    acceptConnectionRequest,
    listIncomingConnectionRequests,
    rejectConnectionRequest,
    type ConnectionRequestView,
} from '@/modules/connections/connections.repository'
import {
    listIncomingDataRoomAccessRequests,
    approveDataRoomAccessRequest,
    rejectDataRoomAccessRequest,
    type DataRoomAccessRequestView,
} from '@/modules/data-room/data-room.repository'
import {
    acceptDealRoomRequest,
    listIncomingDealRoomRequests,
    rejectDealRoomRequest,
    type DealRoomRequestView,
} from '@/modules/deal-room/deal-room.repository'
import { useWorkspaceTheme } from '@/app/workspace/WorkspaceThemeContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function formatRelative(dateStr: string): string {
    const d = new Date(dateStr)
    const now = Date.now()
    const diff = now - d.getTime()
    if (diff < 60_000) return 'Just now'
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
    if (diff < 604800_000) return `${Math.floor(diff / 86400_000)}d ago`
    return d.toLocaleDateString()
}

export default function WorkspaceNotificationsPage() {
    const { isLight } = useWorkspaceTheme()
    const [list, setList] = useState<NotificationView[]>([])
    const [incoming, setIncoming] = useState<ConnectionRequestView[]>([])
    const [dataRoomIncoming, setDataRoomIncoming] = useState<DataRoomAccessRequestView[]>([])
    const [dealRoomIncoming, setDealRoomIncoming] = useState<DealRoomRequestView[]>([])
    const [loading, setLoading] = useState(true)

    const refresh = useCallback(() => {
        setLoading(true)
        Promise.all([listNotifications(), listIncomingConnectionRequests(), listIncomingDataRoomAccessRequests(), listIncomingDealRoomRequests()])
            .then(([notifications, incomingRequests, drIncoming, dealIncoming]) => {
                setList(notifications)
                setIncoming(incomingRequests)
                setDataRoomIncoming(drIncoming)
                setDealRoomIncoming(dealIncoming)
            })
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    const handleMarkRead = useCallback(
        (id: string) => {
            markNotificationRead(id).then((ok) => {
                if (ok) setList((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
            })
        },
        []
    )

    const panelClass = isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-slate-900/80'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const handleAccept = useCallback((id: string) => {
        acceptConnectionRequest(id).then((result) => {
            if (result && typeof result === 'object' && 'error' in result) {
                toast.error(result.error || 'Failed to accept request')
                return
            }
            toast.success('Connection accepted', { description: 'Open Deal Room to continue.' })
            refresh()
            window.location.href = '/workspace/connections'
        }).catch(() => toast.error('Failed to accept request'))
    }, [refresh])

    const handleDecline = useCallback((id: string) => {
        rejectConnectionRequest(id).then((result) => {
            if (result && typeof result === 'object' && 'error' in result) {
                toast.error(result.error || 'Failed to decline request')
                return
            }
            toast.success('Request declined')
            refresh()
        }).catch(() => toast.error('Failed to decline request'))
    }, [refresh])

    const handleApproveDataRoom = useCallback((id: string) => {
        approveDataRoomAccessRequest({ requestId: id, permissionLevel: 'view' })
            .then((result) => {
                if (result && typeof result === 'object' && 'error' in result) {
                    toast.error(result.error || 'Failed to approve request')
                    return
                }
                toast.success('Data Room access approved')
                refresh()
            })
            .catch(() => toast.error('Failed to approve request'))
    }, [refresh])

    const handleRejectDataRoom = useCallback((id: string) => {
        rejectDataRoomAccessRequest({ requestId: id })
            .then((result) => {
                if (result && typeof result === 'object' && 'error' in result) {
                    toast.error(result.error || 'Failed to reject request')
                    return
                }
                toast.success('Data Room request rejected')
                refresh()
            })
            .catch(() => toast.error('Failed to reject request'))
    }, [refresh])

    const handleAcceptDealRoom = useCallback((id: string) => {
        acceptDealRoomRequest(id).then((result) => {
            if (result && typeof result === 'object' && 'error' in result) {
                toast.error(result.error || 'Failed to accept request')
                return
            }
            toast.success('Deal Room opened', { description: 'You can now chat in Deal Room.' })
            refresh()
            window.location.href = '/workspace/connections'
        }).catch(() => toast.error('Failed to accept request'))
    }, [refresh])

    const handleRejectDealRoom = useCallback((id: string) => {
        rejectDealRoomRequest(id).then((result) => {
            if (result && typeof result === 'object' && 'error' in result) {
                toast.error(result.error || 'Failed to decline request')
                return
            }
            toast.success('Deal Room request declined')
            refresh()
        }).catch(() => toast.error('Failed to decline request'))
    }, [refresh])

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-xl">
                    <Link href="/workspace">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className={cn('text-2xl font-black tracking-tight', textMainClass)}>
                        Notifications
                    </h1>
                    <p className={cn('text-sm mt-0.5', textMutedClass)}>
                        Connection requests, acceptances, and deal room updates.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    <p className={textMutedClass}>Loading…</p>
                </div>
            ) : list.length === 0 ? (
                <div className={cn('rounded-2xl border p-8 text-center', panelClass)}>
                    <Bell className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className={cn('mt-3 font-semibold', textMainClass)}>No notifications yet</p>
                    <p className={cn('mt-1 text-sm', textMutedClass)}>
                        When you receive connection requests or acceptances, they’ll appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {(incoming.length > 0 || dataRoomIncoming.length > 0 || dealRoomIncoming.length > 0) && (
                        <div className={cn('rounded-2xl border p-4', panelClass)}>
                            <p className={cn('text-sm font-black uppercase tracking-widest', textMutedClass)}>
                                Action Required
                            </p>
                            <ul className="mt-3 space-y-2">
                                {dealRoomIncoming.map((req) => (
                                    <li
                                        key={`deal-${req.id}`}
                                        className={cn(
                                            'rounded-xl border p-3',
                                            isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-slate-950/40'
                                        )}
                                    >
                                        <p className={cn('font-bold', textMainClass)}>
                                            {req.investor_org_name ?? 'Investor'} wants to start a Deal Room
                                        </p>
                                        {req.message ? <p className={cn('mt-1 text-sm', textMutedClass)}>{req.message}</p> : null}
                                        <div className="mt-2 flex gap-2">
                                            <Button
                                                size="sm"
                                                className="h-8 gap-1.5 rounded-lg bg-emerald-500 px-3 text-slate-950 hover:bg-emerald-400"
                                                onClick={() => handleAcceptDealRoom(req.id)}
                                            >
                                                <UserCheck className="h-3.5 w-3.5" />
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 gap-1.5 rounded-lg px-3"
                                                onClick={() => handleRejectDealRoom(req.id)}
                                            >
                                                <UserX className="h-3.5 w-3.5" />
                                                Decline
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                                {dataRoomIncoming.map((req) => (
                                    <li
                                        key={`dr-${req.id}`}
                                        className={cn(
                                            'rounded-xl border p-3',
                                            isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-slate-950/40'
                                        )}
                                    >
                                        <p className={cn('font-bold', textMainClass)}>
                                            {req.requester_org_name ?? 'Organization'} requested Data Room access
                                        </p>
                                        {req.message ? <p className={cn('mt-1 text-sm', textMutedClass)}>{req.message}</p> : null}
                                        <div className="mt-2 flex gap-2">
                                            <Button
                                                size="sm"
                                                className="h-8 gap-1.5 rounded-lg bg-emerald-500 px-3 text-slate-950 hover:bg-emerald-400"
                                                onClick={() => handleApproveDataRoom(req.id)}
                                            >
                                                <UserCheck className="h-3.5 w-3.5" />
                                                Approve (view)
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 gap-1.5 rounded-lg px-3"
                                                onClick={() => handleRejectDataRoom(req.id)}
                                            >
                                                <UserX className="h-3.5 w-3.5" />
                                                Reject
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                                {incoming.map((req) => (
                                    <li
                                        key={req.id}
                                        className={cn(
                                            'rounded-xl border p-3',
                                            isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-slate-950/40'
                                        )}
                                    >
                                        <p className={cn('font-bold', textMainClass)}>
                                            {req.from_org_name} wants to connect
                                        </p>
                                        <div className="mt-2 flex gap-2">
                                            <Button
                                                size="sm"
                                                className="h-8 gap-1.5 rounded-lg bg-emerald-500 px-3 text-slate-950 hover:bg-emerald-400"
                                                onClick={() => handleAccept(req.id)}
                                            >
                                                <UserCheck className="h-3.5 w-3.5" />
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 gap-1.5 rounded-lg px-3"
                                                onClick={() => handleDecline(req.id)}
                                            >
                                                <UserX className="h-3.5 w-3.5" />
                                                Decline
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <ul className="space-y-2">
                        {list.map((n) => (
                            <li
                                key={n.id}
                                className={cn(
                                    'rounded-xl border p-4 transition-colors',
                                    panelClass,
                                    !n.read_at && (isLight ? 'bg-emerald-50/50 border-emerald-200/60' : 'bg-emerald-500/5 border-emerald-500/20')
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        {n.link ? (
                                            <a
                                                href={n.link}
                                                className={cn('font-bold hover:underline', textMainClass)}
                                            >
                                                {n.title}
                                            </a>
                                        ) : (
                                            <span className={cn('font-bold', textMainClass)}>{n.title}</span>
                                        )}
                                        {n.body && (
                                            <p className={cn('mt-0.5 text-sm', textMutedClass)}>{n.body}</p>
                                        )}
                                        <p className={cn('mt-1 text-xs', textMutedClass)}>{formatRelative(n.created_at)}</p>
                                    </div>
                                    {!n.read_at && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="shrink-0 gap-1 rounded-lg"
                                            onClick={() => handleMarkRead(n.id)}
                                            title="Mark as read"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                            Read
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
