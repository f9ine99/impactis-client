import Image from 'next/image'
import Link from 'next/link'
import { Zap, TrendingUp, Rocket } from 'lucide-react'
import HeroVideoCard from '@/components/HeroVideoCard'

export default function Hero() {
    const heroLineOne = 'Elevate Your'
    const heroLineTwo = 'Impact'
    const letterDelayMs = 45
    const verifiedNodePlaceholders = [
        { id: 'node-1', src: '/placeholders/nodes/node-1.svg', alt: 'Verified node placeholder 1' },
        { id: 'node-2', src: '/placeholders/nodes/node-2.svg', alt: 'Verified node placeholder 2' },
        { id: 'node-3', src: '/placeholders/nodes/node-3.svg', alt: 'Verified node placeholder 3' },
        { id: 'node-4', src: '/placeholders/nodes/node-4.svg', alt: 'Verified node placeholder 4' },
    ]

    return (
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4 overflow-hidden bg-mesh">
            {/* Modern Background Pattern & Grain */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(#0B3D2E_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse:60%_60%_at_50%_50%,#000_60%,transparent_100%)] opacity-[0.07]"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-green-200/20 rounded-full blur-[140px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-200/20 rounded-full blur-[140px] animate-pulse"></div>
            </div>

            <div className="max-w-7xl mx-auto text-center relative z-10">

                <h1 className="text-7xl md:text-[9rem] font-black tracking-[-0.04em] text-gray-900 leading-[0.95] md:leading-[0.85] animate-fade-up [animation-delay:100ms]">
                    <span className="sr-only">{heroLineOne} {heroLineTwo}</span>
                    <span aria-hidden="true">
                        {heroLineOne.split('').map((letter, index) => (
                            <span
                                key={`line-one-${index}`}
                                className="hero-letter-reveal"
                                style={{ animationDelay: `${index * letterDelayMs}ms` }}
                            >
                                {letter === ' ' ? '\u00A0' : letter}
                            </span>
                        ))}
                    </span>
                    <br />
                    <span aria-hidden="true" className="hero-impact-word drop-shadow-sm">
                        {heroLineTwo.split('').map((letter, index) => (
                            <span
                                key={`line-two-${index}`}
                                className="hero-letter-reveal hero-impact-letter"
                                style={{ animationDelay: `${(heroLineOne.length + 1 + index) * letterDelayMs}ms` }}
                            >
                                {letter}
                            </span>
                        ))}
                    </span>
                </h1>

                <p className="mt-8 text-xl md:text-2xl text-gray-600/80 max-w-2xl mx-auto leading-relaxed font-semibold tracking-tight animate-fade-up [animation-delay:200ms]">
                    Secure your seat in the premium ecosystem for <span className="text-gray-900">visionary founders</span> and <span className="text-gray-900 font-bold">institutional-grade capital</span>.
                </p>

                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center space-y-5 sm:space-y-0 sm:space-x-8 animate-fade-up [animation-delay:300ms]">
                    <Link
                        href="/auth/signup"
                        className="group relative w-full sm:w-auto px-12 py-6 bg-[#0B3D2E] text-white rounded-2xl font-black text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_20px_60px_-10px_rgba(11,61,46,0.5)] flex items-center justify-center"
                    >
                        <div className="absolute inset-0 animate-shine opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10 flex items-center">
                            Get Started
                            <Zap className="w-5 h-5 ml-3 fill-current" />
                        </span>
                    </Link>
                    <Link
                        href="#features"
                        className="w-full sm:w-auto px-12 py-6 bg-white/50 backdrop-blur-sm text-gray-900 border border-gray-100 rounded-2xl font-black text-lg hover:bg-white hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center"
                    >
                        Learn More
                    </Link>
                </div>

                {/* Decorative Dashboard Element */}
                <div className="mt-20 md:mt-24 relative max-w-7xl mx-auto px-4 animate-fade-up [animation-delay:400ms]">
                    <div className="bg-white/40 backdrop-blur-3xl border border-white/40 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.7)] pt-10 pb-16 md:pt-14 md:pb-24 px-6 md:px-14 relative overflow-hidden rounded-[4rem]">
                        {/* Window Controls */}
                        <div className="flex items-center space-x-2.5 mb-8 md:mb-10">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm"></div>
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm"></div>
                            <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-sm"></div>
                        </div>
                        {/* Overlaying Info Cards & Video Flip */}
                        <div className="relative z-20 flex flex-col items-center">
                            <div className="w-full mb-6">
                                <HeroVideoCard />
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-10 w-full mt-2">
                                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-white/40 w-full max-w-md transform -rotate-1 hover:rotate-0 transition-all duration-700 hover:shadow-[#0B3D2E]/5 group">
                                    <div className="w-16 h-16 bg-[#0B3D2E]/5 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-[#0B3D2E] group-hover:text-white transition-all duration-500 shadow-sm border border-[#0B3D2E]/10">
                                        <TrendingUp className="w-8 h-8" />
                                    </div>
                                    <p className="text-[10px] text-[#0B3D2E]/40 font-black uppercase tracking-[0.4em]">Asset Liquidity</p>
                                    <p className="text-7xl font-black text-gray-900 mt-4 tracking-tight group-hover:scale-[1.03] transition-transform duration-500">$14.2M</p>
                                    <div className="mt-8 flex items-center px-6 py-3 bg-[#0B3D2E]/5 rounded-2xl w-fit border border-[#0B3D2E]/10">
                                        <span className="text-[#0B3D2E] font-black text-xs">↑ 24.5%</span>
                                        <span className="text-[9px] text-[#0B3D2E]/40 font-black ml-3 tracking-widest uppercase">Live Delta</span>
                                    </div>
                                </div>

                                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-white/40 w-full max-w-md transform rotate-1 hover:rotate-0 transition-all duration-700 hover:shadow-[#0B3D2E]/5 group">
                                    <div className="w-16 h-16 bg-[#10B981]/5 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-[#0B3D2E] group-hover:text-white transition-all duration-500 shadow-sm border border-[#10B981]/10">
                                        <Rocket className="w-8 h-8" />
                                    </div>
                                    <p className="text-[10px] text-[#0B3D2E]/40 font-black uppercase tracking-[0.4em]">Verified Nodes</p>
                                    <p className="text-7xl font-black text-gray-900 mt-4 tracking-tight group-hover:scale-[1.03] transition-transform duration-500">1.2K</p>
                                    <div className="flex -space-x-4 mt-8">
                                        {verifiedNodePlaceholders.map((node) => (
                                            <div key={node.id} className="relative w-14 h-14 rounded-full border-[6px] border-white/80 bg-gray-100 overflow-hidden shadow-xl backdrop-blur-md">
                                                <Image
                                                    src={node.src}
                                                    alt={node.alt}
                                                    fill
                                                    sizes="56px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        ))}
                                        <div className="w-14 h-14 rounded-full border-[6px] border-white/80 bg-[#0B3D2E] text-white text-[11px] font-black flex items-center justify-center shadow-xl">
                                            +85
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
