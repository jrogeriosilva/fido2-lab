import { useState, useEffect } from 'react'
import { CircleCheck, LoaderCircle, Signature } from 'lucide-react'
import { getAssertion } from '../utils/fido2Hardware'
import { createSimulatedAssertion } from '../utils/fido2Simulator'
import { getCredentials, type StoredCredential } from '../utils/localStorage'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert } from './ui/alert'
import { Field } from './ui/field'
import { Select } from './ui/select'
import { InlineCode } from './ui/inline-code'
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

  const selected = credentials.find(c => c.id === selectedCredentialId)
  const noCredentials = credentials.length === 0

  return (
    <div className="flex flex-col gap-5">
      <Field
        label="Request options (JSON)"
        hint={
          <>
            A <InlineCode>PublicKeyCredentialRequestOptions</InlineCode> object.
            The <InlineCode>challenge</InlineCode> field is required. When{' '}
            <InlineCode>allowCredentials</InlineCode> matches a stored credential it is selected automatically.
          </>
        }
      >
        <CodeEditor
          language="json"
          value={jsonInput}
          onChange={e => setJsonInput(e.target.value)}
          placeholder="Paste PublicKeyCredentialRequestOptions JSON…"
          minHeight={180}
          maxHeight={400}
        />
      </Field>

      <Field
        label="Credential"
        required
        hint={
          noCredentials
            ? `No ${mode} credentials stored yet — create one in the Create Credential tab.`
            : undefined
        }
      >
        {autoSelected && selected ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/6 px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--success)]/15 text-[var(--success)]">
              <CircleCheck size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{selected.userName || selected.userId}</p>
              <p className="truncate font-mono text-xs text-[var(--muted-foreground)]" title={selected.id}>
                {selected.id}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="font-mono">{selected.algorithm}</Badge>
              <Badge variant="success">auto-selected</Badge>
            </div>
          </div>
        ) : (
          <Select
            value={selectedCredentialId}
            onChange={e => setSelectedCredentialId(e.target.value)}
            className="font-mono"
            disabled={noCredentials}
          >
            <option value="">
              {noCredentials ? `No ${mode} credentials` : 'Select a credential…'}
            </option>
            {credentials.map(c => (
              <option key={c.id} value={c.id}>
                {c.userName || c.userId} · {c.algorithm} · {c.id.substring(0, 16)}…
              </option>
            ))}
          </Select>
        )}
      </Field>

      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleSign}
          disabled={loading || !selectedCredentialId}
        >
          {loading ? <LoaderCircle size={15} className="animate-spin" /> : <Signature size={15} />}
          {loading ? 'Signing…' : 'Sign Challenge'}
        </Button>
        {mode === 'hardware' && (
          <span className="text-xs text-[var(--muted-foreground)]">
            Your browser will prompt for the authenticator.
          </span>
        )}
      </div>
    </div>
  )
}
