import * as React from 'react'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Syntax colors (One-Dark palette per spec)
const COLORS = {
  key: '#e06c75',
  string: '#98c379',
  number: '#61afef',
  boolean: '#e5c07b',
  null: '#6b737c',
  punctuation: '#6b737c',
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

interface NodeCopyButtonProps {
  value: string
}

function NodeCopyButton({ value }: NodeCopyButtonProps) {
  const [copied, setCopied] = React.useState(false)
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 opacity-0 group-hover/val:opacity-100 transition-opacity rounded px-1 py-0.5 text-[11px] hover:bg-white/10 active:bg-white/20"
      title="Copy value"
    >
      {copied ? (
        <Check size={10} className="text-green-400 inline" />
      ) : (
        <Copy size={10} className="inline" style={{ color: COLORS.punctuation }} />
      )}
    </button>
  )
}

interface TreeNodeProps {
  keyName?: string | number
  value: JsonValue
  depth: number
  isLast: boolean
}

function TreeNode({ keyName, value, depth, isLast }: TreeNodeProps) {
  const [expanded, setExpanded] = React.useState(depth < 2)
  const indent = depth * 14

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value)
  const isArray = Array.isArray(value)
  const isCollapsible = isObject || isArray

  const entries = isObject
    ? Object.entries(value as Record<string, JsonValue>)
    : isArray
    ? (value as JsonValue[]).map((v, i) => [i, v] as [number, JsonValue])
    : []

  const bracket = isArray ? ['[', ']'] : ['{', '}']
  const suffix = isLast ? '' : ','

  const renderValue = (v: JsonValue): React.ReactNode => {
    if (v === null) return <span style={{ color: COLORS.null }}>null</span>
    if (typeof v === 'boolean') return <span style={{ color: COLORS.boolean }}>{String(v)}</span>
    if (typeof v === 'number') return <span style={{ color: COLORS.number }}>{v}</span>
    if (typeof v === 'string') return <span style={{ color: COLORS.string }}>&quot;{v}&quot;</span>
    return null
  }

  const valueStr = isCollapsible ? '' : String(value === null ? 'null' : typeof value === 'string' ? `"${value}"` : value)

  return (
    <div style={{ paddingLeft: `${indent}px` }}>
      {isCollapsible ? (
        <>
          <div
            className="flex items-center cursor-pointer hover:bg-white/5 rounded px-1 -mx-1 select-none"
            onClick={() => setExpanded(e => !e)}
          >
            <span className="mr-0.5" style={{ color: COLORS.punctuation }}>
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
            {keyName !== undefined && (
              <>
                <span style={{ color: COLORS.key }} className="font-medium">&quot;{keyName}&quot;</span>
                <span style={{ color: COLORS.punctuation }} className="mr-1">:</span>
              </>
            )}
            <span style={{ color: COLORS.punctuation }}>{bracket[0]}</span>
            {!expanded && (
              <>
                <span style={{ color: COLORS.punctuation }} className="mx-1">…</span>
                <span style={{ color: COLORS.punctuation }}>{bracket[1]}{suffix}</span>
              </>
            )}
            {expanded && <span style={{ color: COLORS.punctuation }} className="ml-1 text-[11px]">{entries.length} {isArray ? 'items' : 'keys'}</span>}
          </div>
          {expanded && (
            <>
              <div>
                {(entries as [string | number, JsonValue][]).map(([k, v], i) => (
                  <TreeNode
                    key={String(k)}
                    keyName={k}
                    value={v}
                    depth={depth + 1}
                    isLast={i === entries.length - 1}
                  />
                ))}
              </div>
              <div style={{ paddingLeft: 0 }}>
                <span style={{ color: COLORS.punctuation }}>{bracket[1]}{suffix}</span>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="flex items-center group/val px-1 -mx-1">
          {keyName !== undefined && (
            <>
              <span style={{ color: COLORS.key }} className="font-medium">&quot;{keyName}&quot;</span>
              <span style={{ color: COLORS.punctuation }} className="mr-1">:</span>
            </>
          )}
          <span>{renderValue(value)}</span>
          <span style={{ color: COLORS.punctuation }}>{suffix}</span>
          <NodeCopyButton value={valueStr} />
        </div>
      )}
    </div>
  )
}

interface JsonTreeProps {
  data: unknown
  className?: string
}

function JsonTree({ data, className }: JsonTreeProps) {
  const value = data as JsonValue
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value)
  const isArray = Array.isArray(value)

  if (!isObject && !isArray) {
    return (
      <div className={cn('font-mono text-[13px] leading-relaxed p-4', className)}>
        <TreeNode value={value} depth={0} isLast={true} />
      </div>
    )
  }

  const entries = isObject
    ? Object.entries(value as Record<string, JsonValue>)
    : (value as JsonValue[]).map((v, i) => [i, v] as [number, JsonValue])

  return (
    <div className={cn('font-mono text-[13px] leading-relaxed decode-tree-container p-4', className)}>
      <span style={{ color: COLORS.punctuation }}>{isArray ? '[' : '{'}</span>
      <div>
        {(entries as [string | number, JsonValue][]).map(([k, v], i) => (
          <TreeNode
            key={String(k)}
            keyName={k}
            value={v}
            depth={1}
            isLast={i === entries.length - 1}
          />
        ))}
      </div>
      <span style={{ color: COLORS.punctuation }}>{isArray ? ']' : '}'}</span>
    </div>
  )
}

export { JsonTree }
