import RoleCard from '@/components/RoleCard'
import { Rocket, TrendingUp, Briefcase } from 'lucide-react'

export default function Roles() {
    return (
        <section id="roles" className="py-24 md:py-32 px-6 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16 md:mb-20">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-400 mb-6 animate-fade-up">Network Admittance</p>
                    <h2 className="text-5xl md:text-8xl font-black text-gray-900 tracking-[-0.04em] leading-tight animate-fade-up [animation-delay:100ms]">
                        A Role for Every <br className="md:hidden" />
                        <span className="text-gray-400">Partner</span>
                    </h2>
                    <p className="mt-6 text-gray-500 max-w-xl mx-auto text-xl font-medium tracking-tight leading-relaxed animate-fade-up [animation-delay:200ms]">
                        Whether you are architecting a new venture, deploying capital, or facilitating growth, Impactis provides the <span className="text-gray-900">institutional infrastructure</span> required to scale.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <RoleCard
                        title="Founder"
                        description="Raise capital faster with structured pitch decks and automated matching."
                        icon={Rocket}
                        features={['Deal Management', 'Automated Pitching', 'Direct Networking']}
                        roleHref="/auth/signup?role=founder"
                    />
                    <RoleCard
                        title="Investor"
                        description="Access high-quality, pre-verified deals tailored to your investment thesis."
                        icon={TrendingUp}
                        features={['Curated Deal Flow', 'Smart Analytics', 'Due Diligence Tools']}
                        roleHref="/auth/signup?role=investor"
                    />
                    <RoleCard
                        title="Advisor"
                        description="Bridge the gap between vision and capital with professional advisory tools."
                        icon={Briefcase}
                        features={['Service Listing', 'Client Management', 'Verified Success']}
                        roleHref="/auth/signup?role=advisor"
                    />
                </div>
            </div>
        </section>
    )
}
