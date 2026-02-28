'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TurnstileWidget from '@/components/auth/TurnstileWidget'
import {
    buildSignupMetadata,
    getPostSignupRedirectPath,
    getSignupEmailRedirectUrl,
    getSignupEmailRedirectUrlWithNext,
    getSignupRoleFromSearchParams,
    sanitizeNextPath,
} from '@/modules/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Rocket, TrendingUp, Briefcase, Check, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

const roles = [
    { id: 'founder', title: 'Founder', icon: Rocket, description: 'Raising capital or seeking strategic partners.' },
    { id: 'investor', title: 'Investor', icon: TrendingUp, description: 'Seeking high-impact investment opportunities.' },
    { id: 'advisor', title: 'Advisor', icon: Briefcase, description: 'Providing expert professional advisory services.' },
]

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '0x4AAAAAACd7X251ebzrdbGy'

export default function SignupPage() {
    const [step, setStep] = useState<1 | 2>(1)
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)
    const [captchaResetSignal, setCaptchaResetSignal] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [nextPath, setNextPath] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: '',
    })

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const query = new URLSearchParams(window.location.search)
        const roleFromSearch = getSignupRoleFromSearchParams(query)
        setNextPath(sanitizeNextPath(query.get('next')))
        if (roleFromSearch) {
            setFormData((prev) => ({ ...prev, role: roleFromSearch }))
            setStep(2)
        }
    }, [])

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.role) {
            toast.error('Please select your role first.')
            setStep(1)
            return
        }

        if (!captchaToken) {
            toast.error('Please complete the security check.')
            return
        }

        setIsLoading(true)

        try {
            const queryNextPath = sanitizeNextPath(new URLSearchParams(window.location.search).get('next'))
            const resolvedNextPath = nextPath ?? queryNextPath
            const metadata = buildSignupMetadata({
                fullName: formData.fullName,
                role: formData.role,
            })

            const { data, error: signupError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: metadata,
                    emailRedirectTo: resolvedNextPath
                        ? getSignupEmailRedirectUrlWithNext(window.location.origin, resolvedNextPath)
                        : getSignupEmailRedirectUrl(window.location.origin),
                    captchaToken,
                },
            })

            if (signupError) {
                toast.error(signupError.message)
                setCaptchaResetSignal((current) => current + 1)
                return
            }

            if (data.user) {
                toast.success('Account created! Please check your email for confirmation.')
                router.push(getPostSignupRedirectPath(resolvedNextPath))
            }
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const isCreateDisabled =
        isLoading
        || !formData.fullName.trim()
        || !formData.email.trim()
        || formData.password.length < 6
        || !captchaToken

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-xl w-full">
                <div className="text-center mb-10">
                    <Link href="/" className="text-4xl font-black text-[#0B3D2E] tracking-tighter">
                        Impactis
                    </Link>
                </div>

                <div className="mb-12 flex justify-between items-center px-4">
                    {[1, 2].map((num) => (
                        <div key={num} className="flex items-center flex-1 last:flex-none">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                                    step >= num ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]' : 'bg-white text-gray-400 border-gray-200'
                                }`}
                            >
                                {step > num ? <Check className="w-5 h-5" /> : num}
                            </div>
                            {num < 2 ? (
                                <div className={`flex-1 h-0.5 mx-4 ${step > num ? 'bg-[#0B3D2E]' : 'bg-gray-200'}`} />
                            ) : null}
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 p-8 md:p-12 border border-gray-100">
                    {step === 1 ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">How will you participate?</h2>
                                <p className="mt-2 text-gray-500 font-medium tracking-tight">Select your primary role in the ecosystem.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => {
                                            setFormData((prev) => ({ ...prev, role: role.id }))
                                            setStep(2)
                                        }}
                                        className={`p-6 rounded-3xl border-2 text-left transition-all group ${
                                            formData.role === role.id ? 'border-[#0B3D2E] bg-green-50' : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-6">
                                            <div
                                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                                                    formData.role === role.id
                                                        ? 'bg-[#0B3D2E] text-white'
                                                        : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                                                }`}
                                            >
                                                <role.icon className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-900">{role.title}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSignup} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create your account</h2>
                                <p className="mt-2 text-gray-500 font-medium tracking-tight">
                                    You selected{' '}
                                    <span className="text-[#0B3D2E] font-bold capitalize">{formData.role}</span>
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-green-500/10 focus:border-[#0B3D2E] outline-none transition-all font-medium"
                                            placeholder="John Doe"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-green-500/10 focus:border-[#0B3D2E] outline-none transition-all font-medium"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-green-500/10 focus:border-[#0B3D2E] outline-none transition-all font-medium"
                                            placeholder="Minimum 6 characters"
                                            value={formData.password}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((current) => !current)}
                                            className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-gray-700"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <TurnstileWidget
                                siteKey={TURNSTILE_SITE_KEY}
                                onTokenChange={setCaptchaToken}
                                resetSignal={captchaResetSignal}
                                className="flex justify-center"
                            />

                            <div className="flex space-x-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreateDisabled}
                                    className="flex-[2] py-4 rounded-2xl bg-[#0B3D2E] text-white font-black text-lg hover:shadow-xl hover:shadow-green-900/20 transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Creating Account...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-10 text-center">
                        <p className="text-gray-400 font-medium">
                            Already part of the network?{' '}
                            <Link
                                href={(() => {
                                    if (!nextPath) {
                                        return '/auth/login'
                                    }

                                    return `/auth/login?next=${encodeURIComponent(nextPath)}`
                                })()}
                                className="text-[#0B3D2E] font-bold hover:underline"
                            >
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
