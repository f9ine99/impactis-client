import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdminUser } from '@/modules/admin'
import { getPostAuthRedirectPath } from '@/modules/auth'
import {
    hasOrganizationMembershipForUser,
    listOrganizationsWithVerification,
    type OrganizationVerificationOverview,
    type OrganizationVerificationStatus,
} from '@/modules/organizations'
import { getResolvedProfileForUser } from '@/modules/profiles'
import { updateOrganizationVerificationAction } from './actions'

function getStatusVisual(status: OrganizationVerificationStatus): {
    badgeClassName: string
    label: string
} {
    if (status === 'approved') {
        return {
            badgeClassName: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300',
            label: 'Approved',
        }
    }

    if (status === 'pending') {
        return {
            badgeClassName: 'border-amber-500/30 bg-amber-500/20 text-amber-300',
            label: 'Pending',
        }
    }

    if (status === 'rejected') {
        return {
            badgeClassName: 'border-rose-500/30 bg-rose-500/20 text-rose-300',
            label: 'Rejected',
        }
    }

    return {
        badgeClassName: 'border-slate-500/40 bg-slate-500/20 text-slate-300',
        label: 'Unverified',
    }
}

function formatDate(value: string): string {
    const parsed = Date.parse(value)
    if (Number.isNaN(parsed)) {
        return 'Unknown'
    }

    return new Date(parsed).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    })
}

export default async function AdminPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    if (!isPlatformAdminUser(user)) {
        const hasOrganizationMembership = await hasOrganizationMembershipForUser(supabase, user)
        redirect(getPostAuthRedirectPath(hasOrganizationMembership))
    }

    const profile = await getResolvedProfileForUser(supabase, user)
    const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? 'Admin'

    let configurationWarning: string | null = null
    let organizations: OrganizationVerificationOverview[] = []

    try {
        organizations = await listOrganizationsWithVerification(supabase, 100)
    } catch (error) {
        configurationWarning = error instanceof Error
            ? error.message
            : 'Unable to load organization verification overview right now.'
    }

    const pendingCount = organizations.filter((entry) => entry.verification.status === 'pending').length
    const approvedCount = organizations.filter((entry) => entry.verification.status === 'approved').length
    const reviewableCount = organizations.filter(
        (entry) => entry.organization.type === 'advisor' || entry.organization.type === 'investor'
    ).length

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
            <section className="mx-auto max-w-5xl rounded-3xl border border-slate-700 bg-slate-900 p-10 shadow-2xl">
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-300/80">
                    Platform Admin
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-tight">
                    Welcome, {firstName}
                </h1>
                <p className="mt-4 text-slate-300">
                    This admin area is isolated from member onboarding and workspace routes.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Organizations</p>
                        <p className="mt-2 text-3xl font-black text-slate-100">{organizations.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Pending Review</p>
                        <p className="mt-2 text-3xl font-black text-amber-300">{pendingCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Approved</p>
                        <p className="mt-2 text-3xl font-black text-emerald-300">{approvedCount}</p>
                    </div>
                </div>

                {configurationWarning ? (
                    <p className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">
                        {configurationWarning}
                    </p>
                ) : null}
                {!configurationWarning && organizations.length > 0 && reviewableCount === 0 ? (
                    <p className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm font-semibold text-slate-300">
                        Approve/Reject actions are available for advisor and investor organizations only.
                    </p>
                ) : null}

                <div className="mt-8 overflow-hidden rounded-2xl border border-slate-700">
                    <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr] gap-3 border-b border-slate-700 bg-slate-800 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        <p>Organization</p>
                        <p>Type</p>
                        <p>Verification</p>
                        <p>Created</p>
                        <p>Actions</p>
                    </div>
                    <div className="divide-y divide-slate-800 bg-slate-900/80">
                        {organizations.length === 0 ? (
                            <p className="px-4 py-6 text-sm font-medium text-slate-400">
                                No organizations available yet.
                            </p>
                        ) : (
                            organizations.map((entry) => {
                                const statusVisual = getStatusVisual(entry.verification.status)
                                const isReviewableOrg =
                                    entry.organization.type === 'advisor'
                                    || entry.organization.type === 'investor'

                                return (
                                    <div
                                        key={entry.organization.id}
                                        className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr] gap-3 px-4 py-4 text-sm"
                                    >
                                        <p className="font-semibold text-slate-100">{entry.organization.name}</p>
                                        <p className="capitalize text-slate-300">{entry.organization.type}</p>
                                        <p>
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${statusVisual.badgeClassName}`}
                                            >
                                                {statusVisual.label}
                                            </span>
                                        </p>
                                        <p className="text-slate-400">{formatDate(entry.organization.created_at)}</p>
                                        {isReviewableOrg ? (
                                            <form action={updateOrganizationVerificationAction} className="flex items-center gap-2">
                                                <input type="hidden" name="orgId" value={entry.organization.id} />
                                                <button
                                                    type="submit"
                                                    name="nextStatus"
                                                    value="approved"
                                                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-500/30"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    type="submit"
                                                    name="nextStatus"
                                                    value="rejected"
                                                    className="rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-rose-200 transition hover:bg-rose-500/30"
                                                >
                                                    Reject
                                                </button>
                                            </form>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled
                                                        className="cursor-not-allowed rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled
                                                        className="cursor-not-allowed rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                    Advisor/Investor only
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
                <div className="mt-10">
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
                        >
                            Sign Out
                        </button>
                    </form>
                </div>
            </section>
        </main>
    )
}
