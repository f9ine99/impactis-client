import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors',
    {
        variants: {
            variant: {
                default: 'border-slate-300 bg-slate-100 text-slate-700',
                success: 'border-emerald-300 bg-emerald-50 text-emerald-700',
                warning: 'border-amber-300 bg-amber-50 text-amber-700',
                destructive: 'border-rose-300 bg-rose-50 text-rose-700',
                secondary: 'border-slate-200 bg-white text-slate-600',
                outline: 'border-slate-300 text-slate-700',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
