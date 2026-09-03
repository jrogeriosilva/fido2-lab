import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string
}

/** Native <select> dressed to match the other inputs, with a custom chevron. */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn('relative', wrapperClassName)}>
        <select
          ref={ref}
          className={cn(
            'h-9 w-full appearance-none rounded-lg border border-[var(--input)] bg-[var(--background)] pl-3 pr-9 text-sm',
            'text-[var(--foreground)] transition-colors hover:border-[oklch(1_0_0/20%)]',
            'focus-visible:outline-none focus-visible:border-[var(--ring)] focus-visible:ring-3 focus-visible:ring-[var(--ring)]/30',
            'disabled:pointer-events-none disabled:opacity-50',
            '[&>option]:bg-[var(--card)] [&>option]:text-[var(--foreground)]',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
        />
      </div>
    )
  },
)
Select.displayName = 'Select'

export { Select }
