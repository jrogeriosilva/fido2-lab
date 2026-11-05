import * as React from 'react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[oklch(1_0_0/14%)] px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)]">
          {icon}
        </span>
      )}
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="max-w-sm text-xs leading-relaxed text-[var(--muted-foreground)]">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export { EmptyState }
