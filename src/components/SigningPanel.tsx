import { useState, useEffect } from 'react'
import { getAssertion } from '../utils/fido2Hardware'
import { createSimulatedAssertion } from '../utils/fido2Simulator'
import { getCredentials, type StoredCredential } from '../utils/localStorage'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CodeEditor } from './ui/code-editor'

const DEFAULT_JSON = {
  challenge: 'VN00RzBXws786lXX2NrBhxpV3002sfeLhvSHyY_m4RBp7yhX34hPHnCVy_55saIxkqGRlJGvpCNChduIrZSn7DiSnqq___E4EuJvw3QUFC9SrGKgvSVsQ6CptqTddl8jfQCBJoYRftQibRcBNWfDmQswtKb3Ee6y_fprIyD02nw',
  allowCredentials: [{ id: 'eADIe8jfFltERf136k_OpA', type: 'public-key' }],
}

interface AssertionData {
  id: string
  rawId: string
  response: Record<string, string | null>
  algorithm?: string
  credentialId?: string
}

interface Props {
  mode: string
  refreshKey: number
  onAssertionGenerated?: (a: AssertionData) => void
}

export default function SigningPanel({ mode, refreshKey, onAssertionGenerated }: Props) {
  const [credentials, setCredentials] = useState<StoredCredential[]>([])
  const [selectedCredentialId, setSelectedCredentialId] = useState('')
  const [jsonInput, setJsonInput] = useState(JSON.stringify(DEFAULT_JSON, null, 2))
  const [autoSelected, setAutoSelected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const allCredentials = getCredentials()
    const filtered = mode === 'hardware'
      ? allCredentials.filter(c => c.type === 'hardware')
      : allCredentials.filter(c => c.type === 'simulated')
    setCredentials(filtered)
    if (selectedCredentialId && !filtered.find(c => c.id === selectedCredentialId)) {
      setSelectedCredentialId('')
    }
  }, [refreshKey, mode])

  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonInput)
      const allowedId = (parsed.allowCredentials as Array<{ id: string }> | undefined)?.[0]?.id
      if (allowedId) {
        const match = credentials.find(c => c.id === allowedId)
        if (match) {
          setSelectedCredentialId(match.id)
          setAutoSelected(true)
          return
        }
      }
    } catch { /* ignore */ }
    setAutoSelected(false)
  }, [jsonInput, credentials])

  const handleSign = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      let config: Record<string, unknown>
      try {
        config = JSON.parse(jsonInput)
      } catch (e) {
        throw new Error(`Invalid JSON: ${(e as Error).message}`)
      }

      const challenge = config.challenge as string
      if (!challenge) throw new Error('Challenge is required.')
      if (!selectedCredentialId) throw new Error('Please select a credential.')

      const credential = credentials.find(c => c.id === selectedCredentialId)
      if (!credential) throw new Error('Credential not found.')

      let assertion: AssertionData

      if (mode === 'hardware') {
        assertion = await getAssertion({
          challenge,
          rpId: credential.rpId,
          credentialId: credential.credentialId,
        }) as AssertionData
      } else {
        assertion = await createSimulatedAssertion({
          challenge,
          credential,
          rpId: credential.rpId,
          signCount: 1,
        }) as AssertionData
      }

      setSuccess('Assertion generated successfully.')
      onAssertionGenerated?.(assertion)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Configure the assertion request in JSON format. The{' '}
        <code className="font-mono text-xs bg-[var(--muted)] px-1 rounded">challenge</code> field is required.
      </p>

      <CodeEditor
        language="json"
        value={jsonInput}
        onChange={e => setJsonInput(e.target.value)}
        placeholder="Paste PublicKeyCredentialRequestOptions JSON…"
        minHeight={180}
        maxHeight={400}
      />

      {!autoSelected && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Credential
          </label>
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--input)', backgroundColor: 'var(--card)' }}
          >
            <select
              value={selectedCredentialId}
              onChange={e => setSelectedCredentialId(e.target.value)}
              className="w-full px-2.5 py-2 text-sm font-mono bg-transparent outline-none"
              style={{ color: 'var(--foreground)' }}
            >
              <option value="" style={{ backgroundColor: 'var(--card)' }}>
                {credentials.length === 0
                  ? `No ${mode} credentials — create one first.`
                  : 'Select a credential…'}
              </option>
              {credentials.map(c => (
                <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--card)' }}>
                  {c.userName || c.userId} · {c.algorithm} · {c.id.substring(0, 16)}…
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {autoSelected && selectedCredentialId && (
        <div className="flex items-center gap-2 min-h-[28px]">
          <Badge variant="secondary">
            Auto-selected: {credentials.find(c => c.id === selectedCredentialId)?.userName || selectedCredentialId.substring(0, 16)}
          </Badge>
        </div>
      )}

      <div className="flex flex-col gap-2 min-h-[28px]">
        {error && (
          <div
            role="alert"
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: 'color-mix(in oklch, var(--destructive) 50%, transparent)', color: 'var(--destructive)' }}
          >
            {error}
          </div>
        )}
        {success && <Badge variant="secondary">{success}</Badge>}
      </div>

      <Button
        onClick={handleSign}
        disabled={loading || !selectedCredentialId}
        className="self-start"
      >
        {loading ? 'Signing…' : 'Sign Challenge'}
      </Button>
    </div>
  )
}
