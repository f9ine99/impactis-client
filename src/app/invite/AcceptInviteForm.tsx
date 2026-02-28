'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import {
    acceptOrganizationInviteAction,
    type AcceptOrganizationInviteActionState,
} from './actions'

type AcceptInviteFormProps = {
    inviteToken: string
}

const initialState: AcceptOrganizationInviteActionState = {
    error: null,
    success: null,
}

export default function AcceptInviteForm({ inviteToken }: AcceptInviteFormProps) {
    const [state, formAction, isPending] = useActionState(acceptOrganizationInviteAction, initialState)

    return (
        <form action={formAction} className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
            <input type="hidden" name="inviteToken" value={inviteToken} />

            <p className="text-sm text-gray-600">
                Accept this invite to join the organization. You can belong to multiple organizations.
            </p>

            {state.error ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                    {state.error}
                </p>
            ) : null}

            {state.success ? (
                <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700">
                    <p>{state.success}</p>
                    <Link
                        href="/workspace"
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-emerald-800"
                    >
                        Open Workspace
                    </Link>
                </div>
            ) : null}

            <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-xl bg-[#0B3D2E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#082a20] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isPending ? 'Accepting...' : 'Accept Invite'}
            </button>
        </form>
    )
}
