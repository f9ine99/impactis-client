import FeatureCard from '@/components/FeatureCard'
import { ShieldCheck, UserCheck, Target, MessageSquare, CreditCard, Settings } from 'lucide-react'

export default function Features() {
    return (
        <section id="features" className="py-24 md:py-32 px-4 relative overflow-hidden bg-gradient-to-b from-white via-[#f0fdf4]/40 to-white">
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#0B3D2E_0.5px,transparent_0.5px)] [background-size:32px_32px] opacity-[0.03]"></div>
            {/* Grain overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
            {/* Soft glow */}
            <div className="absolute top-[20%] left-[-5%] w-[40%] h-[40%] bg-green-100/30 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-emerald-100/20 rounded-full blur-[120px]"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16 md:mb-20">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#0B3D2E]/40 mb-6 animate-fade-up">Core Platform</p>
                    <h2 className="text-5xl md:text-7xl font-black text-gray-900 tracking-[-0.04em] leading-tight animate-fade-up [animation-delay:100ms]">
                        Built for <br className="md:hidden" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#0B3D2E] to-[#10B981]">Excellence</span>
                    </h2>
                    <p className="mt-6 text-gray-500/80 max-w-xl mx-auto text-xl font-medium tracking-tight animate-fade-up [animation-delay:200ms]">
                        Precision-engineered tools to provide <span className="text-gray-900">maximum transparency</span> and efficiency in the global impact ecosystem.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        title="Deal Rooms"
                        description="Secure, private spaces for due diligence and documentation sharing."
                        icon={ShieldCheck}
                    />
                    <FeatureCard
                        title="Trusted Verification"
                        description="Automated and manual verification processes for all ecosystem members."
                        icon={UserCheck}
                    />
                    <FeatureCard
                        title="Intelligent Matching"
                        description="AI-driven matching to connect startups with the most relevant investors."
                        icon={Target}
                    />
                    <FeatureCard
                        title="Secure Messaging"
                        description="Integrated communication tools with full audit trails."
                        icon={MessageSquare}
                    />
                    <FeatureCard
                        title="Payments-ready"
                        description="Seamless fund transfers and escrow services built for global compliance."
                        icon={CreditCard}
                    />
                    <FeatureCard
                        title="Admin Oversight"
                        description="Full visibility and governance tools for platform administrators."
                        icon={Settings}
                    />
                </div>
            </div>
        </section>
    )
}
