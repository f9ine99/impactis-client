import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getOnboardingPath } from '@/modules/onboarding'
import { getWorkspaceIdentityForUser } from '@/modules/workspace'
import AdminPageClient from './AdminPageClient'

export default async function AdminPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) redirect('/auth/login')

    const user = session.user
    const identitySnapshot = await getWorkspaceIdentityForUser(null as any, user as any)
    if (!identitySnapshot?.membership) redirect(getOnboardingPath())

    const cookieStore = await cookies()
    const isLight = cookieStore.get('workspace_theme')?.value !== 'dark'

    return <AdminPageClient isLight={isLight} />
}

