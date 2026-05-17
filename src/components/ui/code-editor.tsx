import * as React from 'react'
import { cn } from '@/lib/utils'
import { getHighlighter } from '@/lib/shiki'

export interface CodeEditorProps {
  value: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  autoGrow?: boolean
  language?: 'json'
  className?: string
  minHeight?: number
  maxHeight?: number
}

export function CodeEditor({
  value,
  onChange,
  placeholder,
  autoGrow = false,
  language = 'json',
  className,
  minHeight = 120,
  maxHeight = 320,
}: CodeEditorProps) {
  const [html, setHtml] = React.useState<string>('')
  const [ready, setReady] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Sync textarea height with content for autoGrow
  const syncHeight = React.useCallback(() => {
    const el = textareaRef.current
    if (!el || !autoGrow) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [autoGrow, maxHeight])

  React.useEffect(() => {
    syncHeight()
  }, [value, syncHeight])

  // Highlight via Shiki
  React.useEffect(() => {
    let cancelled = false
    getHighlighter().then(hl => {
      if (cancelled) return
      const highlighted = hl.codeToHtml(value || '', {
        lang: language,
        theme: 'one-dark-pro',
      })
      if (!cancelled) {
        setHtml(highlighted)
        setReady(true)
      }
    })
    return () => { cancelled = true }
  }, [value, language])

  const baseClasses = cn(
    'w-full rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm font-mono',
    'focus-within:border-[var(--ring)] focus-within:ring-3 focus-within:ring-[var(--ring)]/50',
    'overflow-hidden',
    className,
  )

  const sharedTextStyle: React.CSSProperties = {
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: '1.5',
    padding: '0.5rem 0.625rem',
    margin: 0,
    tabSize: 2,
    whiteSpace: 'pre',
    overflowWrap: 'normal',
    wordBreak: 'normal',
    overflowX: 'auto',
    minHeight,
    maxHeight,
  }

  return (
    <div className={baseClasses} style={{ position: 'relative' }}>
      {/* Highlighted layer */}
      {ready && (
        <div
          aria-hidden
          className="absolute inset-0 overflow-auto pointer-events-none select-none"
          style={{ ...sharedTextStyle, background: 'transparent' }}
          // Shiki wraps output in <pre><code>; we strip the outer box styles
          dangerouslySetInnerHTML={{
            __html: html
              // remove shiki's background so our card color shows through
              .replace(/style="[^"]*background-color:[^"]*"/g, 'style=""')
              // remove the outer <pre> border/padding shiki injects
              .replace(/<pre[^>]*>/, '<pre style="margin:0;padding:0;background:transparent;font:inherit;">')
          }}
        />
      )}
      {/* Transparent editing layer on top */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => {
          onChange?.(e)
          syncHeight()
        }}
        placeholder={ready ? placeholder : placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        className={cn(
          'relative w-full bg-transparent outline-none resize-none',
          'placeholder:text-[var(--muted-foreground)]',
          !ready && 'text-[var(--foreground)]',
          ready && 'text-transparent',
        )}
        style={{
          ...sharedTextStyle,
          // Keep caret visible over transparent text
          caretColor: 'var(--foreground)',
          // Selection still readable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          WebkitTextFillColor: ready ? 'transparent' : undefined,
          overflowX: 'hidden',
          maxHeight,
          minHeight,
        }}
      />
    </div>
  )
}
