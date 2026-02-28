import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
    {
        variants: {
            variant: {
                default: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
                secondary: 'bg-slate-900 text-slate-100 hover:bg-slate-800 focus-visible:ring-slate-500',
                outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400',
                ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400',
                destructive: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-lg px-3 text-xs',
                lg: 'h-11 px-6 text-sm',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button'
        return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
