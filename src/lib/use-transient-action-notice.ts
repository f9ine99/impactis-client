'use client'

import { useEffect, useReducer } from 'react'

type ActionNoticeSource = {
    error: string | null
    success: string | null
}

type ActionNotice = {
    error: string | null
    success: string | null
}

const EMPTY_NOTICE: ActionNotice = {
    error: null,
    success: null,
}

type ActionNoticeReducerAction =
    | {
        type: 'source_changed'
        nextNotice: ActionNotice
    }
    | {
        type: 'clear_if_unchanged'
        nextNotice: ActionNotice
    }

function actionNoticeReducer(
    currentNotice: ActionNotice,
    action: ActionNoticeReducerAction
): ActionNotice {
    if (action.type === 'source_changed') {
        const { nextNotice } = action
        if (!nextNotice.error && !nextNotice.success) {
            if (!currentNotice.error && !currentNotice.success) {
                return currentNotice
            }

            return EMPTY_NOTICE
        }

        if (
            currentNotice.error === nextNotice.error
            && currentNotice.success === nextNotice.success
        ) {
            return currentNotice
        }

        return nextNotice
    }

    if (
        currentNotice.error === action.nextNotice.error
        && currentNotice.success === action.nextNotice.success
    ) {
        return EMPTY_NOTICE
    }

    return currentNotice
}

export function useTransientActionNotice(
    source: ActionNoticeSource,
    timeoutMs = 5000
): ActionNotice {
    const [notice, dispatchNotice] = useReducer(actionNoticeReducer, EMPTY_NOTICE)

    useEffect(() => {
        const nextError = source.error
        const nextSuccess = source.success

        const nextNotice: ActionNotice = {
            error: nextError,
            success: nextSuccess,
        }

        dispatchNotice({
            type: 'source_changed',
            nextNotice,
        })

        if (!nextNotice.error && !nextNotice.success) {
            return
        }

        const timeoutId = window.setTimeout(() => {
            dispatchNotice({
                type: 'clear_if_unchanged',
                nextNotice,
            })
        }, timeoutMs)

        return () => window.clearTimeout(timeoutId)
    }, [source.error, source.success, timeoutMs])

    return notice
}
