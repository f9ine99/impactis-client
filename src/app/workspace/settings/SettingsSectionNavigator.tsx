import {
    Building2,
    CircleDollarSign,
    ClipboardList,
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
    if (icon === 'identity') {
        return Building2
    }

    if (icon === 'readiness') {
        return Gauge
    }

    if (icon === 'billing') {
        return CircleDollarSign
    }

    if (icon === 'discovery') {
        return Rocket
    }

    if (icon === 'invites') {
        return Users
    }

    if (icon === 'permissions') {
        return ShieldCheck
    }

    if (icon === 'rules') {
        return ClipboardList
    }

    return Users
}

export default function SettingsSectionNavigator({
    sections,
    isLight,
}: SettingsSectionNavigatorProps) {
    const wrapperClass = isLight
        ? 'rounded-xl border border-slate-200 bg-slate-50 p-2'
        : 'rounded-xl border border-slate-800 bg-slate-950/60 p-2'
    const activeClass = isLight
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
    const idleClass = isLight
        ? 'border-slate-200 bg-white text-slate-700'
        : 'border-slate-800 bg-slate-900 text-slate-300'
    const mutedClass = isLight ? 'text-slate-500' : 'text-slate-400'

    return (
        <div className="space-y-2">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedClass}`}>Settings Properties</p>
            <div className={wrapperClass}>
                <div className="space-y-1">
                    {sections.map((section) => {
                        const Icon = getSectionIcon(section.icon)

                        return (
                            <Link
                                key={section.id}
                                href={section.href}
                                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${section.active ? activeClass : idleClass}`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {section.label}
                            </Link>
                        )
                    })}
                </div>
            </div>
            <p className={`text-[11px] ${mutedClass}`}>Select a property to open its standalone section view.</p>
        </div>
    )
}
