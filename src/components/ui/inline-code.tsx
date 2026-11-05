import * as React from 'react'
import { cn } from '@/lib/utils'

function InlineCode({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={cn(
        'rounded-[4px] border border-[var(--border)] bg-[var(--muted)]/70 px-1 py-px font-mono text-[0.85em] text-[var(--foreground)]',
        className,
      )}
      {...props}
    />
  )
}

export { InlineCode }
