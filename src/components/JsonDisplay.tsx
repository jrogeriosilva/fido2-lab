import { JsonTree } from './ui/json-tree'
import { CopyButton } from './ui/copy-button'
import { cn } from '@/lib/utils'

interface JsonDisplayProps {
  data: unknown
  title?: string | null
  maxHeight?: number
  /** Show a copy button (in the header strip, or floating when there is no title). */
  copyable?: boolean
  className?: string
}

export default function JsonDisplay({
  data,
  title = null,
  maxHeight = 400,
  copyable = true,
  className,
}: JsonDisplayProps) {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  const parsed = typeof data === 'string'
    ? (() => { try { return JSON.parse(data) } catch { return data } })()
    : data

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)]',
        className,
      )}
    >
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            {title}
          </span>
          {copyable && <CopyButton value={jsonString} size="xs" variant="ghost" />}
        </div>
      ) : copyable ? (
        <div className="absolute right-2 top-2 z-10">
          <CopyButton value={jsonString} size="xs" />
        </div>
      ) : null}
      <div className="overflow-auto" style={{ maxHeight: `${maxHeight}px` }}>
        <JsonTree data={parsed} className={!title && copyable ? 'pr-16' : undefined} />
      </div>
    </div>
  )
}
