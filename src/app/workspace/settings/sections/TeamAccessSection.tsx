'use client'

import { Users } from 'lucide-react'

type TeamAccessSectionProps = {
    isLight: boolean
    labelClass: string
    textMainClass: string
    textMutedClass: string
    titleMutedClass: string
    mutedPanelClass: string
}

export default function TeamAccessSection(input: TeamAccessSectionProps) {
    const { isLight, labelClass, textMainClass, textMutedClass, titleMutedClass, mutedPanelClass } = input

    return (
        <div className={`rounded-3xl border p-6 ${mutedPanelClass} shadow-xl backdrop-blur-2xl`}>
            <div className="mb-8 flex items-center gap-3">
                <div className={`rounded-xl border p-2 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <Users className="h-4 w-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                </div>
                <div>
                    <p className={`text-xs font-black uppercase tracking-[0.2em] ${labelClass}`}>Team Access Guide</p>
                    <p className={`text-[11px] font-bold ${textMutedClass}`}>Recommended structure for organization collaboration.</p>
                </div>
            </div>

            <div className="divide-y divide-slate-200/5">
                {/* Access Hierarchy Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 first:pt-0">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Membership Roles
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Understand the functional boundaries and responsibilities for each seat type.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid gap-3 sm:grid-cols-3 max-w-2xl">
                            <div className={`rounded-2xl border p-5 ${mutedPanelClass} hover:border-emerald-500/30 transition-colors`}>
                                <p className={`text-[11px] font-black uppercase tracking-widest ${titleMutedClass}`}>Owner</p>
                                <p className={`mt-2 text-base font-black ${textMainClass}`}>Strategic</p>
                                <p className={`mt-1 text-[11px] font-bold leading-relaxed ${textMutedClass}`}>Full governance over identity, billing, and team composition.</p>
                            </div>
                            <div className={`rounded-2xl border p-5 ${mutedPanelClass} hover:border-emerald-500/30 transition-colors`}>
                                <p className={`text-[11px] font-black uppercase tracking-widest ${titleMutedClass}`}>Admin</p>
                                <p className={`mt-2 text-base font-black ${textMainClass}`}>Oversight</p>
                                <p className={`mt-1 text-[11px] font-bold leading-relaxed ${textMutedClass}`}>Operational maintenance and discovery campaign execution.</p>
                            </div>
                            <div className={`rounded-2xl border p-5 ${mutedPanelClass} hover:border-emerald-500/30 transition-colors`}>
                                <p className={`text-[11px] font-black uppercase tracking-widest ${titleMutedClass}`}>Member</p>
                                <p className={`mt-2 text-base font-black ${textMainClass}`}>Standard</p>
                                <p className={`mt-1 text-[11px] font-bold leading-relaxed ${textMutedClass}`}>View workspace data and participate in active rooms.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Collaboration Context Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
                            Governance
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            How roles interact with organizational assets and tools.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid gap-4 max-w-xl">
                            <p className={`text-[12px] font-bold leading-relaxed ${textMutedClass}`}>
                                Roles are hierarchical. <span className={textMainClass}>Owners</span> have inherited permissions of <span className={textMainClass}>Admins</span>, who have inherited permissions of <span className={textMainClass}>Members</span>.
                            </p>
                            <p className={`text-[12px] font-bold leading-relaxed ${textMutedClass}`}>
                                For sensitive financial or legal modifications, restricted &quot;Owner-only&quot; gates are enforced at the API level.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
