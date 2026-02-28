'use client'

import { FileText, Globe2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { toTitleCase } from '@/lib/utils'
import { ReadinessAssetUploadCard } from '../components/ReadinessAssetUploadCard'
import type { StartupReadiness, StartupPitchDeckMediaKind } from '@/modules/startups'
import type { SettingsSectionActionState } from '../actions'

type ReadinessSectionProps = {
    canEdit: boolean
    isLight: boolean
    action: (formData: FormData) => void
    isPending: boolean
    state: SettingsSectionActionState
    // Startup data
    startupReadiness: StartupReadiness | null
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
    // Styles
    mutedPanelClass: string
    labelClass: string
    inputClass: string
    textMainClass: string
    textMutedClass: string
    titleClass: string
}

export function ReadinessSection({
    canEdit,
    isLight,
    action,
    isPending,
    state,
    startupReadiness,
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
    mutedPanelClass,
    labelClass,
    inputClass,
    textMainClass,
    textMutedClass,
    titleClass,
}: ReadinessSectionProps) {
    const readinessScore = startupReadiness?.readiness_score ?? 0
    const profileCompletionPercent = startupReadiness?.profile_completion_percent ?? 0
    const readinessEligible = startupReadiness?.eligible_for_discovery_post ?? false
    const requiredDocsUploaded = startupReadiness?.required_docs_uploaded ?? false
    const readinessMissingSteps = startupReadiness?.missing_steps ?? []
    const readinessSectionScores = startupReadiness?.section_scores ?? []

    const readinessChecks = [
        { label: 'Profile Completion >= 70%', done: profileCompletionPercent >= 70 },
        { label: 'Readiness Score >= 60', done: readinessScore >= 60 },
        { label: 'Core Files Uploaded', done: requiredDocsUploaded },
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

    return (
        <div className={`rounded-3xl border p-6 ${mutedPanelClass} shadow-xl backdrop-blur-2xl`}>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`rounded-xl border p-2 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                        <Globe2 className="h-4 w-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                    </div>
                    <div>
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${labelClass}`}>Readiness Engine</p>
                        <p className={`text-[11px] font-bold ${textMutedClass}`}>Compliance and verification data</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-1.5 shadow-sm ${isLight ? 'bg-white' : 'bg-slate-900/50'}`}>
                    <span className={`text-[11px] font-black uppercase tracking-tight ${textMutedClass}`}>Readiness Index</span>
                    <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-sm font-black ${readinessEligible ? 'border-emerald-500/50 text-emerald-600' : 'border-amber-500/50 text-amber-600'}`}>
                        {readinessScore}%
                    </Badge>
                </div>
            </div>

            <div className={`mb-8 rounded-2xl border p-6 ${isLight ? 'bg-slate-50/50' : 'bg-slate-900/30'}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <p className={`text-2xl font-black tracking-tight ${titleClass}`}>Profile Status</p>
                            <Badge variant={readinessEligible ? 'success' : 'warning'} className="rounded-md px-2 py-0.5 text-[10px] uppercase">
                                {readinessEligible ? 'Eligible' : 'Pending'}
                            </Badge>
                        </div>
                        <p className={`mt-1 text-sm font-medium ${textMutedClass}`}>
                            Complete core requirements to unlock full network discovery.
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${textMutedClass}`}>Engine Confidence</span>
                        <span className={`text-xs font-black ${textMainClass}`}>{readinessScore}%</span>
                    </div>
                    <div className={`h-2.5 w-full overflow-hidden rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                        <div className={`h-full transition-all duration-1000 ease-out ${readinessBarColor}`} style={{ width: `${readinessScore}%` }} />
                    </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {readinessChecks.map((check) => (
                        <div key={check.label} className={`rounded-2xl border p-4 shadow-sm transition-all ${isLight ? 'bg-white' : 'bg-slate-950/40'}`}>
                            <p className={`text-[11px] font-black uppercase tracking-widest ${labelClass}`}>{check.label}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <div className={`h-1.5 w-1.5 rounded-full ${check.done ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                                <p className={`text-sm font-bold ${check.done ? textMainClass : textMutedClass}`}>
                                    {check.done ? 'Verified' : 'Required'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {readinessMissingSteps.length > 0 ? (
                    <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200/50 bg-amber-50/20 p-3 backdrop-blur-sm">
                        <div className="mt-0.5 rounded-full bg-amber-500 p-0.5">
                            <span className="block h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <p className={`text-sm font-medium text-amber-800/80`}>
                            <span className="font-bold uppercase tracking-tight text-xs">Remaining:</span> {readinessMissingSteps.join(', ')}
                        </p>
                    </div>
                ) : null}
            </div>

            <form action={action} className="divide-y divide-slate-200/5">
                {/* Official Website Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 first:pt-0">
                    <div className="md:col-span-1">
                        <label htmlFor="startupWebsiteUrl" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Official Website
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            The primary digital storefront for your organization.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        {canEdit ? (
                            <input
                                id="startupWebsiteUrl"
                                name="startupWebsiteUrl"
                                defaultValue={defaultStartupWebsiteUrl}
                                disabled={isPending}
                                placeholder="https://startup.com"
                                className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                            />
                        ) : (
                            <div className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm font-bold ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                {defaultStartupWebsiteUrl || 'Not set'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pitch Deck Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Pitch Deck
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Core narrative for readiness scoring. PDF or Video up to 50MB.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="max-w-xl">
                            <input type="hidden" name="startupPitchDeckCurrentUrl" value={defaultStartupPitchDeckUrl} />
                            <input type="hidden" name="startupPitchDeckCurrentMediaKind" value={defaultStartupPitchDeckMediaKind ?? ''} />
                            <input type="hidden" name="startupPitchDeckCurrentFileName" value={defaultStartupPitchDeckFileName} />
                            <input type="hidden" name="startupPitchDeckCurrentFileSizeBytes" value={defaultStartupPitchDeckFileSizeBytes ?? ''} />
                            <ReadinessAssetUploadCard
                                id="startupPitchDeckFile"
                                name="startupPitchDeckFile"
                                label="Pitch Deck"
                                hint="Primary asset for engine confidence."
                                accept="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,video/mp4,video/webm,video/quicktime"
                                currentUrl={defaultStartupPitchDeckUrl}
                                currentFileName={defaultStartupPitchDeckFileName}
                                currentFileSizeBytes={defaultStartupPitchDeckFileSizeBytes}
                                currentKindLabel={defaultStartupPitchDeckMediaKind === 'video' ? 'Video' : defaultStartupPitchDeckMediaKind === 'document' ? 'Doc' : undefined}
                                removeFieldName="startupPitchDeckRemove"
                                disabled={!canEdit || isPending}
                                isLight={isLight}
                                hideLabel={true}
                            />
                        </div>
                    </div>
                </div>

                {/* Team Strengths Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label htmlFor="startupTeamOverview" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Team Core Strengths
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Highlight domain expertise and technical background.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        {canEdit ? (
                            <textarea
                                id="startupTeamOverview"
                                name="startupTeamOverview"
                                defaultValue={defaultStartupTeamOverview}
                                disabled={isPending}
                                rows={4}
                                placeholder="Describe relevant experience and expertise..."
                                className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                            />
                        ) : (
                            <div className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                {defaultStartupTeamOverview || 'No team overview provided yet.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Foundational Data Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Foundational Data
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Core operational metadata for matching filters.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
                            <div>
                                <label htmlFor="startupCompanyStage" className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] ${labelClass}`}>Stage</label>
                                {canEdit ? (
                                    <select
                                        id="startupCompanyStage"
                                        name="startupCompanyStage"
                                        defaultValue={defaultStartupCompanyStage}
                                        disabled={isPending}
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                    >
                                        <option value="">Select stage</option>
                                        <option value="idea">Idea</option>
                                        <option value="mvp">MVP</option>
                                        <option value="pre-seed">Pre-seed</option>
                                        <option value="seed">Seed</option>
                                        <option value="series-a">Series A</option>
                                        <option value="growth">Growth</option>
                                    </select>
                                ) : (
                                    <div className={`w-full rounded-xl border px-4 py-3 text-sm font-bold ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                        {toTitleCase(defaultStartupCompanyStage) || 'Not set'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="startupFoundingYear" className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] ${labelClass}`}>Founding Year</label>
                                {canEdit ? (
                                    <input
                                        id="startupFoundingYear"
                                        name="startupFoundingYear"
                                        type="number"
                                        min={1900}
                                        max={2100}
                                        defaultValue={defaultStartupFoundingYear ?? ''}
                                        disabled={isPending}
                                        placeholder="2024"
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                    />
                                ) : (
                                    <div className={`w-full rounded-xl border px-4 py-3 text-sm font-bold ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                        {defaultStartupFoundingYear || 'Not set'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Traction Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label htmlFor="startupTractionSummary" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Traction Pulse
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Quantifiable growth metrics and key milestones.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        {canEdit ? (
                            <textarea
                                id="startupTractionSummary"
                                name="startupTractionSummary"
                                defaultValue={defaultStartupTractionSummary}
                                disabled={isPending}
                                rows={4}
                                placeholder="Users, ARR, growth rate, or key enterprise milestones."
                                className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                            />
                        ) : (
                            <div className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                {defaultStartupTractionSummary || 'No traction data provided yet.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Verification Assets Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Verification Assets
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Hard documentation for high-confidence engine verification.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
                            <div className="space-y-4">
                                <input type="hidden" name="startupFinancialDocCurrentUrl" value={defaultStartupFinancialDocUrl} />
                                <input type="hidden" name="startupFinancialDocCurrentFileName" value={defaultStartupFinancialDocFileName} />
                                <input type="hidden" name="startupFinancialDocCurrentFileSizeBytes" value={defaultStartupFinancialDocFileSizeBytes ?? ''} />
                                <ReadinessAssetUploadCard
                                    id="startupFinancialDocFile"
                                    name="startupFinancialDocFile"
                                    label="Financials"
                                    hint="Audits/Statements."
                                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                                    currentUrl={defaultStartupFinancialDocUrl}
                                    currentFileName={defaultStartupFinancialDocFileName}
                                    currentFileSizeBytes={defaultStartupFinancialDocFileSizeBytes}
                                    removeFieldName="startupFinancialDocRemove"
                                    disabled={!canEdit || isPending}
                                    isLight={isLight}
                                    hideLabel={true}
                                />
                            </div>

                            <div className="space-y-4">
                                <input type="hidden" name="startupLegalDocCurrentUrl" value={defaultStartupLegalDocUrl} />
                                <input type="hidden" name="startupLegalDocCurrentFileName" value={defaultStartupLegalDocFileName} />
                                <input type="hidden" name="startupLegalDocCurrentFileSizeBytes" value={defaultStartupLegalDocFileSizeBytes ?? ''} />
                                <ReadinessAssetUploadCard
                                    id="startupLegalDocFile"
                                    name="startupLegalDocFile"
                                    label="Legal"
                                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                                    currentUrl={defaultStartupLegalDocUrl}
                                    currentFileName={defaultStartupLegalDocFileName}
                                    currentFileSizeBytes={defaultStartupLegalDocFileSizeBytes}
                                    removeFieldName="startupLegalDocRemove"
                                    disabled={!canEdit || isPending}
                                    hint="Compliance records."
                                    isLight={isLight}
                                    hideLabel={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 border-t border-slate-200/5 items-center">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <p className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Finalize Engine Sync</p>
                        </div>
                        <p className={`mt-1 text-sm font-bold ${textMutedClass}`}>Recalculate readiness scores upon saving.</p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="flex flex-col gap-4">
                            {canEdit && (
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-fit h-10 px-8 text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
                                >
                                    {isPending ? 'Synchronizing Engine...' : 'Save Readiness'}
                                </Button>
                            )}
                            {!canEdit ? (
                                <p className="text-[11px] font-bold text-amber-600/80">Only owners can manage readiness assets.</p>
                            ) : null}
                            {state.error ? (
                                <div className="max-w-xl">
                                    <ActionFeedback tone="error" title="Sync Blocked" message={state.error} isLight={isLight} />
                                </div>
                            ) : null}
                            {state.success ? (
                                <div className="max-w-xl">
                                    <ActionFeedback tone="success" title="Engine Updated" message={state.success} isLight={isLight} />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
