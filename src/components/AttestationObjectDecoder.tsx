import { useState, type ReactNode } from 'react'
import { Braces, Check, FileKey2, Fingerprint, Minus, ScanSearch, type LucideIcon } from 'lucide-react'
import { parseAttestationObject } from '../utils/attestationParser'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Alert } from './ui/alert'
import { Field } from './ui/field'
import { CopyButton } from './ui/copy-button'
import { EmptyState } from './ui/empty-state'
import { InlineCode } from './ui/inline-code'
import JsonDisplay from './JsonDisplay'
import { cn } from '@/lib/utils'

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

function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: LucideIcon
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]/40">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-[var(--brand)]" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {action}
      </header>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </section>
  )
}

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-tight">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{hint}</p>}
    </div>
  )
}

function HexValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <CopyButton value={value} size="xs" variant="ghost" />
      </div>
      <code className="block break-all rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 font-mono text-xs leading-relaxed">
        {value}
      </code>
    </div>
  )
}

function FlagGrid({ flags }: { flags: Record<string, boolean> }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Object.entries(flags).map(([flag, active]) => (
        <div
          key={flag}
          className={cn(
            'flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors',
            active
              ? 'border-[var(--success)]/30 bg-[var(--success)]/8'
              : 'border-[var(--border)] bg-[var(--background)]/60 opacity-70',
          )}
        >
          <span
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
              active
                ? 'bg-[var(--success)]/20 text-[var(--success)]'
                : 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
            )}
          >
            {active ? <Check size={11} /> : <Minus size={11} />}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="font-mono text-xs font-semibold">{flag}</p>
            <p className="truncate text-[11px] text-[var(--muted-foreground)]">{FLAG_LABELS[flag] ?? flag}</p>
          </div>
        </div>
      ))}
    </div>
  )
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

  const activeFlags = parsed ? Object.values(parsed.authData.flags).filter(Boolean).length : 0
  const attested = parsed?.authData.attestedCredentialData

  return (
    <div className="flex flex-col gap-5">
      <Field
        label="Attestation object (base64url)"
        hint={
          <>
            Paste the base64url-encoded <InlineCode>attestationObject</InlineCode> from an{' '}
            <InlineCode>AuthenticatorAttestationResponse</InlineCode>.
          </>
        }
      >
        <Textarea
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          placeholder="Paste base64url-encoded attestationObject here…"
          autoGrow
        />
      </Field>

      {error && <Alert variant="destructive">{error}</Alert>}

      <Button onClick={handleDecode} className="self-start">
        <ScanSearch size={15} />
        Decode attestationObject
      </Button>

      {parsed ? (
        <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Attestation format" value={<span className="font-mono">{parsed.fmt}</span>} />
            <Stat label="Sign count" value={parsed.authData.signCount} />
            <Stat
              label="Flags"
              value={<span className="font-mono">{parsed.authData.flagsByte}</span>}
              hint={`${activeFlags} of ${Object.keys(parsed.authData.flags).length} set`}
            />
          </div>

          {/* Authenticator data */}
          <Section icon={Fingerprint} title="Authenticator Data">
            <HexValue label="RP ID hash (SHA-256)" value={parsed.authData.rpIdHash} />

            <div className="flex flex-col gap-2">
              <Label>Flags</Label>
              <FlagGrid flags={parsed.authData.flags} />
            </div>

            {attested && (
              <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Attested credential data
                </h4>
                <HexValue label="AAGUID" value={attested.aaguid} />
                <HexValue label="Credential ID (hex)" value={attested.credentialId} />
                <HexValue label="Credential ID (base64url)" value={attested.credentialIdBase64url} />
                <div className="flex flex-col gap-1.5">
                  <Label>Credential public key (COSE)</Label>
                  <JsonDisplay data={attested.credentialPublicKey} maxHeight={320} />
                </div>
              </div>
            )}

            {Boolean(parsed.authData.extensions) && (
              <div className="flex flex-col gap-1.5 border-t border-[var(--border)] pt-4">
                <Label>Extensions</Label>
                <JsonDisplay data={parsed.authData.extensions} maxHeight={320} />
              </div>
            )}
          </Section>

          {/* Attestation statement */}
          <Section icon={FileKey2} title="Attestation Statement">
            <JsonDisplay data={parsed.attStmt} maxHeight={400} />
          </Section>

          {/* Full JSON */}
          <Section
            icon={Braces}
            title="Complete Structure"
            action={<CopyButton value={JSON.stringify(parsed, null, 2)} label="Copy all" size="xs" />}
          >
            <JsonDisplay data={parsed} maxHeight={400} copyable={false} />
          </Section>
        </div>
      ) : (
        <EmptyState
          icon={<ScanSearch size={18} />}
          title="Nothing decoded yet"
          description="Paste an attestationObject above and press Decode to inspect its format, flags, credential ID and public key."
        />
      )}
    </div>
  )
}
