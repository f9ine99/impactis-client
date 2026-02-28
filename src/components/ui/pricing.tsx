'use client'

import { buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Check, Star } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import NumberFlow from '@number-flow/react'

export interface PricingPlan {
    name: string
    price: string
    yearlyPrice: string
    period: string
    features: string[]
    description: string
    buttonText: string
    href: string
    isPopular: boolean
}

export interface PricingProps {
    plans: PricingPlan[]
    title?: string
    description?: string
}

export function Pricing({
    plans,
    title = 'Simple, Transparent Pricing',
    description = 'Choose the plan that works for you.\nAll plans include access to our platform, lead generation tools, and dedicated support.',
}: PricingProps) {
    const [isMonthly, setIsMonthly] = useState(true)
    const isDesktop = useMediaQuery('(min-width: 768px)')
    const switchRef = useRef<HTMLButtonElement>(null)

    const handleToggle = (checked: boolean) => {
        setIsMonthly(!checked)
        if (checked && switchRef.current) {
            const rect = switchRef.current.getBoundingClientRect()
            const x = rect.left + rect.width / 2
            const y = rect.top + rect.height / 2

            confetti({
                particleCount: 50,
                spread: 60,
                origin: {
                    x: x / window.innerWidth,
                    y: y / window.innerHeight,
                },
                colors: ['#0B3D2E', '#10B981', '#d1d5db', '#f3f4f6'],
                ticks: 200,
                gravity: 1.2,
                decay: 0.94,
                startVelocity: 30,
                shapes: ['circle'],
            })
        }
    }

    return (
        <div className="container py-24 md:py-28">
            <div className="text-center space-y-6 mb-16 max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
                    {title}
                </h2>
                <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed whitespace-pre-line">
                    {description}
                </p>
            </div>

            <div className="flex justify-center items-center gap-3 mb-14">
                <label className="relative inline-flex items-center cursor-pointer">
                    <Label>
                        <Switch
                            ref={switchRef as React.RefObject<HTMLButtonElement>}
                            checked={!isMonthly}
                            onCheckedChange={handleToggle}
                            className="relative"
                        />
                    </Label>
                </label>
                <span className="text-base font-semibold text-foreground">
                    Annual billing <span className="text-primary">(Save 20%)</span>
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
                {plans.map((plan, index) => (
                    <motion.div
                        key={index}
                        initial={{ y: 50, opacity: 1 }}
                        whileInView={
                            isDesktop
                                ? {
                                      y: plan.isPopular ? -20 : 0,
                                      opacity: 1,
                                      x: index === 2 ? -30 : index === 0 ? 30 : 0,
                                      scale: index === 0 || index === 2 ? 0.94 : 1.0,
                                  }
                                : {}
                        }
                        viewport={{ once: true }}
                        transition={{
                            duration: 1.6,
                            type: 'spring',
                            stiffness: 100,
                            damping: 30,
                            delay: 0.4,
                            opacity: { duration: 0.5 },
                        }}
                        className={cn(
                            'rounded-2xl border-[1px] p-8 lg:p-10 bg-background text-center lg:flex lg:flex-col lg:justify-center relative',
                            plan.isPopular ? 'border-primary border-2' : 'border-border',
                            'flex flex-col',
                            !plan.isPopular && 'mt-6',
                            index === 0 || index === 2
                                ? 'z-0 transform translate-x-0 translate-y-0 -translate-z-[50px] rotate-y-[10deg]'
                                : 'z-10',
                            index === 0 && 'origin-right',
                            index === 2 && 'origin-left'
                        )}
                    >
                        {plan.isPopular && (
                            <div className="absolute top-0 right-0 bg-primary py-1.5 px-3 rounded-bl-xl rounded-tr-xl flex items-center">
                                <Star className="text-primary-foreground h-4 w-4 fill-current" />
                                <span className="text-primary-foreground ml-1.5 text-sm font-semibold tracking-tight">
                                    Popular
                                </span>
                            </div>
                        )}
                        <div className="flex-1 flex flex-col">
                            <p className="text-lg font-semibold text-muted-foreground tracking-tight">
                                {plan.name}
                            </p>
                            <div className="mt-8 flex items-center justify-center gap-x-2">
                                <span className="text-5xl lg:text-6xl font-bold tracking-tight text-foreground tabular-nums">
                                    <NumberFlow
                                        value={isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)}
                                        format={{
                                            style: 'currency',
                                            currency: 'USD',
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        }}
                                        transformTiming={{
                                            duration: 500,
                                            easing: 'ease-out',
                                        }}
                                        willChange
                                    />
                                </span>
                                {plan.period !== 'Next 3 months' && (
                                    <span className="text-base font-semibold leading-6 tracking-wide text-muted-foreground">
                                        / {plan.period}
                                    </span>
                                )}
                            </div>

                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {isMonthly ? 'billed monthly' : 'billed annually'}
                            </p>

                            <ul className="mt-6 gap-3 flex flex-col">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                        <span className="text-left text-[15px] leading-snug text-foreground">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <hr className="w-full my-6 border-border" />

                            <Link
                                href={plan.href}
                                className={cn(
                                    buttonVariants({
                                        variant: 'outline',
                                    }),
                                    'group relative w-full gap-2 overflow-hidden py-3 text-base font-semibold tracking-tight',
                                    'transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1 hover:bg-primary hover:text-primary-foreground',
                                    plan.isPopular ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'
                                )}
                            >
                                {plan.buttonText}
                            </Link>
                            <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
                                {plan.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
