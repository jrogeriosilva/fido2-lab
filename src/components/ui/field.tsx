import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode
  htmlFor?: string
  required?: boolean
  hint?: React.ReactNode
  /** Rendered at the right edge of the label row (e.g. a copy button). */
  action?: React.ReactNode
}

/** Label + control + optional hint, with a consistent vertical rhythm. */
function Field({ label, htmlFor, required, hint, action, className, children, ...props }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      <div className="flex min-h-[28px] items-center justify-between gap-3">
        <Label htmlFor={htmlFor} required={required}>{label}</Label>
        {action}
      </div>
      {children}
      {hint && (
        <p className="text-xs leading-snug text-[var(--muted-foreground)]">{hint}</p>
      )}
    </div>
  )
}

export { Field }
