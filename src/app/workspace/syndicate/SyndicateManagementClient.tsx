'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    createSyndicate,
    getSyndicateDetails,
    inviteToSyndicate,
    listMySyndicates,
    updateSyndicateStatus,
    commitToSyndicate,
    type SyndicateInviteView,
    type SyndicateView,
} from '@/modules/syndicates/syndicates.repository'
import { useWorkspaceTheme } from '@/app/workspace/WorkspaceThemeContext'
import { cn } from '@/lib/utils'
import { isUuid } from '@/lib/uuid'

export type OrganizationOption = { id: string; name: string; type: 'startup' | 'investor' | 'advisor' }

export default function SyndicateManagementClient({ organizations = [] }: { organizations?: OrganizationOption[] }) {
    const { isLight } = useWorkspaceTheme()
    const [list, setList] = useState<SyndicateView[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [invites, setInvites] = useState<SyndicateInviteView[]>([])
    const [members, setMembers] = useState<any[]>([])

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [startupOrgId, setStartupOrgId] = useState('')
    const [inviteeOrgId, setInviteeOrgId] = useState('')
    const [inviteMessage, setInviteMessage] = useState('')
    const [commitAmount, setCommitAmount] = useState('')

    const panelClass = isLight ? 'border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/40' : 'border-white/10 bg-slate-900/80'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'

    const refresh = useCallback(() => {
        setLoading(true)
        listMySyndicates()
            .then(setList)
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    const loadDetail = useCallback(async (id: string) => {
        setDetailLoading(true)
        const res = await getSyndicateDetails(id)
        setDetailLoading(false)
        if (res && 'error' in res) {
            toast.error(res.error)
            return
        }
        setInvites(res.invites ?? [])
        setMembers(res.members ?? [])
    }, [])

    useEffect(() => {
        if (expandedId) void loadDetail(expandedId)
        else {
            setInvites([])
            setMembers([])
        }
    }, [expandedId, loadDetail])

    const handleCreate = useCallback(async () => {
        const n = name.trim()
        if (n.length < 2) {
            toast.error('Name is required')
            return
        }
        const sid = startupOrgId.trim()
        if (sid && !isUuid(sid)) {
            toast.error('Startup org id must be a valid UUID or empty')
            return
        }
        const res = await createSyndicate({
            name: n,
            description: description.trim() || null,
            startupOrgId: sid || null,
        })
        if (res && typeof res === 'object' && 'error' in res) {
            toast.error(res.error)
            return
        }
        toast.success('Syndicate created')
        setName('')
        setDescription('')
        setStartupOrgId('')
        refresh()
    }, [name, description, startupOrgId, refresh])

    const handleInvite = useCallback(async () => {
        if (!expandedId) return
        const oid = inviteeOrgId.trim()
        if (!isUuid(oid)) {
            toast.error('Invitee organization id must be a UUID')
            return
        }
        const res = await inviteToSyndicate(expandedId, {
            inviteeOrgId: oid,
            message: inviteMessage.trim() || null,
        })
        if (res && typeof res === 'object' && 'error' in res) {
            toast.error(res.error)
            return
        }
        toast.success('Invite sent')
        setInviteeOrgId('')
        setInviteMessage('')
        void loadDetail(expandedId)
    }, [expandedId, inviteeOrgId, inviteMessage, loadDetail])

    const handleCommit = useCallback(async () => {
        if (!expandedId) return
        const amount = Number(commitAmount)
        if (isNaN(amount) || amount <= 0) {
            toast.error('Invalid amount')
            return
        }
        const res = await commitToSyndicate(expandedId, amount)
        if (res && 'error' in res) {
            toast.error(res.error)
            return
        }
        toast.success('Capital committed successfully')
        setCommitAmount('')
        void loadDetail(expandedId)
    }, [expandedId, commitAmount, loadDetail])

    return (
        <div className="space-y-6">
            <Card className={panelClass}>
                <CardHeader>
                    <CardTitle className={textMainClass}>Create syndicate</CardTitle>
                    <CardDescription className={textMutedClass}>
                        Elite investors only. Link a startup org (optional) and invite co-investors after creation.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <div className={cn('text-xs font-black uppercase tracking-widest', textMutedClass)}>Name</div>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Syndicate name" />
                        </div>
                        <div className="space-y-1.5">
                            <div className={cn('text-xs font-black uppercase tracking-widest', textMutedClass)}>Startup Target (optional)</div>
                            <select
                                className={cn(
                                    "flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                    isLight ? "border-slate-200 bg-white placeholder:text-slate-500" : "border-slate-800 bg-slate-950 ring-offset-slate-950 placeholder:text-slate-400 focus-visible:ring-slate-300"
                                )}
                                value={startupOrgId}
                                onChange={(e) => setStartupOrgId(e.target.value)}
                            >
                                <option value="">-- Select Startup --</option>
                                {organizations.map(o => (
                                    <option key={o.id} value={o.id}>{o.name} ({o.type})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className={cn('text-xs font-black uppercase tracking-widest', textMutedClass)}>Description</div>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Thesis, terms, etc." />
                    </div>
                    <Button type="button" onClick={() => void handleCreate()} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                        Create
                    </Button>
                </CardContent>
            </Card>

            <Card className={panelClass}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className={textMainClass}>Your syndicates</CardTitle>
                        <CardDescription className={textMutedClass}>Expand a row to manage members and invites.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="rounded-lg gap-2" onClick={() => refresh()} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className={textMutedClass}>Loading…</p>
                    ) : list.length === 0 ? (
                        <p className={textMutedClass}>No syndicates yet. Create one above (requires Elite tier).</p>
                    ) : (
                        <ul className="space-y-2">
                            {list.map((s) => (
                                <li key={s.id} className={cn('rounded-xl border p-3', isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-slate-950/40')}>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className={cn('font-bold', textMainClass)}>{s.name}</p>
                                            <p className={cn('text-xs', textMutedClass)}>
                                                {s.status} · {s.id}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="rounded-lg"
                                                onClick={() => setExpandedId((id) => (id === s.id ? null : s.id))}
                                            >
                                                {expandedId === s.id ? 'Collapse' : 'Manage'}
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                className="rounded-lg"
                                                onClick={async () => {
                                                    const res = await updateSyndicateStatus(s.id, 'active')
                                                    if (res && 'error' in res) toast.error(res.error)
                                                    else {
                                                        toast.success('Status updated')
                                                        refresh()
                                                    }
                                                }}
                                            >
                                                Mark active
                                            </Button>
                                        </div>
                                    </div>
                                    {expandedId === s.id ? (
                                        <div className="mt-4 space-y-4 border-t border-dashed pt-4">
                                            {detailLoading ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                                            ) : (
                                                <>
                                                    <div>
                                                        <p className={cn('text-xs font-black uppercase tracking-widest', textMutedClass)}>Members</p>
                                                        <ul className="mt-2 space-y-1 text-sm">
                                                            {members.map((m) => (
                                                                <li key={m.id} className={textMainClass}>
                                                                    {m.org_name} — {m.status} {m.committed_usd ? <span className="text-emerald-500 font-semibold ml-1">· ${Number(m.committed_usd).toLocaleString()} committed</span> : ''}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <p className={cn('text-xs font-black uppercase tracking-widest', textMutedClass)}>Invites</p>
                                                        <ul className="mt-2 space-y-2">
                                                            {invites.map((inv) => (
                                                                <li key={inv.id} className="text-sm">
                                                                    <span className={textMainClass}>
                                                                        {inv.invitee_org_name} — {inv.status}
                                                                    </span>
                                                                    <span className={cn('ml-2 text-xs', textMutedClass)}>
                                                                        (Invitees accept or decline from their account / notifications.)
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <p className={cn('text-xs font-black uppercase tracking-widest', textMutedClass)}>Your Financial Commitment</p>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <Input 
                                                                type="number" 
                                                                placeholder="Amount in USD" 
                                                                value={commitAmount} 
                                                                onChange={e => setCommitAmount(e.target.value)} 
                                                                className="max-w-[200px]" 
                                                            />
                                                            <Button onClick={() => void handleCommit()} className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Commit Capital</Button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className={cn('text-xs font-black uppercase tracking-widest', textMutedClass)}>Invite organization</p>
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                                            <select
                                                                className={cn(
                                                                    "flex h-10 w-full sm:max-w-xs rounded-md border px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                                                    isLight ? "border-slate-200 bg-white placeholder:text-slate-500" : "border-slate-800 bg-slate-950 ring-offset-slate-950 placeholder:text-slate-400 focus-visible:ring-slate-300"
                                                                )}
                                                                value={inviteeOrgId}
                                                                onChange={(e) => setInviteeOrgId(e.target.value)}
                                                            >
                                                                <option value="">-- Select Organization --</option>
                                                                {organizations.map(o => (
                                                                    <option key={o.id} value={o.id}>{o.name} ({o.type})</option>
                                                                ))}
                                                            </select>
                                                            <Input
                                                                className="flex-1"
                                                                placeholder="Message (optional)"
                                                                value={inviteMessage}
                                                                onChange={(e) => setInviteMessage(e.target.value)}
                                                            />
                                                            <Button type="button" className="rounded-lg bg-emerald-600 text-white" onClick={() => void handleInvite()}>
                                                                Send invite
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
