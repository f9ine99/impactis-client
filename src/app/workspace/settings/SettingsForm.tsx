'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useActionState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Pencil } from 'lucide-react'
import { useTransientActionNotice } from '@/lib/use-transient-action-notice'
import { cn } from '@/lib/utils'
import type {
    StartupPitchDeckMediaKind,
    StartupPostStatus,
    StartupReadiness,
} from '@/modules/startups'
import {
    updateOrganizationIdentitySectionAction,
    updateStartupReadinessSectionAction,
    updateStartupDiscoverySectionAction,
    type SettingsSectionActionState,
} from './actions'

import { IdentitySection } from './sections/IdentitySection'
import { ReadinessSection } from './sections/ReadinessSection'
import { DiscoverySection } from './sections/DiscoverySection'

type SettingsFormProps = {
    organizationType: 'startup' | 'advisor' | 'investor'
    defaultOrganizationName: string
    defaultOrganizationLocation: string
    defaultOrganizationLogoUrl: string
    defaultOrganizationIndustryTags: string
    defaultStartupWebsiteUrl: string
    defaultStartupPitchDeckUrl: string
    defaultStartupPitchDeckMediaKind: StartupPitchDeckMediaKind | null
    defaultStartupPitchDeckFileName: string
    defaultStartupPitchDeckFileSizeBytes: number | null
    defaultStartupTeamOverview: string
    defaultStartupCompanyStage: string
    defaultStartupFoundingYear: number | null
    defaultStartupTeamSize: number | null
    defaultStartupTargetMarket: string
    defaultStartupBusinessModel: string
    defaultStartupTractionSummary: string
    defaultStartupFinancialSummary: string
    defaultStartupLegalSummary: string
    defaultStartupFinancialDocUrl: string
    defaultStartupFinancialDocFileName: string
    defaultStartupFinancialDocFileSizeBytes: number | null
    defaultStartupLegalDocUrl: string
    defaultStartupLegalDocFileName: string
    defaultStartupLegalDocFileSizeBytes: number | null
    defaultInvestorThesis: string
    defaultInvestorSectorTags: string
    defaultInvestorCheckSizeMinUsd: number | null
    defaultInvestorCheckSizeMaxUsd: number | null
    defaultStartupPostTitle: string
    defaultStartupPostSummary: string
    defaultStartupPostStage: string
    defaultStartupPostLocation: string
    defaultStartupPostIndustryTags: string
    defaultStartupPostStatus: StartupPostStatus
    startupReadiness: StartupReadiness | null
    sectionView?: 'identity' | 'readiness' | 'discovery'
    canEdit: boolean
    isLight?: boolean
}

const initialState: SettingsSectionActionState = {
    error: null,
    success: null,
}

export default function SettingsForm(props: SettingsFormProps) {
    const { isLight = true, sectionView = 'identity', organizationType } = props
    const [isEditMode, setIsEditMode] = useState(false)

    const [identityState, identityAction, isIdentityPending] = useActionState(updateOrganizationIdentitySectionAction, initialState)
    const [readinessState, readinessAction, isReadinessPending] = useActionState(updateStartupReadinessSectionAction, initialState)
    const [discoveryState, discoveryAction, isDiscoveryPending] = useActionState(updateStartupDiscoverySectionAction, initialState)

    const identityNotice = useTransientActionNotice(identityState)
    const readinessNotice = useTransientActionNotice(readinessState)
    const discoveryNotice = useTransientActionNotice(discoveryState)

    useEffect(() => {
        if (identityNotice.success) toast.success('Organization identity saved')
        if (identityNotice.error) toast.error('Identity update failed', { description: identityNotice.error })
    }, [identityNotice])

    useEffect(() => {
        if (readinessNotice.success) toast.success('Readiness fields saved')
        if (readinessNotice.error) toast.error('Readiness update failed', { description: readinessNotice.error })
    }, [readinessNotice])

    useEffect(() => {
        if (discoveryNotice.success) toast.success('Discovery post saved')
        if (discoveryNotice.error) toast.error('Discovery update failed', { description: discoveryNotice.error })
    }, [discoveryNotice])

    const inputClass = isLight
        ? 'border-slate-200 bg-white/50 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
        : 'border-slate-800 bg-slate-950/50 text-slate-100 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20'

    const labelClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const titleClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const mutedPanelClass = isLight
        ? 'border-slate-200 bg-slate-50/50 backdrop-blur-sm shadow-sm'
        : 'border-slate-800 bg-slate-900/30 backdrop-blur-sm shadow-xl'

    const isStartup = organizationType === 'startup'
    const resolvedSectionView = isStartup && (sectionView === 'readiness' || sectionView === 'discovery')
        ? sectionView
        : 'identity'

    return (
        <div className="space-y-8">
            {/* Mode Toggle Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex flex-col gap-1">
                    <h2 className={`text-sm font-black uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                        Organization Hub
                    </h2>
                    <p className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {isEditMode ? 'You are currently editing organization properties.' : 'Viewing organization properties in read-only mode.'}
                    </p>
                </div>

                {props.canEdit ? (
                    <div className={cn('flex items-center gap-1 rounded-xl border p-1',
                        isLight ? 'border-slate-200 bg-slate-100/50' : 'border-white/5 bg-slate-950/40'
                    )}>
                        <button
                            type="button"
                            onClick={() => setIsEditMode(false)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300',
                                !isEditMode
                                    ? 'bg-blue-600 shadow-lg shadow-blue-500/25 text-white'
                                    : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                            )}
                        >
                            <Eye className="h-3 w-3" />
                            ReadOnly
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditMode(true)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300',
                                isEditMode
                                    ? 'bg-blue-600 shadow-lg shadow-blue-500/25 text-white'
                                    : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                            )}
                        >
                            <Pencil className="h-3 w-3" />
                            Edit Mode
                        </button>
                    </div>
                ) : (
                    <div className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border',
                        isLight ? 'border-slate-100 bg-slate-50 text-slate-400 italic' : 'border-white/5 bg-slate-950/50 text-slate-500 italic'
                    )}>
                        <Eye className="h-3 w-3 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Permanent ReadOnly</span>
                    </div>
                )}
            </div>

            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={resolvedSectionView}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        {resolvedSectionView === 'identity' && (
                            <IdentitySection
                                {...props}
                                canEdit={isEditMode}
                                isLight={isLight}
                                action={identityAction}
                                isPending={isIdentityPending}
                                state={identityState}
                                mutedPanelClass={mutedPanelClass}
                                labelClass={labelClass}
                                inputClass={inputClass}
                                textMutedClass={textMutedClass}
                                textMainClass={textMainClass}
                                titleClass={titleClass}
                            />
                        )}

                        {resolvedSectionView === 'readiness' && (
                            <ReadinessSection
                                {...props}
                                canEdit={isEditMode}
                                isLight={isLight}
                                action={readinessAction}
                                isPending={isReadinessPending}
                                state={readinessState}
                                mutedPanelClass={mutedPanelClass}
                                labelClass={labelClass}
                                inputClass={inputClass}
                                textMutedClass={textMutedClass}
                                textMainClass={textMainClass}
                                titleClass={titleClass}
                            />
                        )}

                        {resolvedSectionView === 'discovery' && (
                            <DiscoverySection
                                {...props}
                                canEdit={isEditMode}
                                isLight={isLight}
                                action={discoveryAction}
                                isPending={isDiscoveryPending}
                                state={discoveryState}
                                mutedPanelClass={mutedPanelClass}
                                labelClass={labelClass}
                                inputClass={inputClass}
                                textMutedClass={textMutedClass}
                                textMainClass={textMainClass}
                                titleClass={titleClass}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
