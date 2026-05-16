import JsonDisplay from './JsonDisplay'
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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Generated Assertion</h2>
        <CopyButton value={jsonString} label="Copy all" />
      </div>
      <JsonDisplay data={formatted} maxHeight={600} />
    </div>
  )
}
