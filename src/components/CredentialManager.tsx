import { useState, useEffect } from 'react'
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { getCredentials, deleteCredential, clearAllCredentials, type StoredCredential } from '../utils/localStorage'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CopyButton } from './ui/copy-button'
import { JsonTree } from './ui/json-tree'

interface Props {
  refreshKey: number
}

function CredentialRow({ credential, onDelete }: { credential: StoredCredential; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-md border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-sm font-medium hover:text-[var(--foreground)] transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="font-mono text-xs">{credential.id.substring(0, 20)}…</span>
          </button>
          <Badge variant="secondary" className="font-mono">{credential.algorithm}</Badge>
          <Badge variant={credential.type === 'simulated' ? 'outline' : 'default'}>{credential.type}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <CopyButton value={JSON.stringify(credential, null, 2)} size="icon-sm" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            title="Delete credential"
          >
            <Trash2 size={13} style={{ color: 'var(--destructive)' }} />
          </Button>
        </div>
      </div>

      {/* Definition list */}
      <dl className="px-4 pb-2 space-y-1">
        {[
          ['rpId', credential.rpId],
          ['userId', credential.userId],
          ['userName', credential.userName],
          ['createdAt', credential.createdAt ? new Date(credential.createdAt).toLocaleString() : undefined],
        ].filter(([, v]) => v).map(([k, v]) => (
          <div key={k as string} className="flex gap-3 text-xs">
            <dt className="font-mono font-medium w-24 shrink-0" style={{ color: 'var(--foreground)' }}>{k as string}</dt>
            <dd style={{ color: 'var(--muted-foreground)' }}>{v as string}</dd>
          </div>
        ))}
      </dl>

      {/* Expanded public key */}
      {expanded && credential.publicKeyJWK && (
        <div className="border-t mx-3 mb-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs mt-2 mb-1 font-medium" style={{ color: 'var(--muted-foreground)' }}>Public Key (JWK)</p>
          <JsonTree data={credential.publicKeyJWK} />
        </div>
      )}
    </div>
  )
}

export default function CredentialManager({ refreshKey }: Props) {
  const [credentials, setCredentials] = useState<StoredCredential[]>([])

  useEffect(() => {
    setCredentials(getCredentials())
  }, [refreshKey])

  const handleDelete = (id: string) => {
    if (!confirm('Delete this credential?')) return
    deleteCredential(id)
    setCredentials(getCredentials())
  }

  const handleClearAll = () => {
    if (!confirm('Delete ALL credentials?')) return
    clearAllCredentials()
    setCredentials([])
  }

  if (credentials.length === 0) {
    return (
      <div
        className="rounded-md border p-4 min-h-[200px] flex items-center justify-center"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
      >
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          No credentials stored. Create one first.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {credentials.length} credential{credentials.length !== 1 ? 's' : ''} stored
        </span>
        <Button variant="destructive" size="sm" onClick={handleClearAll}>
          Clear all
        </Button>
      </div>
      {credentials.map(c => (
        <CredentialRow key={c.id} credential={c} onDelete={() => handleDelete(c.id)} />
      ))}
    </div>
  )
}
