'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { BarChart3, Building2, CreditCard, FileText, LifeBuoy, ShieldCheck } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    adminAudit,
    adminDealRooms,
    adminOrganizations,
    adminStats,
    adminSubscriptions,
    adminTickets,
    adminForceTier,
    adminUpdateOrgStatus,
} from '@/modules/admin/admin.repository'
import { cn } from '@/lib/utils'

function safeText(value: unknown): string {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    return ''
}

export default function AdminPageClient({ isLight }: { isLight: boolean }) {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any | null>(null)
    const [orgs, setOrgs] = useState<any[]>([])
    const [subs, setSubs] = useState<any[]>([])
    const [dealRooms, setDealRooms] = useState<any[]>([])
    const [tickets, setTickets] = useState<any[]>([])
    const [audit, setAudit] = useState<any[]>([])
    const [orgFilter, setOrgFilter] = useState('')

    const textMain = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMuted = isLight ? 'text-slate-500' : 'text-slate-400'
    const panel = isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-slate-900/60'

    const filteredOrgs = useMemo(() => {
        const q = orgFilter.trim().toLowerCase()
        if (!q) return orgs
        return orgs.filter((o) => safeText(o.name).toLowerCase().includes(q) || safeText(o.org_id).toLowerCase().includes(q))
    }, [orgs, orgFilter])

    function refreshAll() {
        setLoading(true)
        Promise.all([
            adminStats(),
            adminOrganizations({ limit: 200 }),
            adminSubscriptions(200),
            adminDealRooms(200),
            adminTickets(200),
            adminAudit(200),
        ])
            .then(([s, o, sub, dr, t, a]) => {
                setStats(s)
                setOrgs(o)
                setSubs(sub)
                setDealRooms(dr)
                setTickets(t)
                setAudit(a)
            })
            .catch(() => toast.error('Failed to load admin data'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        refreshAll()
    }, [])

    async function forceTier(orgId: string, planCode: 'free' | 'pro' | 'elite') {
        const ok = await adminForceTier(orgId, planCode)
        if (!ok) toast.error('Failed to change tier')
        else {
            toast.success('Tier updated')
            refreshAll()
        }
    }

    async function setOrgStatus(orgId: string, status: 'active' | 'suspended' | 'deleted') {
        const ok = await adminUpdateOrgStatus(orgId, status, 'Manual update from admin UI')
        if (!ok) toast.error('Failed to update status')
        else {
            toast.success('Status updated')
            refreshAll()
        }
    }

    return (
        <section className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                <div className="mx-auto max-w-6xl space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className={cn('text-2xl font-black tracking-tight', textMain)}>Admin</h1>
                            <p className={cn('mt-1 text-sm', textMuted)}>Platform overview, organizations, subscriptions, deal rooms, tickets, and audit logs.</p>
                        </div>
                        <Button onClick={refreshAll} variant="outline" className="rounded-xl">
                            Refresh
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className={panel}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className={cn('text-sm font-black uppercase tracking-widest', textMain)}>Organizations</CardTitle>
                                <Building2 className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent className={cn('text-sm', textMuted)}>
                                {loading ? 'Loading…' : (Array.isArray(stats?.org_counts) ? stats.org_counts.reduce((acc: number, r: any) => acc + (typeof r.count === 'number' ? r.count : 0), 0) : 0)}
                            </CardContent>
                        </Card>
                        <Card className={panel}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className={cn('text-sm font-black uppercase tracking-widest', textMain)}>Deal rooms</CardTitle>
                                <BarChart3 className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent className={cn('text-sm', textMuted)}>
                                {loading ? 'Loading…' : safeText(stats?.active_deal_rooms ?? 0)}
                            </CardContent>
                        </Card>
                        <Card className={panel}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className={cn('text-sm font-black uppercase tracking-widest', textMain)}>Agreements (30d)</CardTitle>
                                <FileText className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent className={cn('text-sm', textMuted)}>
                                {loading ? 'Loading…' : safeText(stats?.agreements_signed_30d ?? 0)}
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="orgs">
                        <TabsList>
                            <TabsTrigger value="orgs"><Building2 className="mr-2 h-4 w-4" />Orgs</TabsTrigger>
                            <TabsTrigger value="subs"><CreditCard className="mr-2 h-4 w-4" />Subs</TabsTrigger>
                            <TabsTrigger value="dealrooms"><ShieldCheck className="mr-2 h-4 w-4" />Deal Rooms</TabsTrigger>
                            <TabsTrigger value="tickets"><LifeBuoy className="mr-2 h-4 w-4" />Tickets</TabsTrigger>
                            <TabsTrigger value="audit"><FileText className="mr-2 h-4 w-4" />Audit</TabsTrigger>
                        </TabsList>

                        <TabsContent value="orgs">
                            <Card className={panel}>
                                <CardHeader className="flex flex-row items-center justify-between gap-4">
                                    <CardTitle className={cn('text-sm font-black uppercase tracking-widest', textMain)}>Organizations</CardTitle>
                                    <Input
                                        value={orgFilter}
                                        onChange={(e) => setOrgFilter(e.target.value)}
                                        placeholder="Search org name or id…"
                                        className="max-w-xs rounded-xl"
                                    />
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Plan</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredOrgs.map((o) => (
                                                <TableRow key={safeText(o.org_id)}>
                                                    <TableCell className={cn('font-semibold', textMain)}>{safeText(o.name)}</TableCell>
                                                    <TableCell className={textMuted}>{safeText(o.org_type)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{safeText(o.status ?? 'active')}</Badge>
                                                    </TableCell>
                                                    <TableCell className={textMuted}>{safeText(o.plan_code ?? 'free')}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="inline-flex gap-2">
                                                            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => forceTier(safeText(o.org_id), 'pro')}>Set Pro</Button>
                                                            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => forceTier(safeText(o.org_id), 'elite')}>Set Elite</Button>
                                                            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setOrgStatus(safeText(o.org_id), 'suspended')}>Suspend</Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="subs">
                            <Card className={panel}>
                                <CardHeader>
                                    <CardTitle className={cn('text-sm font-black uppercase tracking-widest', textMain)}>Subscriptions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Org</TableHead>
                                                <TableHead>Plan</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Interval</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {subs.map((s) => (
                                                <TableRow key={safeText(s.id)}>
                                                    <TableCell className={cn('font-semibold', textMain)}>{safeText(s.org_name)}</TableCell>
                                                    <TableCell className={textMuted}>{safeText(s.plan_code)}</TableCell>
                                                    <TableCell><Badge variant="secondary">{safeText(s.status)}</Badge></TableCell>
                                                    <TableCell className={textMuted}>{safeText(s.billing_interval)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="dealrooms">
                            <Card className={panel}>
                                <CardHeader>
                                    <CardTitle className={cn('text-sm font-black uppercase tracking-widest', textMain)}>Deal Rooms</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Stage</TableHead>
                                                <TableHead>Org A</TableHead>
                                                <TableHead>Org B</TableHead>
                                                <TableHead>Updated</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dealRooms.map((r) => (
                                                <TableRow key={safeText(r.id)}>
                                                    <TableCell><Badge variant="secondary">{safeText(r.stage)}</Badge></TableCell>
                                                    <TableCell className={cn('font-semibold', textMain)}>{safeText(r.org_a_name)}</TableCell>
                                                    <TableCell className={cn('font-semibold', textMain)}>{safeText(r.org_b_name)}</TableCell>
                                                    <TableCell className={textMuted}>{safeText(r.updated_at)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="tickets">
                            <Card className={panel}>
                                <CardHeader>
                                    <CardTitle className={cn('text-sm font-black uppercase tracking-widest', textMain)}>Support Tickets</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Priority</TableHead>
                                                <TableHead>Updated</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tickets.map((t) => (
                                                <TableRow key={safeText(t.id)}>
                                                    <TableCell className={cn('font-semibold', textMain)}>{safeText(t.subject)}</TableCell>
                                                    <TableCell><Badge variant="secondary">{safeText(t.status)}</Badge></TableCell>
                                                    <TableCell className={textMuted}>{safeText(t.priority)}</TableCell>
                                                    <TableCell className={textMuted}>{safeText(t.updated_at)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="audit">
                            <Card className={panel}>
                                <CardHeader>
                                    <CardTitle className={cn('text-sm font-black uppercase tracking-widest', textMain)}>Audit Logs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Target</TableHead>
                                                <TableHead>Created</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {audit.map((a) => (
                                                <TableRow key={safeText(a.id)}>
                                                    <TableCell className={cn('font-semibold', textMain)}>{safeText(a.action)}</TableCell>
                                                    <TableCell className={textMuted}>{safeText(a.target_type)} {safeText(a.target_id)}</TableCell>
                                                    <TableCell className={textMuted}>{safeText(a.created_at)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </section>
    )
}

