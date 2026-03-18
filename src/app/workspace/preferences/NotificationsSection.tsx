'use client'

import { useMemo, useState } from 'react'
import { Bell, Mail, MessageSquare, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateNotificationPreferences } from '@/modules/notifications/notifications.repository'

export default function NotificationsSection({ isLight }: { isLight: boolean }) {
    const [inAppEnabled, setInAppEnabled] = useState(true)
    const [emailEnabled, setEmailEnabled] = useState(true)
    const [telegramEnabled, setTelegramEnabled] = useState(false)
    const [telegramChatId, setTelegramChatId] = useState('')
    const [saving, setSaving] = useState(false)

    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const panelClass = isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-white/5 bg-slate-900/60'

    const inputClass = isLight
        ? 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
        : 'border-slate-800 bg-slate-950/40 text-slate-100 placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10'

    const toggleRow = useMemo(() => (label: string, value: boolean, setValue: (v: boolean) => void, icon: any) => {
        const Icon = icon
        return (
            <div className={`flex items-center justify-between rounded-2xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/5 bg-slate-950/30'}`}>
                <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-white/5'}`}>
                        <Icon className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                        <p className={`text-sm font-black ${textMainClass}`}>{label}</p>
                        <p className={`text-[11px] font-medium ${textMutedClass}`}>Control delivery for this channel.</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setValue(!value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${value ? 'bg-emerald-500' : isLight ? 'bg-slate-200' : 'bg-slate-800'}`}
                    aria-pressed={value}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${value ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
            </div>
        )
    }, [isLight, textMainClass, textMutedClass])

    async function onSave() {
        setSaving(true)
        try {
            const ok = await updateNotificationPreferences({
                in_app_enabled: inAppEnabled,
                email_enabled: emailEnabled,
                telegram_enabled: telegramEnabled,
                telegram_chat_id: telegramChatId.trim() ? telegramChatId.trim() : null,
            })
            if (!ok) {
                toast.error('Failed to save preferences')
                return
            }
            toast.success('Notification preferences saved')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className={`overflow-hidden rounded-[2rem] border p-8 ${panelClass}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className={`text-sm font-black uppercase tracking-widest ${textMainClass}`}>Notification Preferences</h3>
                    <p className={`mt-1 text-[11px] font-medium ${textMutedClass}`}>
                        Choose how you receive alerts. (Telegram is optional.)
                    </p>
                </div>
                <Button
                    onClick={onSave}
                    disabled={saving}
                    className="h-10 rounded-xl bg-emerald-600 px-4 text-[11px] font-black uppercase tracking-widest text-white hover:bg-emerald-500"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving…' : 'Save'}
                </Button>
            </div>

            <div className="mt-6 grid gap-4">
                {toggleRow('In-app notifications', inAppEnabled, setInAppEnabled, Bell)}
                {toggleRow('Email notifications', emailEnabled, setEmailEnabled, Mail)}
                {toggleRow('Telegram notifications', telegramEnabled, setTelegramEnabled, MessageSquare)}

                <div className={`rounded-2xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/5 bg-slate-950/30'}`}>
                    <Label className={`text-[10px] font-black uppercase tracking-widest ${textMutedClass}`}>
                        Telegram Chat ID (optional)
                    </Label>
                    <div className="mt-2">
                        <Input
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            placeholder="e.g. 123456789"
                            className={`rounded-xl ${inputClass}`}
                        />
                    </div>
                    <p className={`mt-2 text-[11px] font-medium ${textMutedClass}`}>
                        You can leave this empty until Telegram linking is implemented.
                    </p>
                </div>
            </div>
        </div>
    )
}

