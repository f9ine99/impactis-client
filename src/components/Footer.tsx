import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 py-16 md:py-20 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16 mb-16">
                    <div className="lg:col-span-2">
                        <Link href="/" className="text-2xl font-black tracking-tighter text-gray-900">
                            Impactis<span className="text-[#0B3D2E]">.</span>
                        </Link>
                        <p className="mt-6 text-gray-500 max-w-sm text-lg leading-relaxed font-medium tracking-tight">
                            The architect of next-generation venture capital. Empowering visionaries through institutional-grade infrastructure.
                        </p>
                        <div className="mt-8 flex space-x-6">
                            {['LinkedIn', 'Twitter', 'Crunchbase'].map((social) => (
                                <Link key={social} href="#" className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em]">
                                    {social}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 px-1 border-l-2 border-[#0B3D2E]">Platform</h4>
                        <ul className="space-y-4 text-gray-500 font-medium tracking-tight">
                            <li><Link href="#features" className="hover:text-gray-900 transition-colors">Deal Rooms</Link></li>
                            <li><Link href="#roles" className="hover:text-gray-900 transition-colors">Ecosystem Roles</Link></li>
                            <li><Link href="#pricing" className="hover:text-gray-900 transition-colors">Performance Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 px-1 border-l-2 border-[#0B3D2E]">Intelligence</h4>
                        <ul className="space-y-4 text-gray-500 font-medium tracking-tight">
                            <li><Link href="#" className="hover:text-gray-900 transition-colors">Market Analysis</Link></li>
                            <li><Link href="#" className="hover:text-gray-900 transition-colors">Impact Analytics</Link></li>
                            <li><Link href="#" className="hover:text-gray-900 transition-colors">Risk Assessment</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 px-1 border-l-2 border-[#0B3D2E]">Protocol</h4>
                        <ul className="space-y-4 text-gray-500 font-medium tracking-tight">
                            <li><Link href="#" className="hover:text-gray-900 transition-colors">Privacy Shield</Link></li>
                            <li><Link href="#" className="hover:text-gray-900 transition-colors">Verification Nodes</Link></li>
                            <li><Link href="#" className="hover:text-gray-900 transition-colors">API & Webhooks</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-gray-400 text-xs font-bold tracking-tight">
                    <p className="uppercase tracking-widest">© 2026 Impactis Protocol. All Rights Reserved.</p>
                    <div className="flex space-x-10 mt-6 md:mt-0 uppercase tracking-[0.2em]">
                        <Link href="#" className="hover:text-gray-900 transition-colors">Legal</Link>
                        <Link href="#" className="hover:text-gray-900 transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-gray-900 transition-colors">Security</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
