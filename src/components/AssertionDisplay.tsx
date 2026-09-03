import { Signature } from 'lucide-react'
import JsonDisplay from './JsonDisplay'
import { Badge } from './ui/badge'
import { CopyButton } from './ui/copy-button'

interface AssertionResponse {
  authenticatorData?: string
  signature?: string
  clientDataJSON?: string
  userHandle?: string | null
  [key: string]: string | null | undefined
}

interface AssertionData {
  id: string
  rawId: string
  response: AssertionResponse
  algorithm?: string
  credentialId?: string
}

interface AssertionDisplayProps {
  assertion: AssertionData
}

export default function AssertionDisplay({ assertion }: AssertionDisplayProps) {
  const formatted = {
    id: assertion.id,
    rawId: assertion.rawId,
    response: Object.fromEntries(
      Object.entries({
        authenticatorData: assertion.response?.authenticatorData,
        signature: assertion.response?.signature,
        clientDataJSON: assertion.response?.clientDataJSON,
        userHandle: assertion.response?.userHandle,
        type: 'public-key',
      }).filter(([, v]) => v !== undefined)
    ),
  }

  const jsonString = JSON.stringify(formatted, null, 2)

  return (
    <section className="flex flex-col gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--success)]/12 text-[var(--success)]">
            <Signature size={14} />
          </span>
          <h3 className="text-sm font-semibold">Generated Assertion</h3>
          <Badge variant="success">PublicKeyCredential</Badge>
        </div>
        <CopyButton value={jsonString} label="Copy all" />
      </div>
      <JsonDisplay data={formatted} maxHeight={600} copyable={false} />
    </section>
  )
}
