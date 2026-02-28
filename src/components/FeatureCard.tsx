import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
    title: string
    description: string
    icon: LucideIcon
}

export default function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
    return (
        <div className="relative group p-10 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/50 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_40px_80px_-20px_rgba(11,61,46,0.1)] overflow-hidden">
            {/* Spotlight Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0B3D2E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            <div className="relative z-10">
                <div className="w-16 h-16 bg-[#0B3D2E]/5 rounded-[1.8rem] flex items-center justify-center mb-10 group-hover:bg-[#0B3D2E] group-hover:scale-110 transition-all duration-500 shadow-sm border border-[#0B3D2E]/10">
                    <Icon className="w-8 h-8 text-[#0B3D2E] group-hover:text-white transition-all duration-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-5 tracking-tight">{title}</h3>
                <p className="text-gray-500/80 leading-relaxed font-medium text-lg">{description}</p>
            </div>

            {/* Decorative Corner Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#0B3D2E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-bl-[4rem]"></div>
        </div>
    )
}
