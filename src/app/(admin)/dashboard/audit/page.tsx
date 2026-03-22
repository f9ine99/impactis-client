'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Activity, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminAudit } from '@/modules/admin/admin.repository'
import { cn } from '@/lib/utils'

function safeText(value: unknown): string {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    return ''
}

export default function AdminAuditPage() {
    const [loading, setLoading] = useState(true)
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [filter, setFilter] = useState('')

    const textMain = 'text-slate-900 dark:text-slate-100'
    const textMuted = 'text-slate-500 dark:text-slate-400'
    const panel = 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60'

    const filteredLogs = useMemo(() => {
        const q = filter.trim().toLowerCase()
        if (!q) return auditLogs
        return auditLogs.filter((l) => 
            safeText(l.action).toLowerCase().includes(q) || 
            safeText(l.admin_id).toLowerCase().includes(q) ||
            safeText(l.target_type).toLowerCase().includes(q)
        )
    }, [auditLogs, filter])

    function refreshAll() {
        setLoading(true)
        adminAudit(500)
            .then(res => setAuditLogs(res))
            .catch(() => toast.error('Failed to load audit logs'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        refreshAll()
    }, [])

    return (
        <section className="flex flex-1 flex-col min-w-0 overflow-y-auto p-4 md:p-8 space-y-6">
            <div className="mx-auto max-w-6xl w-full space-y-6">
                <div>
                    <h1 className={cn('text-2xl font-black tracking-tight', textMain)}>Admin Audit Logs</h1>
                    <p className={cn('mt-1 text-sm', textMuted)}>Read-only timeline tracking all administrative mutations over the platform.</p>
                </div>

                <Card className={panel}>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <CardTitle className={cn('text-sm font-black uppercase tracking-widest', textMain)}>System Audit Trail</CardTitle>
                        <div className="flex items-center gap-2">
                            <Input
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Search action, target, admin ID…"
                                className="max-w-xs rounded-xl"
                            />
                            <Button variant="outline" size="icon" onClick={refreshAll} disabled={loading}>
                                <Activity className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Admin ID</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target Type & ID</TableHead>
                                    <TableHead>Context / Payload</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((l, i) => (
                                    <TableRow key={l.id ?? i}>
                                        <TableCell className={cn('whitespace-nowrap text-xs text-slate-500')}>
                                            {new Date(l.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <Shield className="h-3 w-3 text-red-500" />
                                                <span className={cn('font-mono text-xs', textMain)}>{safeText(l.admin_id).substring(0, 8)}...</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                                                {safeText(l.action).replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={cn('font-semibold text-xs capitalize', textMain)}>{safeText(l.target_type)}</span>
                                                <span className={cn('font-mono text-[10px]', textMuted)}>{safeText(l.target_id)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn('text-xs font-mono max-w-[200px] truncate', textMuted)}>
                                            {JSON.stringify(l.payload || {})}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredLogs.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                                            No audit trails available.
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
