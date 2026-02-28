'use client'

import { useActionState } from 'react'
import type { OrganizationType } from '@/modules/organizations'
import { completeOnboardingAction, type OnboardingActionState } from './actions'

type OnboardingFormProps = {
    defaultOrganizationType: OrganizationType
    defaultOrganizationName: string
    defaultLocation: string
    defaultIndustryTags: string[]
}

const initialState: OnboardingActionState = { error: null }

function toLabel(value: OrganizationType): string {
    if (value === 'startup') {
        return 'Startup'
    }

    if (value === 'investor') {
        return 'Investor'
    }

    return 'Advisor'
}

export default function OnboardingForm({
    defaultOrganizationType,
    defaultOrganizationName,
    defaultLocation,
    defaultIndustryTags,
}: OnboardingFormProps) {
    const [state, formAction, isPending] = useActionState(completeOnboardingAction, initialState)

    return (
        <form action={formAction} className="mt-8 space-y-5">
            <div>
                <label
                    htmlFor="organizationType"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500"
                >
                    Organization Type
                </label>
                <select
                    id="organizationType"
                    name="organizationType"
                    defaultValue={defaultOrganizationType}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-[#0B3D2E]"
                >
                    {(['startup', 'investor', 'advisor'] as const).map((organizationType) => (
                        <option key={organizationType} value={organizationType}>
                            {toLabel(organizationType)}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label
                    htmlFor="organizationName"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500"
                >
                    Organization Name
                </label>
                <input
                    id="organizationName"
                    name="organizationName"
                    defaultValue={defaultOrganizationName}
                    placeholder="Your organization name"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#0B3D2E]"
                />
            </div>

            <div>
                <label
                    htmlFor="organizationLocation"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500"
                >
                    Location
                </label>
                <input
                    id="organizationLocation"
                    name="organizationLocation"
                    defaultValue={defaultLocation}
                    placeholder="City, Country"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#0B3D2E]"
                />
            </div>

            <div>
                <label
                    htmlFor="organizationIndustryTags"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500"
                >
                    Industry Tags
                </label>
                <input
                    id="organizationIndustryTags"
                    name="organizationIndustryTags"
                    defaultValue={defaultIndustryTags.join(', ')}
                    placeholder="Fintech, Climate, Health"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#0B3D2E]"
                />
                <p className="mt-2 text-xs text-gray-500">Separate tags with commas.</p>
            </div>

            {state.error ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                    {state.error}
                </p>
            ) : null}

            <button
                type="submit"
                disabled={isPending}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#0B3D2E] px-5 py-3 font-semibold text-white transition hover:bg-[#082a20] disabled:opacity-60"
            >
                {isPending ? 'Creating workspace...' : 'Continue To Workspace'}
            </button>
        </form>
    )
}
