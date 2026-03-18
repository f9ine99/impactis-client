'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { OrganizationType } from '@/modules/organizations'
import { completeOnboardingAction, type OnboardingActionState } from '@/app/onboarding/actions'
import { onboardingSchema, type OnboardingFormValues } from '@/schemas/onboarding'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

type CreateOrgFormProps = {
    defaultOrganizationType: OrganizationType
    defaultOrganizationName: string
    defaultLocation: string
    defaultIndustryTags: string[]
}

const initialState: OnboardingActionState = { error: null }

function toLabel(value: OrganizationType): string {
    if (value === 'startup') return 'Startup'
    if (value === 'investor') return 'Investor'
    return 'Advisor'
}

export default function CreateOrgForm({
    defaultOrganizationType,
    defaultOrganizationName,
    defaultLocation,
    defaultIndustryTags,
}: CreateOrgFormProps) {
    const [isPending, setIsPending] = useState(false)
    const form = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            organizationType: defaultOrganizationType,
            organizationName: defaultOrganizationName,
            organizationLocation: defaultLocation,
            organizationIndustryTags: defaultIndustryTags.join(', '),
        },
    })

    const onSubmit = async (values: OnboardingFormValues) => {
        setIsPending(true)
        try {
            const formData = new FormData()
            formData.set('organizationType', values.organizationType)
            formData.set('organizationName', values.organizationName)
            formData.set('organizationLocation', values.organizationLocation ?? '')
            formData.set('organizationIndustryTags', values.organizationIndustryTags ?? '')
            const result = await completeOnboardingAction(initialState, formData)
            if (result.error) {
                form.setError('root', { message: result.error })
            }
        } finally {
            setIsPending(false)
        }
    }
    const stateError = form.formState.errors.root?.message

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
                <FormField
                    control={form.control}
                    name="organizationType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                                Organization type
                            </FormLabel>
                            <FormControl>
                                <select
                                    id="organizationType"
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-[#0B3D2E]"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value as OnboardingFormValues['organizationType'])}
                                >
                                    {(['startup', 'investor', 'advisor'] as const).map((organizationType) => (
                                        <option key={organizationType} value={organizationType}>
                                            {toLabel(organizationType)}
                                        </option>
                                    ))}
                                </select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="organizationName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                                Organization name
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Your organization name"
                                    className="rounded-xl border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-[#0B3D2E]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="organizationLocation"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                                Location
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="City, Country"
                                    className="rounded-xl border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-[#0B3D2E]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="organizationIndustryTags"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                                Industry tags
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Fintech, Climate, Health"
                                    className="rounded-xl border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-[#0B3D2E]"
                                    {...field}
                                />
                            </FormControl>
                            <p className="mt-2 text-xs text-gray-500">Separate tags with commas.</p>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {stateError ? (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                        {stateError}
                    </p>
                ) : null}
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#0B3D2E] px-5 py-3 font-semibold text-white transition hover:bg-[#082a20] disabled:opacity-60"
                >
                    {isPending ? 'Creating…' : 'Continue'}
                </button>
            </form>
        </Form>
    )
}
