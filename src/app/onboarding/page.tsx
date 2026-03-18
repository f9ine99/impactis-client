import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getWorkspacePath } from '@/modules/auth'
import { hasOrganizationMembershipForUser } from '@/modules/organizations'
import { ONBOARDING_QUESTIONS_PATH } from '@/modules/onboarding'

export default async function OnboardingPage() {
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

    redirect(ONBOARDING_QUESTIONS_PATH)
}
