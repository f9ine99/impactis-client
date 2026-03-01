'use client'

import {
    Building2,
    ChevronRight,
    CircleDollarSign,
    ClipboardList,
    FolderLock,
    Gauge,
    Rocket,
    ShieldCheck,
    Users,
} from 'lucide-react'
import Link from 'next/link'

export type SettingsSectionIcon =
    | 'identity'
    | 'billing'
    | 'readiness'
    | 'discovery'
    | 'dataroom'
    | 'invites'
    | 'permissions'
    | 'rules'
    | 'team'

export type SettingsSectionItem = {
    id: string
    label: string
    icon: SettingsSectionIcon
    href: string
    active?: boolean
}

type SettingsSectionNavigatorProps = {
    sections: SettingsSectionItem[]
    isLight: boolean
}

const ICON_MAP: Record<string, typeof Building2> = {
    identity: Building2,
    readiness: Gauge,
    billing: CircleDollarSign,
    discovery: Rocket,
    dataroom: FolderLock,
    invites: Users,
    permissions: ShieldCheck,
    rules: ClipboardList,
    team: Users,
}

const DESCRIPTION_MAP: Record<string, string> = {
    'settings-identity': 'Profile, logo & categories',
    'settings-billing': 'Plans, invoices & usage',
    'settings-startup-readiness': 'Score & eligibility inputs',
    'settings-discovery': 'Visibility & feed listing',
    'settings-data-room': 'Documents for investors',
    'settings-invites': 'Invite links & members',
    'settings-permissions': 'Roles & access control',
    'settings-readiness-rules': 'Qualification criteria',
    'settings-team-access': 'Collaboration settings',
}

const ICON_COLOR_MAP: Record<string, { bg: string; color: string; ring: string }> = {
    identity: { bg: 'bg-emerald-500/10', color: 'text-emerald-500', ring: 'ring-emerald-100 dark:ring-emerald-500/10' },
    billing: { bg: 'bg-amber-500/10', color: 'text-amber-500', ring: 'ring-amber-100 dark:ring-amber-500/10' },
    readiness: { bg: 'bg-blue-500/10', color: 'text-blue-500', ring: 'ring-blue-100 dark:ring-blue-500/10' },
    discovery: { bg: 'bg-violet-500/10', color: 'text-violet-500', ring: 'ring-violet-100 dark:ring-violet-500/10' },
    dataroom: { bg: 'bg-rose-500/10', color: 'text-rose-500', ring: 'ring-rose-100 dark:ring-rose-500/10' },
    invites: { bg: 'bg-cyan-500/10', color: 'text-cyan-500', ring: 'ring-cyan-100 dark:ring-cyan-500/10' },
    permissions: { bg: 'bg-orange-500/10', color: 'text-orange-500', ring: 'ring-orange-100 dark:ring-orange-500/10' },
    rules: { bg: 'bg-pink-500/10', color: 'text-pink-500', ring: 'ring-pink-100 dark:ring-pink-500/10' },
    team: { bg: 'bg-teal-500/10', color: 'text-teal-500', ring: 'ring-teal-100 dark:ring-teal-500/10' },
}

function getSectionIcon(icon: SettingsSectionIcon) {
    return ICON_MAP[icon] || Building2
}

function getIconColors(icon: SettingsSectionIcon) {
    return ICON_COLOR_MAP[icon] || ICON_COLOR_MAP.identity
}

export default function SettingsSectionNavigator({
    sections,
    isLight,
}: SettingsSectionNavigatorProps) {
    return (
        <div className="space-y-1.5">
            {sections.map((section) => {
                const Icon = getSectionIcon(section.icon)
                const iconColors = getIconColors(section.icon)
                const isActive = section.active
                const description = DESCRIPTION_MAP[section.id] ?? ''

                return (
                    <Link
                        key={section.id}
                        href={section.href}
                        className="block group"
                    >
                        <div className={`relative flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 transition-all duration-300 ${isActive
                                ? isLight
                                    ? 'bg-gradient-to-r from-emerald-50 to-white border border-emerald-200/80 shadow-sm shadow-emerald-500/5'
                                    : 'bg-gradient-to-r from-emerald-500/[0.08] to-transparent border border-emerald-500/20 shadow-lg shadow-emerald-900/10'
                                : isLight
                                    ? 'border border-transparent hover:bg-slate-50 hover:border-slate-200/60'
                                    : 'border border-transparent hover:bg-white/[0.02] hover:border-white/[0.04]'
                            }`}>
                            {/* Active indicator bar */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            )}

                            {/* Icon */}
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isActive
                                    ? `${iconColors.bg} ring-2 ${isLight ? iconColors.ring.split(' ')[0] : iconColors.ring.split(' ')[1]?.replace('dark:', '') || iconColors.ring.split(' ')[0]}`
                                    : isLight
                                        ? 'bg-slate-100/80 group-hover:bg-slate-100'
                                        : 'bg-slate-800/50 group-hover:bg-slate-800/80'
                                }`}>
                                <Icon className={`h-4 w-4 transition-colors duration-300 ${isActive ? iconColors.color : isLight ? 'text-slate-400' : 'text-slate-500'
                                    }`} />
                            </div>

                            {/* Text */}
                            <div className="min-w-0 flex-1">
                                <p className={`text-[12px] font-bold tracking-tight transition-colors ${isActive
                                        ? isLight ? 'text-emerald-700' : 'text-emerald-300'
                                        : isLight ? 'text-slate-700 group-hover:text-slate-900' : 'text-slate-300 group-hover:text-slate-100'
                                    }`}>
                                    {section.label}
                                </p>
                                {description && (
                                    <p className={`mt-0.5 text-[10px] font-medium transition-colors truncate ${isActive
                                            ? isLight ? 'text-emerald-600/60' : 'text-emerald-400/50'
                                            : isLight ? 'text-slate-400' : 'text-slate-600'
                                        }`}>
                                        {description}
                                    </p>
                                )}
                            </div>

                            {/* Chevron */}
                            {isActive && (
                                <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isLight ? 'text-emerald-400' : 'text-emerald-500/60'}`} />
                            )}
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
