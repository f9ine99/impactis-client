import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPostAuthRedirectPath } from '@/modules/auth'
import {
    hasOrganizationMembershipForUser,
    mapAppRoleToOrganizationType,
    type OrganizationType,
} from '@/modules/organizations'
import OnboardingForm from './OnboardingForm'

function resolveDefaultOrganizationType(value: unknown): OrganizationType {
    return mapAppRoleToOrganizationType(value) ?? 'startup'
}

function normalizeText(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : ''
}

function normalizeTextArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
}

export default async function OnboardingPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const hasMembership = await hasOrganizationMembershipForUser(supabase, user, {
        failOpenOnRequestError: true,
    })
    if (hasMembership) {
        redirect(getPostAuthRedirectPath(true))
    }

    const metadata = user.user_metadata as Record<string, unknown> | undefined
    const metadataOrgType = metadata?.intended_org_type
    const metadataRole = metadata?.role
    const metadataCompany = metadata?.company
    const metadataLocation = metadata?.location
    const metadataIndustryTags = metadata?.industry_tags

    const defaultOrganizationType = resolveDefaultOrganizationType(metadataOrgType ?? metadataRole)
    const defaultOrganizationName = normalizeText(metadataCompany)
    const defaultLocation = normalizeText(metadataLocation)
    const defaultIndustryTags = normalizeTextArray(metadataIndustryTags)

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-20">
            <section className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-10 shadow-xl">
                <h1 className="text-3xl font-black text-gray-900">Finish your onboarding</h1>
                <p className="mt-3 text-gray-600">
                    Your account is active. Create your first organization to unlock the workspace.
                </p>
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
                    <p className="text-sm font-semibold text-emerald-800">
                        You can always update details later. For now we need your org identity and type.
                    </p>
                </div>

                <OnboardingForm
                    defaultOrganizationType={defaultOrganizationType}
                    defaultOrganizationName={defaultOrganizationName}
                    defaultLocation={defaultLocation}
                    defaultIndustryTags={Array.from(new Set(defaultIndustryTags))}
                />

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Back To Home
                    </Link>
                    <form action="/auth/signout" method="post" className="w-full sm:w-auto">
                        <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center rounded-xl bg-[#0B3D2E] px-5 py-3 font-semibold text-white hover:bg-[#082a20]"
                        >
                            Sign Out
                        </button>
                    </form>
                </div>
            </section>
        </main>
    )
}
