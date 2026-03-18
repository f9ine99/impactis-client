import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getOnboardingPath } from '@/modules/onboarding'
import { getWorkspaceIdentityForUser } from '@/modules/workspace'
import { getWorkspaceSettingsSnapshotForCurrentUser } from '@/modules/workspace/workspace.repository'
import DataRoomSection from '../settings/DataRoomSection'
import DataRoomAccessClient from './DataRoomAccessClient'

export default async function WorkspaceDataRoomPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        redirect('/auth/login')
    }

    const user = session.user
    const identitySnapshot = await getWorkspaceIdentityForUser(null as any, user as any)
    const { membership } = identitySnapshot
    if (!membership) {
        redirect(getOnboardingPath())
    }

    const cookieStore = await cookies()
    const themeCookie = cookieStore.get('workspace_theme')?.value
    const isLight = themeCookie !== 'dark'

    const settingsSnapshot = await getWorkspaceSettingsSnapshotForCurrentUser(null as any, {
        section: 'settings-data-room',
        userId: user.id,
    })
    const snapshotAny = settingsSnapshot as any
    const orgType = membership.organization.type

    const canEdit = membership.member_role === 'owner'
    const mutedPanelClass = isLight
        ? 'border-slate-200 bg-slate-50 shadow-sm ring-1 ring-slate-200/40'
        : 'border-white/5 bg-slate-900/60'
    const panelClass = isLight ? 'border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/40' : 'border-white/5 bg-slate-900/80'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const titleMutedClass = isLight ? 'text-slate-600' : 'text-slate-300'
    const labelClass = isLight ? 'text-slate-600' : 'text-slate-300'

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10">
            <h1 className={`text-2xl font-black ${textMainClass}`}>Data Room</h1>
            <p className={`mt-2 text-sm font-semibold ${textMutedClass}`}>
                {orgType === 'startup'
                    ? 'Upload and manage documents for investors.'
                    : 'Request access to startup data rooms and review documents securely.'}
            </p>
            <div className="mt-8">
                {orgType === 'startup' ? (
                    <DataRoomSection
                        canEdit={canEdit}
                        isLight={isLight}
                        panelClass={panelClass}
                        mutedPanelClass={mutedPanelClass}
                        labelClass={labelClass}
                        textMainClass={textMainClass}
                        textMutedClass={textMutedClass}
                        titleMutedClass={titleMutedClass}
                        featureGate={snapshotAny?.data_room_feature_gate ?? null}
                        documents={snapshotAny?.startup_data_room_documents ?? []}
                    />
                ) : (
                    <DataRoomAccessClient />
                )}
            </div>
        </main>
    )
}

