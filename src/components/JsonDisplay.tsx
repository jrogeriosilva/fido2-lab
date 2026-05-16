import { JsonTree } from './ui/json-tree'
import { CopyButton } from './ui/copy-button'

interface JsonDisplayProps {
  data: unknown
  title?: string | null
  maxHeight?: number
}

export default function JsonDisplay({ data, title = null, maxHeight = 400 }: JsonDisplayProps) {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  const parsed = typeof data === 'string'
    ? (() => { try { return JSON.parse(data) } catch { return data } })()
    : data

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">{title}</span>
          <CopyButton value={jsonString} />
        </div>
      )}
      <div
        className="rounded-md border overflow-auto"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--card)',
          maxHeight: `${maxHeight}px`,
        }}
      >
        {!title && (
          <div className="flex justify-end p-2 pb-0">
            <CopyButton value={jsonString} />
          </div>
        )}
        <JsonTree data={parsed} />
      </div>
    </div>
  )
}
