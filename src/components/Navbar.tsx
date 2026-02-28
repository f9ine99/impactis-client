import Link from 'next/link'

export default function Navbar() {
    return (
        <div className="fixed top-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
            <nav className="w-full max-w-5xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-full px-8 py-4 flex justify-between items-center pointer-events-auto">
                <div className="flex items-center space-x-12">
                    <Link href="/" className="text-2xl font-black text-[#0B3D2E] tracking-tight">
                        Impactis
                    </Link>
                    <div className="hidden md:flex space-x-8">
                        <Link href="#features" className="text-gray-600 hover:text-[#0B3D2E] text-sm font-bold transition-colors">Features</Link>
                        <Link href="#how-it-works" className="text-gray-600 hover:text-[#0B3D2E] text-sm font-bold transition-colors">Process</Link>
                        <Link href="#roles" className="text-gray-600 hover:text-[#0B3D2E] text-sm font-bold transition-colors">Roles</Link>
                        <Link href="#pricing" className="text-gray-600 hover:text-[#0B3D2E] text-sm font-bold transition-colors">Pricing</Link>
                    </div>
                </div>
                <div className="flex items-center space-x-6">
                    <Link href="/auth/login" className="text-gray-600 hover:text-[#0B3D2E] text-sm font-bold transition-colors hidden sm:block">
                        Log in
                    </Link>
                    <Link
                        href="/auth/signup"
                        className="bg-[#0B3D2E] text-white px-8 py-3 rounded-full text-sm font-bold hover:shadow-[0_10px_20px_rgba(11,61,46,0.2)] hover:-translate-y-0.5 transition-all"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>
        </div>
    )
}
