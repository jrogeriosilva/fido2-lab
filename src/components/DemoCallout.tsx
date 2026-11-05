import { ArrowUpRight, Sparkles } from 'lucide-react'
import { buttonVariants } from './ui/button'
import { cn } from '@/lib/utils'

const DEMO_URL = 'https://jrogeriosilva.github.io/fido2-demo/'

export default function DemoCallout() {
  return (
    <section
      className={cn(
        'relative flex flex-col gap-4 overflow-hidden rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5',
        'border-[var(--brand)]/25 bg-[var(--card)]',
      )}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--brand)]/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-[oklch(0.6_0.17_270)]/12 blur-3xl"
      />

      <div className="relative flex items-start gap-3.5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--brand)]/25 bg-[var(--brand)]/12 text-[var(--brand)]">
          <Sparkles size={16} />
        </span>
        <div>
          <h2 className="text-sm font-semibold leading-tight">
            New to FIDO2? See the protocol in action.
          </h2>
          <p className="mt-1 text-sm leading-snug text-[var(--muted-foreground)]">
            Walk through registration and authentication step by step — challenge,
            attestation and assertion — in an interactive demo.
          </p>
        </div>
      </div>

      <a
        href={DEMO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ size: 'lg' }), 'relative self-start sm:self-center')}
      >
        Open FIDO2 Demo
        <ArrowUpRight size={16} />
      </a>
    </section>
  )
}
