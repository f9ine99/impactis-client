'use client'

import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useOnboardingSave } from '@/modules/onboarding'

type Props = {
    role: string
    initialValues: Record<string, unknown> | null
}

const schema = z.record(z.any())

export default function OnboardingDataEditor({ role, initialValues }: Props) {
    const save = useOnboardingSave()
    const [status, setStatus] = useState<string | null>(null)

    const defaults = useMemo(() => (initialValues && typeof initialValues === 'object' ? initialValues : {}), [initialValues])

    const form = useForm<Record<string, unknown>>({
        resolver: zodResolver(schema),
        defaultValues: defaults,
    })

    const onSubmit = async (values: Record<string, unknown>) => {
        setStatus(null)
        const res = await save({
            role,
            stepIndex: 999,
            totalSteps: 6,
            values,
            completed: true,
            skipped: false,
        })
        setStatus(res.ok ? 'Saved.' : 'Save failed.')
    }

    // Minimal editor: render common keys as inputs when present.
    const keys = Object.keys(defaults)
        .filter((k) => !['updated_at', 'score', 'questionnaire'].includes(k))
        .slice(0, 80)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Onboarding fields</CardTitle>
                <CardDescription>Edit the onboarding values saved for role: {role}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {keys.length === 0 ? (
                            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">No saved onboarding fields yet.</div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {keys.map((k) => (
                                    <FormField
                                        key={k}
                                        control={form.control}
                                        name={k as any}
                                        render={({ field }) => {
                                            const v = field.value
                                            const isLong = typeof v === 'string' && v.length > 120
                                            const isArray = Array.isArray(v)
                                            return (
                                                <FormItem className={isLong ? 'sm:col-span-2' : ''}>
                                                    <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                        {k}
                                                    </FormLabel>
                                                    <FormControl>
                                                        {isLong ? (
                                                            <Textarea {...field} value={(field.value as any) ?? ''} />
                                                        ) : (
                                                            <Input
                                                                {...field}
                                                                value={
                                                                    isArray
                                                                        ? (v as any[]).join(', ')
                                                                        : (field.value as any) ?? ''
                                                                }
                                                                onChange={(e) => {
                                                                    if (isArray) {
                                                                        field.onChange(
                                                                            e.target.value
                                                                                .split(',')
                                                                                .map((s) => s.trim())
                                                                                .filter(Boolean),
                                                                        )
                                                                        return
                                                                    }
                                                                    field.onChange(e.target.value)
                                                                }}
                                                            />
                                                        )}
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <Button type="submit">Save changes</Button>
                            {status ? <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{status}</span> : null}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

