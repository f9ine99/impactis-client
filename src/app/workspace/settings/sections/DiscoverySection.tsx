'use client'

import { FileText, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { TagEditor } from '../components/TagEditor'
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
    mutedPanelClass,
    labelClass,
    inputClass,
    textMutedClass,
    textMainClass,
    titleClass,
}: DiscoverySectionProps) {
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
                        <input
                            id="startupPostTitle"
                            name="startupPostTitle"
                            defaultValue={defaultStartupPostTitle}
                            disabled={!canEdit || isPending}
                            placeholder="Enter a high-impact headline..."
                            className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>
                </div>

                {/* Executive Summary Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label htmlFor="startupPostSummary" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Executive Summary
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Briefly describe the problem, traction, and vision.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <textarea
                            id="startupPostSummary"
                            name="startupPostSummary"
                            defaultValue={defaultStartupPostSummary}
                            disabled={!canEdit || isPending}
                            rows={5}
                            placeholder="Describe the problem you solve, your traction, and your vision."
                            className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
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
                                <input
                                    id="startupPostStage"
                                    name="startupPostStage"
                                    defaultValue={defaultStartupPostStage}
                                    disabled={!canEdit || isPending}
                                    placeholder="Pre-seed, Seed, etc."
                                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="startupPostLocation" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>Primary Location</label>
                                <input
                                    id="startupPostLocation"
                                    name="startupPostLocation"
                                    defaultValue={defaultStartupPostLocation}
                                    disabled={!canEdit || isPending}
                                    placeholder="City, Country"
                                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                />
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
                        <select
                            id="startupPostStatus"
                            name="startupPostStatus"
                            defaultValue={defaultStartupPostStatus}
                            disabled={!canEdit || isPending}
                            className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        >
                            <option value="draft">Private Draft</option>
                            <option value="published">Publicly Discoverable</option>
                        </select>
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
                            <Button
                                type="submit"
                                disabled={!canEdit || isPending}
                                className="w-fit h-10 px-8 text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                {isPending ? 'Synchronizing...' : 'Save Campaign'}
                            </Button>
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
