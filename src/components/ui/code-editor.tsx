import * as React from 'react'
import { cn } from '@/lib/utils'
import { getHighlighter } from '@/lib/shiki'

type Highlighter = Awaited<ReturnType<typeof getHighlighter>>

export interface CodeEditorProps {
  value: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  language?: 'json'
  className?: string
  minHeight?: number
  maxHeight?: number
  readOnly?: boolean
}

/**
 * Overlay code editor.
 *
 * A single scroll container (the outer div) wraps a sizing wrapper that holds
 * the highlighted <pre> and, absolutely positioned on top of it, a transparent
 * <textarea> of the exact same size. Because neither inner layer scrolls on its
 * own, the highlight can never drift out of sync with the caret — vertical and
 * horizontal scrolling are handled once, by the container.
 */
export function CodeEditor({
  value,
  onChange,
  placeholder,
  language = 'json',
  className,
  minHeight = 120,
  maxHeight = 320,
  readOnly = false,
}: CodeEditorProps) {
  const [highlighter, setHighlighter] = React.useState<Highlighter | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const pendingCaret = React.useRef<number | null>(null)

  React.useEffect(() => {
    let cancelled = false
    getHighlighter().then(
      hl => { if (!cancelled) setHighlighter(hl) },
      () => { /* keep the plain-text fallback */ },
    )
    return () => { cancelled = true }
  }, [])

  // A textarea renders a trailing empty line when the value ends in "\n";
  // <pre> swallows it. Add one back so both layers stay the same height.
  const code = value.endsWith('\n') ? `${value}\n` : value

  const html = React.useMemo(() => {
    if (!highlighter || !code) return null
    try {
      return highlighter
        .codeToHtml(code, { lang: language, theme: 'one-dark-pro' })
        // Drop Shiki's own background/padding so the card color shows through.
        .replace(/<pre[^>]*>/, '<pre style="margin:0;padding:0;background:transparent;font:inherit;line-height:inherit;">')
        .replace(/(<code[^>]*)style="[^"]*"/, '$1')
    } catch {
      return null
    }
  }, [highlighter, code, language])

  // Restore the caret after an edit we performed ourselves (Tab insertion).
  React.useEffect(() => {
    const pos = pendingCaret.current
    if (pos == null) return
    pendingCaret.current = null
    const el = textareaRef.current
    if (el) el.setSelectionRange(pos, pos)
  }, [value])

  const emitChange = (el: HTMLTextAreaElement, next: string, caret: number) => {
    el.value = next
    pendingCaret.current = caret
    onChange?.({
      target: el,
      currentTarget: el,
    } as React.ChangeEvent<HTMLTextAreaElement>)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab' || readOnly) return
    const el = e.currentTarget
    const start = el.selectionStart
    const end = el.selectionEnd
    e.preventDefault()

    if (e.shiftKey) {
      // Outdent the line the caret sits on.
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const removed = value.slice(lineStart).match(/^ {1,2}/)?.[0].length ?? 0
      if (!removed) return
      emitChange(
        el,
        value.slice(0, lineStart) + value.slice(lineStart + removed),
        Math.max(lineStart, start - removed),
      )
      return
    }

    emitChange(el, value.slice(0, start) + '  ' + value.slice(end), start + 2)
  }

  // Both layers must lay text out identically.
  const textStyle: React.CSSProperties = {
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 1.5,
    padding: '0.5rem 0.625rem',
    margin: 0,
    tabSize: 2,
    whiteSpace: 'pre',
    overflowWrap: 'normal',
    wordBreak: 'normal',
    border: 0,
  }

  return (
    <div
      className={cn(
        'w-full rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm font-mono',
        'overflow-auto focus-within:border-[var(--ring)] focus-within:ring-3 focus-within:ring-[var(--ring)]/30',
        className,
      )}
      style={{ minHeight, maxHeight, position: 'relative' }}
      onMouseDown={e => {
        // Clicks on the padding below the last line should still focus the input.
        if (e.target === e.currentTarget) textareaRef.current?.focus()
      }}
    >
      <div style={{ position: 'relative', width: 'max-content', minWidth: '100%', minHeight }}>
        {html ? (
          <div
            aria-hidden
            style={{ ...textStyle, pointerEvents: 'none' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre
            aria-hidden
            style={{ ...textStyle, pointerEvents: 'none', color: 'var(--foreground)' }}
          >
            {code || ' '}
          </pre>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="code-editor-input absolute inset-0 h-full w-full resize-none bg-transparent outline-none placeholder:text-[var(--muted-foreground)]"
          style={{
            ...textStyle,
            overflow: 'hidden',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
            caretColor: 'var(--foreground)',
          }}
        />
      </div>
    </div>
  )
}
