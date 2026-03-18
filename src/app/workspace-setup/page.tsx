import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { hasOrganizationMembershipForUser } from '@/modules/organizations'
import { getWorkspacePath } from '@/modules/auth'
import { mapAppRoleToOrganizationType, type OrganizationType } from '@/modules/organizations'
import CreateOrgForm from './CreateOrgForm'
import GoToWorkspace from './GoToWorkspace'

function normalizeText(value: unknown): string {
    if (typeof value !== 'string') return ''
    const t = String(value).trim()
    return t.length > 0 ? t : ''
}

function normalizeTextArray(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
}

export default async function WorkspaceSetupPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        redirect('/auth/login')
    }

    const user = session.user as any
    const hasMembership = await hasOrganizationMembershipForUser(null as any, user, {
        failOpenOnRequestError: false,
    })

    if (hasMembership) {
        redirect(getWorkspacePath())
    }

    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>
    const role =
        typeof metadata.role === 'string'
            ? metadata.role
            : typeof metadata.intended_org_type === 'string'
                ? metadata.intended_org_type
                : 'startup'
    const metadataOrgType = metadata.intended_org_type ?? metadata.role
    const defaultOrganizationType = (mapAppRoleToOrganizationType(metadataOrgType ?? role) ?? 'startup') as OrganizationType
    const defaultOrganizationName = normalizeText(metadata.company)
    const defaultLocation = normalizeText(metadata.location)
    const defaultIndustryTags = normalizeTextArray(metadata.industry_tags)

    return (
        <main className="min-h-screen bg-white px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl flex-col items-center justify-center">
                <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Create your organization</h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Create your first organization to continue to onboarding.
                    </p>
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/50">
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                            You can update these details later in workspace settings.
                        </p>
                    </div>
                    <CreateOrgForm
                        defaultOrganizationType={defaultOrganizationType}
                        defaultOrganizationName={defaultOrganizationName}
                        defaultLocation={defaultLocation}
                        defaultIndustryTags={Array.from(new Set(defaultIndustryTags))}
                    />
                    <div className="mt-6 flex justify-center">
                        <GoToWorkspace inline />
                    </div>
                </section>
            </div>
        </main>
    )
}
