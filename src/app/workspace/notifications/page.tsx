'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, Check, Loader2, UserCheck, UserX, Info, FolderLock, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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

function safeNotificationHref(link: string | null): string | null {
    if (!link || typeof link !== 'string') return null
    const t = link.trim()
    if (!t) return null
    if (t.startsWith('/auth/signout')) return null
    if (!t.startsWith('/') || t.startsWith('//')) return null
    if (!t.startsWith('/workspace') && !t.startsWith('/onboarding')) return null
    return t
}

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
    const router = useRouter()
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
            router.push('/workspace/connections')
        }).catch(() => toast.error('Failed to accept request'))
    }, [refresh, router])

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
            const dealRoomId = 'dealRoomId' in result ? (result as { dealRoomId: string }).dealRoomId : null
            toast.success('Deal Room opened', { description: 'You can now chat in Deal Room.' })
            refresh()
            if (dealRoomId) {
                router.push(`/workspace/deal-room/${dealRoomId}`)
            } else {
                router.push('/workspace/connections')
            }
        }).catch(() => toast.error('Failed to accept request'))
    }, [refresh, router])

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
        <div className="mx-auto max-w-3xl space-y-8 p-6 lg:p-10">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild className="rounded-xl h-10 w-10">
                    <Link href="/workspace">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className={cn('text-3xl font-black tracking-tight', textMainClass)}>
                        Notifications
                    </h1>
                    <p className={cn('text-sm mt-1', textMutedClass)}>
                        Manage your connection requests, data room access, and platform alerts.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                    <p className={cn('text-sm font-medium', textMutedClass)}>Loading notifications…</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Action Required Section */}
                    {(incoming.length > 0 || dataRoomIncoming.length > 0 || dealRoomIncoming.length > 0) && (
                        <section>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className={cn('text-lg font-bold tracking-tight', textMainClass)}>Action Required</h2>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    {incoming.length + dataRoomIncoming.length + dealRoomIncoming.length} Pending
                                </Badge>
                            </div>
                            <div className="grid gap-4">
                                {dealRoomIncoming.map((req) => (
                                    <Card key={`deal-${req.id}`} className={isLight ? 'bg-white shadow-sm' : 'bg-slate-900/50 border-white/10'}>
                                        <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                                                        <Handshake className="h-5 w-5" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className={cn('text-sm font-semibold', textMainClass)}>
                                                        {req.investor_org_name ?? 'Investor'} <span className="font-normal text-slate-500">wants to start a Deal Room</span>
                                                    </p>
                                                    {req.message && <p className={cn('mt-1 text-sm line-clamp-2', textMutedClass)}>"{req.message}"</p>}
                                                </div>
                                            </div>
                                            <div className="flex max-sm:w-full gap-2 mt-2 sm:mt-0">
                                                <Button size="sm" className="max-sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAcceptDealRoom(req.id)}>
                                                    <UserCheck className="mr-1.5 h-4 w-4" /> Accept
                                                </Button>
                                                <Button size="sm" variant="outline" className="max-sm:flex-1" onClick={() => handleRejectDealRoom(req.id)}>
                                                    <UserX className="mr-1.5 h-4 w-4" /> Decline
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {dataRoomIncoming.map((req) => (
                                    <Card key={`dr-${req.id}`} className={isLight ? 'bg-white shadow-sm' : 'bg-slate-900/50 border-white/10'}>
                                        <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                                                        <FolderLock className="h-5 w-5" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className={cn('text-sm font-semibold', textMainClass)}>
                                                        {req.requester_org_name ?? 'Organization'} <span className="font-normal text-slate-500">requested Data Room access</span>
                                                    </p>
                                                    {req.message && <p className={cn('mt-1 text-sm line-clamp-2', textMutedClass)}>"{req.message}"</p>}
                                                </div>
                                            </div>
                                            <div className="flex max-sm:w-full gap-2 mt-2 sm:mt-0">
                                                <Button size="sm" className="max-sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApproveDataRoom(req.id)}>
                                                    <Check className="mr-1.5 h-4 w-4" /> Approve
                                                </Button>
                                                <Button size="sm" variant="outline" className="max-sm:flex-1" onClick={() => handleRejectDataRoom(req.id)}>
                                                    <UserX className="mr-1.5 h-4 w-4" /> Reject
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {incoming.map((req) => (
                                    <Card key={`conn-${req.id}`} className={isLight ? 'bg-white shadow-sm' : 'bg-slate-900/50 border-white/10'}>
                                        <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        {req.from_org_name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className={cn('text-sm font-semibold', textMainClass)}>
                                                        {req.from_org_name} <span className="font-normal text-slate-500">wants to connect</span>
                                                    </p>
                                                    <p className={cn('mt-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400')}>
                                                        New Connection Request
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex max-sm:w-full gap-2 mt-2 sm:mt-0">
                                                <Button size="sm" className="max-sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAccept(req.id)}>
                                                    <UserCheck className="mr-1.5 h-4 w-4" /> Accept
                                                </Button>
                                                <Button size="sm" variant="outline" className="max-sm:flex-1" onClick={() => handleDecline(req.id)}>
                                                    <UserX className="mr-1.5 h-4 w-4" /> Decline
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Standard Notifications Section */}
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className={cn('text-lg font-bold tracking-tight', textMainClass)}>Recent Updates</h2>
                        </div>
                        {list.length === 0 ? (
                            <Card className={cn('border-dashed', isLight ? 'bg-slate-50/50' : 'bg-slate-900/20')}>
                                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                    <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                                        <Bell className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <h3 className={cn('mt-4 text-lg font-semibold', textMainClass)}>No notifications yet</h3>
                                    <p className={cn('mt-1 max-w-sm text-sm', textMutedClass)}>
                                        When you receive connection updates, messages, or deal developments, they’ll appear here.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className={isLight ? 'bg-white shadow-sm' : 'bg-slate-900/50 border-white/10'}>
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                    {list.map((n) => (
                                        <div
                                            key={n.id}
                                            className={cn(
                                                'flex items-start gap-4 p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                                                !n.read_at && (isLight ? 'bg-emerald-50/30' : 'bg-emerald-900/10')
                                            )}
                                        >
                                            <div className="mt-1">
                                                {!n.read_at ? (
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                                                ) : (
                                                    <div className="h-2 w-2 rounded-full bg-transparent" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        {safeNotificationHref(n.link) ? (
                                                            <Link
                                                                href={safeNotificationHref(n.link)!}
                                                                prefetch={false}
                                                                className={cn('text-sm font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors', textMainClass)}
                                                                onClick={() => handleMarkRead(n.id)}
                                                            >
                                                                {n.title}
                                                            </Link>
                                                        ) : (
                                                            <span className={cn('text-sm font-semibold', textMainClass)}>{n.title}</span>
                                                        )}
                                                        {n.body && (
                                                            <p className={cn('mt-1 text-sm leading-relaxed', textMutedClass)}>{n.body}</p>
                                                        )}
                                                    </div>
                                                    <span className="shrink-0 text-xs font-medium text-slate-400">
                                                        {formatRelative(n.created_at)}
                                                    </span>
                                                </div>
                                                {!n.read_at && (
                                                    <div className="mt-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/30 -ml-2"
                                                            onClick={() => handleMarkRead(n.id)}
                                                        >
                                                            <Check className="mr-1.5 h-3.5 w-3.5" /> Mark as read
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </section>
                </div>
            )}
        </div>
    )
}
