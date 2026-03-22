'use client'

import { FileText, Rocket, UserPlus, Sparkles, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { TagEditor } from '../components/TagEditor'
import { enhanceText } from '@/modules/discovery/discovery.client'
import { STARTUP_DISCOVERY_TAG_SUGGESTIONS } from '../constants'
import type { StartupPostStatus } from '@/modules/startups'
import type { SettingsSectionActionState } from '../actions'

type DiscoverySectionProps = {
    canEdit: boolean
    isLight: boolean
    action: (formData: FormData) => void
    isPending: boolean
    state: SettingsSectionActionState
    // Discovery data
    defaultStartupPostTitle: string
    defaultStartupPostSummary: string
    defaultStartupPostStage: string
    defaultStartupPostLocation: string
    defaultStartupPostIndustryTags: string
    defaultStartupPostStatus: StartupPostStatus
    defaultStartupPostNeedAdvisor: boolean
    // Styles
    mutedPanelClass: string
    labelClass: string
    inputClass: string
    textMutedClass: string
    textMainClass: string
    titleClass: string
}

export function DiscoverySection({
    canEdit,
    isLight,
    action,
    isPending,
    state,
    defaultStartupPostTitle,
    defaultStartupPostSummary,
    defaultStartupPostStage,
    defaultStartupPostLocation,
    defaultStartupPostIndustryTags,
    defaultStartupPostStatus,
    defaultStartupPostNeedAdvisor,
    mutedPanelClass,
    labelClass,
    inputClass,
    textMutedClass,
    textMainClass,
    titleClass,
}: DiscoverySectionProps) {
    const [summary, setSummary] = useState(defaultStartupPostSummary)
    const [isEnhancing, setIsEnhancing] = useState(false)

    async function handleEnhance() {
        if (!summary || summary.length < 10) return
        setIsEnhancing(true)
        try {
            const enhanced = await enhanceText({ text: summary, context: 'startup discovery post executive summary' })
            if (enhanced) {
                setSummary(enhanced)
            }
        } finally {
            setIsEnhancing(false)
        }
    }

    return (
        <div className={`rounded-3xl border p-6 ${mutedPanelClass} shadow-xl backdrop-blur-2xl`}>
            <div className="mb-8 flex items-center gap-3">
                <div className={`rounded-xl border p-2 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <Rocket className="h-4 w-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                </div>
                <div>
                    <p className={`text-xs font-black uppercase tracking-[0.2em] ${labelClass}`}>Discovery Campaign</p>
                    <p className={`text-[11px] font-bold ${textMutedClass}`}>Public presence and network visibility</p>
                </div>
            </div>

            <form action={action} className="divide-y divide-slate-200/5">
                {/* Campaign Headline Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 first:pt-0">
                    <div className="md:col-span-1">
                        <label htmlFor="startupPostTitle" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Campaign Headline
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            A high-impact title that captures attention in discovery feeds.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        {canEdit ? (
                            <input
                                id="startupPostTitle"
                                name="startupPostTitle"
                                defaultValue={defaultStartupPostTitle}
                                disabled={isPending}
                                placeholder="Enter a high-impact headline..."
                                className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                            />
                        ) : (
                            <div className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm font-bold ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                {defaultStartupPostTitle || 'No campaign headline set'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Executive Summary Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 border-t border-slate-200/5 items-start">
                    <div className="md:col-span-1 text-left">
                        <label htmlFor="startupPostSummary" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Executive Summary
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Briefly describe the problem, traction, and vision.
                        </p>
                        {canEdit && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isEnhancing || !summary || summary.length < 10}
                                onClick={handleEnhance}
                                className="mt-4 rounded-xl border-emerald-500/30 bg-emerald-500/5 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                            >
                                {isEnhancing ? (
                                    <>
                                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                        Enhancing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                                        AI Enhance
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        {canEdit ? (
                            <textarea
                                id="startupPostSummary"
                                name="startupPostSummary"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                disabled={isPending || isEnhancing}
                                rows={5}
                                placeholder="Describe the problem you solve, your traction, and your vision."
                                className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                            />
                        ) : (
                            <div className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                {defaultStartupPostSummary || 'No executive summary provided yet.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Logistics Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Campaign Logistics
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Specify the current stage and primary base of operations.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
                            <div>
                                <label htmlFor="startupPostStage" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>Current Stage</label>
                                {canEdit ? (
                                    <input
                                        id="startupPostStage"
                                        name="startupPostStage"
                                        defaultValue={defaultStartupPostStage}
                                        disabled={isPending}
                                        placeholder="Pre-seed, Seed, etc."
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                    />
                                ) : (
                                    <div className={`w-full rounded-xl border px-4 py-3 text-sm font-bold ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                        {defaultStartupPostStage || 'Not set'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="startupPostLocation" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>Primary Location</label>
                                {canEdit ? (
                                    <input
                                        id="startupPostLocation"
                                        name="startupPostLocation"
                                        defaultValue={defaultStartupPostLocation}
                                        disabled={isPending}
                                        placeholder="City, Country"
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                    />
                                ) : (
                                    <div className={`w-full rounded-xl border px-4 py-3 text-sm font-bold ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                        {defaultStartupPostLocation || 'Not set'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Discovery Categories
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Target specific investor feeds with precise categorization.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="max-w-xl">
                            <TagEditor
                                id="startupPostIndustryTags"
                                name="startupPostIndustryTags"
                                defaultValue={defaultStartupPostIndustryTags}
                                disabled={!canEdit || isPending}
                                label="Discovery Categories"
                                placeholder="Add categories..."
                                suggestions={STARTUP_DISCOVERY_TAG_SUGGESTIONS}
                                inputClass={inputClass}
                                labelClass={labelClass}
                                textMutedClass={textMutedClass}
                                isLight={isLight}
                                suggestionLimit={16}
                                hideLabelAndDescription={true}
                            />
                        </div>
                    </div>
                </div>

                {/* Status Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label htmlFor="startupPostStatus" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Visibility Status
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Control how your campaign appears across the network.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        {canEdit ? (
                            <select
                                id="startupPostStatus"
                                name="startupPostStatus"
                                defaultValue={defaultStartupPostStatus}
                                disabled={isPending}
                                className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                            >
                                <option value="draft">Private Draft</option>
                                <option value="published">Publicly Discoverable</option>
                            </select>
                        ) : (
                            <div className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm font-bold ${textMainClass} ${isLight ? 'bg-white/50 border-slate-100' : 'bg-slate-950/50 border-slate-800'}`}>
                                {defaultStartupPostStatus === 'published' ? 'Publicly Discoverable' : 'Private Draft'}
                            </div>
                        )}

                {/* Seeking advisor: listed for advisors when enabled */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Advisor visibility
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            When on, your startup is listed and recommended to advisors seeking clients.
                        </p>
                    </div>
                    <div className="md:col-span-2 flex items-center gap-3">
                        {canEdit ? (
                            <label className="inline-flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="startupPostNeedAdvisor"
                                    defaultChecked={defaultStartupPostNeedAdvisor}
                                    disabled={isPending}
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className={`text-sm font-bold ${textMainClass}`}>
                                    Seeking advisor — list us for advisors
                                </span>
                            </label>
                        ) : (
                            <div className={`flex items-center gap-2 text-sm font-bold ${textMainClass}`}>
                                <UserPlus className="h-4 w-4 text-emerald-500" />
                                {defaultStartupPostNeedAdvisor ? 'Listed for advisors' : 'Not listed for advisors'}
                            </div>
                        )}
                    </div>
                </div>
                    </div>
                </div>

                {/* Save Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 border-t border-slate-200/5 items-center">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <p className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Finalize Campaign</p>
                        </div>
                        <p className={`mt-1 text-sm font-bold ${textMutedClass}`}>Sync campaign properties to discovery feeds.</p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="flex flex-col gap-4">
                            {canEdit && (
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-fit h-10 px-8 text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
                                >
                                    {isPending ? 'Synchronizing...' : 'Save Campaign'}
                                </Button>
                            )}
                            {!canEdit ? (
                                <p className="text-[11px] font-bold text-amber-600/80">Only owners can manage discovery campaigns.</p>
                            ) : null}
                            {state.error ? (
                                <div className="max-w-xl">
                                    <ActionFeedback tone="error" title="Update Blocked" message={state.error} isLight={isLight} />
                                </div>
                            ) : null}
                            {state.success ? (
                                <div className="max-w-xl">
                                    <ActionFeedback tone="success" title="Campaign Synchronized" message={state.success} isLight={isLight} />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
