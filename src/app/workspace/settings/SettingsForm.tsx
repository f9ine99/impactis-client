'use client'

import { Building2, FileText, Globe2, Plus, Rocket, ShieldCheck, UploadCloud, X } from 'lucide-react'
import { useActionState, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { getAcronym, toTitleCase } from '@/lib/utils'
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

const ORGANIZATION_TAG_SUGGESTIONS = [
    'Technology',
    'Business',
    'Business Services',
    'Professional Services',
    'Consulting',
    'Marketing',
    'Advertising',
    'Sales',
    'Operations',
    'Agriculture',
    'AgriBusiness',
    'Political',
    'Politics',
    'Public Policy',
    'CampaignTech',
    'Nonprofit',
    'Social Impact',
    'International Development',
    'Humanitarian',
    'Fintech',
    'InsurTech',
    'RegTech',
    'WealthTech',
    'LendTech',
    'PropTech',
    'SaaS',
    'Vertical SaaS',
    'Developer Tools',
    'Cloud Infrastructure',
    'Data Infrastructure',
    'HealthTech',
    'MedTech',
    'BioTech',
    'Digital Therapeutics',
    'PharmaTech',
    'Mental Health',
    'FemTech',
    'EdTech',
    'Future of Work',
    'HRTech',
    'LegalTech',
    'GovTech',
    'CivicTech',
    'Climate',
    'CleanTech',
    'Energy Storage',
    'CarbonTech',
    'WaterTech',
    'Circular Economy',
    'AgriTech',
    'FoodTech',
    'Food Security',
    'AI',
    'Generative AI',
    'Robotics',
    'Automation',
    'IoT',
    'DeepTech',
    'Quantum',
    'Semiconductors',
    'SpaceTech',
    'Aerospace',
    'DefenseTech',
    'Cybersecurity',
    'Supply Chain',
    'LogisticsTech',
    'ManufacturingTech',
    'ConstructionTech',
    'Mobility',
    'E-commerce',
    'RetailTech',
    'Marketplaces',
    'Consumer Apps',
    'Creator Economy',
    'MediaTech',
    'Gaming',
    'TravelTech',
    'HospitalityTech',
    'SportsTech',
    'Real Estate',
    'Web3',
]

const STARTUP_DISCOVERY_TAG_SUGGESTIONS = [
    'B2B',
    'B2C',
    'Marketplace',
    'DeepTech',
    'Enterprise',
    'Developer Tools',
    'Web3',
    'Automation',
]

const INVESTOR_SECTOR_TAG_SUGGESTIONS = [
    'Fintech',
    'HealthTech',
    'Climate',
    'AI',
    'SaaS',
    'Cybersecurity',
    'Developer Tools',
    'LogisticsTech',
    'BioTech',
    'Marketplaces',
    'PropTech',
    'Education',
    'AgriTech',
    'DeepTech',
    'Mobility',
    'Consumer Apps',
]

function parseTagsFromText(value: string): string[] {
    return Array.from(
        new Set(
            value
                .split(',')
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
        )
    )
}

function serializeTags(tags: string[]): string {
    return tags.join(', ')
}

function normalizeTagValue(value: string): string {
    return value.replace(/\s+/g, ' ').trim()
}

function splitInputIntoTags(value: string): string[] {
    return value
        .split(',')
        .map((item) => normalizeTagValue(item))
        .filter((item) => item.length > 0)
}

function formatFileSize(value: number | null): string {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
        return 'Unknown size'
    }

    if (value < 1024 * 1024) {
        return `${Math.round(value / 1024)} KB`
    }

    return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function ReadinessAssetUploadCard(input: {
    id: string
    name: string
    label: string
    hint: string
    accept: string
    currentUrl: string
    currentFileName: string
    currentFileSizeBytes: number | null
    currentKindLabel?: string
    removeFieldName: string
    disabled: boolean
    isLight: boolean
}) {
    const shellClass = input.isLight
        ? 'border-slate-200 bg-white/70'
        : 'border-slate-700 bg-slate-950/40'
    const dropzoneClass = input.isLight
        ? 'border-slate-300 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/50'
        : 'border-slate-700 bg-slate-950 hover:border-emerald-500/40 hover:bg-emerald-500/5'
    const textMainClass = input.isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = input.isLight ? 'text-slate-500' : 'text-slate-400'
    const removeLabelClass = input.isLight
        ? 'border-slate-300 bg-white text-slate-600'
        : 'border-slate-700 bg-slate-900 text-slate-300'

    return (
        <div className={`rounded-2xl border p-4 ${shellClass}`}>
            <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-bold ${textMainClass}`}>{input.label}</p>
                <Badge variant={input.currentUrl ? 'success' : 'secondary'}>
                    {input.currentUrl ? 'Uploaded' : 'Missing'}
                </Badge>
            </div>
            <label htmlFor={input.id} className={`relative mt-3 block rounded-2xl border border-dashed p-4 transition-all ${dropzoneClass}`}>
                <input
                    id={input.id}
                    name={input.name}
                    type="file"
                    accept={input.accept}
                    disabled={input.disabled}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                <div className="pointer-events-none flex items-center gap-3">
                    <div className={`rounded-xl border p-2 ${input.isLight ? 'border-emerald-200 bg-emerald-50' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                        <UploadCloud className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-[0.12em] ${textMainClass}`}>
                            Drag and drop or click to upload
                        </p>
                        <p className={`mt-1 text-[11px] ${textMutedClass}`}>{input.hint}</p>
                    </div>
                </div>
            </label>

            {input.currentUrl ? (
                <div className={`mt-3 rounded-xl border p-3 ${shellClass}`}>
                    <div className="flex flex-wrap items-center gap-2">
                        {input.currentKindLabel ? <Badge variant="outline">{input.currentKindLabel}</Badge> : null}
                        <a
                            href={input.currentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-xs font-semibold text-emerald-500 hover:underline"
                        >
                            {input.currentFileName || 'Open current asset'}
                        </a>
                    </div>
                    <p className={`mt-1 text-xs ${textMutedClass}`}>{formatFileSize(input.currentFileSizeBytes)}</p>
                    <label className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${removeLabelClass}`}>
                        <input
                            type="checkbox"
                            name={input.removeFieldName}
                            value="1"
                            disabled={input.disabled}
                            className="h-3.5 w-3.5 rounded border-slate-300"
                        />
                        Remove current file
                    </label>
                </div>
            ) : null}
        </div>
    )
}

function TagEditor(input: {
    id: string
    name: string
    label: string
    description?: string
    placeholder: string
    defaultValue: string
    disabled: boolean
    suggestions: string[]
    inputClass: string
    labelClass: string
    textMutedClass: string
    isLight: boolean
    suggestionLimit?: number
}) {
    const initialTags = useMemo(() => parseTagsFromText(input.defaultValue), [input.defaultValue])
    const [tags, setTags] = useState<string[]>(initialTags)
    const [draft, setDraft] = useState('')

    useEffect(() => {
        setTags(initialTags)
    }, [initialTags])

    const tagsLookup = useMemo(() => new Set(tags.map((tag) => tag.toLowerCase())), [tags])
    const availableSuggestions = input.suggestions.filter((tag) => !tagsLookup.has(tag.toLowerCase()))

    function addTagsFromValue(rawValue: string) {
        const candidateTags = splitInputIntoTags(rawValue)
        if (candidateTags.length === 0) {
            return
        }

        setTags((previousTags) => {
            const seen = new Set(previousTags.map((tag) => tag.toLowerCase()))
            const nextTags = [...previousTags]

            for (const tag of candidateTags) {
                const key = tag.toLowerCase()
                if (!seen.has(key)) {
                    seen.add(key)
                    nextTags.push(tag)
                }
            }

            return nextTags
        })
    }

    function addTag(tag: string) {
        addTagsFromValue(tag)
        setDraft('')
    }

    function removeTag(tag: string) {
        const target = tag.toLowerCase()
        setTags((previousTags) => previousTags.filter((item) => item.toLowerCase() !== target))
    }

    function handleDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            if (draft.trim().length > 0) {
                addTag(draft)
            }
            return
        }

        if (event.key === 'Backspace' && draft.length === 0 && tags.length > 0) {
            event.preventDefault()
            setTags((previousTags) => previousTags.slice(0, -1))
        }
    }

    function handleDraftBlur() {
        if (draft.trim().length > 0) {
            addTag(draft)
        }
    }

    const containerClass = input.isLight
        ? 'border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-emerald-500/50'
        : 'border-slate-800 bg-slate-950/50 focus-within:bg-slate-950 focus-within:border-emerald-500/50'
    const chipClass = input.isLight
        ? 'border-slate-200 bg-white text-slate-700 shadow-sm'
        : 'border-slate-700 bg-slate-900 text-slate-200 shadow-xl'
    const textMainClass = input.isLight ? 'text-slate-900' : 'text-slate-100'

    return (
        <div className="sm:col-span-2">
            <label htmlFor={input.id} className={`mb-3 block text-[10px] font-black uppercase tracking-widest ${input.labelClass}`}>
                {input.label}
            </label>
            <input type="hidden" name={input.name} value={serializeTags(tags)} />

            <div className={`flex min-h-14 w-full flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 transition-all ${containerClass}`}>
                {tags.map((tag) => (
                    <span key={tag} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 ${chipClass}`}>
                        {tag}
                        {!input.disabled ? (
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="group relative rounded-full p-0.5"
                                aria-label={`Remove ${tag}`}
                            >
                                <div className="absolute inset-0 scale-50 rounded-full bg-rose-500 opacity-0 transition-all group-hover:scale-110 group-hover:opacity-100" />
                                <X className="relative h-3 w-3 transition-all group-hover:text-white" />
                            </button>
                        ) : null}
                    </span>
                ))}

                <input
                    id={input.id}
                    value={draft}
                    onChange={(event) => setDraft(normalizeTagValue(event.target.value))}
                    onKeyDown={handleDraftKeyDown}
                    onBlur={handleDraftBlur}
                    disabled={input.disabled}
                    placeholder={tags.length === 0 ? input.placeholder : 'Add more...'}
                    className={`min-w-[140px] flex-1 border-0 bg-transparent px-1 py-1 text-sm font-medium outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 ${textMainClass}`}
                />
            </div>

            {input.description ? (
                <p className={`mt-3 text-[10px] font-medium leading-relaxed ${input.textMutedClass}`}>{input.description}</p>
            ) : null}

            {availableSuggestions.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                    {availableSuggestions.slice(0, input.suggestionLimit ?? 10).map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            disabled={input.disabled}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${input.isLight
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                        >
                            <Plus className="h-3 w-3" />
                            {tag}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

export default function SettingsForm({
    organizationType,
    defaultOrganizationName,
    defaultOrganizationLocation,
    defaultOrganizationLogoUrl,
    defaultOrganizationIndustryTags,
    defaultStartupWebsiteUrl,
    defaultStartupPitchDeckUrl,
    defaultStartupPitchDeckMediaKind,
    defaultStartupPitchDeckFileName,
    defaultStartupPitchDeckFileSizeBytes,
    defaultStartupTeamOverview,
    defaultStartupCompanyStage,
    defaultStartupFoundingYear,
    defaultStartupTeamSize,
    defaultStartupTargetMarket,
    defaultStartupBusinessModel,
    defaultStartupTractionSummary,
    defaultStartupFinancialSummary,
    defaultStartupLegalSummary,
    defaultStartupFinancialDocUrl,
    defaultStartupFinancialDocFileName,
    defaultStartupFinancialDocFileSizeBytes,
    defaultStartupLegalDocUrl,
    defaultStartupLegalDocFileName,
    defaultStartupLegalDocFileSizeBytes,
    defaultInvestorThesis,
    defaultInvestorSectorTags,
    defaultInvestorCheckSizeMinUsd,
    defaultInvestorCheckSizeMaxUsd,
    defaultStartupPostTitle,
    defaultStartupPostSummary,
    defaultStartupPostStage,
    defaultStartupPostLocation,
    defaultStartupPostIndustryTags,
    defaultStartupPostStatus,
    startupReadiness,
    sectionView = 'identity',
    canEdit,
    isLight = true,
}: SettingsFormProps) {
    const [identityState, identityAction, isIdentityPending] = useActionState(updateOrganizationIdentitySectionAction, initialState)
    const [readinessState, readinessAction, isReadinessPending] = useActionState(updateStartupReadinessSectionAction, initialState)
    const [discoveryState, discoveryAction, isDiscoveryPending] = useActionState(updateStartupDiscoverySectionAction, initialState)
    const identityNotice = useTransientActionNotice(identityState)
    const readinessNotice = useTransientActionNotice(readinessState)
    const discoveryNotice = useTransientActionNotice(discoveryState)

    useEffect(() => {
        if (!identityNotice.success) {
            return
        }

        toast.success('Organization identity saved', {
            description: 'Core organization details were updated successfully.',
            duration: 3200,
            id: 'settings-identity-success',
        })
    }, [identityNotice.success])

    useEffect(() => {
        if (!identityNotice.error) {
            return
        }

        toast.error('Identity update failed', {
            description: identityNotice.error,
            duration: 4200,
            id: 'settings-identity-error',
        })
    }, [identityNotice.error])

    useEffect(() => {
        if (!readinessNotice.success) {
            return
        }

        toast.success('Readiness fields saved', {
            description: 'Startup readiness profile was updated.',
            duration: 3200,
            id: 'settings-readiness-success',
        })
    }, [readinessNotice.success])

    useEffect(() => {
        if (!readinessNotice.error) {
            return
        }

        toast.error('Readiness update failed', {
            description: readinessNotice.error,
            duration: 4200,
            id: 'settings-readiness-error',
        })
    }, [readinessNotice.error])

    useEffect(() => {
        if (!discoveryNotice.success) {
            return
        }

        toast.success('Discovery post saved', {
            description: 'Your discovery listing is now updated.',
            duration: 3200,
            id: 'settings-discovery-success',
        })
    }, [discoveryNotice.success])

    useEffect(() => {
        if (!discoveryNotice.error) {
            return
        }

        toast.error('Discovery update failed', {
            description: discoveryNotice.error,
            duration: 4200,
            id: 'settings-discovery-error',
        })
    }, [discoveryNotice.error])

    const panelClass = isLight
        ? 'border-slate-200 bg-white/90'
        : 'border-slate-800 bg-slate-900/70'
    const inputClass = isLight
        ? 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500'
        : 'border-slate-700 bg-slate-950 text-slate-100 focus:border-emerald-400'
    const labelClass = isLight
        ? 'text-slate-500'
        : 'text-slate-400'
    const textMutedClass = isLight
        ? 'text-slate-600'
        : 'text-slate-400'
    const titleClass = isLight
        ? 'text-slate-900'
        : 'text-slate-100'
    const mutedPanelClass = isLight
        ? 'border-slate-200 bg-slate-50'
        : 'border-slate-800 bg-slate-950/70'
    const isStartup = organizationType === 'startup'
    const readinessScore = startupReadiness?.readiness_score ?? 0
    const profileCompletionPercent = startupReadiness?.profile_completion_percent ?? 0
    const readinessEligible = startupReadiness?.eligible_for_discovery_post ?? false
    const requiredDocsUploaded = startupReadiness?.required_docs_uploaded ?? false
    const readinessMissingSteps = startupReadiness?.missing_steps ?? []
    const readinessSectionScores = startupReadiness?.section_scores ?? []
    const readinessChecks = [
        { label: 'Profile completion >= 70%', done: profileCompletionPercent >= 70 },
        { label: 'Readiness score >= 60', done: readinessScore >= 60 },
        { label: 'Required docs uploaded', done: requiredDocsUploaded },
    ]
    const readinessBarColor = readinessEligible
        ? 'bg-emerald-500'
        : readinessScore >= 60
            ? 'bg-amber-500'
            : 'bg-rose-500'
    const readinessSectionLabelMap: Record<string, string> = {
        team: 'Team',
        product: 'Product',
        market: 'Market',
        traction: 'Traction',
        financials: 'Financials',
        legal: 'Legal',
        pitch_materials: 'Pitch Materials',
    }
    const resolvedSectionView = isStartup && (sectionView === 'readiness' || sectionView === 'discovery')
        ? sectionView
        : 'identity'

    const identitySection = (
        <div className={`rounded-xl border p-4 ${mutedPanelClass}`}>
            <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-500" />
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>Organization Identity</p>
            </div>

            <form action={identityAction} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label htmlFor="organizationName" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Organization Name
                        </label>
                        <input
                            id="organizationName"
                            name="organizationName"
                            defaultValue={defaultOrganizationName}
                            disabled={!canEdit || isIdentityPending}
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="organizationLocation" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Location
                        </label>
                        <input
                            id="organizationLocation"
                            name="organizationLocation"
                            defaultValue={defaultOrganizationLocation}
                            disabled={!canEdit || isIdentityPending}
                            placeholder="City, Country"
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="organizationLogoFile" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Organization Logo
                        </label>
                        <input type="hidden" name="organizationLogoCurrentUrl" value={defaultOrganizationLogoUrl} />
                        <input
                            id="organizationLogoFile"
                            name="organizationLogoFile"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                            disabled={!canEdit || isIdentityPending}
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                        <p className={`mt-2 text-xs ${textMutedClass}`}>Upload JPG, PNG, WEBP, GIF, or SVG up to 2MB.</p>
                        {defaultOrganizationLogoUrl ? (
                            <div className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 ${mutedPanelClass}`}>
                                <Avatar className="h-7 w-7 border border-slate-200">
                                    <AvatarImage src={defaultOrganizationLogoUrl} alt="Organization logo" />
                                    <AvatarFallback className="bg-slate-900 text-[10px] font-semibold text-white">O</AvatarFallback>
                                </Avatar>
                                <span className={`text-xs font-medium ${textMutedClass}`}>Current logo preview</span>
                            </div>
                        ) : null}
                        {defaultOrganizationLogoUrl ? (
                            <label className={`mt-3 flex items-center gap-2 text-xs font-medium ${textMutedClass}`}>
                                <input
                                    type="checkbox"
                                    name="organizationLogoRemove"
                                    value="1"
                                    disabled={!canEdit || isIdentityPending}
                                    className="h-4 w-4 rounded border-slate-300"
                                />
                                Remove current logo
                            </label>
                        ) : null}
                    </div>

                    <TagEditor
                        id="organizationIndustryTags"
                        name="organizationIndustryTags"
                        defaultValue={defaultOrganizationIndustryTags}
                        disabled={!canEdit || isIdentityPending}
                        label="Organization Categories"
                        description="Press Enter or comma to add. Click tags to remove."
                        placeholder="Fintech, Climate, Health"
                        suggestions={ORGANIZATION_TAG_SUGGESTIONS}
                        inputClass={inputClass}
                        labelClass={labelClass}
                        textMutedClass={textMutedClass}
                        isLight={isLight}
                        suggestionLimit={24}
                    />

                    {organizationType === 'investor' ? (
                        <>
                            <div className="sm:col-span-2">
                                <label htmlFor="investorThesis" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                                    Investment Thesis
                                </label>
                                <textarea
                                    id="investorThesis"
                                    name="investorThesis"
                                    defaultValue={defaultInvestorThesis}
                                    disabled={!canEdit || isIdentityPending}
                                    rows={4}
                                    placeholder="Describe your thesis, conviction areas, and what makes a strong fit."
                                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                />
                            </div>

                            <TagEditor
                                id="investorSectorTags"
                                name="investorSectorTags"
                                defaultValue={defaultInvestorSectorTags}
                                disabled={!canEdit || isIdentityPending}
                                label="Sector Focus"
                                description="These tags power investor readiness and discovery matching."
                                placeholder="Fintech, AI, Climate"
                                suggestions={INVESTOR_SECTOR_TAG_SUGGESTIONS}
                                inputClass={inputClass}
                                labelClass={labelClass}
                                textMutedClass={textMutedClass}
                                isLight={isLight}
                                suggestionLimit={16}
                            />

                            <div>
                                <label htmlFor="investorCheckSizeMinUsd" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                                    Check Size Min (USD)
                                </label>
                                <input
                                    id="investorCheckSizeMinUsd"
                                    name="investorCheckSizeMinUsd"
                                    type="number"
                                    min={0}
                                    step={1000}
                                    defaultValue={defaultInvestorCheckSizeMinUsd ?? ''}
                                    disabled={!canEdit || isIdentityPending}
                                    placeholder="25000"
                                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                />
                            </div>

                            <div>
                                <label htmlFor="investorCheckSizeMaxUsd" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                                    Check Size Max (USD)
                                </label>
                                <input
                                    id="investorCheckSizeMaxUsd"
                                    name="investorCheckSizeMaxUsd"
                                    type="number"
                                    min={0}
                                    step={1000}
                                    defaultValue={defaultInvestorCheckSizeMaxUsd ?? ''}
                                    disabled={!canEdit || isIdentityPending}
                                    placeholder="500000"
                                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                />
                            </div>
                        </>
                    ) : null}
                </div>

                {!canEdit ? (
                    <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                        Only organization owner can edit this section.
                    </p>
                ) : null}

                {identityNotice.error ? (
                    <ActionFeedback
                        tone="error"
                        title="Identity update failed"
                        message={identityNotice.error}
                        isLight={isLight}
                    />
                ) : null}

                {identityNotice.success ? (
                    <ActionFeedback
                        tone="success"
                        title="Identity saved"
                        message={identityNotice.success}
                        isLight={isLight}
                    />
                ) : null}

                <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${mutedPanelClass}`}>
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-500" />
                        <p className={`text-sm ${textMutedClass}`}>Update and save organization identity details only.</p>
                    </div>
                    <Button type="submit" disabled={!canEdit || isIdentityPending}>
                        {isIdentityPending ? 'Saving Identity...' : 'Save Identity'}
                    </Button>
                </div>
            </form>
        </div>
    )

    const readinessSection = (
        <div className={`rounded-xl border p-4 ${isLight ? 'border-emerald-200 bg-emerald-50/50' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
            <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-emerald-500" />
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>Startup Readiness Fields</p>
            </div>
            <p className={`mt-2 text-xs ${textMutedClass}`}>
                Readiness score and discovery eligibility are computed from these saved profile sections.
            </p>

            <div className={`mt-4 rounded-2xl border p-4 ${mutedPanelClass}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${labelClass}`}>Readiness Engine</p>
                        <p className={`mt-1 text-sm font-bold ${titleClass}`}>Completion {profileCompletionPercent}% · Score {readinessScore}%</p>
                    </div>
                    <Badge variant={readinessEligible ? 'success' : 'warning'}>
                        {readinessEligible ? 'Eligible for Discovery' : 'Not Eligible'}
                    </Badge>
                </div>
                <div className={`mt-3 h-2 w-full overflow-hidden rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                    <div className={`h-full transition-all duration-700 ${readinessBarColor}`} style={{ width: `${readinessScore}%` }} />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {readinessChecks.map((check) => (
                        <div key={check.label} className={`rounded-xl border px-3 py-2 ${mutedPanelClass}`}>
                            <p className={`text-[11px] font-semibold ${titleClass}`}>{check.label}</p>
                            <p className={`mt-0.5 text-[11px] ${check.done ? 'text-emerald-500' : textMutedClass}`}>
                                {check.done ? 'Passed' : 'Pending'}
                            </p>
                        </div>
                    ))}
                </div>
                {readinessMissingSteps.length > 0 ? (
                    <p className={`mt-3 text-[11px] ${textMutedClass}`}>
                        Missing: {readinessMissingSteps.join(', ')}
                    </p>
                ) : null}
            </div>

            {readinessSectionScores.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {readinessSectionScores.map((item) => (
                        <div key={item.section} className={`rounded-2xl border p-3 ${mutedPanelClass}`}>
                            <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm font-bold ${titleClass}`}>
                                    {readinessSectionLabelMap[item.section] ?? toTitleCase(item.section.replace(/_/g, ' '))}
                                </p>
                                <Badge variant="outline">{item.weight}% weight</Badge>
                            </div>
                            <p className={`mt-1 text-xs ${textMutedClass}`}>
                                Completion {item.completion_percent}% · Contribution {item.score_contribution}
                            </p>
                        </div>
                    ))}
                </div>
            ) : null}

            <form action={readinessAction} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label htmlFor="startupWebsiteUrl" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Website URL
                        </label>
                        <input
                            id="startupWebsiteUrl"
                            name="startupWebsiteUrl"
                            defaultValue={defaultStartupWebsiteUrl}
                            disabled={!canEdit || isReadinessPending}
                            placeholder="https://example.com"
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <input type="hidden" name="startupPitchDeckCurrentUrl" value={defaultStartupPitchDeckUrl} />
                    <input type="hidden" name="startupPitchDeckCurrentMediaKind" value={defaultStartupPitchDeckMediaKind ?? ''} />
                    <input type="hidden" name="startupPitchDeckCurrentFileName" value={defaultStartupPitchDeckFileName} />
                    <input type="hidden" name="startupPitchDeckCurrentFileSizeBytes" value={defaultStartupPitchDeckFileSizeBytes ?? ''} />
                    <div className="sm:col-span-2">
                        <ReadinessAssetUploadCard
                            id="startupPitchDeckFile"
                            name="startupPitchDeckFile"
                            label="Pitch Deck (Required)"
                            hint="PDF/PPT/PPTX or MP4/WEBM/MOV up to 50MB."
                            accept="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,video/mp4,video/webm,video/quicktime"
                            currentUrl={defaultStartupPitchDeckUrl}
                            currentFileName={defaultStartupPitchDeckFileName}
                            currentFileSizeBytes={defaultStartupPitchDeckFileSizeBytes}
                            currentKindLabel={defaultStartupPitchDeckMediaKind === 'video' ? 'Video' : defaultStartupPitchDeckMediaKind === 'document' ? 'Document' : undefined}
                            removeFieldName="startupPitchDeckRemove"
                            disabled={!canEdit || isReadinessPending}
                            isLight={isLight}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="startupTeamOverview" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Team Overview
                        </label>
                        <textarea
                            id="startupTeamOverview"
                            name="startupTeamOverview"
                            defaultValue={defaultStartupTeamOverview}
                            disabled={!canEdit || isReadinessPending}
                            rows={4}
                            placeholder="Describe key team members, roles, and execution strength."
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div>
                        <label htmlFor="startupCompanyStage" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Company Stage
                        </label>
                        <select
                            id="startupCompanyStage"
                            name="startupCompanyStage"
                            defaultValue={defaultStartupCompanyStage}
                            disabled={!canEdit || isReadinessPending}
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        >
                            <option value="">Select stage</option>
                            <option value="idea">Idea</option>
                            <option value="mvp">MVP</option>
                            <option value="pre-seed">Pre-seed</option>
                            <option value="seed">Seed</option>
                            <option value="series-a">Series A</option>
                            <option value="growth">Growth</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="startupFoundingYear" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Founding Year
                        </label>
                        <input
                            id="startupFoundingYear"
                            name="startupFoundingYear"
                            type="number"
                            min={1900}
                            max={2100}
                            defaultValue={defaultStartupFoundingYear ?? ''}
                            disabled={!canEdit || isReadinessPending}
                            placeholder="2024"
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div>
                        <label htmlFor="startupTeamSize" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Team Size
                        </label>
                        <input
                            id="startupTeamSize"
                            name="startupTeamSize"
                            type="number"
                            min={1}
                            max={100000}
                            defaultValue={defaultStartupTeamSize ?? ''}
                            disabled={!canEdit || isReadinessPending}
                            placeholder="12"
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div>
                        <label htmlFor="startupBusinessModel" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Business Model
                        </label>
                        <input
                            id="startupBusinessModel"
                            name="startupBusinessModel"
                            defaultValue={defaultStartupBusinessModel}
                            disabled={!canEdit || isReadinessPending}
                            placeholder="B2B SaaS / Transaction fee / Subscription"
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="startupTargetMarket" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Target Market
                        </label>
                        <input
                            id="startupTargetMarket"
                            name="startupTargetMarket"
                            defaultValue={defaultStartupTargetMarket}
                            disabled={!canEdit || isReadinessPending}
                            placeholder="SMB finance teams in North America"
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="startupTractionSummary" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Traction Summary
                        </label>
                        <textarea
                            id="startupTractionSummary"
                            name="startupTractionSummary"
                            defaultValue={defaultStartupTractionSummary}
                            disabled={!canEdit || isReadinessPending}
                            rows={4}
                            placeholder="Share key metrics: users, ARR, growth, pilots, or enterprise contracts."
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="startupFinancialSummary" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Financial Summary
                        </label>
                        <textarea
                            id="startupFinancialSummary"
                            name="startupFinancialSummary"
                            defaultValue={defaultStartupFinancialSummary}
                            disabled={!canEdit || isReadinessPending}
                            rows={4}
                            placeholder="Highlight runway, revenue profile, burn, and key financial assumptions."
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <input type="hidden" name="startupFinancialDocCurrentUrl" value={defaultStartupFinancialDocUrl} />
                    <input type="hidden" name="startupFinancialDocCurrentFileName" value={defaultStartupFinancialDocFileName} />
                    <input type="hidden" name="startupFinancialDocCurrentFileSizeBytes" value={defaultStartupFinancialDocFileSizeBytes ?? ''} />
                    <div className="sm:col-span-2">
                        <ReadinessAssetUploadCard
                            id="startupFinancialDocFile"
                            name="startupFinancialDocFile"
                            label="Financial Document (Required)"
                            hint="PDF, DOC/DOCX, XLS/XLSX, or CSV up to 50MB."
                            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                            currentUrl={defaultStartupFinancialDocUrl}
                            currentFileName={defaultStartupFinancialDocFileName}
                            currentFileSizeBytes={defaultStartupFinancialDocFileSizeBytes}
                            removeFieldName="startupFinancialDocRemove"
                            disabled={!canEdit || isReadinessPending}
                            isLight={isLight}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="startupLegalSummary" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Legal Summary
                        </label>
                        <textarea
                            id="startupLegalSummary"
                            name="startupLegalSummary"
                            defaultValue={defaultStartupLegalSummary}
                            disabled={!canEdit || isReadinessPending}
                            rows={4}
                            placeholder="Summarize legal structure, IP ownership, key agreements, and compliance posture."
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <input type="hidden" name="startupLegalDocCurrentUrl" value={defaultStartupLegalDocUrl} />
                    <input type="hidden" name="startupLegalDocCurrentFileName" value={defaultStartupLegalDocFileName} />
                    <input type="hidden" name="startupLegalDocCurrentFileSizeBytes" value={defaultStartupLegalDocFileSizeBytes ?? ''} />
                    <div className="sm:col-span-2">
                        <ReadinessAssetUploadCard
                            id="startupLegalDocFile"
                            name="startupLegalDocFile"
                            label="Legal Document (Required)"
                            hint="PDF, DOC/DOCX, XLS/XLSX, or CSV up to 50MB."
                            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                            currentUrl={defaultStartupLegalDocUrl}
                            currentFileName={defaultStartupLegalDocFileName}
                            currentFileSizeBytes={defaultStartupLegalDocFileSizeBytes}
                            removeFieldName="startupLegalDocRemove"
                            disabled={!canEdit || isReadinessPending}
                            isLight={isLight}
                        />
                    </div>
                </div>

                {!canEdit ? (
                    <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                        Only organization owner can edit this section.
                    </p>
                ) : null}

                {readinessNotice.error ? (
                    <ActionFeedback
                        tone="error"
                        title="Readiness update failed"
                        message={readinessNotice.error}
                        isLight={isLight}
                    />
                ) : null}

                {readinessNotice.success ? (
                    <ActionFeedback
                        tone="success"
                        title="Readiness saved"
                        message={readinessNotice.success}
                        isLight={isLight}
                    />
                ) : null}

                <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${mutedPanelClass}`}>
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-500" />
                        <p className={`text-sm ${textMutedClass}`}>Save readiness fields without touching other sections.</p>
                    </div>
                    <Button type="submit" disabled={!canEdit || isReadinessPending}>
                        {isReadinessPending ? 'Saving Readiness...' : 'Save Readiness'}
                    </Button>
                </div>
            </form>
        </div>
    )

    const discoverySection = (
        <div className={`rounded-xl border p-4 ${isLight ? 'border-sky-200 bg-sky-50/60' : 'border-sky-500/30 bg-sky-500/5'}`}>
            <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-sky-500" />
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>Startup Discovery Post</p>
            </div>
            <p className={`mt-2 text-xs ${textMutedClass}`}>
                Publish this to become visible in advisor and investor discovery.
            </p>

            <form action={discoveryAction} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label htmlFor="startupPostTitle" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Post Title
                        </label>
                        <input
                            id="startupPostTitle"
                            name="startupPostTitle"
                            defaultValue={defaultStartupPostTitle}
                            disabled={!canEdit || isDiscoveryPending}
                            placeholder="Concise startup headline"
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="startupPostSummary" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Post Summary
                        </label>
                        <textarea
                            id="startupPostSummary"
                            name="startupPostSummary"
                            defaultValue={defaultStartupPostSummary}
                            disabled={!canEdit || isDiscoveryPending}
                            rows={5}
                            placeholder="Describe your problem, traction, and what support you need."
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div>
                        <label htmlFor="startupPostStage" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Stage
                        </label>
                        <input
                            id="startupPostStage"
                            name="startupPostStage"
                            defaultValue={defaultStartupPostStage}
                            disabled={!canEdit || isDiscoveryPending}
                            placeholder="Pre-seed, Seed, Series A"
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <div>
                        <label htmlFor="startupPostLocation" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Discovery Location
                        </label>
                        <input
                            id="startupPostLocation"
                            name="startupPostLocation"
                            defaultValue={defaultStartupPostLocation}
                            disabled={!canEdit || isDiscoveryPending}
                            placeholder="City, Country"
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>

                    <TagEditor
                        id="startupPostIndustryTags"
                        name="startupPostIndustryTags"
                        defaultValue={defaultStartupPostIndustryTags}
                        disabled={!canEdit || isDiscoveryPending}
                        label="Discovery Categories"
                        description="Use focused categories to improve advisor/investor feed matching."
                        placeholder="Fintech, Climate, AI"
                        suggestions={STARTUP_DISCOVERY_TAG_SUGGESTIONS}
                        inputClass={inputClass}
                        labelClass={labelClass}
                        textMutedClass={textMutedClass}
                        isLight={isLight}
                    />

                    <div className="sm:col-span-2">
                        <label htmlFor="startupPostStatus" className={`mb-2 block text-xs font-bold uppercase tracking-[0.14em] ${labelClass}`}>
                            Discovery Status
                        </label>
                        <select
                            id="startupPostStatus"
                            name="startupPostStatus"
                            defaultValue={defaultStartupPostStatus}
                            disabled={!canEdit || isDiscoveryPending}
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                </div>

                {!canEdit ? (
                    <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                        Only organization owner can edit this section.
                    </p>
                ) : null}

                {discoveryNotice.error ? (
                    <ActionFeedback
                        tone="error"
                        title="Discovery update failed"
                        message={discoveryNotice.error}
                        isLight={isLight}
                    />
                ) : null}

                {discoveryNotice.success ? (
                    <ActionFeedback
                        tone="success"
                        title="Discovery saved"
                        message={discoveryNotice.success}
                        isLight={isLight}
                    />
                ) : null}

                <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${mutedPanelClass}`}>
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-500" />
                        <p className={`text-sm ${textMutedClass}`}>Save discovery post updates independently.</p>
                    </div>
                    <Button type="submit" disabled={!canEdit || isDiscoveryPending}>
                        {isDiscoveryPending ? 'Saving Discovery...' : 'Save Discovery Post'}
                    </Button>
                </div>
            </form>
        </div>
    )

    return (
        <div className="space-y-8">
            {resolvedSectionView === 'identity' && identitySection}
            {resolvedSectionView === 'readiness' && readinessSection}
            {resolvedSectionView === 'discovery' && discoverySection}
        </div>
    )
}
