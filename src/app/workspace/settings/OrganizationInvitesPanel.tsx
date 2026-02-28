'use client'

import { useActionState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTransientActionNotice } from '@/lib/use-transient-action-notice'
import type { OrganizationOutgoingInvite } from '@/modules/organizations'
import {
    createOrganizationInviteAction,
    revokeOrganizationInviteAction,
    type CreateOrganizationInviteActionState,
} from './actions'

type OrganizationInvitesPanelProps = {
    canManage: boolean
    pendingInvites: OrganizationOutgoingInvite[]
    isLight?: boolean
}

const initialCreateInviteState: CreateOrganizationInviteActionState = {
    error: null,
    success: null,
    inviteToken: null,
    inviteLink: null,
}

function formatDate(value: string): string {
    const timestamp = Date.parse(value)
    if (Number.isNaN(timestamp)) {
        return 'Unknown'
    }

    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    })
}

export default function OrganizationInvitesPanel({
    canManage,
    pendingInvites,
    isLight = true,
}: OrganizationInvitesPanelProps) {
    const [state, formAction, isPending] = useActionState(createOrganizationInviteAction, initialCreateInviteState)
    const notice = useTransientActionNotice(state)

    const panelClass = isLight
        ? 'border-slate-200 bg-white/90'
        : 'border-slate-800 bg-slate-900/70'
    const mutedPanelClass = isLight
        ? 'border-slate-200 bg-slate-50'
        : 'border-slate-800 bg-slate-950/70'
    const inputClass = isLight
        ? 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500'
        : 'border-slate-700 bg-slate-950 text-slate-100 focus:border-emerald-400'
    const labelClass = isLight
        ? 'text-slate-500'
        : 'text-slate-400'
    const textMutedClass = isLight
        ? 'text-slate-600'
        : 'text-slate-400'
    const textMainClass = isLight
        ? 'text-slate-900'
        : 'text-slate-100'

    return (
        <Card className={panelClass}>
            <CardHeader>
                <CardTitle className={textMainClass}>Organization Invites</CardTitle>
                <CardDescription className={textMutedClass}>
                    Invite admins or members by email and share a secure invite link.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form action={formAction} className={`grid gap-4 rounded-xl border p-4 sm:grid-cols-2 ${mutedPanelClass}`}>
                    <div className="sm:col-span-2">
                        <label htmlFor="invitedEmail" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Member Email
                        </label>
                        <input
                            id="invitedEmail"
                            name="invitedEmail"
                            type="email"
                            required
                            disabled={!canManage || isPending}
                            placeholder="teammate@company.com"
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div>
                        <label htmlFor="memberRole" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Member Role
                        </label>
                        <select
                            id="memberRole"
                            name="memberRole"
                            defaultValue="member"
                            disabled={!canManage || isPending}
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="expiresInDays" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Expires In (Days)
                        </label>
                        <input
                            id="expiresInDays"
                            name="expiresInDays"
                            type="number"
                            min={1}
                            max={30}
                            defaultValue={7}
                            disabled={!canManage || isPending}
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <Button type="submit" disabled={!canManage || isPending}>
                            {isPending ? 'Creating Invite...' : 'Create Invite'}
                        </Button>
                    </div>
                </form>

                {!canManage ? (
                    <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                        Only organization owner can create or revoke invites.
                    </p>
                ) : null}

                {notice.error ? (
                    <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                        {notice.error}
                    </p>
                ) : null}

                {notice.success ? (
                    <div className="space-y-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                        <p className="font-medium">{notice.success}</p>
                        {state.inviteLink ? (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Invite Link</p>
                                <p className="mt-1 break-all rounded border border-emerald-200 bg-white px-3 py-2 font-mono text-xs text-emerald-800">
                                    {state.inviteLink}
                                </p>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div className={`rounded-xl border ${mutedPanelClass}`}>
                    <div className="border-b border-slate-200 px-4 py-3">
                        <p className={`text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>Pending Invites</p>
                    </div>

                    {pendingInvites.length === 0 ? (
                        <p className={`px-4 py-4 text-sm ${textMutedClass}`}>No pending invites.</p>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {pendingInvites.map((invite) => (
                                <div key={invite.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className={`text-sm font-semibold ${textMainClass}`}>{invite.invited_email}</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <Badge variant="secondary">{invite.member_role}</Badge>
                                            <span className={`text-xs ${textMutedClass}`}>Expires {formatDate(invite.expires_at)}</span>
                                        </div>
                                    </div>

                                    <form action={revokeOrganizationInviteAction}>
                                        <input type="hidden" name="inviteId" value={invite.id} />
                                        <Button type="submit" variant="destructive" size="sm" disabled={!canManage}>
                                            Revoke
                                        </Button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
