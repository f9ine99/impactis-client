'use client'

import Link from 'next/link'
import { Pricing, type PricingPlan } from '@/components/ui/pricing'

const LANDING_PLANS: PricingPlan[] = [
    {
        name: 'Starter',
        price: '0',
        yearlyPrice: '0',
        period: 'month',
        features: [
            'Core profile & verification',
            'Basic discovery visibility',
            'Up to 2 team members',
            'Community support',
        ],
        description: 'Perfect for individuals and small projects.',
        buttonText: 'Get started free',
        href: '/auth/signup',
        isPopular: false,
    },
    {
        name: 'Growth',
        price: '49',
        yearlyPrice: '39',
        period: 'month',
        features: [
            'Everything in Starter',
            'Unlimited team members',
            'Priority discovery placement',
            'Deal rooms & due diligence',
            'Dedicated support',
        ],
        description: 'Ideal for growing teams and businesses.',
        buttonText: 'Start free trial',
        href: '/auth/signup',
        isPopular: true,
    },
    {
        name: 'Enterprise',
        price: '299',
        yearlyPrice: '239',
        period: 'month',
        features: [
            'Everything in Growth',
            'Custom integrations',
            'SSO & advanced security',
            'Dedicated success manager',
            'SLA & compliance',
        ],
        description: 'For large organizations with specific needs.',
        buttonText: 'Contact sales',
        href: '/auth/signup',
        isPopular: false,
    },
]

export default function PricingSection() {
    return (
        <section
            id="pricing"
            className="py-28 md:py-40 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-white via-[#f0fdf4]/30 to-white"
        >
            <div
                className="absolute inset-0 bg-[radial-gradient(#0B3D2E_0.5px,transparent_0.5px)] [background-size:32px_32px] opacity-[0.03]"
                aria-hidden
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" aria-hidden />
            <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] bg-green-100/20 rounded-full blur-[120px]" aria-hidden />
            <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-emerald-100/15 rounded-full blur-[100px]" aria-hidden />

            <div className="relative z-10">
                <Pricing
                    plans={LANDING_PLANS}
                    title="Simple, transparent pricing"
                    description="Choose the plan that fits your organization.\nAll plans include access to our platform, lead generation tools, and dedicated support. Upgrade or change anytime from workspace settings."
                />
            </div>

            <p className="max-w-3xl mx-auto mt-12 text-center text-base font-medium text-gray-600 leading-relaxed">
                All plans include a 14-day trial. Manage your subscription anytime in{' '}
                <Link href="/auth/login" className="text-[#0B3D2E] font-semibold underline underline-offset-2 hover:text-[#10B981]">
                    workspace settings
                </Link>
                .
            </p>
        </section>
    )
}
