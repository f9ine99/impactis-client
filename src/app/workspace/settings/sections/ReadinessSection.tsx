'use client'

import { useState } from 'react'
import { Sparkles, Loader2, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { toTitleCase } from '@/lib/utils'
import { analyzeReadiness } from '@/modules/discovery/discovery.client'
import type { SettingsSectionActionState } from '../actions'

type ReadinessSectionProps = {
    canEdit: boolean
    isLight: boolean
    action: (formData: FormData) => void
    isPending: boolean
    state: SettingsSectionActionState
    defaultStartupWebsiteUrl: string
    defaultStartupTeamOverview: string
    defaultStartupCompanyStage: string
    defaultStartupFoundingYear: number | null
    defaultStartupTeamSize: number | null
    defaultStartupTargetMarket: string
    defaultStartupBusinessModel: string
    defaultStartupTractionSummary: string
    defaultStartupFinancialSummary: string
    defaultStartupLegalSummary: string
    // Styles
    mutedPanelClass: string
    labelClass: string
    inputClass: string
    textMainClass: string
    textMutedClass: string
}

export function ReadinessSection({
    canEdit,
    isLight,
    action,
    isPending,
    state,
    defaultStartupWebsiteUrl,
    defaultStartupTeamOverview,
    defaultStartupCompanyStage,
    defaultStartupFoundingYear,
    defaultStartupTeamSize,
    defaultStartupTargetMarket,
    defaultStartupBusinessModel,
    defaultStartupTractionSummary,
    defaultStartupFinancialSummary,
    defaultStartupLegalSummary,
    mutedPanelClass,
    labelClass,
    inputClass,
    textMainClass,
    textMutedClass,
}: ReadinessSectionProps) {
    const [startupWebsiteUrl, setStartupWebsiteUrl] = useState(defaultStartupWebsiteUrl)
    const [startupTeamOverview, setStartupTeamOverview] = useState(defaultStartupTeamOverview)
    const [startupCompanyStage, setStartupCompanyStage] = useState(defaultStartupCompanyStage)
    const [startupFoundingYear, setStartupFoundingYear] = useState<string | number | ''>(
        defaultStartupFoundingYear ?? '',
    )
    const [startupTeamSize, setStartupTeamSize] = useState<string | number | ''>(
        defaultStartupTeamSize ?? '',
    )
    const [startupTargetMarket, setStartupTargetMarket] = useState(defaultStartupTargetMarket)
    const [startupBusinessModel, setStartupBusinessModel] = useState(defaultStartupBusinessModel)
    const [startupTractionSummary, setStartupTractionSummary] = useState(defaultStartupTractionSummary)
    const [startupFinancialSummary, setStartupFinancialSummary] = useState(defaultStartupFinancialSummary)
    const [startupLegalSummary, setStartupLegalSummary] = useState(defaultStartupLegalSummary)

    const [analysis, setAnalysis] = useState<{ summary: string; riskFlags: string[] } | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    async function handleAnalyze() {
        setIsAnalyzing(true)
        try {
            const res = await analyzeReadiness()
            setAnalysis(res)
        } catch (error) {
            console.error('Analysis failed', error)
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className={`rounded-3xl border p-6 ${mutedPanelClass} shadow-xl backdrop-blur-2xl`}>
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
                                value={startupWebsiteUrl}
                                onChange={(event) => setStartupWebsiteUrl(event.target.value)}
                                disabled={isPending}
                                placeholder="https://startup.com"
                                className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                            />
                        ) : (
                            <div className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm font-bold ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                {startupWebsiteUrl || 'Not set'}
                            </div>
                        )}
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
                                value={startupTeamOverview}
                                onChange={(event) => setStartupTeamOverview(event.target.value)}
                                disabled={isPending}
                                rows={4}
                                placeholder="Describe relevant experience and expertise..."
                                className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                            />
                        ) : (
                            <div className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                {startupTeamOverview || 'No team overview provided yet.'}
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
                        <div className="grid gap-4 sm:grid-cols-3 max-w-2xl">
                            <div>
                                <label htmlFor="startupCompanyStage" className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] ${labelClass}`}>Stage</label>
                                {canEdit ? (
                                    <select
                                        id="startupCompanyStage"
                                        name="startupCompanyStage"
                                        value={startupCompanyStage}
                                        onChange={(event) => setStartupCompanyStage(event.target.value)}
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
                                        {toTitleCase(startupCompanyStage) || 'Not set'}
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
                                        value={startupFoundingYear}
                                        onChange={(event) => setStartupFoundingYear(event.target.value)}
                                        disabled={isPending}
                                        placeholder="2024"
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                    />
                                ) : (
                                    <div className={`w-full rounded-xl border px-4 py-3 text-sm font-bold ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                        {startupFoundingYear || 'Not set'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="startupTeamSize" className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] ${labelClass}`}>Team Size</label>
                                {canEdit ? (
                                    <input
                                        id="startupTeamSize"
                                        name="startupTeamSize"
                                        type="number"
                                        min={1}
                                        value={startupTeamSize}
                                        onChange={(event) => setStartupTeamSize(event.target.value)}
                                        disabled={isPending}
                                        placeholder="8"
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                    />
                                ) : (
                                    <div className={`w-full rounded-xl border px-4 py-3 text-sm font-bold ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                        {startupTeamSize || 'Not set'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Market Positioning Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Market Positioning
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Define who you serve and how the business captures value.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                            <div>
                                <label htmlFor="startupTargetMarket" className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] ${labelClass}`}>Target Market</label>
                                {canEdit ? (
                                    <textarea
                                        id="startupTargetMarket"
                                        name="startupTargetMarket"
                                        value={startupTargetMarket}
                                        onChange={(event) => setStartupTargetMarket(event.target.value)}
                                        disabled={isPending}
                                        rows={4}
                                        placeholder="Primary customer segment, ICP, and geography."
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                    />
                                ) : (
                                    <div className={`w-full rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                        {startupTargetMarket || 'Not set'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="startupBusinessModel" className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] ${labelClass}`}>Business Model</label>
                                {canEdit ? (
                                    <textarea
                                        id="startupBusinessModel"
                                        name="startupBusinessModel"
                                        value={startupBusinessModel}
                                        onChange={(event) => setStartupBusinessModel(event.target.value)}
                                        disabled={isPending}
                                        rows={4}
                                        placeholder="Revenue model, pricing structure, and distribution motion."
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                    />
                                ) : (
                                    <div className={`w-full rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                        {startupBusinessModel || 'Not set'}
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
                                value={startupTractionSummary}
                                onChange={(event) => setStartupTractionSummary(event.target.value)}
                                disabled={isPending}
                                rows={4}
                                placeholder="Users, ARR, growth rate, or key enterprise milestones."
                                className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                            />
                        ) : (
                            <div className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                {startupTractionSummary || 'No traction data provided yet.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Financial & Legal Summary Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Financial & Legal Summaries
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Keep concise narrative context here while source files stay in Data Room.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                            <div>
                                <label htmlFor="startupFinancialSummary" className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] ${labelClass}`}>Financial Summary</label>
                                {canEdit ? (
                                    <textarea
                                        id="startupFinancialSummary"
                                        name="startupFinancialSummary"
                                        value={startupFinancialSummary}
                                        onChange={(event) => setStartupFinancialSummary(event.target.value)}
                                        disabled={isPending}
                                        rows={4}
                                        placeholder="Revenue, burn, runway, and key financial assumptions."
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                    />
                                ) : (
                                    <div className={`w-full rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                        {startupFinancialSummary || 'Not set'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="startupLegalSummary" className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] ${labelClass}`}>Legal Summary</label>
                                {canEdit ? (
                                    <textarea
                                        id="startupLegalSummary"
                                        name="startupLegalSummary"
                                        value={startupLegalSummary}
                                        onChange={(event) => setStartupLegalSummary(event.target.value)}
                                        disabled={isPending}
                                        rows={4}
                                        placeholder="Incorporation status, IP posture, and material legal notes."
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                    />
                                ) : (
                                    <div className={`w-full rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                        {startupLegalSummary || 'Not set'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Analysis Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 border-t border-slate-200/5">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-emerald-500" />
                            <label className={`block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                                AI Readiness Analysis
                            </label>
                        </div>
                        <p className={`mt-1 text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Get an instant VC-style evaluation of your current profile readiness.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isAnalyzing}
                            onClick={handleAnalyze}
                            className="mt-4 rounded-xl border-emerald-500/30 bg-emerald-500/5 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    Analyzing Profile...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                                    Run AI Analysis
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="md:col-span-2">
                        {analysis ? (
                            <div className={`rounded-2xl border p-5 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950/40 border-slate-800 shadow-xl'}`}>
                                <div className="mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <h4 className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Analysis Summary</h4>
                                </div>
                                <p className={`text-sm font-medium leading-relaxed mb-6 ${textMainClass}`}>
                                    {analysis.summary}
                                </p>

                                {analysis.riskFlags.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            <h4 className={`text-[10px] font-black uppercase tracking-widest text-amber-600/90`}>Identified Risk Flags</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.riskFlags.map((flag, i) => (
                                                <div key={i} className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-[11px] font-bold text-amber-600/90">
                                                    <ShieldAlert className="h-3 w-3" />
                                                    {flag}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[11px] font-bold text-emerald-600/90">
                                        <CheckCircle2 className="h-3 w-3" />
                                        No critical risk flags identified in the provided data.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={`flex h-full min-h-[140px] items-center justify-center rounded-2xl border border-dashed text-center p-6 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800 bg-slate-900/20'}`}>
                                <div>
                                    <Sparkles className={`mx-auto h-6 w-6 mb-2 opacity-20 ${textMainClass}`} />
                                    <p className={`text-xs font-bold ${textMutedClass}`}>
                                        Click "Run AI Analysis" to evaluate your profile.<br />
                                        <span className="opacity-60">This uses your saved core strengths, market, and traction data.</span>
                                    </p>
                                </div>
                            </div>
                        )}
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
                                <p className="text-[11px] font-bold text-amber-600/80">Only owners can update readiness profile fields.</p>
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
