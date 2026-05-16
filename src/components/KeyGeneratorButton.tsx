import { useState } from 'react'
import { KeyRound, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { generateKeyPairForStorage } from '../utils/fido2Simulator'
import { saveGeneratedKey, getGeneratedKeys, deleteGeneratedKey, type GeneratedKey } from '../utils/localStorage'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CopyButton } from './ui/copy-button'

interface Props {
  onKeyGenerated?: () => void
}

export default function KeyGeneratorButton({ onKeyGenerated }: Props) {
  const [algorithm, setAlgorithm] = useState('ES256')
  const [loading, setLoading] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [keys, setKeys] = useState<GeneratedKey[]>(() => getGeneratedKeys())
  const [showKeys, setShowKeys] = useState(false)

  const refresh = () => setKeys(getGeneratedKeys())

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setFlash(null)
    try {
      const keyPair = await generateKeyPairForStorage(algorithm)
      saveGeneratedKey(keyPair)
      refresh()
      setFlash(`Key generated · ${algorithm}`)
      setTimeout(() => setFlash(null), 1500)
      onKeyGenerated?.()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    deleteGeneratedKey(id)
    refresh()
    onKeyGenerated?.()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Algorithm picker */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--input)', backgroundColor: 'var(--card)' }}
        >
          <select
            value={algorithm}
            onChange={e => setAlgorithm(e.target.value)}
            className="px-2.5 py-1.5 text-sm font-mono bg-transparent outline-none h-8"
            style={{ color: 'var(--foreground)' }}
          >
            <option value="ES256" style={{ backgroundColor: 'var(--card)' }}>ES256 (ECDSA P-256)</option>
            <option value="RS256" style={{ backgroundColor: 'var(--card)' }}>RS256 (RSA 2048)</option>
          </select>
        </div>

        <Button variant="secondary" onClick={handleGenerate} disabled={loading} className="gap-2">
          <KeyRound size={14} />
          {loading ? 'Generating…' : 'Generate Key Pair'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => { if (!showKeys) refresh(); setShowKeys(s => !s) }}
          className="gap-1.5"
        >
          {showKeys ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {showKeys ? 'Hide' : 'Show'} Keys ({keys.length})
        </Button>
      </div>

      <div className="flex items-center gap-2 min-h-[28px]">
        {flash && <Badge variant="secondary">{flash}</Badge>}
        {error && (
          <span className="text-xs" style={{ color: 'var(--destructive)' }}>{error}</span>
        )}
      </div>

      {showKeys && (
        <div className="flex flex-col gap-2">
          {keys.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No key pairs generated yet.</p>
          ) : (
            keys.map(key => (
              <div
                key={key.id}
                className="rounded-md border p-3 flex items-start justify-between gap-3"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
              >
                <dl className="space-y-0.5 text-xs">
                  <div className="flex gap-3">
                    <dt className="font-mono font-medium w-16 shrink-0" style={{ color: 'var(--muted-foreground)' }}>id</dt>
                    <dd className="font-mono break-all">{key.id}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="font-mono font-medium w-16 shrink-0" style={{ color: 'var(--muted-foreground)' }}>alg</dt>
                    <dd><Badge variant="secondary" className="font-mono">{key.algorithm}</Badge></dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="font-mono font-medium w-16 shrink-0" style={{ color: 'var(--muted-foreground)' }}>created</dt>
                    <dd style={{ color: 'var(--muted-foreground)' }}>{new Date(key.createdAt).toLocaleString()}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="font-mono font-medium w-16 shrink-0" style={{ color: 'var(--muted-foreground)' }}>status</dt>
                    <dd>
                      <Badge variant={key.used ? 'outline' : 'secondary'}>
                        {key.used ? 'Used' : 'Available'}
                      </Badge>
                    </dd>
                  </div>
                </dl>
                <div className="flex gap-1 shrink-0">
                  <CopyButton value={JSON.stringify(key, null, 2)} size="icon-sm" />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(key.id)}
                    title="Delete key"
                  >
                    <Trash2 size={13} style={{ color: 'var(--destructive)' }} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
