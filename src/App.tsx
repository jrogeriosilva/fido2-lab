import { useState } from 'react'
import { ChevronDown, Cpu, Usb } from 'lucide-react'
import CreateCredentialForm from './components/CreateCredentialForm'
import SigningPanel from './components/SigningPanel'
import AssertionDisplay from './components/AssertionDisplay'
import KeyGeneratorButton from './components/KeyGeneratorButton'
import CredentialManager from './components/CredentialManager'
import Base64Decoder from './components/Base64Decoder'
import AttestationObjectDecoder from './components/AttestationObjectDecoder'
import { cn } from './lib/utils'
import { Button } from './components/ui/button'

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
  const [modeMenuOpen, setModeMenuOpen] = useState(false)

  const handleCredentialCreated = () => setRefreshKey(k => k + 1)
  const handleAssertionGenerated = (a: AssertionData) => setAssertion(a)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header className="mx-auto max-w-5xl flex items-center justify-between py-6 px-4">
        <div>
          <h1 className="text-xl font-semibold leading-tight">FIDO2 Lab</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Browser-based testing client for FIDO2 servers.
          </p>
        </div>

        {/* Mode dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setModeMenuOpen(o => !o)}
          >
            {mode === 'simulated' ? <Cpu size={14} /> : <Usb size={14} />}
            <span>{mode === 'simulated' ? 'Simulated' : 'Hardware'}</span>
            <ChevronDown size={14} style={{ opacity: 0.7 }} />
          </Button>

          {modeMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setModeMenuOpen(false)} />
              <div
                className="absolute right-0 top-full mt-1 z-50 rounded-md border p-1 shadow-md min-w-[280px] max-w-[360px]"
                style={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)' }}
              >
                {([
                  {
                    value: 'simulated' as Mode,
                    icon: <Cpu size={14} />,
                    title: 'Simulated',
                    desc: 'Generate keys and sign internally via SubtleCrypto. No hardware required.',
                  },
                  {
                    value: 'hardware' as Mode,
                    icon: <Usb size={14} />,
                    title: 'Hardware (WebAuthn)',
                    desc: 'Use a real authenticator via navigator.credentials — FIDO2/WebAuthn API.',
                  },
                ] as const).map(item => (
                  <button
                    key={item.value}
                    onClick={() => { setMode(item.value); setModeMenuOpen(false) }}
                    className={cn(
                      'w-full text-left rounded-sm px-2 py-1.5 text-sm transition-colors',
                      mode === item.value ? 'bg-[var(--muted)]' : 'hover:bg-[var(--muted)]'
                    )}
                  >
                    <div className="flex items-center gap-2 font-medium leading-tight">
                      {item.icon}
                      {item.title}
                    </div>
                    <p className="mt-0.5 text-xs leading-snug" style={{ color: 'var(--muted-foreground)' }}>
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 flex flex-col gap-8 pb-16">
        {/* Tab navigation */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 h-8 rounded-lg text-sm font-medium transition-colors',
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

        {activeTab === 'create' && (
          <CreateCredentialForm mode={mode} onCredentialCreated={handleCredentialCreated} />
        )}

        {activeTab === 'sign' && (
          <div className="flex flex-col gap-8">
            <SigningPanel mode={mode} refreshKey={refreshKey} onAssertionGenerated={handleAssertionGenerated} />
            {assertion && <AssertionDisplay assertion={assertion} />}
          </div>
        )}

        {activeTab === 'base64' && <Base64Decoder />}

        {activeTab === 'attest' && <AttestationObjectDecoder />}

        {activeTab === 'creds' && (
          <div className="flex flex-col gap-6">
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
