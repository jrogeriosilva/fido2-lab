import { useState } from 'react'
import { parseAttestationObject } from '../utils/attestationParser'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { CopyButton } from './ui/copy-button'
import { JsonTree } from './ui/json-tree'

interface ParsedAttestation {
  fmt: string
  attStmt: unknown
  authData: {
    rpIdHash: string
    flags: Record<string, boolean>
    flagsByte: string
    signCount: number
    attestedCredentialData?: {
      aaguid: string
      credentialIdLength: number
      credentialId: string
      credentialIdBase64url: string
      credentialPublicKey: unknown
    }
    extensions?: unknown
  }
  rawAuthData: string
  raw: unknown
}

const FLAG_LABELS: Record<string, string> = {
  UP: 'User Present',
  UV: 'User Verified',
  BE: 'Backup Eligible',
  BS: 'Backup State',
  AT: 'Attested Credential Data',
  ED: 'Extension Data',
}

export default function AttestationObjectDecoder() {
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<ParsedAttestation | null>(null)
  const [error, setError] = useState('')

  const handleDecode = () => {
    setError('')
    setParsed(null)
    if (!input.trim()) { setError('Enter a base64url-encoded attestationObject.'); return }
    try {
      setParsed(parseAttestationObject(input.trim()) as ParsedAttestation)
    } catch (err) {
      setError(`Failed to parse attestationObject: ${(err as Error).message}`)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Paste a base64url-encoded <code className="font-mono text-xs bg-[var(--muted)] px-1 rounded">attestationObject</code> to decode its CBOR structure.
      </p>

      <Textarea
        value={input}
        onChange={e => { setInput(e.target.value); setError('') }}
        placeholder="Paste base64url-encoded attestationObject here…"
        autoGrow
      />

      {error && (
        <div
          role="alert"
          className="rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: 'color-mix(in oklch, var(--destructive) 50%, transparent)', color: 'var(--destructive)' }}
        >
          {error}
        </div>
      )}

      <Button onClick={handleDecode} className="self-start">
        Decode AttestationObject
      </Button>

      {parsed && (
        <div className="flex flex-col gap-4 mt-2">
          {/* Attestation format */}
          <div className="rounded-md border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
            <h3 className="text-sm font-semibold mb-2">Attestation Format</h3>
            <Badge variant="secondary" className="font-mono">{parsed.fmt}</Badge>
          </div>

          {/* Authenticator data */}
          <div className="rounded-md border p-4 flex flex-col gap-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
            <h3 className="text-sm font-semibold">Authenticator Data</h3>

            <dl className="space-y-2">
              <div>
                <dt className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted-foreground)' }}>RP ID Hash</dt>
                <dd className="font-mono text-xs break-all" style={{ color: 'var(--foreground)' }}>{parsed.authData.rpIdHash}</dd>
              </div>

              <div>
                <dt className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Flags <span className="font-mono">({parsed.authData.flagsByte})</span>
                </dt>
                <dd className="flex flex-wrap gap-1.5">
                  {Object.entries(parsed.authData.flags).map(([flag, active]) => (
                    <Badge
                      key={flag}
                      variant={active ? 'secondary' : 'outline'}
                      className="font-mono"
                      title={FLAG_LABELS[flag]}
                    >
                      {flag}
                    </Badge>
                  ))}
                </dd>
                <dd className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {Object.entries(FLAG_LABELS).map(([k, v]) => `${k}=${v}`).join(' · ')}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Sign Count</dt>
                <dd><Badge variant="outline" className="font-mono">{parsed.authData.signCount}</Badge></dd>
              </div>
            </dl>

            {parsed.authData.attestedCredentialData && (
              <div>
                <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>Attested Credential Data</h4>
                <dl className="space-y-2">
                  {[
                    ['AAGUID', parsed.authData.attestedCredentialData.aaguid],
                    ['Credential ID (hex)', parsed.authData.attestedCredentialData.credentialId],
                    ['Credential ID (base64url)', parsed.authData.attestedCredentialData.credentialIdBase64url],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <dt className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{k as string}</dt>
                      <dd className="font-mono text-xs break-all">{v as string}</dd>
                    </div>
                  ))}
                  <div>
                    <dt className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Credential Public Key (COSE)</dt>
                    <dd>
                      <div className="rounded-md border overflow-auto" style={{ borderColor: 'var(--border)' }}>
                        <JsonTree data={parsed.authData.attestedCredentialData.credentialPublicKey} />
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {Boolean(parsed.authData.extensions) && (
              <div>
                <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>Extensions</h4>
                <div className="rounded-md border overflow-auto" style={{ borderColor: 'var(--border)' }}>
                  <JsonTree data={parsed.authData.extensions} />
                </div>
              </div>
            )}
          </div>

          {/* Attestation statement */}
          <div className="rounded-md border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
            <h3 className="text-sm font-semibold mb-2">Attestation Statement</h3>
            <div className="rounded-md border overflow-auto" style={{ borderColor: 'var(--border)' }}>
              <JsonTree data={parsed.attStmt} />
            </div>
          </div>

          {/* Full JSON */}
          <div className="rounded-md border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Complete JSON Structure</h3>
              <CopyButton value={JSON.stringify(parsed, null, 2)} label="Copy all" />
            </div>
            <div className="rounded-md border overflow-auto max-h-[400px]" style={{ borderColor: 'var(--border)' }}>
              <JsonTree data={parsed} />
            </div>
          </div>
        </div>
      )}

      {!parsed && (
        <div
          className="rounded-md border min-h-[200px] flex items-center justify-center"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Decoded output will appear here.</p>
        </div>
      )}
    </div>
  )
}
