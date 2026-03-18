'use client'

import { useState } from 'react'
import { createDefaultOrganizationAndRedirect } from '@/app/onboarding/actions'

type Props = { inline?: boolean; companyNameFromDb?: string | null }

export default function GoToWorkspace({ inline, companyNameFromDb }: Props) {
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGo = async () => {
        setPending(true)
        setError(null)
        const result = await createDefaultOrganizationAndRedirect(companyNameFromDb ?? undefined)
        if (result?.error) {
            setError(result.error)
            setPending(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-center">
            {error && <span className="text-xs font-semibold text-rose-600">{error}</span>}
            <button
                type="button"
                onClick={handleGo}
                disabled={pending}
                className="rounded-xl border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-70"
            >
                {pending ? 'Taking you…' : 'Already have an org? Go to workspace'}
            </button>
        </div>
    )
}
