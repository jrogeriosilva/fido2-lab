import { useEffect, useRef, useState } from 'react'
import {
  Binary,
  Check,
  ChevronDown,
  Cpu,
  Database,
  KeyRound,
  Lock,
  ScanSearch,
  Signature,
  Usb,
  type LucideIcon,
} from 'lucide-react'
import CreateCredentialForm from './components/CreateCredentialForm'
import SigningPanel from './components/SigningPanel'
import AssertionDisplay from './components/AssertionDisplay'
import KeyGeneratorButton from './components/KeyGeneratorButton'
import CredentialManager from './components/CredentialManager'
import Base64Decoder from './components/Base64Decoder'
import AttestationObjectDecoder from './components/AttestationObjectDecoder'
import { EcosystemNav } from './components/EcosystemNav'
import { cn } from './lib/utils'
import { Button, buttonVariants } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'

type Tab = 'create' | 'sign' | 'base64' | 'attest' | 'creds'
type Mode = 'simulated' | 'hardware'

const REPO_URL = 'https://github.com/jrogeriosilva/fido2-lab'

interface TabDef {
  id: Tab
  label: string
  icon: LucideIcon
  title: string
  description: string
  /** Whether the panel's behaviour depends on the selected authenticator mode. */
  modeAware: boolean
}

const TABS: TabDef[] = [
  {
    id: 'create',
    label: 'Create Credential',
    icon: KeyRound,
    title: 'Create Credential',
    description: 'Register a new credential from the PublicKeyCredentialCreationOptions returned by your server.',
    modeAware: true,
  },
  {
    id: 'sign',
    label: 'Sign / Assert',
    icon: Signature,
    title: 'Sign / Assert',
    description: 'Sign a server challenge with a stored credential and produce a WebAuthn assertion.',
    modeAware: true,
  },
  {
    id: 'base64',
    label: 'Base64 Tool',
    icon: Binary,
    title: 'Base64URL Tool',
    description: 'Encode and decode base64url strings — the encoding FIDO2 uses on the wire.',
    modeAware: false,
  },
  {
    id: 'attest',
    label: 'Attestation Decoder',
    icon: ScanSearch,
    title: 'Attestation Decoder',
    description: 'Inspect the CBOR structure of an attestationObject: format, authenticator data and statement.',
    modeAware: false,
  },
  {
    id: 'creds',
    label: 'Credentials',
    icon: Database,
    title: 'Credentials & Keys',
    description: 'Everything kept in this browser\u2019s localStorage: generated key pairs and registered credentials.',
    modeAware: true,
  },
]

const MODES: { value: Mode; icon: LucideIcon; title: string; desc: string }[] = [
  {
    value: 'simulated',
    icon: Cpu,
    title: 'Simulated',
    desc: 'Generate keys and sign internally via SubtleCrypto. No hardware required.',
  },
  {
    value: 'hardware',
    icon: Usb,
    title: 'Hardware (WebAuthn)',
    desc: 'Use a real authenticator via navigator.credentials — FIDO2/WebAuthn API.',
  },
]

interface AssertionData {
  id: string
  rawId: string
  response: Record<string, string | null>
  algorithm?: string
  credentialId?: string
}

function ModeMenu({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = MODES.find(m => m.value === mode) ?? MODES[0]
  const CurrentIcon = current.icon

  // Close on outside click / Escape. (A fixed full-screen overlay would be
  // clipped by the header's backdrop-filter, so listen on the document instead.)
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-2 pl-2.5 pr-2"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <CurrentIcon
          size={14}
          className={mode === 'simulated' ? 'text-[var(--brand)]' : 'text-[var(--warning)]'}
        />
        <span>{current.title.replace(' (WebAuthn)', '')}</span>
        <ChevronDown
          size={13}
          className={cn('text-[var(--muted-foreground)] transition-transform', open && 'rotate-180')}
        />
      </Button>

      {open && (
        <>
          <div
            role="menu"
            className={cn(
              'absolute right-0 top-full z-50 mt-1.5 w-[min(300px,calc(100vw-80px))] rounded-xl border border-[var(--border)] bg-[var(--popover)] p-1',
              'shadow-[0_12px_40px_-8px_oklch(0_0_0/70%)] animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150',
            )}
          >
            <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Authenticator mode
            </p>
            {MODES.map(item => {
              const active = item.value === mode
              const Icon = item.icon
              return (
                <button
                  key={item.value}
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => { onChange(item.value); setOpen(false) }}
                  className={cn(
                    'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                    active ? 'bg-[var(--muted)]' : 'hover:bg-[var(--muted)]/60',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                      active
                        ? 'bg-[var(--brand)]/15 text-[var(--brand)]'
                        : 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
                    )}
                  >
                    <Icon size={13} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-medium leading-tight">
                      {item.title}
                      {active && <Check size={13} className="text-[var(--brand)]" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-[var(--muted-foreground)]">
                      {item.desc}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function SectionHeading({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--secondary)] text-[var(--brand)]">
        <Icon size={14} />
      </span>
      <div>
        <h3 className="text-sm font-semibold leading-tight">{title}</h3>
        <p className="mt-0.5 text-xs leading-snug text-[var(--muted-foreground)]">{description}</p>
      </div>
    </div>
  )
}

export default function App() {
  const [mode, setMode] = useState<Mode>('simulated')
  const [assertion, setAssertion] = useState<AssertionData | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('create')

  const handleCredentialCreated = () => setRefreshKey(k => k + 1)
  const handleAssertionGenerated = (a: AssertionData) => setAssertion(a)

  const current = TABS.find(t => t.id === activeTab) ?? TABS[0]
  const CurrentIcon = current.icon

  return (
    <div className="relative flex min-h-screen flex-col">

      {/* Header */}
      <header className="suite-header">
        <div className="suite-header-inner">
          <a className="suite-brand" href="#top"><span className="suite-mark" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg></span><span className="suite-brand-copy"><h1 className="suite-title">FIDO2 Lab</h1><span className="suite-subtitle">FIDO2 · WebAuthn</span></span></a>
          <div className="suite-actions">
            <ModeMenu mode={mode} onChange={next => { setMode(next); setAssertion(null) }} />
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="View source on GitHub"
              aria-label="View source on GitHub"
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-[var(--muted-foreground)]')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="top" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-12 pt-5 sm:pb-16 sm:pt-8">
        <EcosystemNav />

        {/* Tab navigation */}
        <nav aria-label="Tools" className="min-w-0">
          <div
            role="tablist"
            aria-label="Tools"
            className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1"
          >
            {TABS.map(tab => {
              const active = tab.id === activeTab
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-controls="tool-panel"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onKeyDown={e => {
                    const index = TABS.findIndex(t => t.id === tab.id)
                    const next = e.key === 'ArrowRight' ? (index + 1) % TABS.length : e.key === 'ArrowLeft' ? (index + TABS.length - 1) % TABS.length : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : -1
                    if (next < 0) return
                    e.preventDefault()
                    setActiveTab(TABS[next].id)
                    const tabs = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                    tabs?.[next].focus()
                  }}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex min-h-11 flex-auto items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--ring)]/40',
                    active
                      ? 'bg-[var(--secondary)] text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]',
                  )}
                >
                  <Icon size={15} className={active ? 'text-[var(--brand)]' : undefined} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Active panel */}
        <Card
          role="tabpanel"
          id="tool-panel"
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
        >
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-[var(--brand)]">
                <CurrentIcon size={16} />
              </span>
              <div className="flex flex-col gap-1">
                <CardTitle>{current.title}</CardTitle>
                <CardDescription>{current.description}</CardDescription>
              </div>
            </div>
            {current.modeAware && (
              <Badge
                variant={mode === 'simulated' ? 'brand' : 'warning'}
                className="h-6 shrink-0 self-start px-2.5 sm:self-center"
              >
                {mode === 'simulated' ? <Cpu /> : <Usb />}
                {mode === 'simulated' ? 'Simulated mode' : 'Hardware mode'}
              </Badge>
            )}
          </CardHeader>

          <CardContent>
            <section hidden={activeTab !== 'create'} aria-label="Create Credential">
              <CreateCredentialForm mode={mode} onCredentialCreated={handleCredentialCreated} />
            </section>

            <section hidden={activeTab !== 'sign'} aria-label="Sign / Assert">
              <div className="flex flex-col gap-6">
                <SigningPanel mode={mode} refreshKey={refreshKey} onAssertionGenerated={handleAssertionGenerated} />
                {assertion && (
                  <div className="border-t border-[var(--border)] pt-6">
                    <AssertionDisplay assertion={assertion} />
                  </div>
                )}
              </div>
            </section>

            {activeTab === 'base64' && <Base64Decoder />}

            {activeTab === 'attest' && <AttestationObjectDecoder />}

            {activeTab === 'creds' && (
              <div className="flex flex-col gap-6">
                {mode === 'simulated' && (
                  <section className="flex flex-col gap-4">
                    <SectionHeading
                      icon={KeyRound}
                      title="Key Generator"
                      description="Pre-generate ES256 or RS256 key pairs to attach to simulated credentials."
                    />
                    <KeyGeneratorButton onKeyGenerated={handleCredentialCreated} />
                  </section>
                )}
                <section
                  className={cn(
                    'flex flex-col gap-4',
                    mode === 'simulated' && 'border-t border-[var(--border)] pt-6',
                  )}
                >
                  <SectionHeading
                    icon={Database}
                    title="Stored Credentials"
                    description="Registered credentials with their metadata and public keys."
                  />
                  <CredentialManager refreshKey={refreshKey} />
                </section>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5">
            <Lock size={12} className="shrink-0" />
            Runs entirely in your browser. Credentials and keys are stored in localStorage only.
          </p>
          <nav className="flex items-center gap-4">
            <a href="https://www.w3.org/TR/webauthn-3/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--foreground)]">
              WebAuthn spec
            </a>
            <a href="https://fidoalliance.org/specifications/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--foreground)]">
              FIDO Alliance
            </a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--foreground)]">
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
