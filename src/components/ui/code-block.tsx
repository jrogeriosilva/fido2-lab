import * as React from 'react'
import { cn } from '@/lib/utils'
import { getHighlighter } from '@/lib/shiki'

export interface CodeBlockProps {
  value: string
  language?: 'json' | 'plaintext' | 'auto'
  placeholder?: string
  autoGrow?: boolean
  maxHeight?: number
  className?: string
}

function detectLanguage(value: string): 'json' | 'plaintext' {
  if (!value.trim()) return 'plaintext'
  try {
    JSON.parse(value.trim())
    return 'json'
  } catch {
    return 'plaintext'
  }
}

export function CodeBlock({
  value,
  language = 'auto',
  placeholder,
  autoGrow = false,
  maxHeight = 320,
  className,
}: CodeBlockProps) {
  const [html, setHtml] = React.useState<string>('')
  const [ready, setReady] = React.useState(false)

  const resolvedLang = language === 'auto' ? detectLanguage(value) : language

  React.useEffect(() => {
    if (!value || resolvedLang === 'plaintext') {
      setHtml('')
      setReady(resolvedLang === 'plaintext')
      return
    }
    let cancelled = false
    getHighlighter().then(hl => {
      if (cancelled) return
      const highlighted = hl.codeToHtml(value, {
        lang: resolvedLang,
        theme: 'one-dark-pro',
      })
      if (!cancelled) {
        setHtml(highlighted)
        setReady(true)
      }
    })
    return () => { cancelled = true }
  }, [value, resolvedLang])

  const isEmpty = !value

  return (
    <div
      className={cn(
        'w-full rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm font-mono overflow-auto',
        className,
      )}
      style={{
        minHeight: autoGrow ? undefined : 120,
        maxHeight: autoGrow ? Math.min(value.split('\n').length * 21 + 16, maxHeight) : maxHeight,
      }}
    >
      {isEmpty ? (
        <p
          className="px-2.5 py-2 text-sm font-mono select-none"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {placeholder}
        </p>
      ) : resolvedLang === 'plaintext' || !ready ? (
        <pre
          className="px-2.5 py-2 m-0 whitespace-pre"
          style={{ font: 'inherit', lineHeight: '1.5', color: 'var(--foreground)' }}
        >
          {value}
        </pre>
      ) : (
        <div
          dangerouslySetInnerHTML={{
            __html: html
              .replace(/style="[^"]*background-color:[^"]*"/g, 'style=""')
              .replace(/<pre[^>]*>/, '<pre style="margin:0;padding:0.5rem 0.625rem;background:transparent;font:inherit;line-height:1.5;">'),
          }}
        />
      )}
    </div>
  )
}
