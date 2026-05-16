import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoGrow?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoGrow = false, onChange, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null)
    const resolvedRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoGrow && resolvedRef.current) {
        resolvedRef.current.style.height = 'auto'
        const newHeight = Math.min(resolvedRef.current.scrollHeight, 320)
        resolvedRef.current.style.height = `${newHeight}px`
      }
      onChange?.(e)
    }

    return (
      <textarea
        ref={resolvedRef}
        className={cn(
          'w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-2.5 py-2 text-sm font-mono',
          'placeholder:text-[var(--muted-foreground)]',
          'focus-visible:outline-none focus-visible:border-[var(--ring)] focus-visible:ring-3 focus-visible:ring-[var(--ring)]/50',
          'disabled:pointer-events-none disabled:opacity-50',
          'aria-invalid:border-[var(--destructive)] aria-invalid:ring-3 aria-invalid:ring-[var(--destructive)]/20',
          'min-h-[120px] max-h-[320px] resize-none',
          className
        )}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
