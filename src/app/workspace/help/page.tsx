'use client'

import Link from 'next/link'
import { ArrowLeft, LifeBuoy, Hammer, Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function HelpUnderConstructionPage() {
    const [isLight, setIsLight] = useState(false)

    useEffect(() => {
        const theme = document.documentElement.classList.contains('workspace-theme-light')
        setIsLight(theme)
    }, [])

    const textMainClass = isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
    const cardClass = isLight
        ? 'border-slate-200 bg-white shadow-xl shadow-slate-200/50'
        : 'border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl shadow-blue-500/10'

    return (
        <main className={`flex min-h-screen items-center justify-center p-6 ${isLight ? 'bg-slate-50' : 'bg-[#070b14]'}`}>
            {/* Ambient Background Elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className={`absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full ${isLight ? 'bg-indigo-500/5' : 'bg-indigo-500/10'} blur-[120px]`} />
                <div className={`absolute right-[-10%] bottom-[-10%] h-[340px] w-[340px] rounded-full ${isLight ? 'bg-blue-400/5' : 'bg-blue-400/5'} blur-[100px]`} />
            </div>

            <div className={`relative z-10 w-full max-w-xl overflow-hidden rounded-[2.5rem] border p-12 text-center transition-all duration-500 ${cardClass}`}>
                <div className="flex flex-col items-center gap-8">
                    {/* Icon Stack */}
                    <div className="relative">
                        <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
                            <LifeBuoy className="h-12 w-12 animate-spin-slow" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-slate-900/50">
                            <Hammer className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h1 className={`text-3xl font-black tracking-tight ${textMainClass}`}>
                            Help & Support is <span className="text-indigo-500 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500">Under Construction</span>
                        </h1>
                        <p className={`text-sm font-medium leading-relaxed ${textMutedClass}`}>
                            We're crafting an elite support experience for you.
                            Our team is currently polishing documentation, tutorials, and direct support channels.
                        </p>
                    </div>

                    {/* Progress Indicator Shimmer */}
                    <div className="w-full max-w-sm space-y-4">
                        <div className={`h-1.5 w-full overflow-hidden rounded-full ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                            <div className="h-full w-[65%] bg-gradient-to-r from-indigo-600 to-blue-600 ws-shimmer shadow-[0_0_12px_rgba(79,70,229,0.3)]" />
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-50">
                            <span className={textMutedClass}>System Build</span>
                            <span className="text-indigo-500">65% Complete</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link href="/workspace">
                            <Button className="h-12 rounded-2xl bg-indigo-600 px-8 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:scale-[1.02] active:scale-95">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Button>
                        </Link>
                        <Button variant="outline" className={`h-12 rounded-2xl border-slate-700/50 bg-transparent px-8 text-xs font-black uppercase tracking-widest ${textMainClass} transition-all hover:bg-white/5`}>
                            Contact Support
                        </Button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
            `}</style>
        </main>
    )
}
