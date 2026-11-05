export function EcosystemNav() {
  const links = [
    ['demo', 'fido2-demo', 'Understand', 'FIDO2 Demo'],
    ['lab', 'fido2-lab', 'Experiment', 'FIDO2 Lab'],
    ['decoder', 'webauthn-decoder', 'Inspect', 'WebAuthn Decoder'],
  ]
  return <nav className="ecosystem-nav" aria-label="FIDO2 ecosystem">
    {links.map(([id, path, action, name]) => <a key={id}
      href={`https://jrogeriosilva.github.io/${path}/`}
      aria-current={id === 'lab' ? 'page' : undefined}>
      <span>{action}</span><span>{name}</span>
    </a>)}
  </nav>
}
