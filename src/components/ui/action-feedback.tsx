'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ActionFeedbackTone = 'success' | 'error'

type ActionFeedbackProps = {
    tone: ActionFeedbackTone
    title?: string
    message: string
    isLight?: boolean
    className?: string
    extra?: ReactNode
}

export function ActionFeedback({
    tone,
    title,
    message,
    isLight = true,
    className,
    extra,
}: ActionFeedbackProps) {
    const isSuccess = tone === 'success'
    const Icon = isSuccess ? CheckCircle2 : AlertTriangle
    const resolvedTitle = title ?? (isSuccess ? 'Saved successfully' : 'Action failed')

    const containerClass = isLight
        ? isSuccess
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
            : 'border-rose-300 bg-rose-50 text-rose-900'
        : isSuccess
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
            : 'border-rose-500/30 bg-rose-500/10 text-rose-100'

    const iconWrapClass = isLight
        ? isSuccess
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-rose-100 text-rose-700'
        : isSuccess
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/20 text-rose-300'

    const titleClass = isLight
        ? isSuccess
            ? 'text-emerald-900'
            : 'text-rose-900'
        : isSuccess
            ? 'text-emerald-100'
            : 'text-rose-100'

    const messageClass = isLight
        ? isSuccess
            ? 'text-emerald-800'
            : 'text-rose-800'
        : isSuccess
            ? 'text-emerald-200'
            : 'text-rose-200'

    return (
        <div className={cn('rounded-xl border px-3.5 py-3 shadow-sm transition-colors', containerClass, className)}>
            <div className="flex items-start gap-3">
                <span className={cn('mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', iconWrapClass)}>
                    <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                    <p className={cn('text-sm font-semibold tracking-tight', titleClass)}>{resolvedTitle}</p>
                    <p className={cn('mt-0.5 text-sm leading-relaxed', messageClass)}>{message}</p>
                    {extra ? <div className="mt-2">{extra}</div> : null}
                </div>
            </div>
        </div>
    )
}
