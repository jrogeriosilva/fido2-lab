import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm leading-snug animate-in fade-in-0 slide-in-from-top-1 duration-200',
  {
    variants: {
      variant: {
        destructive:
          'border-[var(--destructive)]/30 bg-[var(--destructive)]/8 text-[var(--destructive)]',
        success:
          'border-[var(--success)]/30 bg-[var(--success)]/8 text-[var(--success)]',
        info:
          'border-[var(--info)]/30 bg-[var(--info)]/8 text-[var(--info)]',
        warning:
          'border-[var(--warning)]/30 bg-[var(--warning)]/8 text-[var(--warning)]',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

const ICONS = {
  destructive: CircleAlert,
  success: CircleCheck,
  info: Info,
  warning: TriangleAlert,
} as const

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Override the default icon; pass `null` to hide it. */
  icon?: React.ReactNode | null
}

function Alert({ className, variant = 'info', icon, children, ...props }: AlertProps) {
  const Icon = ICONS[variant ?? 'info']
  return (
    <div
      role={variant === 'destructive' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon === null ? null : (
        <span className="mt-px shrink-0">
          {icon ?? <Icon size={15} />}
        </span>
      )}
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </div>
  )
}

export { Alert }
