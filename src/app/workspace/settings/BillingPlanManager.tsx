'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { useTransientActionNotice } from '@/lib/use-transient-action-notice'
import type { BillingCurrentPlanSnapshot, BillingInterval, BillingPlan } from '@/modules/billing'
import {
    openBillingPortalSectionAction,
    type SettingsSectionActionState,
    updateBillingSubscriptionSectionAction,
} from './actions'

type BillingPlanManagerProps = {
    plans: BillingPlan[]
    currentPlan: BillingCurrentPlanSnapshot | null
    canManage: boolean
    isLight?: boolean
}

const INITIAL_STATE: SettingsSectionActionState = {
    error: null,
    success: null,
}

function formatCurrencyFromCents(cents: number | null, currency: string): string | null {
    if (typeof cents !== 'number' || Number.isNaN(cents)) {
        return null
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100)
}

function resolveAvailableIntervals(plan: BillingPlan | null): BillingInterval[] {
    if (!plan) {
        return []
    }

    const intervals: BillingInterval[] = []
    if (typeof plan.pricing.monthly_price_cents === 'number') {
        intervals.push('monthly')
    }
    if (typeof plan.pricing.annual_price_cents === 'number') {
        intervals.push('annual')
    }

    return intervals
}

export default function BillingPlanManager({
    plans,
    currentPlan,
    canManage,
    isLight = true,
}: BillingPlanManagerProps) {
    const [state, action, isPending] = useActionState(updateBillingSubscriptionSectionAction, INITIAL_STATE)
    const [portalState, portalAction, isPortalPending] = useActionState(openBillingPortalSectionAction, INITIAL_STATE)
    const notice = useTransientActionNotice(state)
    const portalNotice = useTransientActionNotice(portalState)
    const sortedPlans = useMemo(
        () => [...plans].sort((left, right) => left.tier - right.tier || left.plan_code.localeCompare(right.plan_code)),
        [plans]
    )
    const initialPlanCode = currentPlan?.plan.code ?? sortedPlans[0]?.plan_code ?? ''
    const initialInterval = currentPlan?.subscription.billing_interval ?? 'monthly'
    const [selectedPlanCode, setSelectedPlanCode] = useState<string>(initialPlanCode)

    const selectedPlan = useMemo(
        () => sortedPlans.find((plan) => plan.plan_code === selectedPlanCode) ?? null,
        [selectedPlanCode, sortedPlans]
    )
    const availableIntervals = useMemo(
        () => resolveAvailableIntervals(selectedPlan),
        [selectedPlan]
    )
    const [selectedIntervalOverride, setSelectedIntervalOverride] = useState<BillingInterval | null>(null)

    const selectedInterval = (selectedIntervalOverride && availableIntervals.includes(selectedIntervalOverride))
        ? selectedIntervalOverride
        : (availableIntervals.includes(initialInterval) ? initialInterval : (availableIntervals[0] ?? null))

    useEffect(() => {
        if (!notice.success) {
            return
        }

        toast.success('Subscription updated', {
            description: notice.success,
            duration: 3200,
            id: 'settings-billing-success',
        })
    }, [notice.success])

    useEffect(() => {
        if (!notice.error) {
            return
        }

        toast.error('Subscription update failed', {
            description: notice.error,
            duration: 4200,
            id: 'settings-billing-error',
        })
    }, [notice.error])

    useEffect(() => {
        if (!portalNotice.error) {
            return
        }

        toast.error('Billing portal unavailable', {
            description: portalNotice.error,
            duration: 4200,
            id: 'settings-billing-portal-error',
        })
    }, [portalNotice.error])

    const shellClass = isLight
        ? 'border-slate-200 bg-white/60 shadow-xl backdrop-blur-3xl'
        : 'border-slate-800 bg-slate-900/40 shadow-2xl backdrop-blur-3xl'
    const mutedPanelClass = isLight
        ? 'border-slate-200 bg-slate-50'
        : 'border-slate-800 bg-slate-950/70'
    const titleClass = isLight
        ? 'text-slate-900'
        : 'text-slate-100'
    const textMutedClass = isLight
        ? 'text-slate-600'
        : 'text-slate-400'

    if (sortedPlans.length < 1) {
        return (
            <div className={`rounded-3xl border p-6 ${shellClass}`}>
                <p className={`text-sm font-semibold ${titleClass}`}>No public plans are available for this organization type.</p>
            </div>
        )
    }

    return (
        <div className={`rounded-3xl border p-6 ${mutedPanelClass} shadow-xl backdrop-blur-2xl`}>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`rounded-xl border p-2 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                        <Sparkles className="h-4 w-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                    </div>
                    <div>
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${textMutedClass}`}>Subscription Plan</p>
                        <p className={`text-[11px] font-bold ${textMutedClass}`}>Choose and manage your environment tier</p>
                    </div>
                </div>
                {currentPlan ? (
                    <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-1.5 shadow-sm ${isLight ? 'bg-white' : 'bg-slate-900/50'}`}>
                        <span className={`text-[11px] font-black uppercase tracking-tight ${textMutedClass}`}>Active Plan</span>
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-500 px-2 py-0.5 text-[11px] font-black uppercase tracking-widest">
                            {currentPlan.plan.name}
                        </Badge>
                    </div>
                ) : null}
            </div>

            <form action={action} className="divide-y divide-slate-200/5">
                <input type="hidden" name="planCode" value={selectedPlanCode} />
                {selectedInterval ? <input type="hidden" name="billingInterval" value={selectedInterval} /> : null}

                {/* Plan Selection Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 first:pt-0">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${textMutedClass}`}>
                            Available Plans
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Select a tier that matches your organization's scale and required features.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {sortedPlans.map((plan) => {
                                const isSelected = selectedPlanCode === plan.plan_code
                                const monthlyLabel = formatCurrencyFromCents(plan.pricing.monthly_price_cents, plan.pricing.currency)
                                const annualLabel = formatCurrencyFromCents(plan.pricing.annual_price_cents, plan.pricing.currency)
                                const isCurrent = currentPlan?.plan.code === plan.plan_code

                                return (
                                    <button
                                        key={plan.plan_code}
                                        type="button"
                                        onClick={() => setSelectedPlanCode(plan.plan_code)}
                                        className={`text-left rounded-2xl border p-4 transition-all hover:scale-[1.02] active:scale-95 ${isSelected
                                            ? (isLight
                                                ? 'border-emerald-300 bg-emerald-50 shadow-md ring-1 ring-emerald-300/20'
                                                : 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20')
                                            : (isLight ? 'border-slate-200 bg-white hover:bg-slate-50' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900')
                                            }`}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`text-sm font-black uppercase tracking-tight ${titleClass}`}>{plan.display_name}</p>
                                                {isCurrent ? <Badge variant="success" className="h-4 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tighter">Active</Badge> : null}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <p className={`text-[11px] font-black text-emerald-500`}>
                                                    {monthlyLabel || 'FREE'}
                                                </p>
                                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                <Badge variant="outline" className="h-4 border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">Tier {plan.tier}</Badge>
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-1 opacity-80">
                                            {plan.features.slice(0, 3).map((feature) => (
                                                <p key={feature.key} className={`text-[11px] font-bold leading-tight ${textMutedClass}`}>
                                                    • {feature.label}
                                                </p>
                                            ))}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Billing Interval Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${textMutedClass}`}>
                            Billing Interval
                        </label>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            Choose between flexible monthly billing or discounted annual payments.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
                            {availableIntervals.map((interval) => {
                                const isSelectedInterval = selectedInterval === interval
                                const label = interval === 'annual' ? 'Annual (Best Value)' : 'Monthly'
                                return (
                                    <button
                                        key={interval}
                                        type="button"
                                        onClick={() => setSelectedIntervalOverride(interval)}
                                        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${isSelectedInterval
                                            ? (isLight
                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm'
                                                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-emerald-500/10')
                                            : (isLight
                                                ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800')
                                            }`}
                                    >
                                        <span className="text-[11px]">{label}</span>
                                        <CircleDollarSign className={`h-4 w-4 ${isSelectedInterval ? 'text-emerald-500' : 'opacity-40'}`} />
                                    </button>
                                )
                            })}
                        </div>
                        {availableIntervals.length < 1 ? (
                            <p className={`mt-3 text-[11px] font-bold text-amber-600 italic`}>
                                No active billing intervals for the selected plan.
                            </p>
                        ) : null}
                    </div>
                </div>

                {/* Save Action Row */}
                <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 border-t border-slate-200/5 items-center">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <p className={`text-xs font-black uppercase tracking-widest ${textMutedClass}`}>Finalize Subscription</p>
                        </div>
                        <p className={`mt-1 text-sm font-bold ${textMutedClass}`}>Changes apply immediately or via Stripe Portal.</p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                disabled={!canManage || isPending || !selectedPlan || !selectedInterval}
                                className="w-fit h-10 px-8 text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                {isPending ? 'Synchronizing...' : 'Update Subscription'}
                            </Button>
                            {!canManage ? (
                                <p className="text-[11px] font-bold text-amber-600/80 uppercase tracking-tighter">Requires administrator privileges.</p>
                            ) : null}
                            {notice.error ? (
                                <div className="max-w-xl">
                                    <ActionFeedback tone="error" title="Update failed" message={notice.error} isLight={isLight} />
                                </div>
                            ) : null}
                            {notice.success ? (
                                <div className="max-w-xl">
                                    <ActionFeedback tone="success" title="Plan Synchronized" message={notice.success} isLight={isLight} />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </form>

            <form action={portalAction} className="mt-8 border-t border-slate-200/5 pt-8">
                <div className="grid gap-4 md:grid-cols-3 md:gap-8 items-center">
                    <div className="md:col-span-1">
                        <p className={`text-xs font-black uppercase tracking-widest ${textMutedClass}`}>External Controls</p>
                        <p className={`mt-1 text-sm font-bold ${textMutedClass}`}>Manage invoices and payment methods.</p>
                    </div>
                    <div className="md:col-span-2">
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={!canManage || isPortalPending}
                            className="w-fit h-9 px-6 text-[11px] font-black uppercase tracking-[0.12em] border-slate-200/60 hover:bg-slate-100 transition-all"
                        >
                            {isPortalPending ? 'Opening Portal...' : 'Open Stripe Billing Portal'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
