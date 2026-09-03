import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { buttonVariants } from './ui/button'
import { cn } from '@/lib/utils'

const DEMO_URL = 'https://jrogeriosilva.github.io/fido2-demo/'

export default function DemoCallout() {
  return (
    <section
      className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--secondary)' }}
        >
          <ShieldCheck size={16} />
        </span>
        <div>
          <h2 className="text-sm font-semibold leading-tight">
            New to FIDO2? See the protocol in action.
          </h2>
          <p className="mt-1 text-sm leading-snug" style={{ color: 'var(--muted-foreground)' }}>
            Walk through registration and authentication step by step — challenge,
            attestation and assertion — in an interactive demo.
          </p>
        </div>
      </div>

      <a
        href={DEMO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ size: 'lg' }), 'gap-2 self-start sm:self-center')}
      >
        Open FIDO2 Demo
        <ArrowUpRight size={16} />
      </a>
    </section>
  )
}
