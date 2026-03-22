'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CreditCard, History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminSubscriptions } from '@/modules/admin/admin.repository'
import { cn } from '@/lib/utils'

function safeText(value: unknown): string {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    return ''
}

export default function AdminSubscriptionsPage() {
    const [loading, setLoading] = useState(true)
    const [subs, setSubs] = useState<any[]>([])
    const [filter, setFilter] = useState('')

    const textMain = 'text-slate-900 dark:text-slate-100'
    const textMuted = 'text-slate-500 dark:text-slate-400'
    const panel = 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60'

    const filteredSubs = useMemo(() => {
        const q = filter.trim().toLowerCase()
        if (!q) return subs
        return subs.filter((s) => 
            safeText(s.org_id).toLowerCase().includes(q) || 
            safeText(s.status).toLowerCase().includes(q) ||
            safeText(s.plan_id).toLowerCase().includes(q)
        )
    }, [subs, filter])

    function refreshAll() {
        setLoading(true)
        adminSubscriptions(500)
            .then(res => setSubs(res))
            .catch(() => toast.error('Failed to load subscriptions'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        refreshAll()
    }, [])

    return (
        <section className="flex flex-1 flex-col min-w-0 overflow-y-auto p-4 md:p-8 space-y-6">
            <div className="mx-auto max-w-6xl w-full space-y-6">
                <div>
                    <h1 className={cn('text-2xl font-black tracking-tight', textMain)}>Subscriptions Overview</h1>
                    <p className={cn('mt-1 text-sm', textMuted)}>View managed billing plans, active tiers, and payment intervals globally.</p>
                </div>

                <Card className={panel}>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <CardTitle className={cn('text-sm font-black uppercase tracking-widest', textMain)}>Revenue \u0026 Billing Pipeline</CardTitle>
                        <div className="flex items-center gap-2">
                            <Input
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Search by org ID or plan…"
                                className="max-w-xs rounded-xl"
                            />
                            <Button variant="outline" size="icon" onClick={refreshAll} disabled={loading}>
                                <CreditCard className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Organization ID</TableHead>
                                    <TableHead>Plan Instance</TableHead>
                                    <TableHead>Billing Cycle</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Origin</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubs.map((s) => (
                                    <TableRow key={safeText(s.id)}>
                                        <TableCell>
                                            <span className={cn('font-mono text-xs', textMain)}>{safeText(s.org_id)}</span>
                                        </TableCell>
                                        <TableCell className={textMain}>
                                            <div className="font-semibold">{safeText(s.plan_id) || 'Unknown Plan'}</div>
                                        </TableCell>
                                        <TableCell className={textMuted}>
                                            <Badge variant="outline" className="capitalize">
                                                {safeText(s.billing_interval)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={s.status === 'active' ? 'default' : s.status === 'canceled' ? 'destructive' : 'secondary'}>
                                                {safeText(s.status).toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={textMuted}>
                                            {safeText(s.source) === 'auto' ? 'Default (Free)' : `Provider: ${safeText(s.source)}`}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredSubs.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                                            No subscription records found.
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
