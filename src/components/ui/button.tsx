import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--ring)]/50',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[oklch(0.80_0_0)]',
        outline:
          'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] text-[var(--foreground)]',
        secondary:
          'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[#223260]',
        ghost:
          'hover:bg-[var(--muted)] hover:text-[var(--foreground)] text-[var(--foreground)]',
        destructive:
          'bg-[var(--destructive)]/10 text-[var(--destructive)] hover:bg-[var(--destructive)]/20',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-6 px-2 text-xs rounded-[min(var(--radius-md),10px)]',
        sm: 'h-7 px-3 text-xs rounded-[min(var(--radius-md),12px)]',
        default: 'h-8 px-4',
        lg: 'h-9 px-5',
        icon: 'h-8 w-8',
        'icon-xs': 'h-6 w-6',
        'icon-sm': 'h-7 w-7',
        'icon-lg': 'h-9 w-9',
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
