'use client'

import { Settings2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type ReadinessRulesSectionProps = {
    startupReadiness: {
        profile_completion_percent?: number
        readiness_score?: number
        required_docs_uploaded?: boolean
        section_scores?: Array<{
            section: string
            weight: number
            completion_percent: number
            score_contribution: number
        }>
        missing_steps?: string[]
    } | null
    readinessSectionLabelMap: Record<string, string>
    toTitleCase: (v: string) => string
    isLight: boolean
    labelClass: string
    textMainClass: string
    textMutedClass: string
    titleMutedClass: string
    mutedPanelClass: string
}

export default function ReadinessRulesSection(input: ReadinessRulesSectionProps) {
    const {
        startupReadiness,
        readinessSectionLabelMap,
        toTitleCase,
        isLight,
        labelClass,
        textMainClass,
        textMutedClass,
        titleMutedClass,
        mutedPanelClass
    } = input

    return (
        <div id="settings-readiness-rules" className={`rounded-3xl border p-6 ${mutedPanelClass} shadow-xl backdrop-blur-2xl`}>
            <div className="mb-8 flex items-center gap-3">
                <div className={`rounded-xl border p-2 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <Settings2 className="h-4 w-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                </div>
                <div>
                    <p className={`text-xs font-black uppercase tracking-[0.2em] ${labelClass}`}>Qualification Intelligence</p>
                    <p className={`text-[11px] font-bold ${textMutedClass}`}>Rule-based logic governing discovery and engagement.</p>
                </div>
            </div>

            <div className="divide-y divide-slate-200/5">
                {/* Core Thresholds Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 first:pt-0">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Core Thresholds
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Primary metrics required for marketplace activation and visibility.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid gap-3 max-w-xl">
                            <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <p className={`text-sm font-black ${textMainClass}`}>Profile Completion</p>
                                        <p className={`text-[11px] font-bold ${textMutedClass}`}>Target: 70% or higher</p>
                                    </div>
                                    <Badge variant={(startupReadiness?.profile_completion_percent ?? 0) >= 70 ? 'success' : 'warning'} className="px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter">
                                        {startupReadiness?.profile_completion_percent ?? 0}%
                                    </Badge>
                                </div>
                            </div>
                            <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <p className={`text-sm font-black ${textMainClass}`}>Readiness Score</p>
                                        <p className={`text-[11px] font-bold ${textMutedClass}`}>Target: 60% or higher</p>
                                    </div>
                                    <Badge variant={(startupReadiness?.readiness_score ?? 0) >= 60 ? 'success' : 'warning'} className="px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter">
                                        {startupReadiness?.readiness_score ?? 0}%
                                    </Badge>
                                </div>
                            </div>
                            <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <p className={`text-sm font-black ${textMainClass}`}>Diligence Files</p>
                                        <p className={`text-[11px] font-bold ${textMutedClass}`}>Pitch, Financials, Legal</p>
                                    </div>
                                    <Badge variant={startupReadiness?.required_docs_uploaded ? 'success' : 'warning'} className="px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter">
                                        {startupReadiness?.required_docs_uploaded ? 'Uploaded' : 'Missing'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Breakdown Row */}
                {(startupReadiness?.section_scores?.length ?? 0) > 0 && (
                    <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                        <div className="md:col-span-1">
                            <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                                Section Breakdown
                            </label>
                            <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                                Individual Weights and health of each readiness domain.
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
                                {startupReadiness?.section_scores?.map((section) => (
                                    <div key={section.section} className={`rounded-2xl border p-4 transition-all hover:bg-slate-50/50 ${mutedPanelClass}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className={`text-xs font-black uppercase tracking-tight ${textMainClass}`}>
                                                {readinessSectionLabelMap[section.section] ?? toTitleCase(section.section.replace(/_/g, ' '))}
                                            </p>
                                            <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-black uppercase tracking-widest border-slate-200">
                                                {section.weight}%
                                            </Badge>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-base font-black ${textMainClass}`}>{section.completion_percent}%</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${textMutedClass}`}>Health</span>
                                        </div>
                                        <p className={`mt-1 text-[11px] font-bold ${textMutedClass}`}>
                                            Contribution: <span className={textMainClass}>{section.score_contribution} pts</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Blocking Logic Row */}
                {(startupReadiness?.missing_steps?.length ?? 0) > 0 && (
                    <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                        <div className="md:col-span-1">
                            <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                                Blocking Constraints
                            </label>
                            <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                                Identified gaps preventing marketplace eligibility.
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <div className={`rounded-2xl border border-amber-200/50 bg-amber-50/20 p-5 max-w-xl`}>
                                <div className="space-y-3">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">Missing Prerequisites</p>
                                    <div className="flex flex-wrap gap-2">
                                        {startupReadiness?.missing_steps?.map((step: string, idx: number) => (
                                            <Badge key={idx} variant="outline" className="bg-white/80 text-amber-700 border-amber-200 text-[10px] font-black uppercase">
                                                {step.replace(/_/g, ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
