import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Pool } from 'pg'
import { auth } from '@/lib/auth'
import { getDashboardPathForRole, getPostAuthRedirectPath } from '@/modules/auth'
import { getPrimaryOrganizationMembershipByUserId, hasOrganizationMembershipForUser, mapAppRoleToOrganizationType, type OrganizationType } from '@/modules/organizations'
import { OnboardingEntryClient } from '../OnboardingEntryClient'
import CreateOrgForm from '@/app/workspace-setup/CreateOrgForm'
import { getWorkspacePath } from '@/modules/auth'

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

function getPool(): Pool {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) throw new Error('DATABASE_URL is not configured')
    return new Pool({ connectionString: databaseUrl })
}

async function getOnboardingDetailsFromDb(userId: string, role: string): Promise<Record<string, unknown>> {
    let pool: Pool | null = null
    try {
        pool = getPool()
        const orgType = role === 'startup' ? 'startup' : role === 'investor' ? 'investor' : 'advisor'
        const rows = await pool.query<{ details: unknown }>(
            `select details from public.user_onboarding_details where user_id = $1::uuid and organization_type = $2::text limit 1`,
            [userId, orgType]
        )
        const row = rows.rows[0]
        if (row?.details && typeof row.details === 'object' && !Array.isArray(row.details)) {
            return row.details as Record<string, unknown>
        }
        const metaRows = await pool.query<{ raw_user_meta_data: unknown }>(
            `select raw_user_meta_data from public.users where id = $1::uuid limit 1`,
            [userId]
        )
        const meta = metaRows.rows[0]?.raw_user_meta_data
        if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
            const data = (meta as Record<string, unknown>).onboardingData
            const roleData = data && typeof data === 'object' && (data as Record<string, unknown>)[role]
            if (roleData && typeof roleData === 'object' && !Array.isArray(roleData)) {
                return roleData as Record<string, unknown>
            }
        }
    } catch {
        /* DATABASE_URL missing or table missing: fall back to metadata */
    } finally {
        if (pool) {
            try {
                await pool.end()
            } catch {
                /* ignore */
            }
        }
    }
    return {}
}

export default async function OnboardingQuestionsPage(props: {
    searchParams?: Promise<{ view?: string }>
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        redirect('/auth/login')
    }

    const user = session.user as any
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>

    const membership = await getPrimaryOrganizationMembershipByUserId(user.id)

    const searchParams = (props.searchParams ? await props.searchParams : {}) as { view?: string }
    const isViewMode = searchParams?.view === '1'

    const questionnaire = (metadata.onboarding_questionnaire ?? null) as
        | { completed?: boolean; skipped?: boolean }
        | null
    const onboardingCompletedFlag = metadata.onboardingCompleted === true
    const onboardingSkippedFlag = metadata.onboardingSkipped === true
    const questionnaireDone = questionnaire?.completed === true || questionnaire?.skipped === true

    if (!isViewMode && (onboardingCompletedFlag || onboardingSkippedFlag || questionnaireDone)) {
        const destination =
            typeof metadata.role !== 'undefined'
                ? getDashboardPathForRole(metadata.role)
                : getPostAuthRedirectPath(true, { skipCache: true })
        redirect(destination)
    }

    const metadataRole =
        typeof metadata.role === 'string'
            ? metadata.role
            : typeof metadata.intended_org_type === 'string'
                ? metadata.intended_org_type
                : 'startup'
    const role = membership?.organization.type ?? metadataRole

    const onboardingStep =
        typeof metadata.onboardingStep === 'number' ? Math.max(0, Math.trunc(metadata.onboardingStep)) : 0

    const metadataOnboardingData =
        metadata.onboardingData && typeof metadata.onboardingData === 'object' && metadata.onboardingData !== null
            ? (metadata.onboardingData as Record<string, unknown>)
            : {}
    const metadataRoleData =
        metadataOnboardingData[role] && typeof metadataOnboardingData[role] === 'object' && metadataOnboardingData[role] !== null
            ? (metadataOnboardingData[role] as Record<string, unknown>)
            : {}

    const dbDetails = await getOnboardingDetailsFromDb(user.id, role)
    const initialValues =
        Object.keys(dbDetails).length > 0 ? { ...metadataRoleData, ...dbDetails } : metadataRoleData

    if (!membership) {
        // If the API is down / returning errors, `getPrimaryOrganizationMembershipByUserId`
        // returns null. Before showing CreateOrgForm (which would let the user create a
        // duplicate org), double-check with the fail-open check. If the server is simply
        // restarting, send them back to workspace so they land correctly once it's up.
        const hasMembership = await hasOrganizationMembershipForUser(user, { failOpenOnRequestError: true })
        if (hasMembership) {
            redirect(getWorkspacePath())
        }

        const metadataOrgType = metadata.intended_org_type ?? metadata.role
        const defaultOrganizationType = (mapAppRoleToOrganizationType(metadataOrgType ?? metadataRole) ?? 'startup') as OrganizationType
        const defaultOrganizationName = normalizeText(metadata.company)
        const defaultLocation = normalizeText(metadata.location)
        const defaultIndustryTags = Array.from(new Set(normalizeTextArray(metadata.industry_tags)))

        return (
            <main className="min-h-screen bg-white px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl flex-col items-center justify-center">
                    <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Create your organization</h1>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">
                            Create your first organization to continue onboarding.
                        </p>
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/50">
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                                This is now part of the same onboarding flow, so you will not see a duplicate first page anymore.
                            </p>
                        </div>
                        <CreateOrgForm
                            defaultOrganizationType={defaultOrganizationType}
                            defaultOrganizationName={defaultOrganizationName}
                            defaultLocation={defaultLocation}
                            defaultIndustryTags={defaultIndustryTags}
                        />
                    </section>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-white px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
                <OnboardingEntryClient role={role} initialStep={onboardingStep} initialValues={initialValues} />
            </div>
        </main>
    )
}

