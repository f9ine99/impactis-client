'use client'

import { Building2, FileText } from 'lucide-react'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TagEditor } from '../components/TagEditor'
import { ORGANIZATION_TAG_SUGGESTIONS, INVESTOR_SECTOR_TAG_SUGGESTIONS } from '../constants'
import type { SettingsSectionActionState } from '../actions'

type IdentitySectionProps = {
    organizationType: 'startup' | 'advisor' | 'investor'
    defaultOrganizationName: string
    defaultOrganizationLocation: string
    defaultOrganizationLogoUrl: string
    defaultOrganizationIndustryTags: string
    defaultInvestorThesis: string
    defaultInvestorSectorTags: string
    defaultInvestorCheckSizeMinUsd: number | null
    defaultInvestorCheckSizeMaxUsd: number | null
    canEdit: boolean
    isLight: boolean
    action: (formData: FormData) => void
    isPending: boolean
    state: SettingsSectionActionState
    // Styles
    mutedPanelClass: string
    labelClass: string
    inputClass: string
    textMutedClass: string
    textMainClass: string
    titleClass: string
}

export function IdentitySection({
    organizationType,
    defaultOrganizationName,
    defaultOrganizationLocation,
    defaultOrganizationLogoUrl,
    defaultOrganizationIndustryTags,
    defaultInvestorThesis,
    defaultInvestorSectorTags,
    defaultInvestorCheckSizeMinUsd,
    defaultInvestorCheckSizeMaxUsd,
    canEdit,
    isLight,
    action,
    isPending,
    state,
    mutedPanelClass,
    labelClass,
    inputClass,
    textMutedClass,
    textMainClass,
    titleClass,
}: IdentitySectionProps) {
    return (
        <div className={`rounded-3xl border p-6 ${mutedPanelClass} shadow-xl backdrop-blur-2xl`}>
            <div className="mb-8 flex items-center gap-3">
                <div className={`rounded-xl border p-2 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <Building2 className="h-4 w-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                </div>
                <div>
                    <p className={`text-xs font-black uppercase tracking-[0.2em] ${labelClass}`}>Organization Identity</p>
                    <p className={`text-[11px] font-bold ${textMutedClass}`}>Core profile and search properties</p>
                </div>
            </div>

            <form action={action} className="divide-y divide-slate-200/5">
                {/* Organization Name Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 first:pt-0">
                    <div className="md:col-span-1">
                        <label htmlFor="organizationName" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Organization Name
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            The primary identity of your organization across the workspace.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <input
                            id="organizationName"
                            name="organizationName"
                            defaultValue={defaultOrganizationName}
                            disabled={!canEdit || isPending}
                            placeholder="e.g. Acme Corp"
                            className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>
                </div>

                {/* Location Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label htmlFor="organizationLocation" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Headquarters
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Base of operations for matching and jurisdictional requirements.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <input
                            id="organizationLocation"
                            name="organizationLocation"
                            defaultValue={defaultOrganizationLocation}
                            disabled={!canEdit || isPending}
                            placeholder="City, Country"
                            className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                        />
                    </div>
                </div>

                {/* Logo Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label htmlFor="organizationLogoFile" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Organization Logo
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Iconography for your brand profile. Square ratios work best.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <input type="hidden" name="organizationLogoCurrentUrl" value={defaultOrganizationLogoUrl} />
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start max-w-xl">
                            <div className="flex-1">
                                <input
                                    id="organizationLogoFile"
                                    name="organizationLogoFile"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                                    disabled={!canEdit || isPending}
                                    className={`w-full rounded-xl border px-4 py-2.5 text-xs outline-none transition-all file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-1.5 file:text-[11px] file:font-black file:uppercase file:text-white hover:file:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                />
                                <p className={`mt-2 text-[11px] font-medium ${textMutedClass}`}>JPG, PNG, WEBP, GIF, or SVG (max 2MB).</p>
                            </div>

                            {defaultOrganizationLogoUrl ? (
                                <div className={`flex shrink-0 flex-col items-center gap-3 rounded-xl border p-3 ${isLight ? 'bg-white' : 'bg-slate-950/50'}`}>
                                    <Avatar className="h-12 w-12 border border-slate-200 shadow-sm">
                                        <AvatarImage src={defaultOrganizationLogoUrl} alt="Organization logo" />
                                        <AvatarFallback className="bg-slate-900 text-xs font-bold text-white">LOGO</AvatarFallback>
                                    </Avatar>
                                    <label className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight cursor-pointer ${textMutedClass}`}>
                                        <input
                                            type="checkbox"
                                            name="organizationLogoRemove"
                                            value="1"
                                            disabled={!canEdit || isPending}
                                            className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-500"
                                        />
                                        Remove
                                    </label>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Categories Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Organization Categories
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Power discovery matching by tagging your primary focus areas.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="max-w-xl">
                            <TagEditor
                                id="organizationIndustryTags"
                                name="organizationIndustryTags"
                                label="Organization Categories"
                                defaultValue={defaultOrganizationIndustryTags}
                                disabled={!canEdit || isPending}
                                placeholder="e.g. Fintech, SaaS, Health"
                                suggestions={ORGANIZATION_TAG_SUGGESTIONS}
                                inputClass={inputClass}
                                labelClass={labelClass}
                                textMutedClass={textMutedClass}
                                isLight={isLight}
                                suggestionLimit={24}
                                hideLabelAndDescription={true}
                            />
                        </div>
                    </div>
                </div>

                {organizationType === 'investor' ? (
                    <>
                        {/* Investor Thesis Row */}
                        <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                            <div className="md:col-span-1">
                                <label htmlFor="investorThesis" className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                                    Investment Thesis
                                </label>
                                <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                                    Detailed philosophy and mandate for your investment criteria.
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <textarea
                                    id="investorThesis"
                                    name="investorThesis"
                                    defaultValue={defaultInvestorThesis}
                                    disabled={!canEdit || isPending}
                                    rows={4}
                                    placeholder="Describe your mandate, stage focus, and value-add..."
                                    className={`w-full max-w-xl rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                />
                            </div>
                        </div>

                        {/* Sector Focus Row */}
                        <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                            <div className="md:col-span-1">
                                <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                                    Sector Focus
                                </label>
                                <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                                    Specific industries or verticals where you actively deploy capital.
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <div className="max-w-xl">
                                    <TagEditor
                                        id="investorSectorTags"
                                        name="investorSectorTags"
                                        label="Sector Focus"
                                        defaultValue={defaultInvestorSectorTags}
                                        disabled={!canEdit || isPending}
                                        placeholder="e.g. AI, Crypto, Sustainability"
                                        suggestions={INVESTOR_SECTOR_TAG_SUGGESTIONS}
                                        inputClass={inputClass}
                                        labelClass={labelClass}
                                        textMutedClass={textMutedClass}
                                        isLight={isLight}
                                        suggestionLimit={24}
                                        hideLabelAndDescription={true}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Check Size Row */}
                        <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                            <div className="md:col-span-1">
                                <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                                    Typical Check Size (USD)
                                </label>
                                <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                                    Minimum and maximum investment range per deal.
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <div className="flex max-w-xl items-center gap-4">
                                    <div className="flex-1">
                                        <input
                                            name="investorCheckSizeMinUsd"
                                            type="number"
                                            defaultValue={defaultInvestorCheckSizeMinUsd ?? ''}
                                            disabled={!canEdit || isPending}
                                            placeholder="Min USD"
                                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                        />
                                    </div>
                                    <div className={`h-px w-4 ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`} />
                                    <div className="flex-1">
                                        <input
                                            name="investorCheckSizeMaxUsd"
                                            type="number"
                                            defaultValue={defaultInvestorCheckSizeMaxUsd ?? ''}
                                            disabled={!canEdit || isPending}
                                            placeholder="Max USD"
                                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
                {/* Save Action Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 border-t border-slate-200/5 items-center">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <p className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Finalize Changes</p>
                        </div>
                        <p className={`mt-1 text-sm font-bold ${textMutedClass}`}>Sync identity properties to the network.</p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                disabled={!canEdit || isPending}
                                className="w-fit h-10 px-8 text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                {isPending ? 'Synchronizing...' : 'Save Identity'}
                            </Button>
                            {state.error ? (
                                <div className="max-w-xl">
                                    <ActionFeedback tone="error" title="Update failed" message={state.error} isLight={isLight} />
                                </div>
                            ) : null}
                            {state.success ? (
                                <div className="max-w-xl">
                                    <ActionFeedback tone="success" title="Identity updated" message={state.success} isLight={isLight} />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
