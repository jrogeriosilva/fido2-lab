import { useState } from 'react'
import { ArrowDownUp, ArrowLeftRight, ArrowRightLeft } from 'lucide-react'
import { base64url } from '../utils/crypto'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { CopyButton } from './ui/copy-button'
import { CodeBlock } from './ui/code-block'
import { Alert } from './ui/alert'
import { Field } from './ui/field'
import { InlineCode } from './ui/inline-code'

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
    <div className="flex flex-col gap-5">
      {/* Input / Output panes */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-stretch">
        <Field
          label="Input"
          action={input ? <CopyButton value={input} size="xs" variant="ghost" /> : undefined}
        >
          <Textarea
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder="Enter text to encode, or paste a base64url string to decode…"
            className="min-h-[200px] flex-1"
            autoGrow
          />
        </Field>

        <div className="flex items-center justify-center lg:pt-9">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwap}
            disabled={!input && !output}
            title="Swap input and output"
            className="rounded-full"
          >
            <ArrowDownUp size={14} className="lg:hidden" />
            <ArrowLeftRight size={14} className="hidden lg:block" />
          </Button>
        </div>

        <Field
          label="Output"
          action={output ? <CopyButton value={output} size="xs" variant="ghost" /> : undefined}
        >
          <CodeBlock
            value={output}
            language="auto"
            placeholder="Result will appear here."
            className="min-h-[200px] flex-1"
            autoGrow
            maxHeight={320}
          />
        </Field>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleDecode}>
          <ArrowRightLeft size={14} />
          Decode base64url → text
        </Button>
        <Button variant="secondary" onClick={handleEncode}>
          Encode text → base64url
        </Button>
      </div>

      {/* Info */}
      <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
        Uses the base64url alphabet from RFC 4648 §5:{' '}
        <InlineCode>+</InlineCode> → <InlineCode>-</InlineCode>,{' '}
        <InlineCode>/</InlineCode> → <InlineCode>_</InlineCode>, no padding.
        This is the encoding FIDO2 and WebAuthn use for binary fields.
      </p>
    </div>
  )
}
