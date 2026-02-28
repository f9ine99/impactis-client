'use client'

import { useActionState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTransientActionNotice } from '@/lib/use-transient-action-notice'
import type { OrganizationOutgoingInvite } from '@/modules/organizations'
import { Users } from 'lucide-react'
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
    if (Number.isNaN(timestamp)) return 'Unknown'
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
        ? 'border-slate-200 bg-white/60 shadow-sm backdrop-blur-md'
        : 'border-slate-800 bg-slate-900/40 shadow-xl backdrop-blur-md'

    const mutedPanelClass = isLight
        ? 'border-slate-100 bg-slate-50/50 backdrop-blur-sm'
        : 'border-slate-800 bg-slate-950/40 backdrop-blur-sm'

    const inputClass = isLight
        ? 'border-slate-200 bg-white/70 text-slate-900 focus:border-emerald-500'
        : 'border-slate-700 bg-slate-950/70 text-slate-100 focus:border-emerald-400'

    const labelClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'

    return (
        <div className={`rounded-3xl border p-6 ${panelClass} shadow-xl backdrop-blur-3xl`}>
            <div className="mb-8 flex items-center gap-3">
                <div className={`rounded-xl border p-2 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <Users className="h-4 w-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                </div>
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${labelClass}`}>Member Access & Invites</p>
                    <p className={`text-[10px] font-bold ${textMutedClass}`}>Securely manage organization members and active invitations.</p>
                </div>
            </div>
            <div className="divide-y divide-slate-200/5">
                {/* Invite Form Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 first:pt-0">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Invite New Member
                        </label>
                        <p className={`text-[11px] font-medium leading-relaxed ${textMutedClass}`}>
                            Expand your organization by inviting trusted teammates.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <form action={formAction} className="flex flex-col gap-4 max-w-xl">
                            <div>
                                <label htmlFor="invitedEmail" className={`mb-1.5 block text-[8px] font-black uppercase tracking-[0.14em] ${labelClass}`}>Email Address</label>
                                <input
                                    id="invitedEmail"
                                    name="invitedEmail"
                                    type="email"
                                    required
                                    disabled={!canManage || isPending}
                                    placeholder="teammate@company.com"
                                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 ${inputClass}`}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="memberRole" className={`mb-1.5 block text-[8px] font-black uppercase tracking-[0.14em] ${labelClass}`}>Assigned Role</label>
                                    <select
                                        id="memberRole"
                                        name="memberRole"
                                        defaultValue="member"
                                        disabled={!canManage || isPending}
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 ${inputClass}`}
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="expiresInDays" className={`mb-1.5 block text-[8px] font-black uppercase tracking-[0.14em] ${labelClass}`}>Link Validity (Days)</label>
                                    <input
                                        id="expiresInDays"
                                        name="expiresInDays"
                                        type="number"
                                        min={1}
                                        max={30}
                                        defaultValue={7}
                                        disabled={!canManage || isPending}
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 ${inputClass}`}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={!canManage || isPending}
                                className="w-fit h-10 px-8 mt-2 font-black uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                {isPending ? 'Processing...' : 'Send Invitation'}
                            </Button>
                        </form>
                    </div>
                </div>

                {!canManage && (
                    <div className="py-4">
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-amber-200/50 bg-amber-50/20 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-700 backdrop-blur-sm shadow-sm"
                        >
                            Access restricted. Only organization owners can manage invitations.
                        </motion.div>
                    </div>
                )}

                <AnimatePresence>
                    {(notice.error || notice.success) && (
                        <div className="py-4">
                            {notice.error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="rounded-xl border border-rose-200/50 bg-rose-50/30 px-4 py-3 text-xs font-semibold text-rose-700 backdrop-blur-sm"
                                >
                                    {notice.error}
                                </motion.div>
                            )}

                            {notice.success && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3 rounded-xl border border-emerald-200/50 bg-emerald-50/30 px-4 py-4 text-sm text-emerald-800 backdrop-blur-sm"
                                >
                                    <p className="font-bold">{notice.success}</p>
                                    {state.inviteLink && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/70">Secure Invite Link</p>
                                            <div className="flex items-center gap-2 rounded-lg border border-emerald-200/50 bg-white/80 px-3 py-2 font-mono text-[11px] text-emerald-900 shadow-sm">
                                                <span className="truncate">{state.inviteLink}</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    )}
                </AnimatePresence>

                {/* Pending Invites Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Active Invitations
                        </label>
                        <p className={`text-[11px] font-medium leading-relaxed ${textMutedClass}`}>
                            Monitor and manage secure access tokens currently in circulation.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className={`rounded-2xl border overflow-hidden max-w-xl ${mutedPanelClass}`}>
                            <div className="flex items-center justify-between border-b border-slate-200/50 px-4 py-2.5 bg-slate-50/30">
                                <p className={`text-[9px] font-black uppercase tracking-[0.1em] ${labelClass}`}>
                                    Pending ({pendingInvites.length})
                                </p>
                            </div>

                            <div className="divide-y divide-slate-200/30">
                                {pendingInvites.length === 0 ? (
                                    <div className={`px-5 py-8 text-center text-[11px] font-bold italic ${textMutedClass}`}>
                                        No active invitations at this time.
                                    </div>
                                ) : (
                                    pendingInvites.map((invite) => (
                                        <motion.div
                                            key={invite.id}
                                            className="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50 transition-colors"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <div className="space-y-0.5">
                                                <p className={`text-xs font-black ${textMainClass}`}>{invite.invited_email}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="h-4 px-1 text-[8px] font-black uppercase tracking-tighter border-slate-200 text-slate-500">
                                                        {invite.member_role}
                                                    </Badge>
                                                    <span className={`text-[10px] font-bold ${textMutedClass}`}>
                                                        Expires {formatDate(invite.expires_at)}
                                                    </span>
                                                </div>
                                            </div>

                                            <form action={revokeOrganizationInviteAction}>
                                                <input type="hidden" name="inviteId" value={invite.id} />
                                                <Button
                                                    type="submit"
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={!canManage}
                                                    className="h-7 px-3 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                                >
                                                    Revoke
                                                </Button>
                                            </form>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
