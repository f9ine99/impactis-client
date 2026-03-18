import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { apiRequest } from '@/lib/api/rest-client'
import { getBetterAuthToken } from '@/lib/better-auth-token'
import { getOnboardingPath, getOnboardingQuestionsPath } from '@/modules/onboarding'
import { getWorkspaceIdentityForUser } from '@/modules/workspace'
import WorkspaceHeader from './WorkspaceHeader'
import WorkspaceLayoutShell from './WorkspaceLayoutShell'
import { WorkspaceThemeProvider } from './WorkspaceThemeContext'

function toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

export default async function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        redirect('/auth/login')
    }

    const user = session.user
    const identitySnapshot = await getWorkspaceIdentityForUser(null as any, user as any)
    const { profile, membership } = identitySnapshot

    if (!membership) {
        redirect(getOnboardingPath())
    }

    const cookieStore = await cookies()
    const themeCookie = cookieStore.get('workspace_theme')?.value
    // Default to light when no cookie (match root layout script default)
    const isLight = themeCookie !== 'dark'

    const org = membership?.organization
    const workspaceLabel = org ? `${toTitleCase(org.type)} workspace` : 'Workspace'
    const displayName = profile?.full_name?.trim() || org?.name || 'User'
    const organizationType = org?.type ?? 'startup'

    const token = await getBetterAuthToken()
    const onboardingMe = token
        ? await apiRequest<{
            onboarding?: { blocked?: boolean; missing?: string[] }
            scores?: { overall_score?: number } | null
        }>({
            path: '/v1/onboarding/me',
            method: 'GET',
            accessToken: token,
        })
        : null

    return (
        <WorkspaceThemeProvider initialIsLight={isLight}>
            <WorkspaceLayoutShell
                initialIsLight={isLight}
                membership={membership}
                profile={profile ?? { id: user.id, full_name: null, location: null, bio: null, avatar_url: null, phone: null, headline: null, website_url: null, linkedin_url: null, timezone_name: null, preferred_contact_method: null, profile_completeness_percent: null }}
                organizationCoreTeam={[]}
                verificationMeta={null}
                workspaceLabel={workspaceLabel}
                onboardingMe={onboardingMe}
                header={
                    <WorkspaceHeader
                        workspaceLabel={workspaceLabel}
                        displayName={displayName}
                        email={user.email ?? null}
                        avatarUrl={profile?.avatar_url}
                        initialIsLight={isLight}
                        organizationType={organizationType}
                    />
                }
            >
                {children}
            </WorkspaceLayoutShell>
        </WorkspaceThemeProvider>
    )
}
