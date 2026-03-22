'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck, Handshake } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminDealRooms } from '@/modules/admin/admin.repository'
import { cn } from '@/lib/utils'

function safeText(value: unknown): string {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    return ''
}

export default function AdminDealRoomsPage() {
    const [loading, setLoading] = useState(true)
    const [dealRooms, setDealRooms] = useState<any[]>([])
    const [filter, setFilter] = useState('')

    const textMain = 'text-slate-900 dark:text-slate-100'
    const textMuted = 'text-slate-500 dark:text-slate-400'
    const panel = 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60'

    const filteredRooms = useMemo(() => {
        const q = filter.trim().toLowerCase()
        if (!q) return dealRooms
        return dealRooms.filter((d) => 
            safeText(d.id).toLowerCase().includes(q) || 
            safeText(d.startup_org_id).toLowerCase().includes(q) ||
            safeText(d.investor_org_id).toLowerCase().includes(q)
        )
    }, [dealRooms, filter])

    function refreshAll() {
        setLoading(true)
        adminDealRooms(500)
            .then(res => setDealRooms(res))
            .catch(() => toast.error('Failed to load deal rooms'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        refreshAll()
    }, [])

    return (
        <section className="flex flex-1 flex-col min-w-0 overflow-y-auto p-4 md:p-8 space-y-6">
            <div className="mx-auto max-w-6xl w-full space-y-6">
                <div>
                    <h1 className={cn('text-2xl font-black tracking-tight', textMain)}>Deal Rooms</h1>
                    <p className={cn('mt-1 text-sm', textMuted)}>Monitor active private deal rooms and investment stages across the platform.</p>
                </div>

                <Card className={panel}>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <CardTitle className={cn('text-sm font-black uppercase tracking-widest', textMain)}>Active Deals Overview</CardTitle>
                        <div className="flex items-center gap-2">
                            <Input
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Search by org IDs…"
                                className="max-w-xs rounded-xl"
                            />
                            <Button variant="outline" size="icon" onClick={refreshAll} disabled={loading}>
                                <ShieldCheck className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Deal Room ID</TableHead>
                                    <TableHead>Startup (Target)</TableHead>
                                    <TableHead>Investor</TableHead>
                                    <TableHead>Stage</TableHead>
                                    <TableHead>Created At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRooms.map((d) => (
                                    <TableRow key={safeText(d.id)}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Handshake className="h-4 w-4 text-slate-400" />
                                                <span className={cn('font-mono text-xs', textMain)}>{safeText(d.id).substring(0, 8)}...</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={textMain}>{safeText(d.startup_org_id)}</TableCell>
                                        <TableCell className={textMuted}>{safeText(d.investor_org_id)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {safeText(d.stage).replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={textMuted}>
                                            <span className="text-sm">
                                                {new Date(d.created_at).toLocaleDateString()}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredRooms.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                                            No active deal rooms found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
