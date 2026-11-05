import { useState } from 'react'
import CreateCredentialForm from './components/CreateCredentialForm'
import SigningPanel from './components/SigningPanel'
import AssertionDisplay from './components/AssertionDisplay'
import KeyGeneratorButton from './components/KeyGeneratorButton'
import CredentialManager from './components/CredentialManager'
import Base64Decoder from './components/Base64Decoder'
import AttestationObjectDecoder from './components/AttestationObjectDecoder'
import { cn } from './lib/utils'
import { EcosystemNav } from './components/EcosystemNav'

type Tab = 'create' | 'sign' | 'base64' | 'attest' | 'creds'
type Mode = 'simulated' | 'hardware'

const TABS: { id: Tab; label: string }[] = [
  { id: 'create', label: 'Create Credential' },
  { id: 'sign', label: 'Sign / Assert' },
  { id: 'base64', label: 'Base64 Tool' },
  { id: 'attest', label: 'Attestation Decoder' },
  { id: 'creds', label: 'Credentials' },
]

interface AssertionData {
  id: string
  rawId: string
  response: Record<string, string | null>
  algorithm?: string
  credentialId?: string
}

export default function App() {
  const [mode, setMode] = useState<Mode>('simulated')
  const [assertion, setAssertion] = useState<AssertionData | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('create')

  const handleCredentialCreated = () => setRefreshKey(k => k + 1)
  const handleAssertionGenerated = (a: AssertionData) => setAssertion(a)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <div className="mx-auto max-w-5xl px-4 pt-6"><EcosystemNav /></div>
      <header className="mx-auto max-w-5xl flex flex-wrap gap-4 items-center justify-between pb-6 px-4">
        <div>
          <h1 className="text-xl font-semibold leading-tight">FIDO2 Lab</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Browser-based testing client for FIDO2 servers.
          </p>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <label htmlFor="authenticator-mode" className="text-xs text-[var(--muted-foreground)]">Authenticator mode</label>
          <select id="authenticator-mode" value={mode}
            onChange={e => { setMode(e.target.value as Mode); setAssertion(null) }}
            className="rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm min-h-11">
            <option value="simulated">Simulated</option>
            <option value="hardware">Hardware (WebAuthn)</option>
          </select>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 flex flex-col gap-8 pb-16">
        <p className="text-sm text-[var(--muted-foreground)]" role="status">
          {mode === 'simulated' ? 'Simulated mode: generate a test key, create a credential, then sign a challenge. Test keys are stored in this browser.' : 'Hardware mode: use your system authenticator through WebAuthn. Your browser will ask you to confirm.'}
        </p>
        {/* Task navigation */}
        <div className="flex gap-1 flex-wrap" role="group" aria-label="Lab tasks">
          {TABS.map(tab => (
            <button
              key={tab.id}
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 min-h-11 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-[var(--foreground)]'
                  : 'hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
              )}
              style={{
                color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted-foreground)',
                backgroundColor: activeTab === tab.id ? 'var(--secondary)' : undefined,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section id="panel-create" aria-label="Create Credential" hidden={activeTab !== 'create'}>
          <CreateCredentialForm mode={mode} onCredentialCreated={handleCredentialCreated} />
        </section>

        <section id="panel-sign" aria-label="Sign / Assert" hidden={activeTab !== 'sign'}>
          <div className="flex flex-col gap-8">
            <SigningPanel mode={mode} refreshKey={refreshKey} onAssertionGenerated={handleAssertionGenerated} />
            {assertion && <AssertionDisplay assertion={assertion} />}
          </div>
        </section>

        {activeTab === 'base64' && <section id="panel-base64"><Base64Decoder /></section>}

        {activeTab === 'attest' && <section id="panel-attest"><p className="text-sm text-[var(--muted-foreground)] mb-4">Quick CBOR inspection. For full credential responses and field-by-field analysis, use <a className="underline" href="https://jrogeriosilva.github.io/webauthn-decoder/">WebAuthn Decoder</a>.</p><AttestationObjectDecoder /></section>}

        {activeTab === 'creds' && (
          <div id="panel-creds" className="flex flex-col gap-6">
            {mode === 'simulated' && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Key Generator</h2>
                <KeyGeneratorButton onKeyGenerated={handleCredentialCreated} />
              </section>
            )}
            <section>
              <h2 className="text-lg font-semibold mb-3">Stored Credentials</h2>
              <CredentialManager refreshKey={refreshKey} />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
