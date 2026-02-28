import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface RoleCardProps {
    title: string
    description: string
    icon: LucideIcon
    features: string[]
    roleHref?: string
}

export default function RoleCard({ title, description, icon: Icon, features, roleHref = '/auth/signup' }: RoleCardProps) {
    return (
        <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 flex flex-col h-full shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_-20px_rgba(11,61,46,0.1)] transition-all duration-700 hover:-translate-y-2 group">
            <div className="w-16 h-16 bg-[#0B3D2E]/5 rounded-[1.5rem] flex items-center justify-center mb-10 group-hover:bg-[#0B3D2E] group-hover:text-white transition-all duration-500 border border-[#0B3D2E]/10">
                <Icon className="w-7 h-7 text-[#0B3D2E] group-hover:text-white transition-colors duration-500" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">{title}</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-10 text-lg">{description}</p>
            <ul className="space-y-5 mb-12 flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start text-gray-600 font-semibold tracking-tight text-[15px]">
                        <div className="w-1.5 h-1.5 bg-[#0B3D2E]/20 group-hover:bg-[#0B3D2E] rounded-full mt-2 mr-4 transition-colors duration-500" />
                        {feature}
                    </li>
                ))}
            </ul>
            <Link
                href={roleHref}
                className="w-full text-center py-5 rounded-2xl border border-[#0B3D2E]/10 text-gray-900 font-black text-sm uppercase tracking-[0.2em] hover:bg-[#0B3D2E] hover:text-white hover:shadow-[0_10px_30px_-5px_rgba(11,61,46,0.3)] transition-all duration-500"
            >
                Join as {title}
            </Link>
        </div>
    )
}
