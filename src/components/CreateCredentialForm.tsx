import { useState } from 'react'
import { createCredential } from '../utils/fido2Hardware'
import { createSimulatedCredential } from '../utils/fido2Simulator'
import { saveCredential, getGeneratedKeys } from '../utils/localStorage'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
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

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Configure credential creation parameters in JSON format. The{' '}
        <code className="font-mono text-xs bg-[var(--muted)] px-1 rounded">challenge</code> field is required.
      </p>

      <Textarea
        autoGrow
        value={jsonInput}
        onChange={e => setJsonInput(e.target.value)}
        placeholder="Paste PublicKeyCredentialCreationOptions JSON…"
        className="min-h-[320px]"
      />

      {mode === 'simulated' && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Pre-generated key <span style={{ color: 'var(--destructive)' }}>*</span>
          </label>
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--input)', backgroundColor: 'var(--card)' }}
          >
            <select
              value={selectedKeyId}
              onChange={e => setSelectedKeyId(e.target.value)}
              className="w-full px-2.5 py-2 text-sm font-mono bg-transparent outline-none"
              style={{ color: 'var(--foreground)' }}
            >
              <option value="" style={{ backgroundColor: 'var(--card)' }}>
                {generatedKeys.length === 0 ? 'No keys available — generate one in Credentials tab' : 'Select a key…'}
              </option>
              {generatedKeys.map(k => (
                <option key={k.id} value={k.id} style={{ backgroundColor: 'var(--card)' }}>
                  {k.algorithm} · {k.id} · {new Date(k.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
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
        {success && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{success}</Badge>
          </div>
        )}
      </div>

      <Button
        onClick={handleCreate}
        disabled={loading || (mode === 'simulated' && !selectedKeyId)}
        className="self-start"
      >
        {loading ? 'Creating…' : `Create ${mode === 'hardware' ? 'Hardware' : 'Simulated'} Credential`}
      </Button>

      {result && (
        <div className="flex flex-col gap-2 mt-2">
          <h3 className="text-sm font-semibold">Created Credential</h3>
          <JsonDisplay data={result} maxHeight={600} />
        </div>
      )}
    </div>
  )
}
