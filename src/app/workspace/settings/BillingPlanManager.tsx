'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { useTransientActionNotice } from '@/lib/use-transient-action-notice'
import type { BillingCurrentPlanSnapshot, BillingInterval, BillingPlan } from '@/modules/billing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    type SettingsSectionActionState,
    updateBillingSubscriptionSectionAction,
} from './actions'
import {
    initMpesaCheckout,
    initTelebirrCheckout,
    listBillingTransactions,
    type BillingTransactionView,
} from '@/modules/billing/billing.client'

type BillingPlanManagerProps = {
    plans: BillingPlan[]
    currentPlan: BillingCurrentPlanSnapshot | null
    canManage: boolean
    billingStripeRedirectEnabled: boolean
    billingSiteUrlConfigured: boolean
    billingApiBaseUrlConfigured: boolean
    stripeCheckoutStatus: 'success' | 'cancel' | null
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
    billingStripeRedirectEnabled,
    billingSiteUrlConfigured,
    billingApiBaseUrlConfigured,
    stripeCheckoutStatus,
    isLight = true,
}: BillingPlanManagerProps) {
    const [state, action, isPending] = useActionState(updateBillingSubscriptionSectionAction, INITIAL_STATE)
    const notice = useTransientActionNotice(state)
    const sortedPlans = useMemo(
        () => [...plans].sort((left, right) => left.tier - right.tier || left.plan_code.localeCompare(right.plan_code)),
        [plans]
    )
    const initialPlanCode = currentPlan?.plan.code ?? sortedPlans[0]?.plan_code ?? ''
    const initialInterval = currentPlan?.subscription.billing_interval ?? 'monthly'
    const [selectedPlanCode, setSelectedPlanCode] = useState<string>(initialPlanCode)
    const [transactions, setTransactions] = useState<BillingTransactionView[]>([])
    const [loadingTx, setLoadingTx] = useState(false)

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

    const shellClass = isLight
        ? 'border-slate-200 bg-white shadow-sm'
        : 'border-slate-800 bg-slate-900/50'
    const cardClass = isLight
        ? 'border-slate-200 bg-slate-50'
        : 'border-slate-800 bg-slate-950/60'
    const titleClass = isLight
        ? 'text-slate-900'
        : 'text-slate-100'
    const textMutedClass = isLight
        ? 'text-slate-600'
        : 'text-slate-400'
    const selectedAmountCents = selectedPlan
        ? (selectedInterval === 'annual'
            ? selectedPlan.pricing.annual_price_cents
            : selectedPlan.pricing.monthly_price_cents)
        : null
    const selectedPriceLabel = selectedPlan
        ? formatCurrencyFromCents(selectedAmountCents, selectedPlan.pricing.currency)
        : null
    const isPaidSelection = (selectedAmountCents ?? 0) > 0
    const primaryActionLabel = isPending
        ? 'Processing...'
        : (billingStripeRedirectEnabled && isPaidSelection)
            ? 'Continue to Checkout'
            : 'Update Subscription'

    const recommendedPlanCode =
        sortedPlans.find((plan) => (plan.pricing.monthly_price_cents ?? 0) > 0)?.plan_code ?? null

    if (sortedPlans.length < 1) {
        return (
            <Card className={shellClass}>
                <CardHeader>
                    <CardTitle className={titleClass}>No public plans are available for this organization type.</CardTitle>
                </CardHeader>
            </Card>
        )
    }

    function refreshTransactions() {
        setLoadingTx(true)
        listBillingTransactions(50)
            .then(setTransactions)
            .catch(() => {})
            .finally(() => setLoadingTx(false))
    }

    useEffect(() => {
        refreshTransactions()
    }, [])

    async function startTelebirr() {
        if (!selectedPlan || !selectedInterval) return
        const res = await initTelebirrCheckout({ planCode: selectedPlan.plan_code, billingInterval: selectedInterval })
        if (!res.success) {
            toast.error('Telebirr init failed', { description: res.message ?? undefined })
            return
        }
        toast.success('Telebirr initialized', { description: res.transactionId ?? undefined })
        refreshTransactions()
    }

    async function startMpesa() {
        if (!selectedPlan || !selectedInterval) return
        const res = await initMpesaCheckout({ planCode: selectedPlan.plan_code, billingInterval: selectedInterval })
        if (!res.success) {
            toast.error('M-Pesa init failed', { description: res.message ?? undefined })
            return
        }
        toast.success('M-Pesa initialized', { description: res.transactionId ?? undefined })
        refreshTransactions()
    }

    return (
        <Card className={`p-0 ${shellClass}`}>
            <CardHeader className="mb-0 flex flex-row flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-emerald-500 ${
                            isLight ? 'border-slate-200 bg-white' : 'border-slate-700 bg-slate-950'
                        }`}
                    >
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className={`text-lg font-bold tracking-tight ${titleClass}`}>Subscription & billing</CardTitle>
                        <p className={`text-sm ${textMutedClass}`}>
                            Choose the right plan and billing cadence for your organization.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                    {currentPlan ? (
                        <Badge variant="outline" className="px-2.5 py-1 text-[11px] font-bold">
                            Active: {currentPlan.plan.name}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="px-2.5 py-1 text-[11px] font-bold">
                            No active plan
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
            <form action={action} className="space-y-6">
                {stripeCheckoutStatus === 'success' ? (
                    <ActionFeedback
                        tone="success"
                        title="Checkout completed"
                        message="Payment was confirmed by Stripe. We are syncing your subscription status now. If your tier does not update immediately, refresh once in a few seconds."
                        isLight={isLight}
                    />
                ) : null}
                {stripeCheckoutStatus === 'cancel' ? (
                    <ActionFeedback
                        tone="error"
                        title="Checkout canceled"
                        message="No charge was made. Select a plan and continue to checkout when you are ready."
                        isLight={isLight}
                    />
                ) : null}

                <input type="hidden" name="planCode" value={selectedPlanCode} />
                {selectedInterval ? <input type="hidden" name="billingInterval" value={selectedInterval} /> : null}

                <Card className={cardClass}>
                    <CardHeader className="pb-3">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className={`text-sm font-semibold ${titleClass}`}>Available plans</p>
                            <p className={`mt-1 text-sm ${textMutedClass}`}>Compare tiers and pick what fits your team.</p>
                        </div>
                        {recommendedPlanCode ? (
                            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                                Recommended: growth plan
                            </div>
                        ) : null}
                    </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {sortedPlans.map((plan) => {
                            const isSelected = selectedPlanCode === plan.plan_code
                            const monthlyLabel = formatCurrencyFromCents(plan.pricing.monthly_price_cents, plan.pricing.currency)
                            const annualLabel = formatCurrencyFromCents(plan.pricing.annual_price_cents, plan.pricing.currency)
                            const isCurrent = currentPlan?.plan.code === plan.plan_code

                            return (
                                <Card
                                    key={plan.plan_code}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedPlanCode(plan.plan_code)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') setSelectedPlanCode(plan.plan_code)
                                    }}
                                    className={`group cursor-pointer rounded-2xl border p-0 transition-all ${
                                        isSelected
                                            ? isLight
                                                ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                                                : 'border-emerald-500/40 bg-emerald-500/10 shadow-sm'
                                            : isLight
                                                ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                                : 'border-slate-700 bg-slate-900 hover:border-slate-600 hover:shadow-sm'
                                    }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className={`text-sm font-semibold ${titleClass}`}>{plan.display_name}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {isCurrent ? (
                                                    <Badge variant="success" className="text-[10px] font-bold">
                                                        Current
                                                    </Badge>
                                                ) : null}
                                                {recommendedPlanCode === plan.plan_code ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-emerald-400 bg-emerald-50 text-[9px] font-semibold text-emerald-600"
                                                    >
                                                        Recommended
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-baseline gap-1">
                                            <p className="text-lg font-semibold text-emerald-500">
                                                {monthlyLabel ?? 'Free'}
                                            </p>
                                            <span className={`text-xs font-medium ${textMutedClass}`}>/month</span>
                                        </div>
                                        {annualLabel ? (
                                            <p className={`text-[11px] ${textMutedClass}`}>{annualLabel}/year</p>
                                        ) : null}
                                        <div className="mt-3 space-y-1">
                                            {plan.features.slice(0, 3).map((feature) => (
                                                <p
                                                    key={feature.key}
                                                    className={`flex items-center gap-1 text-xs ${textMutedClass}`}
                                                >
                                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                    <span>{feature.label}</span>
                                                </p>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                    </CardContent>
                </Card>

                <Card className={cardClass}>
                    <CardContent className="pt-5">
                    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className={`text-sm font-semibold ${titleClass}`}>Billing cadence</p>
                            <p className={`mt-1 text-sm ${textMutedClass}`}>Toggle between monthly and annual pricing.</p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 p-1 text-xs">
                            {availableIntervals.map((interval) => {
                                const isSelectedInterval = selectedInterval === interval
                                const label = interval === 'annual' ? 'Annual' : 'Monthly'

                                return (
                                    <Button
                                        key={interval}
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedIntervalOverride(interval)}
                                        className={`gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                            isSelectedInterval
                                                ? 'bg-emerald-500 text-white hover:bg-emerald-500 hover:text-white'
                                                : isLight
                                                    ? 'text-slate-600 hover:text-slate-900'
                                                    : 'text-slate-300 hover:text-slate-50'
                                        }`}
                                    >
                                        <CircleDollarSign className="h-3 w-3" />
                                        {label}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                    {availableIntervals.length < 1 ? (
                        <p className="mt-1 text-xs font-medium text-amber-600">
                            No active billing intervals for the selected plan.
                        </p>
                    ) : (
                        <p className={`text-xs ${textMutedClass}`}>
                            Annual billing typically offers the best effective monthly rate; monthly keeps things flexible.
                        </p>
                    )}
                    </CardContent>
                </Card>

                <Card className={cardClass}>
                    <CardContent className="pt-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <p className={`text-xs font-semibold uppercase tracking-wide ${textMutedClass}`}>Selected Plan</p>
                            <p className={`text-sm font-semibold ${titleClass}`}>
                                {selectedPlan ? `${selectedPlan.display_name}${selectedInterval ? ` · ${selectedInterval}` : ''}` : 'No plan selected'}
                            </p>
                            <p className={`text-sm ${textMutedClass}`}>
                                {selectedPriceLabel
                                    ? `${selectedPriceLabel}${selectedInterval === 'annual' ? '/year' : '/month'}`
                                    : 'Free plan'}
                            </p>
                            <p className={`text-xs ${textMutedClass}`}>
                                {billingStripeRedirectEnabled
                                    ? 'Paid plans continue to Stripe checkout.'
                                    : 'Hosted Stripe checkout is disabled for this environment.'}
                            </p>
                        </div>
                        <div className="flex flex-col items-start gap-3">
                            <Button
                                type="submit"
                                disabled={!canManage || isPending || !selectedPlan || !selectedInterval}
                                className="h-10 px-6 text-xs font-semibold uppercase tracking-wide"
                            >
                                {primaryActionLabel}
                            </Button>
                            {!canManage ? (
                                <p className="text-xs font-medium text-amber-600">Requires owner or admin role.</p>
                            ) : null}
                        </div>
                    </div>
                    {notice.error ? (
                        <div className="mt-4 max-w-xl">
                            <ActionFeedback tone="error" title="Update failed" message={notice.error} isLight={isLight} />
                        </div>
                    ) : null}
                    {notice.success ? (
                        <div className="mt-4 max-w-xl">
                            <ActionFeedback tone="success" title="Subscription Updated" message={notice.success} isLight={isLight} />
                        </div>
                    ) : null}
                    </CardContent>
                </Card>
            </form>
            <Card className={cardClass}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className={`text-sm font-semibold ${titleClass}`}>Payment transactions</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={refreshTransactions}>
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                        <div className={`text-sm ${textMutedClass}`}>
                                {billingStripeRedirectEnabled
                                    ? 'Stripe checkout is enabled (use Continue to Checkout for paid plans).'
                                    : 'Stripe checkout is disabled here; Telebirr/M-Pesa demo init endpoints are available.'}
                        </div>
                            {billingStripeRedirectEnabled ? null : (
                                <div className="flex gap-2">
                                    <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={startTelebirr}>
                                        Telebirr (demo)
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={startMpesa}>
                                        M-Pesa (demo)
                                    </Button>
                                </div>
                            )}
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Provider</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingTx ? (
                                <TableRow><TableCell colSpan={4} className={textMutedClass}>Loading…</TableCell></TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className={textMutedClass}>No transactions yet.</TableCell></TableRow>
                            ) : transactions.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell className={titleClass}>{t.provider}</TableCell>
                                    <TableCell><Badge variant="secondary">{t.status}</Badge></TableCell>
                                    <TableCell className={textMutedClass}>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: t.currency, maximumFractionDigits: 2 }).format((t.amount_cents ?? 0) / 100)}
                                    </TableCell>
                                    <TableCell className={textMutedClass}>{t.created_at ? new Date(t.created_at).toLocaleString() : ''}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            </CardContent>
        </Card>
    )
}
