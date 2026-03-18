'use client'

import Link from 'next/link'
import { ArrowLeft, LifeBuoy, Send, User, Bot, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getBetterAuthTokenClient } from '@/lib/better-auth-token-client'
import { apiRequest } from '@/lib/api/rest-client'

type ChatTurn = { role: 'user' | 'assistant'; content: string }

export default function HelpPage() {
    const [isLight, setIsLight] = useState(false)
    const [message, setMessage] = useState('')
    const [turns, setTurns] = useState<ChatTurn[]>([
        { role: 'assistant', content: 'Hi — ask anything about Impactis. If you want a human, type “talk to human”.' },
    ])
    const [loading, setLoading] = useState(false)
    const [lastSessionId, setLastSessionId] = useState<string | null>(null)

    useEffect(() => {
        const theme = document.documentElement.classList.contains('workspace-theme-light')
        setIsLight(theme)
    }, [])

    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const cardClass = isLight
        ? 'border-slate-200 bg-white shadow-xl shadow-slate-200/50'
        : 'border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl shadow-emerald-500/10'

    const inputClass = isLight
        ? 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
        : 'border-slate-800 bg-slate-950/50 text-slate-100 placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10'

    const canEscalate = useMemo(() => !!lastSessionId, [lastSessionId])

    async function send() {
        const trimmed = message.trim()
        if (!trimmed || loading) return
        setMessage('')
        setTurns((t) => [...t, { role: 'user', content: trimmed }])
        setLoading(true)
        try {
            const token = await getBetterAuthTokenClient()
            if (!token) {
                toast.error('Please login again')
                return
            }
            const res = await apiRequest<{ session: { id: string }; reply: string } | { error: string }>({
                path: '/support/help-bot/message',
                method: 'POST',
                accessToken: token,
                body: { message: trimmed, context: 'help' },
            })
            if (!res || (typeof res === 'object' && 'error' in res)) {
                toast.error('Help bot failed')
                return
            }
            setLastSessionId(res.session?.id ?? null)
            setTurns((t) => [...t, { role: 'assistant', content: res.reply }])
        } finally {
            setLoading(false)
        }
    }

    async function escalate() {
        if (!lastSessionId) return
        setLoading(true)
        try {
            const token = await getBetterAuthTokenClient()
            if (!token) return
            const res = await apiRequest<{ success: boolean; ticketId: string | null } | { error: string }>({
                path: '/support/help-bot/escalate',
                method: 'POST',
                accessToken: token,
                body: { sessionId: lastSessionId, note: 'User requested human support.' },
            })
            if (!res || (typeof res === 'object' && 'error' in res)) {
                toast.error('Escalation failed')
                return
            }
            toast.success('Escalated to support', { description: res.ticketId ? `Ticket: ${res.ticketId}` : undefined })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-1 overflow-y-auto items-center justify-center p-6">
            <div className={`relative z-10 w-full max-w-3xl overflow-hidden rounded-[2.5rem] border p-8 transition-all duration-500 ${cardClass}`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                            <LifeBuoy className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className={`text-lg font-black tracking-tight ${textMainClass}`}>Help & Support</h1>
                            <p className={`text-xs font-medium ${textMutedClass}`}>AI-first support with human escalation.</p>
                        </div>
                    </div>
                    <Button asChild variant="ghost" className="rounded-2xl">
                        <Link href="/workspace">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>

                <div className={`mt-6 rounded-3xl border ${isLight ? 'border-slate-200 bg-slate-50/40' : 'border-white/5 bg-slate-950/30'}`}>
                    <div className="max-h-[420px] overflow-y-auto p-5 space-y-3">
                        {turns.map((t, idx) => (
                            <div key={idx} className={`flex items-start gap-3 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {t.role === 'assistant' && (
                                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                )}
                                <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${t.role === 'user'
                                    ? 'bg-emerald-600 text-white'
                                    : isLight ? 'bg-white border border-slate-200 text-slate-900' : 'bg-slate-900/70 border border-white/5 text-slate-100'
                                    }`}>
                                    {t.content}
                                </div>
                                {t.role === 'user' && (
                                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                                        <User className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className={`border-t p-4 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                        <div className="flex gap-2">
                            <Input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your question…"
                                className={`h-12 rounded-2xl ${inputClass}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') send()
                                }}
                            />
                            <Button
                                onClick={send}
                                disabled={loading}
                                className="h-12 rounded-2xl bg-emerald-600 px-5 text-white hover:bg-emerald-500"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                            <p className={`text-[11px] font-medium ${textMutedClass}`}>
                                Tip: type “talk to human” then press escalate.
                            </p>
                            <Button
                                variant="outline"
                                onClick={escalate}
                                disabled={!canEscalate || loading}
                                className="h-9 rounded-xl"
                            >
                                <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                                Escalate
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
