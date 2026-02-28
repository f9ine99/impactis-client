import FAQAccordion from '@/components/FAQAccordion'

export default function FAQSection() {
    return (
        <section id="faq" className="py-24 md:py-32 px-4 relative overflow-hidden bg-gradient-to-b from-white via-[#f0fdf4]/30 to-white">
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#0B3D2E_0.5px,transparent_0.5px)] [background-size:32px_32px] opacity-[0.03]"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-14 md:mb-16">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#0B3D2E]/40 mb-6 animate-fade-up">Support</p>
                    <h2 className="text-5xl md:text-7xl font-black text-gray-900 tracking-[-0.04em] leading-tight animate-fade-up [animation-delay:100ms]">
                        Frequently Asked <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#0B3D2E] to-[#10B981]">Questions</span>
                    </h2>
                </div>
                <FAQAccordion />
            </div>
        </section>
    )
}
