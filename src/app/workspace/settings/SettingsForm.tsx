'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useActionState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTransientActionNotice } from '@/lib/use-transient-action-notice'
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
    )
}
