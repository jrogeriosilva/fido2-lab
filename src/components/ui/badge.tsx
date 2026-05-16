import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-[var(--radius-4xl)] h-5 px-2 text-xs font-medium whitespace-nowrap border border-transparent transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-[var(--primary-foreground)]',
        secondary:
          'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
        destructive:
          'bg-[var(--destructive)]/10 text-[var(--destructive)]',
        warning:
          'bg-[oklch(0.75_0.15_85/15%)] text-[oklch(0.75_0.15_85)]',
        outline:
          'border-[var(--border)] text-[var(--foreground)]',
        ghost:
          'bg-transparent text-[var(--muted-foreground)]',
        link:
          'text-[var(--primary)] underline-offset-2 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
