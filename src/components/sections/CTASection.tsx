import Link from 'next/link'

export default function CTASection() {
    return (
        <section className="py-24 md:py-32 px-4 bg-white overflow-hidden relative">
            <div className="max-w-7xl mx-auto">
                <div className="bg-[#0B3D2E] rounded-[4rem] p-10 md:p-20 text-center relative overflow-hidden shadow-[0_60px_100px_-20px_rgba(11,61,46,0.3)]">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px]"></div>
                    <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[600px] h-[600px] bg-green-400/10 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[120px] animate-pulse"></div>

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-green-400/60 mb-6">Exclusive Admittance</p>
                        <h2 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-[-0.03em] leading-[0.9]">
                            Ready to lead the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-green-300 to-emerald-500">Next Impact?</span>
                        </h2>
                        <p className="text-green-100/60 text-xl md:text-2xl mb-10 md:mb-12 font-medium tracking-tight leading-relaxed">
                            Join an elite collective of hundreds of global leaders already architecting the future of institutional impact finance.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                            <Link
                                href="/auth/signup"
                                className="group relative w-full sm:w-auto px-12 py-6 bg-white text-[#0B3D2E] rounded-2xl font-black text-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_20px_60px_-10px_rgba(255,255,255,0.2)] flex items-center justify-center"
                            >
                                <div className="absolute inset-0 bg-green-50 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                <span className="relative z-10">Request Access</span>
                            </Link>
                            <Link
                                href="/auth/login"
                                className="w-full sm:w-auto px-12 py-6 bg-transparent text-white border border-white/10 rounded-2xl font-black text-xl hover:bg-white/5 transition-all text-center"
                            >
                                Member Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
