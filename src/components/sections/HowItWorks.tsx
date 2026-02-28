export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 md:py-32 bg-[#0B3D2E] text-white px-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-400/10 rounded-full blur-[140px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-green-400/10 rounded-full blur-[140px] animate-pulse"></div>
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px]"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16 md:mb-20">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-green-400/60 mb-6 animate-fade-up">The Process</p>
                    <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-[-0.04em] leading-[0.9] animate-fade-up [animation-delay:100ms]">
                        Simple, Efficient, <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-green-300 to-emerald-500">Transparent</span>
                    </h2>
                    <p className="text-green-100/60 max-w-xl mx-auto text-xl font-medium tracking-tight animate-fade-up [animation-delay:200ms]">A streamlined process to get you from onboarding to deal closure faster than ever.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute top-[4.5rem] left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    {[
                        { step: '1', title: 'Choose Your Role', desc: 'Sign up and select your role in the ecosystem: Founder, Investor, or Advisor.' },
                        { step: '2', title: 'Complete Verification', desc: 'Fill your profile and go through our streamlined verification process.' },
                        { step: '3', title: 'Connect & Scale', desc: 'Start matching with partners, managing deals, and creating real-world impact.' },
                    ].map((item, index) => (
                        <div key={index} className="text-center group animate-fade-up" style={{ animationDelay: `${(index + 3) * 100}ms` }}>
                            <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 transition-all duration-700 hover:-translate-y-2 hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)]">
                                <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 border border-white/20 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500">
                                    <span className="text-2xl font-black">{item.step}</span>
                                </div>
                                <h3 className="text-2xl font-black mb-5 tracking-tight">{item.title}</h3>
                                <p className="text-green-100/60 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
