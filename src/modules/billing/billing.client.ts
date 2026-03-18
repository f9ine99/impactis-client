import { apiRequest } from '@/lib/api/rest-client'
import { getBetterAuthTokenClient } from '@/lib/better-auth-token-client'

export type BillingTransactionView = {
    id: string
    provider: string
    amount_cents: number
    currency: string
    status: string
    created_at: string
    provider_payment_id: string | null
}

function normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const t = value.trim()
    return t.length ? t : null
}

function normalizeNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
    if (typeof value === 'string') {
        const parsed = Number.parseInt(value.trim(), 10)
        if (Number.isFinite(parsed)) return Math.max(0, parsed)
    }
    return 0
}

async function token(): Promise<string | null> {
    return getBetterAuthTokenClient()
}

export async function listBillingTransactions(limit = 100): Promise<BillingTransactionView[]> {
    const accessToken = await token()
    if (!accessToken) return []
    const data = await apiRequest<unknown>({
        path: `/billing/transactions?limit=${encodeURIComponent(String(limit))}`,
        method: 'GET',
        accessToken,
    })
    if (!Array.isArray(data)) return []
    return data
        .map((row) => {
            const r = (row ?? {}) as Record<string, unknown>
            return {
                id: normalizeText(r.id) ?? '',
                provider: normalizeText(r.provider) ?? 'stripe',
                amount_cents: normalizeNumber(r.amount_cents),
                currency: (normalizeText(r.currency) ?? 'USD').toUpperCase(),
                status: normalizeText(r.status) ?? 'pending',
                created_at: normalizeText(r.created_at) ?? '',
                provider_payment_id: normalizeText(r.provider_payment_id),
            }
        })
        .filter((t) => t.id.length > 0)
}

export async function initTelebirrCheckout(input: { planCode: string; billingInterval?: 'monthly' | 'annual' | null }) {
    const accessToken = await token()
    if (!accessToken) return { success: false, message: 'Unauthorized' }
    const planCode = normalizeText(input.planCode)?.toLowerCase()
    if (!planCode) return { success: false, message: 'Plan code is required.' }
    const row = await apiRequest<any>({
        path: '/billing/checkout/telebirr',
        method: 'POST',
        accessToken,
        body: { planCode, billingInterval: input.billingInterval ?? null },
    })
    if (!row || typeof row !== 'object') return { success: false, message: 'Failed to initialize Telebirr payment.' }
    return { success: row.success === true, message: normalizeText(row.message), transactionId: normalizeText(row.transactionId) }
}

export async function initMpesaCheckout(input: { planCode: string; billingInterval?: 'monthly' | 'annual' | null }) {
    const accessToken = await token()
    if (!accessToken) return { success: false, message: 'Unauthorized' }
    const planCode = normalizeText(input.planCode)?.toLowerCase()
    if (!planCode) return { success: false, message: 'Plan code is required.' }
    const row = await apiRequest<any>({
        path: '/billing/checkout/mpesa',
        method: 'POST',
        accessToken,
        body: { planCode, billingInterval: input.billingInterval ?? null },
    })
    if (!row || typeof row !== 'object') return { success: false, message: 'Failed to initialize M-Pesa payment.' }
    return { success: row.success === true, message: normalizeText(row.message), transactionId: normalizeText(row.transactionId) }
}

