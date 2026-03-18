'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    acceptConnectionRequest,
    getPendingConnectionCount,
    listIncomingConnectionRequests,
    rejectConnectionRequest,
    type ConnectionRequestView,
} from '@/modules/connections/connections.repository'
import { cn } from '@/lib/utils'

type Props = {
    isLight: boolean
    className?: string
}

export default function ConnectionRequestsWidget({ isLight, className }: Props) {
    const router = useRouter()
    const [count, setCount] = useState<number | null>(null)
    const [incoming, setIncoming] = useState<ConnectionRequestView[]>([])

    const refresh = useCallback(() => {
        getPendingConnectionCount().then(setCount)
        listIncomingConnectionRequests().then(setIncoming)
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    const handleAccept = useCallback((id: string) => {
        acceptConnectionRequest(id).then((result) => {
            if (result && typeof result === 'object' && 'error' in result) {
                toast.error(result.error || 'Failed to accept request')
                return
            }
            toast.success('Connection accepted', {
                description: 'Opening Deal Room...',
            })
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

    if (count === null || count === 0) return null

    return (
        <div
            className={cn(
                'rounded-2xl border p-4',
                isLight ? 'border-emerald-200 bg-emerald-50/70' : 'border-emerald-500/30 bg-emerald-500/10',
                className
            )}
        >
            <p className={cn('text-sm font-bold', isLight ? 'text-emerald-800' : 'text-emerald-300')}>
                You have {count} connection request{count !== 1 ? 's' : ''}
            </p>
            <p className={cn('text-xs mt-0.5', isLight ? 'text-emerald-700/80' : 'text-emerald-400/80')}>
                Review requests below or open Deal Room.
            </p>
            {incoming.length > 0 && (
                <ul className="mt-3 space-y-2">
                    {incoming.slice(0, 3).map((req) => (
                        <li
                            key={req.id}
                            className={cn(
                                'rounded-xl border p-3',
                                isLight ? 'border-emerald-200/70 bg-white/70' : 'border-emerald-400/20 bg-slate-900/40'
                            )}
                        >
                            <p className={cn('text-sm font-bold', isLight ? 'text-slate-800' : 'text-slate-100')}>
                                {req.from_org_name}
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
            )}
            <Button asChild size="sm" className="mt-3 gap-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <Link href="/workspace/connections">
                    <MessageCircle className="h-3.5 w-3.5" />
                    View requests
                </Link>
            </Button>
        </div>
    )
}
