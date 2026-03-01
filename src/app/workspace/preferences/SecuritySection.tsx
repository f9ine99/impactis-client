'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    Clock,
    Eye,
    EyeOff,
    Fingerprint,
    Globe,
    KeyRound,
    Loader2,
    Lock,
    LogOut,
    Mail,
    Monitor,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Smartphone,
    X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { apiRequest } from '@/lib/api/rest-client'

type ActiveSessionItem = {
    id: string
    user_id: string
    ip: string | null
    user_agent: string | null
    created_at: string
    updated_at: string
}

type SecuritySectionProps = {
    userEmail: string
    lastSignIn: string | null
    sessions: ActiveSessionItem[]
    isLight: boolean
}

/* ─── Shared Helpers ────────────────────────────────────── */

function PasswordField(input: {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    placeholder: string
    hint?: string
    isLight: boolean
}) {
    const [visible, setVisible] = useState(false)

    const inputClass = input.isLight
        ? 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
        : 'border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10'
    const labelClass = input.isLight ? 'text-slate-600' : 'text-slate-400'

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label
                    htmlFor={input.id}
                    className={`text-[10px] font-black uppercase tracking-widest ${labelClass}`}
                >
                    {input.label}
                </label>
                {input.hint && (
                    <span className={`text-[10px] font-medium ${input.isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {input.hint}
                    </span>
                )}
            </div>
            <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className={`h-3.5 w-3.5 transition-colors ${input.value ? 'text-emerald-500' : input.isLight ? 'text-slate-300' : 'text-slate-600'}`} />
                </div>
                <input
                    id={input.id}
                    type={visible ? 'text' : 'password'}
                    value={input.value}
                    onChange={(e) => input.onChange(e.target.value)}
                    placeholder={input.placeholder}
                    autoComplete={input.id === 'current-password' ? 'current-password' : 'new-password'}
                    className={`w-full rounded-xl border py-3.5 pl-11 pr-12 text-sm font-medium outline-none transition-all duration-200 ${inputClass}`}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className={`absolute inset-y-0 right-3 flex items-center transition-colors ${input.isLight ? 'text-slate-300 hover:text-slate-500' : 'text-slate-600 hover:text-slate-400'}`}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    )
}

function getPasswordStrength(password: string): {
    score: number
    label: string
    color: string
    textColor: string
    checks: { label: string; passed: boolean }[]
} {
    const checks = [
        { label: 'At least 6 characters', passed: password.length >= 6 },
        { label: '10+ characters recommended', passed: password.length >= 10 },
        { label: 'Contains uppercase letter', passed: /[A-Z]/.test(password) },
        { label: 'Contains a number', passed: /[0-9]/.test(password) },
        { label: 'Contains special character', passed: /[^A-Za-z0-9]/.test(password) },
    ]

    const score = checks.filter((c) => c.passed).length

    if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-500', checks }
    if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-500', checks }
    if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-500', checks }
    return { score, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-500', checks }
}

function SectionCard(input: {
    icon: typeof Shield
    iconBgClass: string
    iconColorClass: string
    title: string
    description: string
    badge?: { label: string; variant: 'success' | 'warning' | 'muted' }
    isLight: boolean
    children: React.ReactNode
}) {
    const cardClass = input.isLight
        ? 'border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/40'
        : 'border-white/5 bg-slate-900/60 backdrop-blur-xl'
    const textMainClass = input.isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = input.isLight ? 'text-slate-500' : 'text-slate-400'
    const dividerClass = input.isLight ? 'border-slate-100' : 'border-slate-800'

    const badgeStyles: Record<string, string> = {
        success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        muted: input.isLight
            ? 'bg-slate-100 text-slate-400 border-slate-200'
            : 'bg-slate-800 text-slate-500 border-slate-700',
    }

    return (
        <section className={`overflow-hidden rounded-[2rem] border transition-all duration-300 hover:shadow-lg ${cardClass}`}>
            <div className={`flex items-center justify-between gap-4 border-b px-8 py-6 ${dividerClass}`}>
                <div className="flex items-center gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${input.iconBgClass}`}>
                        <input.icon className={`h-5 w-5 ${input.iconColorClass}`} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-black uppercase tracking-widest ${textMainClass}`}>
                            {input.title}
                        </h3>
                        <p className={`mt-0.5 text-[11px] font-medium leading-relaxed ${textMutedClass}`}>
                            {input.description}
                        </p>
                    </div>
                </div>
                {input.badge && (
                    <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${badgeStyles[input.badge.variant]}`}>
                        {input.badge.variant === 'success' && <CheckCircle2 className="h-3 w-3" />}
                        {input.badge.variant === 'warning' && <AlertTriangle className="h-3 w-3" />}
                        {input.badge.label}
                    </span>
                )}
            </div>
            <div className="p-8">
                {input.children}
            </div>
        </section>
    )
}

/* ─── Main Component ────────────────────────────────────── */

function parseUserAgent(ua: string | null): { browser: string; os: string; label: string } {
    if (!ua || ua.trim().length === 0) {
        return { browser: '', os: '', label: 'Unrecognized Session' }
    }

    let browser = ''
    if (ua.includes('Firefox/')) browser = 'Firefox'
    else if (ua.includes('Edg/')) browser = 'Edge'
    else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera'
    else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome'
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari'
    else if (ua.includes('curl/')) browser = 'cURL'

    let os = ''
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS'
    else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

    if (!browser && !os) {
        // If we can't parse it but it's not empty, show a truncated version of the raw UA
        if (ua && ua.length > 0) {
            const cleanUa = ua.replace(/^Mozilla\/5\.0\s+/, '').split(' ')[0]
            return { browser: '', os: '', label: cleanUa || 'Unknown Device' }
        }
        return { browser: '', os: '', label: 'Unrecognized Session' }
    }
    if (browser && os) return { browser, os, label: `${browser} on ${os}` }
    return { browser: browser || '', os: os || '', label: browser || os }
}

function getDeviceIcon(os: string) {
    if (os === 'Android' || os === 'iOS') return Smartphone
    return Monitor
}

export default function SecuritySection({
    userEmail,
    lastSignIn,
    sessions: initialSessions,
    isLight,
}: SecuritySectionProps) {
    const router = useRouter()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)
    const [liveSessions, setLiveSessions] = useState(initialSessions)
    const [revokingId, setRevokingId] = useState<string | null>(null)
    const [isRevokingAll, setIsRevokingAll] = useState(false)

    const supabase = createClient()
    const strength = getPasswordStrength(newPassword)

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault()

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters.')
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match.')
            return
        }

        if (strength.score <= 1) {
            toast.error('Please choose a stronger password.')
            return
        }

        setIsUpdating(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Password updated successfully.')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch {
            toast.error('An unexpected error occurred.')
        } finally {
            setIsUpdating(false)
        }
    }

    async function handleRevokeSession(sessionId: string) {
        setRevokingId(sessionId)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token ?? null
            const result = await apiRequest<{ success: boolean; message: string }>({
                path: `/sessions/${sessionId}`,
                method: 'DELETE',
                accessToken: token,
            })

            if (result?.success) {
                setLiveSessions((prev) => prev.filter((s) => s.id !== sessionId))
                toast.success('Session revoked.')
            } else {
                toast.error(result?.message ?? 'Failed to revoke session.')
            }
        } catch {
            toast.error('An unexpected error occurred.')
        } finally {
            setRevokingId(null)
        }
    }

    async function handleRevokeAllOtherSessions() {
        setIsRevokingAll(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token ?? null
            const result = await apiRequest<{ success: boolean; message: string; count: number }>({
                path: '/sessions',
                method: 'DELETE',
                accessToken: token,
            })

            if (result?.success) {
                setLiveSessions((prev) => [prev[0]].filter(Boolean))
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result?.message ?? 'Failed to revoke sessions.')
            }
        } catch {
            toast.error('An unexpected error occurred.')
        } finally {
            setIsRevokingAll(false)
        }
    }

    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const mutedCardClass = isLight
        ? 'border-slate-100 bg-slate-50/80'
        : 'border-slate-800 bg-slate-950/40'

    const lastSignInLabel = lastSignIn
        ? new Date(lastSignIn).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
        : 'Unknown'

    const lastSignInRelative = lastSignIn
        ? getRelativeTime(new Date(lastSignIn))
        : null

    const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword
    const passwordsMismatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword
    const canSubmit = !isUpdating && newPassword.length >= 6 && passwordsMatch && strength.score > 1

    return (
        <div className="space-y-8">
            {/* ── Security Overview Banner ─────────────────────── */}
            <div className={`relative overflow-hidden rounded-[2rem] border p-6 ${isLight ? 'border-slate-200 bg-gradient-to-br from-white to-slate-50' : 'border-white/5 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl'}`}>
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />
                <div className="relative flex items-center gap-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-4 ring-emerald-500/5">
                        <ShieldCheck className="h-7 w-7 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-sm font-black uppercase tracking-widest ${textMainClass}`}>
                            Security Overview
                        </h3>
                        <p className={`mt-1 text-[11px] font-medium leading-relaxed ${textMutedClass}`}>
                            Manage your credentials, review active sessions, and configure authentication methods.
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${mutedCardClass}`}>
                            <Mail className={`h-3.5 w-3.5 ${textMutedClass}`} />
                            <span className={`text-[11px] font-bold truncate max-w-[180px] ${textMainClass}`}>{userEmail}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Change Password ──────────────────────────────── */}
            <SectionCard
                icon={KeyRound}
                iconBgClass="bg-emerald-500/10"
                iconColorClass="text-emerald-500"
                title="Change Password"
                description="Update your account password. We recommend using a unique password you don't use elsewhere."
                isLight={isLight}
            >
                <form onSubmit={handleChangePassword} className="space-y-6">
                    <PasswordField
                        id="current-password"
                        label="Current Password"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        placeholder="Enter your current password"
                        isLight={isLight}
                    />

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-slate-800/60'}`} />

                    <PasswordField
                        id="new-password"
                        label="New Password"
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder="Create a strong new password"
                        hint={newPassword.length > 0 ? `${newPassword.length} chars` : undefined}
                        isLight={isLight}
                    />

                    {/* Strength Meter + Requirements */}
                    {newPassword.length > 0 && (
                        <div className={`rounded-2xl border p-5 space-y-4 transition-all duration-500 ${mutedCardClass}`}>
                            {/* Visual Bar */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${textMutedClass}`}>
                                        Password Strength
                                    </span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${strength.textColor}`}>
                                        {strength.label}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-2 flex-1 rounded-full transition-all duration-500 ${level <= strength.score
                                                ? strength.color
                                                : isLight ? 'bg-slate-200' : 'bg-slate-800'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Requirements Checklist */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {strength.checks.map((check) => (
                                    <div key={check.label} className="flex items-center gap-2">
                                        {check.passed ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                        ) : (
                                            <X className={`h-3.5 w-3.5 shrink-0 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
                                        )}
                                        <span className={`text-[11px] font-medium ${check.passed ? 'text-emerald-500' : textMutedClass}`}>
                                            {check.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <PasswordField
                        id="confirm-password"
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Re-enter your new password"
                        isLight={isLight}
                    />

                    {/* Match Indicator */}
                    {passwordsMatch && (
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <p className="text-[11px] font-bold text-emerald-500">Passwords match</p>
                        </div>
                    )}
                    {passwordsMismatch && (
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                            <p className="text-[11px] font-bold text-rose-500">Passwords do not match</p>
                        </div>
                    )}

                    <div className={`flex items-center justify-between pt-2 border-t ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
                        <p className={`text-[10px] font-medium ${textMutedClass}`}>
                            You&apos;ll stay signed in after updating.
                        </p>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="flex items-center gap-2.5 rounded-xl bg-emerald-500 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-950 transition-all duration-200 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/20 active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Updating…
                                </>
                            ) : (
                                <>
                                    <KeyRound className="h-3.5 w-3.5" />
                                    Update Password
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </SectionCard>

            {/* ── Active Sessions ──────────────────────────────── */}
            <SectionCard
                icon={Monitor}
                iconBgClass="bg-blue-500/10"
                iconColorClass="text-blue-500"
                title="Active Sessions"
                description="All devices and sessions currently signed into your account."
                badge={{ label: `${liveSessions.length || 1} Active`, variant: 'success' }}
                isLight={isLight}
            >
                <div className="space-y-4">
                    {liveSessions.length > 0 ? (
                        liveSessions.map((sess, index) => {
                            const parsed = parseUserAgent(sess.user_agent)
                            const DeviceIcon = getDeviceIcon(parsed.os)
                            const isCurrentDevice = index === 0
                            const sessionTime = getRelativeTime(new Date(sess.updated_at))
                            const sessionCreated = new Date(sess.created_at).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                            })
                            const isRevoking = revokingId === sess.id

                            return (
                                <div
                                    key={sess.id}
                                    className={`flex items-center gap-4 rounded-2xl border p-5 transition-all ${isCurrentDevice
                                        ? isLight
                                            ? 'border-emerald-200/80 bg-emerald-50/30'
                                            : 'border-emerald-500/20 bg-emerald-500/[0.03]'
                                        : mutedCardClass
                                        }`}
                                >
                                    <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isLight ? 'bg-white border border-slate-200 shadow-sm' : 'bg-slate-900 border border-slate-800'}`}>
                                        <DeviceIcon className={`h-5 w-5 ${textMutedClass}`} />
                                        {isCurrentDevice && (
                                            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 bg-emerald-500 ${isLight ? 'border-emerald-50' : 'border-slate-900'}`} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2.5">
                                            <p className={`text-sm font-bold ${textMainClass}`}>
                                                {parsed.label}
                                            </p>
                                            {isCurrentDevice && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-500">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    This Device
                                                </span>
                                            )}
                                        </div>
                                        <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium ${textMutedClass}`}>
                                            {sess.ip && (
                                                <span className="flex items-center gap-1.5">
                                                    <Globe className="h-3 w-3" />
                                                    {sess.ip}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3 w-3" />
                                                {sessionCreated}
                                                <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>({sessionTime})</span>
                                            </span>
                                        </div>
                                    </div>
                                    {!isCurrentDevice && (
                                        <button
                                            type="button"
                                            disabled={isRevoking}
                                            onClick={() => handleRevokeSession(sess.id)}
                                            className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${isLight
                                                ? 'text-rose-600 hover:bg-rose-50 border border-rose-200/60'
                                                : 'text-rose-400 hover:bg-rose-500/10 border border-rose-500/20'
                                                }`}
                                        >
                                            {isRevoking ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <LogOut className="h-3 w-3" />
                                            )}
                                            Revoke
                                        </button>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        /* Fallback if no sessions returned from API */
                        <div className={`flex items-center gap-4 rounded-2xl border p-5 transition-all ${mutedCardClass}`}>
                            <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isLight ? 'bg-white border border-slate-200 shadow-sm' : 'bg-slate-900 border border-slate-800'}`}>
                                <Monitor className={`h-5 w-5 ${textMutedClass}`} />
                                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 bg-emerald-500 ${isLight ? 'border-white' : 'border-slate-900'}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2.5">
                                    <p className={`text-sm font-bold ${textMainClass}`}>This Device</p>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-500">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Active Now
                                    </span>
                                </div>
                                <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium ${textMutedClass}`}>
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="h-3 w-3" />
                                        {userEmail}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3 w-3" />
                                        {lastSignInLabel}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {liveSessions.length > 1 && (
                        <div className={`flex items-center justify-between pt-2 border-t ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
                            <p className={`text-[10px] font-medium ${textMutedClass}`}>
                                {liveSessions.length - 1} other session{liveSessions.length > 2 ? 's' : ''}
                            </p>
                            <button
                                type="button"
                                disabled={isRevokingAll}
                                onClick={handleRevokeAllOtherSessions}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${isLight
                                    ? 'text-rose-600 hover:bg-rose-50 border border-rose-200/60'
                                    : 'text-rose-400 hover:bg-rose-500/10 border border-rose-500/20'
                                    }`}
                            >
                                {isRevokingAll ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <LogOut className="h-3.5 w-3.5" />
                                )}
                                Sign out all other sessions
                            </button>
                        </div>
                    )}

                    {/* Security Tip */}
                    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 ${isLight ? 'bg-blue-50/50' : 'bg-blue-500/5'}`}>
                        <ShieldAlert className={`h-4 w-4 shrink-0 mt-0.5 ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                        <p className={`text-[11px] font-medium leading-relaxed ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                            If you don&apos;t recognize a session, revoke it immediately and change your password.
                        </p>
                    </div>
                </div>
            </SectionCard>

            {/* ── Two-Factor Authentication ────────────────────── */}
            <SectionCard
                icon={Fingerprint}
                iconBgClass="bg-violet-500/10"
                iconColorClass="text-violet-500"
                title="Two-Factor Authentication"
                description="Add an extra layer of protection beyond your password."
                badge={{ label: 'Not Enabled', variant: 'warning' }}
                isLight={isLight}
            >
                <div className="space-y-6">
                    {/* Status Banner */}
                    <div className={`flex items-start gap-4 rounded-2xl border p-5 ${isLight ? 'border-amber-200/80 bg-gradient-to-r from-amber-50 to-amber-50/50' : 'border-amber-500/15 bg-gradient-to-r from-amber-500/5 to-transparent'}`}>
                        <ShieldAlert className={`h-5 w-5 shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                        <div className="space-y-1.5">
                            <p className={`text-sm font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                                Your account is not fully protected
                            </p>
                            <p className={`text-[11px] font-medium leading-relaxed ${isLight ? 'text-amber-700/80' : 'text-amber-400/70'}`}>
                                Two-factor authentication significantly reduces the risk of unauthorized access.
                                We strongly recommend enabling at least one method.
                            </p>
                        </div>
                    </div>

                    {/* Methods */}
                    <div className="space-y-3">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${textMutedClass}`}>
                            Available Methods
                        </p>

                        {/* TOTP Authenticator */}
                        <div className={`flex items-center justify-between rounded-2xl border p-5 transition-all hover:shadow-sm ${mutedCardClass}`}>
                            <div className="flex items-center gap-4">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isLight ? 'bg-white border border-slate-200 shadow-sm' : 'bg-slate-900 border border-slate-800'}`}>
                                    <Smartphone className="h-4.5 w-4.5 text-violet-500" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${textMainClass}`}>Authenticator App</p>
                                    <p className={`mt-0.5 text-[11px] ${textMutedClass}`}>
                                        Google Authenticator, Authy, 1Password, etc.
                                    </p>
                                </div>
                            </div>
                            <button
                                disabled
                                className={`rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all cursor-not-allowed ${isLight
                                    ? 'border-slate-200 bg-slate-50 text-slate-400'
                                    : 'border-slate-700 bg-slate-800/50 text-slate-500'
                                    }`}
                            >
                                Coming Soon
                            </button>
                        </div>

                        {/* SMS */}
                        <div className={`flex items-center justify-between rounded-2xl border p-5 transition-all hover:shadow-sm ${mutedCardClass}`}>
                            <div className="flex items-center gap-4">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isLight ? 'bg-white border border-slate-200 shadow-sm' : 'bg-slate-900 border border-slate-800'}`}>
                                    <Mail className="h-4.5 w-4.5 text-blue-500" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${textMainClass}`}>Email Verification</p>
                                    <p className={`mt-0.5 text-[11px] ${textMutedClass}`}>
                                        Receive a one-time code via email on each sign in.
                                    </p>
                                </div>
                            </div>
                            <button
                                disabled
                                className={`rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all cursor-not-allowed ${isLight
                                    ? 'border-slate-200 bg-slate-50 text-slate-400'
                                    : 'border-slate-700 bg-slate-800/50 text-slate-500'
                                    }`}
                            >
                                Coming Soon
                            </button>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
    )
}

/* ─── Utility ────────────────────────────────────────────── */

function getRelativeTime(date: Date): string {
    const now = Date.now()
    const diff = now - date.getTime()
    const minutes = Math.floor(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return `${Math.floor(days / 30)}mo ago`
}
