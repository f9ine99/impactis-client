'use client'

import { useEffect, useRef } from 'react'
import { Turnstile, type TurnstileInstance, type TurnstileTheme } from '@marsidev/react-turnstile'

type TurnstileWidgetProps = {
    siteKey: string
    onTokenChange: (token: string | null) => void
    resetSignal?: number
    className?: string
    theme?: TurnstileTheme
}

export default function TurnstileWidget({
    siteKey,
    onTokenChange,
    resetSignal,
    className,
    theme = 'light',
}: TurnstileWidgetProps) {
    const turnstileRef = useRef<TurnstileInstance | null>(null)

    useEffect(() => {
        const turnstile = turnstileRef.current

        return () => {
            onTokenChange(null)
            turnstile?.remove()
        }
    }, [onTokenChange])

    useEffect(() => {
        if (resetSignal === undefined) {
            return
        }

        turnstileRef.current?.reset()
        onTokenChange(null)
    }, [onTokenChange, resetSignal])

    return (
        <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            className={className}
            options={{ theme }}
            onSuccess={onTokenChange}
            onExpire={() => onTokenChange(null)}
            onError={() => onTokenChange(null)}
        />
    )
}
