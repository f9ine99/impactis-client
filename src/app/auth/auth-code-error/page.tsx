import Link from 'next/link'

export default function AuthCodeErrorPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-4 py-20">
            <section className="mx-auto max-w-md rounded-3xl border border-red-100 bg-white p-10 shadow-xl">
                <h1 className="text-2xl font-black text-gray-900">Authentication Error</h1>
                <p className="mt-3 text-gray-600">
                    The authentication link is invalid or has expired. Please try signing in again.
                </p>
                <div className="mt-8">
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center justify-center rounded-xl bg-[#0B3D2E] px-5 py-3 font-semibold text-white hover:bg-[#082a20]"
                    >
                        Go To Login
                    </Link>
                </div>
            </section>
        </main>
    )
}
