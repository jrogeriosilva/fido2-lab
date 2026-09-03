import { useState } from 'react'
import { CircleCheck, KeyRound, LoaderCircle } from 'lucide-react'
import { createCredential } from '../utils/fido2Hardware'
import { createSimulatedCredential } from '../utils/fido2Simulator'
import { saveCredential, getGeneratedKeys } from '../utils/localStorage'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert } from './ui/alert'
import { Field } from './ui/field'
import { Select } from './ui/select'
import { InlineCode } from './ui/inline-code'
import { CopyButton } from './ui/copy-button'
import { CodeEditor } from './ui/code-editor'
import JsonDisplay from './JsonDisplay'

const DEFAULT_JSON = {
  rp: { name: 'Rogerio Bank' },
  user: { id: 'iE2EpTdwsz5KvUbanpLoqq7ZtiTeQcPn' },
  challenge: 'elDBLGCwRwGCOMRCQkloMmn9PdbaF8YlLzZpEFX9AAUa4uVyDVraNAeL3gkio1IIpfg4HsCjTZI65cm__1BTynLoa4I6oes4avuz5SVHOsZ8leYwbjuHaTdztrlzafnmkKyYlqsor1i4YNlpXlaicavlnQXl-Pkhjeptqu-pQwM',
  pubKeyCredParams: [
    { type: 'public-key', alg: -7 },
    { type: 'public-key', alg: -257 },
  ],
  timeout: 60000,
  attestation: 'direct',
  authenticatorSelection: {
    authenticatorAttachment: 'cross-platform',
    requireResidentKey: true,
    userVerification: 'required',
  },
}

interface Props {
  mode: string
  onCredentialCreated?: () => void
}

export default function CreateCredentialForm({ mode, onCredentialCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [jsonInput, setJsonInput] = useState(JSON.stringify(DEFAULT_JSON, null, 2))
  const [selectedKeyId, setSelectedKeyId] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  const generatedKeys = getGeneratedKeys().filter(k => !k.used)

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setResult(null)

    try {
      let config: Record<string, unknown>
      try {
        config = JSON.parse(jsonInput)
      } catch (e) {
        throw new Error(`Invalid JSON: ${(e as Error).message}`)
      }

      const rpId = (config.rp as Record<string, string>)?.id || window.location.hostname
      const rpName = (config.rp as Record<string, string>)?.name || 'FIDO2 Test Client'
      const user = config.user as Record<string, string> | undefined
      const userId = user?.id || 'test-user'
      const userName = user?.name || 'testuser@example.com'
      const userDisplayName = user?.displayName || 'Test User'
      const challengeToUse = config.challenge as string

      if (!challengeToUse) throw new Error('Challenge is required in JSON configuration')

      let algorithm = 'ES256'
      const params = config.pubKeyCredParams as Array<{ alg: number }> | undefined
      if (params && params.length > 0) {
        algorithm = params[0].alg === -257 ? 'RS256' : 'ES256'
      }

      if (mode === 'hardware') {
        const hwCredential = await createCredential({
          challenge: challengeToUse,
          rpId,
          rpName,
          userId,
          userName,
          userDisplayName,
        })
        const credential = {
          id: hwCredential.id,
          type: 'hardware' as const,
          algorithm: 'Unknown',
          credentialId: hwCredential.rawId,
          response: hwCredential.response,
          rpId,
          rpName,
          userId,
          userName,
          userDisplayName,
          createdAt: new Date().toISOString(),
        }
        saveCredential(credential)
        setResult({
          id: hwCredential.id,
          rawId: hwCredential.rawId,
          response: {
            attestationObject: hwCredential.response.attestationObject,
            clientDataJSON: hwCredential.response.clientDataJSON,
            type: 'public-key',
          },
        })
        setSuccess(`Hardware credential created.`)
      } else {
        if (!selectedKeyId) throw new Error('Please select a pre-generated key.')
        const key = generatedKeys.find(k => k.id === selectedKeyId)
        if (!key) throw new Error('Selected key not found.')
        algorithm = key.algorithm

        const simCredential = await createSimulatedCredential({
          challenge: challengeToUse,
          algorithm,
          rpId,
          rpName,
          userId,
          userName,
          userDisplayName,
          existingKeyPair: { publicKey: key.publicKey, privateKey: key.privateKey },
        })
        const credential = {
          id: simCredential.id,
          type: 'simulated' as const,
          algorithm: simCredential.algorithm,
          credentialId: simCredential.rawId,
          publicKeyJWK: simCredential.publicKeyJWK,
          privateKeyJWK: simCredential.privateKeyJWK,
          response: simCredential.response,
          rpId: simCredential.rpId,
          rpName: simCredential.rpName,
          userId: simCredential.userId,
          userName: simCredential.userName,
          userDisplayName: simCredential.userDisplayName,
          createdAt: simCredential.createdAt,
        }
        saveCredential(credential)
        setResult({
          id: simCredential.id,
          rawId: simCredential.rawId,
          response: {
            attestationObject: simCredential.response.attestationObject,
            clientDataJSON: simCredential.response.clientDataJSON,
            type: 'public-key',
          },
        })
        setSuccess(`Simulated credential created (${algorithm}).`)
      }

      onCredentialCreated?.()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const noKeys = generatedKeys.length === 0

  return (
    <div className="flex flex-col gap-5">
      <Field
        label="Creation options (JSON)"
        hint={
          <>
            A <InlineCode>PublicKeyCredentialCreationOptions</InlineCode> object.
            The <InlineCode>challenge</InlineCode> field is required;{' '}
            <InlineCode>rp</InlineCode>, <InlineCode>user</InlineCode> and{' '}
            <InlineCode>pubKeyCredParams</InlineCode> are honoured when present.
          </>
        }
      >
        <CodeEditor
          language="json"
          value={jsonInput}
          onChange={e => setJsonInput(e.target.value)}
          placeholder="Paste PublicKeyCredentialCreationOptions JSON…"
          minHeight={320}
          maxHeight={600}
        />
      </Field>

      {mode === 'simulated' && (
        <Field
          label="Pre-generated key"
          required
          hint={
            noKeys
              ? 'No unused key pairs yet — generate one in the Credentials tab, then come back here.'
              : 'The selected key pair becomes the credential key and is marked as used.'
          }
        >
          <Select
            value={selectedKeyId}
            onChange={e => setSelectedKeyId(e.target.value)}
            className="font-mono"
            disabled={noKeys}
          >
            <option value="">
              {noKeys ? 'No keys available' : 'Select a key…'}
            </option>
            {generatedKeys.map(k => (
              <option key={k.id} value={k.id}>
                {k.algorithm} · {k.id} · {new Date(k.createdAt).toLocaleString()}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleCreate}
          disabled={loading || (mode === 'simulated' && !selectedKeyId)}
        >
          {loading ? <LoaderCircle size={15} className="animate-spin" /> : <KeyRound size={15} />}
          {loading ? 'Creating…' : `Create ${mode === 'hardware' ? 'Hardware' : 'Simulated'} Credential`}
        </Button>
        {mode === 'hardware' && (
          <span className="text-xs text-[var(--muted-foreground)]">
            Your browser will prompt for an authenticator.
          </span>
        )}
      </div>

      {result && (
        <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--success)]/12 text-[var(--success)]">
                <CircleCheck size={14} />
              </span>
              <h3 className="text-sm font-semibold">Created Credential</h3>
              <Badge variant="success">attestation response</Badge>
            </div>
            <CopyButton value={JSON.stringify(result, null, 2)} label="Copy all" />
          </div>
          <JsonDisplay data={result} maxHeight={600} copyable={false} />
        </section>
      )}
    </div>
  )
}
