export default function SocialProof() {
    return (
        <section className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-[#f0fdf4]/30 to-white">
            {/* Grain overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>

            <div className="max-w-7xl mx-auto px-4 text-center mb-16">
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#0B3D2E]/40 mb-6 animate-fade-up">Ecosystem Partners</p>
                <h2 className="text-5xl md:text-[5.5rem] font-black text-gray-900 tracking-[-0.03em] leading-[0.9] animate-fade-up [animation-delay:100ms]">
                    Trusted by the <br />
                    <span className="text-[#0B3D2E]/20">Global Leaders</span>
                </h2>
            </div>

            <div className="relative group/marquee">
                {/* Edge Fading Mask — uses gradient to transparent */}
                <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white to-transparent z-10"></div>
                <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white to-transparent z-10"></div>

                <div className="flex overflow-x-hidden py-16">
                    <div className="flex space-x-32 items-center animate-marquee whitespace-nowrap px-16">
                        {['CHAPPA', 'TELEBIRR', 'CBE BIRR', 'AMOLE', 'KIBU', 'CHAPPA', 'TELEBIRR', 'CBE BIRR', 'AMOLE', 'KIBU'].map((logo, index) => (
                            <div key={`${logo}-${index}`} className="flex items-center justify-center font-black text-4xl tracking-tighter text-[#0B3D2E]/10 hover:text-[#0B3D2E] hover:scale-110 transition-all duration-700 cursor-default min-w-[180px] hover:drop-shadow-[0_0_25px_rgba(11,61,46,0.25)]">
                                {logo}
                            </div>
                        ))}
                    </div>
                    {/* Duplicate for seamless loop */}
                    <div className="flex space-x-32 items-center animate-marquee whitespace-nowrap absolute top-16 left-0 px-16" aria-hidden="true">
                        {['CHAPPA', 'TELEBIRR', 'CBE BIRR', 'AMOLE', 'KIBU', 'CHAPPA', 'TELEBIRR', 'CBE BIRR', 'AMOLE', 'KIBU'].map((logo, index) => (
                            <div key={`${logo}-duplicate-${index}`} className="flex items-center justify-center font-black text-4xl tracking-tighter text-[#0B3D2E]/10 hover:text-[#0B3D2E] hover:scale-110 transition-all duration-700 cursor-default min-w-[180px] hover:drop-shadow-[0_0_25px_rgba(11,61,46,0.25)]">
                                {logo}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Glassmorphic Track Decoration */}
                <div className="absolute inset-0 bg-[#f0fdf4]/30 backdrop-blur-[2px] opacity-0 group-hover/marquee:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
        </section>
    )
}
