'use client'

import { useActionState, useState, ChangeEvent, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { Trash2 } from 'lucide-react'
import { useTransientActionNotice } from '@/lib/use-transient-action-notice'
import { updateProfileAction, type UpdateProfileActionState } from './actions'

type ProfileFormProps = {
    defaultFullName: string
    defaultAvatarUrl: string
    defaultLocation: string
    defaultBio: string
    defaultPhone: string
    defaultHeadline: string
    defaultWebsiteUrl: string
    defaultLinkedinUrl: string
    defaultTimezoneName: string
    defaultPreferredContactMethod: string
    isLight?: boolean
}

const initialState: UpdateProfileActionState = {
    error: null,
    success: null,
}

export default function ProfileForm({
    defaultFullName,
    defaultAvatarUrl,
    defaultLocation,
    defaultBio,
    defaultPhone,
    defaultHeadline,
    defaultWebsiteUrl,
    defaultLinkedinUrl,
    defaultTimezoneName,
    defaultPreferredContactMethod,
    isLight = true,
}: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState(updateProfileAction, initialState)
    const notice = useTransientActionNotice(state)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [removeCurrentAvatar, setRemoveCurrentAvatar] = useState(false)

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            setRemoveCurrentAvatar(false)
        }
    }

    const panelClass = isLight
        ? 'border-slate-200 bg-white/90 shadow-sm'
        : 'border-slate-800 bg-slate-900/60 shadow-2xl'
    const inputClass = isLight
        ? 'border-slate-200 bg-white text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
        : 'border-slate-800 bg-slate-950 text-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
    const selectClass = isLight
        ? 'border-slate-200 bg-white text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
        : 'border-slate-800 bg-slate-950 text-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
    const labelClass = isLight
        ? 'text-slate-500'
        : 'text-slate-400'
    const textMutedClass = isLight
        ? 'text-slate-600'
        : 'text-slate-400'
    const sectionTitleClass = isLight
        ? 'text-slate-900'
        : 'text-slate-100'

    useEffect(() => {
        if (!notice.success) {
            return
        }

        toast.success('Profile updated', {
            description: 'Your profile details were saved successfully.',
            duration: 3200,
            id: 'profile-update-success',
        })
    }, [notice.success])

    useEffect(() => {
        if (!notice.error) {
            return
        }

        toast.error('Profile update failed', {
            description: notice.error,
            duration: 4200,
            id: 'profile-update-error',
        })
    }, [notice.error])

    return (
        <form action={formAction} className="space-y-8">
            {/* Identity Segment */}
            <Card className={`${panelClass} overflow-hidden rounded-[2rem] backdrop-blur-3xl`}>
                <CardHeader className="p-8 pb-4">
                    <div>
                        <CardTitle className={`text-xl font-black ${sectionTitleClass}`}>Identity Details</CardTitle>
                        <CardDescription className={textMutedClass}>Your core identification across the Impactis network.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                    <div className="grid gap-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                            <div className="relative group shrink-0">
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 opacity-20 blur-sm" />
                                <Avatar className={`h-24 w-24 border-2 ${isLight ? 'border-white' : 'border-slate-900'}`}>
                                    <AvatarImage src={previewUrl || defaultAvatarUrl} alt="Avatar Preview" />
                                    <AvatarFallback className={isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500'}>
                                        U
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex-1 space-y-3">
                                <label htmlFor="avatarFile" className={`block text-[11px] font-black uppercase tracking-widest ${labelClass}`}>
                                    Update Profile Avatar
                                </label>
                                <div className="relative">
                                    <input type="hidden" name="avatarCurrentUrl" value={defaultAvatarUrl} />
                                    <input
                                        id="avatarFile"
                                        name="avatarFile"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                                        onChange={handleAvatarChange}
                                        disabled={isPending}
                                        className={`w-full rounded-2xl border px-5 py-4 text-sm outline-none transition-all file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:text-white hover:file:bg-emerald-600 disabled:opacity-50 ${inputClass}`}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className={`text-[10px] font-medium ${textMutedClass}`}>Max 2MB: JPG, PNG, WEBP, or SVG.</p>
                                    {defaultAvatarUrl && (
                                        <div className="space-y-1 text-right">
                                            <input
                                                id="avatarRemove"
                                                type="checkbox"
                                                name="avatarRemove"
                                                value="1"
                                                checked={removeCurrentAvatar}
                                                onChange={(event) => setRemoveCurrentAvatar(event.target.checked)}
                                                disabled={isPending}
                                                className="peer sr-only"
                                            />
                                            <label
                                                htmlFor="avatarRemove"
                                                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    removeCurrentAvatar
                                                        ? 'border-rose-300 bg-rose-50 text-rose-600'
                                                        : isLight
                                                            ? 'border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-500'
                                                            : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-rose-500/40 hover:text-rose-400'
                                                }`}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                {removeCurrentAvatar ? 'Will Remove' : 'Remove Current'}
                                            </label>
                                            <p className={`text-[10px] font-medium ${removeCurrentAvatar ? 'text-rose-500' : textMutedClass}`}>
                                                {removeCurrentAvatar ? 'Current avatar will be deleted on save.' : 'Keep current avatar unchanged.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator className={isLight ? 'opacity-50' : 'opacity-10'} />

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="fullName" className={`block text-[11px] font-black uppercase tracking-widest ${labelClass}`}>
                                    Full Name
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    defaultValue={defaultFullName}
                                    disabled={isPending}
                                    placeholder="e.g. Jane Cooper"
                                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-medium outline-none transition-all ${inputClass}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="location" className={`block text-[11px] font-black uppercase tracking-widest ${labelClass}`}>
                                    Global Location
                                </label>
                                <input
                                    id="location"
                                    name="location"
                                    defaultValue={defaultLocation}
                                    disabled={isPending}
                                    placeholder="e.g. San Francisco, US"
                                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-medium outline-none transition-all ${inputClass}`}
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="headline" className={`block text-[11px] font-black uppercase tracking-widest ${labelClass}`}>
                                    Professional Headline
                                </label>
                                <input
                                    id="headline"
                                    name="headline"
                                    defaultValue={defaultHeadline}
                                    disabled={isPending}
                                    placeholder="e.g. Fintech Product Leader"
                                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-medium outline-none transition-all ${inputClass}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="phone" className={`block text-[11px] font-black uppercase tracking-widest ${labelClass}`}>
                                    Phone Number
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    defaultValue={defaultPhone}
                                    disabled={isPending}
                                    placeholder="+251912345678"
                                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-medium outline-none transition-all ${inputClass}`}
                                />
                                <p className={`text-[10px] font-medium ${textMutedClass}`}>
                                    Use international format (E.164).
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Professional Segment */}
            <Card className={`${panelClass} overflow-hidden rounded-[2rem] backdrop-blur-3xl`}>
                <CardHeader className="p-8 pb-4">
                    <div>
                        <CardTitle className={`text-xl font-black ${sectionTitleClass}`}>Professional Summary</CardTitle>
                        <CardDescription className={textMutedClass}>Briefly describe your expertise for better matching.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                    <div className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="websiteUrl" className={`block text-[11px] font-black uppercase tracking-widest ${labelClass}`}>
                                    Website URL
                                </label>
                                <input
                                    id="websiteUrl"
                                    name="websiteUrl"
                                    defaultValue={defaultWebsiteUrl}
                                    disabled={isPending}
                                    placeholder="https://example.com"
                                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-medium outline-none transition-all ${inputClass}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="linkedinUrl" className={`block text-[11px] font-black uppercase tracking-widest ${labelClass}`}>
                                    LinkedIn URL
                                </label>
                                <input
                                    id="linkedinUrl"
                                    name="linkedinUrl"
                                    defaultValue={defaultLinkedinUrl}
                                    disabled={isPending}
                                    placeholder="https://www.linkedin.com/in/your-handle"
                                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-medium outline-none transition-all ${inputClass}`}
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="timezoneName" className={`block text-[11px] font-black uppercase tracking-widest ${labelClass}`}>
                                    Timezone (Required)
                                </label>
                                <input
                                    id="timezoneName"
                                    name="timezoneName"
                                    defaultValue={defaultTimezoneName}
                                    required
                                    disabled={isPending}
                                    placeholder="e.g. Africa/Addis_Ababa"
                                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-medium outline-none transition-all ${inputClass}`}
                                />
                                <p className={`text-[10px] font-medium ${textMutedClass}`}>
                                    Required IANA format.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="preferredContactMethod" className={`block text-[11px] font-black uppercase tracking-widest ${labelClass}`}>
                                    Preferred Contact
                                </label>
                                <select
                                    id="preferredContactMethod"
                                    name="preferredContactMethod"
                                    defaultValue={defaultPreferredContactMethod}
                                    disabled={isPending}
                                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-medium outline-none transition-all ${selectClass}`}
                                >
                                    <option value="">No Preference</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="linkedin">LinkedIn</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="bio" className={`block text-[11px] font-black uppercase tracking-widest ${labelClass}`}>
                                Professional Bio
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                defaultValue={defaultBio}
                                disabled={isPending}
                                rows={6}
                                placeholder="Write a short summary about yourself..."
                                className={`w-full resize-none rounded-2xl border px-5 py-4 text-sm font-medium leading-relaxed outline-none transition-all ${inputClass}`}
                            />
                            <div className="flex items-center justify-end">
                                <p className={`text-[10px] font-medium ${textMutedClass}`}>Recommended: 200-500 characters.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status & Actions */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
                <div className="flex-1">
                    {notice.error ? (
                        <ActionFeedback
                            tone="error"
                            title="Profile update failed"
                            message={notice.error}
                            isLight={isLight}
                        />
                    ) : null}
                    {notice.success ? (
                        <ActionFeedback
                            tone="success"
                            title="Profile saved"
                            message={notice.success}
                            isLight={isLight}
                        />
                    ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-4">
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="h-14 rounded-2xl bg-emerald-500 px-10 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/40 active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Processing...
                            </div>
                        ) : (
                            'Update Identity'
                        )}
                    </Button>
                </div>
            </div>
        </form>
    )
}
