import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]',
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="text-[var(--destructive)]" aria-hidden>*</span>}
    </label>
  )
}

export { Label }
