import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getOnboardingPath } from '@/modules/onboarding'
import { getWorkspaceBootstrapForCurrentUser } from '@/modules/workspace'
import { hasOrganizationMembershipForUser } from '@/modules/organizations'
import DiscoveryPageClient from './DiscoveryPageClient'

export default async function DiscoveryPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if (!session) redirect('/auth/login')

    const user = session.user
    const bootstrapSnapshot = await getWorkspaceBootstrapForCurrentUser(null as any, user as any)
    const { membership } = bootstrapSnapshot

    if (!membership) {
        const hasMembership = await hasOrganizationMembershipForUser(null as any, user as any, { failOpenOnRequestError: false })
        if (!hasMembership) redirect(getOnboardingPath())
        return (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
                <p className="text-slate-500">Could not load discovery. Try refreshing.</p>
            </div>
        )
    }

    const viewerOrgType = membership.organization?.type ?? 'startup'
    const viewerOrgId = membership.organization?.id ?? ''

    return (
        <div className="flex flex-1 flex-col overflow-auto p-6">
            <DiscoveryPageClient
                viewerOrgId={viewerOrgId}
                viewerOrgType={viewerOrgType as 'startup' | 'investor' | 'advisor'}
                initialFeed={bootstrapSnapshot.discovery_feed ?? []}
            />
        </div>
    )
}
