import { useState } from 'react'
import { ArrowDownUp } from 'lucide-react'
import { base64url } from '../utils/crypto'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { CopyButton } from './ui/copy-button'
import { CodeBlock } from './ui/code-block'

export default function Base64Decoder() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const handleDecode = () => {
    setError('')
    if (!input.trim()) { setError('Enter base64url-encoded text to decode.'); return }
    try {
      const buffer = base64url.decode(input.trim())
      setOutput(new TextDecoder('utf-8').decode(buffer))
    } catch {
      setError('Invalid base64url input. Check your input and try again.')
    }
  }

  const handleEncode = () => {
    setError('')
    if (!input.trim()) { setError('Enter text to encode.'); return }
    try {
      setOutput(base64url.encode(new TextEncoder().encode(input.trim())))
    } catch {
      setError('Failed to encode text.')
    }
  }

  const handleSwap = () => {
    setInput(output)
    setOutput(input)
    setError('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between min-h-[28px]">
          <label className="text-sm font-medium">Input</label>
          {input && <CopyButton value={input} />}
        </div>
        <Textarea
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          placeholder="Enter text to encode, or paste a base64url string to decode…"
          autoGrow
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="default" onClick={handleDecode} className="flex-1">
          Decode (Base64URL → Text)
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleSwap}
          disabled={!input && !output}
          title="Swap input and output"
        >
          <ArrowDownUp size={14} />
        </Button>
        <Button variant="default" onClick={handleEncode} className="flex-1">
          Encode (Text → Base64URL)
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: 'color-mix(in oklch, var(--destructive) 50%, transparent)', color: 'var(--destructive)' }}
        >
          {error}
        </div>
      )}

      {/* Output */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between min-h-[28px]">
          <label className="text-sm font-medium">Output</label>
          {output && <CopyButton value={output} />}
        </div>
        <CodeBlock
          value={output}
          language="auto"
          placeholder="Result will appear here."
          autoGrow
        />
      </div>

      {/* Info */}
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Uses base64url encoding (RFC 4648): <code className="font-mono bg-[var(--muted)] px-1 rounded">+</code> → <code className="font-mono bg-[var(--muted)] px-1 rounded">-</code>,{' '}
        <code className="font-mono bg-[var(--muted)] px-1 rounded">/</code> → <code className="font-mono bg-[var(--muted)] px-1 rounded">_</code>, no padding. This is the format used by FIDO2/WebAuthn.
      </p>
    </div>
  )
}
