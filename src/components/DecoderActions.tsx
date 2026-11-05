import { useState } from 'react'
import { Button } from './ui/button'

export function DecoderActions({ data }: { data: unknown }) {
  const [message, setMessage] = useState('Copy this response, then paste it into WebAuthn Decoder to inspect its fields.')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setMessage('Response copied. Open WebAuthn Decoder and paste it into the payload field.')
    } catch {
      setMessage('Copy failed. Select and copy the JSON response below, then paste it into WebAuthn Decoder.')
    }
  }
  return <div className="flex flex-col gap-2 my-3">
    <div className="flex gap-2 flex-wrap items-center">
      <Button variant="secondary" onClick={copy}>Copy response for Decoder</Button>
      <a className="inline-flex min-h-11 items-center px-3 underline underline-offset-4" href="https://jrogeriosilva.github.io/webauthn-decoder/" target="_blank" rel="noopener noreferrer">Open Decoder (new tab)</a>
    </div>
    <p className="text-sm text-[var(--muted-foreground)]" role="status">{message}</p>
  </div>
}
