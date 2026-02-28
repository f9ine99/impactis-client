'use client'

import {
    Building2,
    CircleDollarSign,
    ClipboardList,
    FolderLock,
    Gauge,
    Rocket,
    ShieldCheck,
    Users,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

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

function getSectionIcon(icon: SettingsSectionIcon) {
    const icons = {
        identity: Building2,
        readiness: Gauge,
        billing: CircleDollarSign,
        discovery: Rocket,
        dataroom: FolderLock,
        invites: Users,
        permissions: ShieldCheck,
        rules: ClipboardList,
    }
    return icons[icon as keyof typeof icons] || Users
}

export default function SettingsSectionNavigator({
    sections,
    isLight,
}: SettingsSectionNavigatorProps) {
    const wrapperClass = isLight
        ? 'rounded-2xl border border-slate-200 bg-white/50 p-2 shadow-sm backdrop-blur-md'
        : 'rounded-2xl border border-slate-800 bg-slate-950/40 p-2 shadow-2xl backdrop-blur-md'

    const activeClass = isLight
        ? 'bg-white border-slate-200 shadow-sm text-emerald-600'
        : 'bg-slate-900 border-slate-700 shadow-lg text-emerald-400'

    const idleClass = isLight
        ? 'border-transparent text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'
        : 'border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'

    const mutedClass = isLight ? 'text-slate-500/80' : 'text-slate-500'

    return (
        <div className="space-y-1">
            {sections.map((section) => {
                const Icon = getSectionIcon(section.icon)
                const isActive = section.active

                return (
                    <Link
                        key={section.id}
                        href={section.href}
                        className="block px-2"
                    >
                        <motion.div
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-xs font-black transition-all duration-300 ${isActive ? activeClass : idleClass}`}
                        >
                            <div className={`flex h-6 w-6 items-center justify-center rounded-lg border ${isActive
                                ? (isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400')
                                : (isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700')
                                }`}>
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="truncate tracking-tight">{section.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="active-indicator"
                                    className="absolute left-0 h-4 w-1 rounded-r-full bg-emerald-500"
                                />
                            )}
                        </motion.div>
                    </Link>
                )
            })}
        </div>
    )
}
