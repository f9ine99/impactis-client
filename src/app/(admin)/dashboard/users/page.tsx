'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Users, UserX, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminUsers, adminPatchUser, adminRevokeUserSessions, AdminPlatformUserView } from '@/modules/admin/admin.repository'
import { cn } from '@/lib/utils'

function safeText(value: unknown): string {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    return ''
}

export default function AdminUsersPage() {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<AdminPlatformUserView[]>([])
    const [userFilter, setUserFilter] = useState('')

    const textMain = 'text-slate-900 dark:text-slate-100'
    const textMuted = 'text-slate-500 dark:text-slate-400'
    const panel = 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60'

    const filteredUsers = useMemo(() => {
        const q = userFilter.trim().toLowerCase()
        if (!q) return users
        return users.filter((u) => 
            safeText(u.name).toLowerCase().includes(q) || 
            safeText(u.email).toLowerCase().includes(q) || 
            safeText(u.user_id).toLowerCase().includes(q)
        )
    }, [users, userFilter])

    function refreshAll() {
        setLoading(true)
        adminUsers({ limit: 500 })
            .then(res => setUsers(res))
            .catch(() => toast.error('Failed to load users'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        refreshAll()
    }, [])

    async function toggleSuspension(userId: string, currentlySuspended: boolean) {
        const res = await adminPatchUser(userId, { suspended: !currentlySuspended })
        if ('error' in res) toast.error('Check failed', { description: res.error })
        else {
            toast.success(`User has been ${currentlySuspended ? 'unsuspended' : 'suspended'}.`)
            refreshAll()
        }
    }

    async function revokeSessions(userId: string) {
        const res = await adminRevokeUserSessions(userId)
        if ('error' in res) toast.error('Failed to revoke sessions', { description: res.error })
        else {
            toast.success('Sessions revoked successfully', { description: `Deleted ${res.deleted} session tokens.` })
        }
    }

    return (
        <section className="flex flex-1 flex-col min-w-0 overflow-y-auto p-4 md:p-8 space-y-6">
            <div className="mx-auto max-w-6xl w-full space-y-6">
                <div>
                    <h1 className={cn('text-2xl font-black tracking-tight', textMain)}>Platform Users</h1>
                    <p className={cn('mt-1 text-sm', textMuted)}>Manage all registered accounts, moderate users, and revoke active login sessions.</p>
                </div>

                <Card className={panel}>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <CardTitle className={cn('text-sm font-black uppercase tracking-widest', textMain)}>User Directory</CardTitle>
                        <div className="flex items-center gap-2">
                            <Input
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                                placeholder="Search by name, email, or id…"
                                className="max-w-xs rounded-xl"
                            />
                            <Button variant="outline" size="icon" onClick={refreshAll} disabled={loading}>
                                <Users className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User Details</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((u) => (
                                    <TableRow key={safeText(u.user_id)}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={cn('font-semibold', textMain)}>{safeText(u.name || 'Unknown')}</span>
                                                <span className={cn('text-xs', textMuted)}>{safeText(u.email || 'No email')}</span>
                                                {u.organizations?.length > 0 && (
                                                    <span className="text-[10px] uppercase text-slate-400 mt-1">Orgs: {u.organizations.join(', ')}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className={textMuted}>
                                            <span className="text-sm">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={u.suspended ? 'destructive' : 'secondary'}>
                                                {u.suspended ? 'Suspended' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="inline-flex gap-2 justify-end">
                                                <Button 
                                                    type="button" 
                                                    size="sm" 
                                                    variant="outline" 
                                                    title="Revoke active sessions"
                                                    className="rounded-lg h-8 w-8 p-0" 
                                                    onClick={() => revokeSessions(safeText(u.user_id))}
                                                >
                                                    <ShieldAlert className="h-4 w-4 text-orange-500" />
                                                </Button>
                                                <Button 
                                                    type="button" 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="rounded-lg h-8" 
                                                    onClick={() => toggleSuspension(safeText(u.user_id), u.suspended)}
                                                >
                                                    {u.suspended ? 'Unsuspend' : <><UserX className="h-3 w-3 mr-1" /> Suspend</>}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredUsers.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                                            No users found.
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
