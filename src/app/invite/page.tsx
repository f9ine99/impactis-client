import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AcceptInviteForm from './AcceptInviteForm'

function normalizeSearchParam(value: string | string[] | undefined): string | null {
    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : null
    }

    if (Array.isArray(value)) {
        for (const entry of value) {
            const trimmed = entry.trim()
            if (trimmed.length > 0) {
                return trimmed
            }
        }
    }

    return null
}

export default async function InvitePage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string | string[] }>
}) {
    const resolvedSearchParams = await searchParams
    const inviteToken = normalizeSearchParam(resolvedSearchParams.token)

    if (!inviteToken) {
        return (
            <main className="min-h-screen bg-gray-50 px-4 py-20">
                <section className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-10 shadow-xl">
                    <h1 className="text-3xl font-black text-gray-900">Invalid invite link</h1>
                    <p className="mt-3 text-gray-600">
                        This invite link is missing a token. Ask the organization owner to generate a new link.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center justify-center rounded-xl bg-[#0B3D2E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#082a20]"
                        >
                            Go To Login
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Back To Home
                        </Link>
                    </div>
                </section>
            </main>
        )
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const nextPath = `/invite?token=${encodeURIComponent(inviteToken)}`

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-20">
            <section className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-10 shadow-xl">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0B3D2E]/60">Organization Invite</p>
                <h1 className="mt-4 text-3xl font-black text-gray-900">Join Organization</h1>

                {!user ? (
                    <>
                        <p className="mt-3 text-gray-600">
                            Sign in or create an account with the invited email address, then return here to accept the invite.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
                                className="inline-flex items-center justify-center rounded-xl bg-[#0B3D2E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#082a20]"
                            >
                                Sign In
                            </Link>
                            <Link
                                href={`/auth/signup?next=${encodeURIComponent(nextPath)}`}
                                className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Create Account
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="mt-3 text-gray-600">
                            Signed in as{' '}
                            <span className="font-semibold text-gray-900">{user.email ?? 'unknown email'}</span>.
                        </p>
                        <AcceptInviteForm inviteToken={inviteToken} />
                    </>
                )}
            </section>
        </main>
    )
}
