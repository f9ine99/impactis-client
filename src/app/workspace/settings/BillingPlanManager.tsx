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
    const [selectedInterval, setSelectedInterval] = useState<BillingInterval | null>(
        availableIntervals.includes(initialInterval) ? initialInterval : (availableIntervals[0] ?? null)
    )

    useEffect(() => {
        if (!selectedInterval || !availableIntervals.includes(selectedInterval)) {
            setSelectedInterval(availableIntervals[0] ?? null)
        }
    }, [availableIntervals, selectedInterval])

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
        ? 'border-slate-200 bg-white/90'
        : 'border-slate-800 bg-slate-900/70'
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
        <div className={`space-y-6 rounded-3xl border p-6 ${shellClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className={`text-xs font-black uppercase tracking-[0.14em] ${textMutedClass}`}>Subscription Plan</p>
                    <h3 className={`mt-1 text-2xl font-black tracking-tight ${titleClass}`}>Choose Your Plan</h3>
                </div>
                {currentPlan ? (
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-500">
                        Current: {currentPlan.plan.name}
                    </Badge>
                ) : null}
            </div>

            <form action={action} className="space-y-6">
                <input type="hidden" name="planCode" value={selectedPlanCode} />
                {selectedInterval ? <input type="hidden" name="billingInterval" value={selectedInterval} /> : null}

                <div className="grid gap-4 lg:grid-cols-3">
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
                                className={`text-left rounded-2xl border p-4 transition-all ${isSelected
                                    ? (isLight
                                        ? 'border-emerald-300 bg-emerald-50'
                                        : 'border-emerald-500/40 bg-emerald-500/10')
                                    : mutedPanelClass
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-base font-black ${titleClass}`}>{plan.display_name}</p>
                                    <div className="flex items-center gap-2">
                                        {isCurrent ? <Badge variant="success">Current</Badge> : null}
                                        <Badge variant="outline">Tier {plan.tier}</Badge>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-1">
                                    <p className={`text-sm font-semibold ${titleClass}`}>
                                        {monthlyLabel ? `${monthlyLabel} / month` : 'No monthly price'}
                                    </p>
                                    <p className={`text-sm ${textMutedClass}`}>
                                        {annualLabel ? `${annualLabel} / year` : 'No annual price'}
                                    </p>
                                </div>
                                <div className="mt-4 space-y-1">
                                    {plan.features.slice(0, 4).map((feature) => (
                                        <p key={feature.key} className={`text-xs ${textMutedClass}`}>
                                            - {feature.label}
                                        </p>
                                    ))}
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className={`rounded-2xl border p-4 ${mutedPanelClass}`}>
                    <p className={`text-xs font-black uppercase tracking-[0.14em] ${textMutedClass}`}>Billing Interval</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {availableIntervals.map((interval) => {
                            const isSelectedInterval = selectedInterval === interval
                            const label = interval === 'annual' ? 'Annual' : 'Monthly'
                            return (
                                <button
                                    key={interval}
                                    type="button"
                                    onClick={() => setSelectedInterval(interval)}
                                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${isSelectedInterval
                                        ? (isLight
                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300')
                                        : (isLight
                                            ? 'border-slate-200 bg-white text-slate-700'
                                            : 'border-slate-700 bg-slate-900 text-slate-300')
                                        }`}
                                >
                                    <span>{label}</span>
                                    <CircleDollarSign className="h-4 w-4" />
                                </button>
                            )
                        })}
                    </div>
                    {availableIntervals.length < 1 ? (
                        <p className={`mt-3 text-sm ${textMutedClass}`}>
                            The selected plan does not have active billing intervals.
                        </p>
                    ) : null}
                </div>

                {notice.error ? (
                    <ActionFeedback
                        tone="error"
                        title="Subscription update failed"
                        message={notice.error}
                        isLight={isLight}
                    />
                ) : null}

                {notice.success ? (
                    <ActionFeedback
                        tone="success"
                        title="Subscription updated"
                        message={notice.success}
                        isLight={isLight}
                    />
                ) : null}

                {!canManage ? (
                    <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                        Only owner or admin can update subscription settings.
                    </p>
                ) : null}

                <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 ${mutedPanelClass}`}>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                        <p className={`text-sm ${textMutedClass}`}>Paid plans continue in Stripe checkout. Free plan changes apply immediately.</p>
                    </div>
                    <Button
                        type="submit"
                        disabled={!canManage || isPending || !selectedPlan || !selectedInterval}
                    >
                        {isPending ? 'Updating Plan...' : 'Update Subscription'}
                    </Button>
                </div>
            </form>

            {portalNotice.error ? (
                <ActionFeedback
                    tone="error"
                    title="Billing portal unavailable"
                    message={portalNotice.error}
                    isLight={isLight}
                />
            ) : null}

            <form action={portalAction} className={`rounded-2xl border p-3 ${mutedPanelClass}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className={`text-sm ${textMutedClass}`}>
                        Need invoices, payment method, or existing subscription controls?
                    </p>
                    <Button
                        type="submit"
                        variant="outline"
                        disabled={!canManage || isPortalPending}
                    >
                        {isPortalPending ? 'Opening Portal...' : 'Open Stripe Billing Portal'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
