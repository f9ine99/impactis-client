'use client'

import { Building2, ShieldCheck } from 'lucide-react'

type PermissionsSectionProps = {
    organizationType: string
    memberRole: string
    industryTags: string
    isLight: boolean
    labelClass: string
    textMainClass: string
    textMutedClass: string
    titleMutedClass: string
    mutedPanelClass: string
}

export default function PermissionsSection(input: PermissionsSectionProps) {
    const { isLight, labelClass, textMainClass, textMutedClass, titleMutedClass, mutedPanelClass } = input

    return (
        <div className={`rounded-3xl border p-6 ${mutedPanelClass} shadow-xl backdrop-blur-2xl`}>
            <div className="mb-8 flex items-center gap-3">
                <div className={`rounded-xl border p-2 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                </div>
                <div>
                    <p className={`text-xs font-black uppercase tracking-[0.2em] ${labelClass}`}>Governance & Permissions</p>
                    <p className={`text-[11px] font-bold ${textMutedClass}`}>Review access control and organizational standing.</p>
                </div>
            </div>

            <div className="divide-y divide-slate-200/5">
                {/* Organization Snapshot Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 first:pt-0">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Organization Snapshot
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Core system properties defining your organization&apos;s type and standing.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
                            <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                <p className={`text-[11px] font-black uppercase tracking-widest ${titleMutedClass}`}>Type</p>
                                <p className={`mt-1 text-base font-black capitalize ${textMainClass}`}>{input.organizationType}</p>
                            </div>
                            <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                <p className={`text-[11px] font-black uppercase tracking-widest ${titleMutedClass}`}>Your Role</p>
                                <p className={`mt-1 text-base font-black capitalize ${textMainClass}`}>{input.memberRole}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                                    <p className={`text-[11px] font-black uppercase tracking-widest ${titleMutedClass}`}>Industry Scope</p>
                                    <p className={`mt-1 text-sm font-bold ${textMainClass}`}>{input.industryTags}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Permission Rules Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Permission Rules
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Governance logic currently enforced across your organization.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid gap-4 max-w-xl">
                            <div className="flex gap-4 items-start">
                                <div className={`mt-1 shrink-0 rounded-full border p-1 ${isLight ? 'border-slate-200 ' : 'border-slate-800'}`}>
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                </div>
                                <div>
                                    <p className={`text-sm font-black ${textMainClass}`}>Owner-only commands</p>
                                    <p className={`mt-0.5 text-sm font-medium leading-relaxed ${textMutedClass}`}>Update organization settings, manage invites, and govern identity assets.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className={`mt-1 shrink-0 rounded-full border p-1 ${isLight ? 'border-slate-200 ' : 'border-slate-800'}`}>
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                </div>
                                <div>
                                    <p className={`text-sm font-black ${textMainClass}`}>Active membership gate</p>
                                    <p className={`mt-0.5 text-sm font-medium leading-relaxed ${textMutedClass}`}>Only active members can view workspace settings, rooms, and collaboration data.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
