import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[var(--radius-4xl)] h-5 px-2 text-xs font-medium whitespace-nowrap border border-transparent transition-colors [&>svg]:size-3',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-[var(--primary-foreground)]',
        secondary:
          'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
        brand:
          'bg-[var(--brand)]/12 text-[var(--brand)] border-[var(--brand)]/20',
        success:
          'bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/20',
        destructive:
          'bg-[var(--destructive)]/10 text-[var(--destructive)]',
        warning:
          'bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/20',
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
