# FIDO2 Credential Manager - AI Coding Instructions

## Project Overview

Browser-based FIDO2 testing client with dual-mode architecture: **Hardware API** (real authenticators via WebAuthn) and **Simulated** (cryptographic key generation without hardware). Built with React 18, Vite, TypeScript (strict mode), and Tailwind v4.

## Core Architecture

### Dual-Mode System

The application's central pattern is **parallel authentication paths** that produce identical FIDO2 outputs:

1. **Hardware Path** (`src/utils/fido2Hardware.ts`): Wraps `navigator.credentials.create/get()`, returns metadata only
2. **Simulated Path** (`src/utils/fido2Simulator.ts`): Manually constructs FIDO2 structures using SubtleCrypto API (RS256/ES256), stores complete credentials including private keys

Both modes must maintain output format compatibility for server testing.

### Data Flow Pattern

```
Challenge Input → Mode Selection → Credential Creation/Selection → Assertion Generation
                                            ↓
                                    localStorage persistence
                                            ↓
                                    (credentials + generated keys)
```

### State Management

- `App.tsx` maintains global state: `mode`, `assertion`, `refreshKey`, `activeTab`
- **`refreshKey` pattern**: Increment to trigger credential list re-fetching after create/delete operations
- Components use callback props to propagate state upward
- Mode selection lives in the header dropdown (no separate Settings tab)
- No state management library — pure prop drilling

## Tech Stack

- **TypeScript** (strict mode) — all source files are `.ts` / `.tsx`
- **React 18** with Vite
- **Tailwind v4** CSS-first — no `tailwind.config.*`; all tokens defined in `src/index.css` via `@theme`
- **`@base-ui-components/react`** — base UI primitives
- **`class-variance-authority`** + **`clsx`** + **`tailwind-merge`** — variant and class utilities
- **`lucide-react`** — icons
- **`@fontsource-variable/geist`** — Geist Variable font
- **`cbor-x`** — CBOR encoding/decoding (attestation objects)
- Path alias: `@/*` → `src/*`

## UI Components (`src/components/ui/`)

Custom shadcn-style primitives — **do not replace with MUI or other component libraries**:

- **`button.tsx`** — `cva` Button, variants: `default | outline | secondary | ghost | destructive | link`, sizes: `xs | sm | default | lg | icon | icon-xs | icon-sm | icon-lg`
- **`badge.tsx`** — Pill badge, variants: `default | secondary | destructive | warning | outline | ghost | link`
- **`textarea.tsx`** — Auto-grow textarea (capped at 320px) with `font-mono` styling
- **`copy-button.tsx`** — Copy → Check (green) feedback for 1500ms
- **`json-tree.tsx`** — Recursive JSON tree with One-Dark syntax colors, expand/collapse, per-node copy on hover
- **`src/lib/utils.ts`** — `cn()` helper (`clsx` + `tailwind-merge`)

## Design Tokens (defined in `src/index.css`)

```
--background: #0b1120
--card:       #141928
--secondary:  #1a2845
--muted:      #1a2845
--foreground: oklch(0.92 0 0)
--primary:    oklch(0.88 0 0)
--border:     oklch(1 0 0 / 10%)
--input:      oklch(1 0 0 / 12%)
--ring:       oklch(0.55 0 0)
--radius:     0.625rem
```

Dark-first: `:root` and `.dark` share the same token values. `<html class="dark">` is set in `index.html`.

## Critical Implementation Details

### Challenge Handling

Accept challenges in two formats (handle identically in both hardware/simulated utils):

```typescript
// Try base64url decode first, fallback to plain text encoding
try {
  challengeBuffer = base64url.decode(challenge);
} catch (e) {
  challengeBuffer = new TextEncoder().encode(challenge);
}
```

### CBOR Encoding Configuration

In `fido2Simulator.ts`, the CBOR encoder **must** disable tags for FIDO2 compatibility:

```typescript
const cborEncoder = new Encoder({
  tagUint8Array: false, // Required for FIDO2
  useRecords: false,
  structuredClone: false,
  mapsAsObjects: false,
});
```

### Authenticator Data Structure

Manually construct in simulated mode (37+ bytes):

- 32 bytes: SHA-256 hash of RP ID
- 1 byte: Flags (UP=0x01, UV=0x04, AT=0x40, ED=0x80)
- 4 bytes: Sign counter (big-endian)
- Variable: Attested credential data (registration only)

### COSE Key Conversion

Convert JWK to COSE format in `crypto.ts`:

- **ES256**: `{1: 2, 3: -7, -1: 1, -2: x, -3: y}` (P-256 curve)
- **RS256**: `{1: 3, 3: -257, -1: n, -2: e}` (2048-bit modulus)

### Cryptographic Operations

- **RS256**: RSASSA-PKCS1-v1_5 with SHA-256, 2048-bit modulus
- **ES256**: ECDSA with P-256 curve and SHA-256
- All operations use browser's SubtleCrypto API (no external crypto libraries)
- `crypto.subtle.importKey` is called via a bound alias typed as `any` to work around TS overload restrictions on `'jwk'` format

### localStorage Schema

```typescript
// fido2_credentials  (key: "fido2_credentials")
interface StoredCredential {
  id: string
  type: 'simulated' | 'hardware'
  algorithm: string                  // 'RS256' | 'ES256'
  credentialId: string
  publicKeyJWK?: JsonWebKey
  privateKeyJWK?: JsonWebKey         // Only for simulated
  response?: Record<string, unknown>
  rpId: string
  rpName?: string
  userId: string
  userName?: string
  userDisplayName?: string
  createdAt: string                  // ISO8601
}

// fido2_generated_keys  (key: "fido2_generated_keys")
interface GeneratedKey {
  id: string
  algorithm: string                  // 'RS256' | 'ES256'
  publicKey: JsonWebKey
  privateKey: JsonWebKey
  createdAt: string                  // ISO8601
  used: boolean
}
```

Keys marked `used: true` when consumed by credential creation.

## Key Files Reference

- **`src/utils/crypto.ts`**: Base64url encoding, key generation, signing, COSE conversion
- **`src/utils/fido2Simulator.ts`**: Manual FIDO2 structure construction, CBOR encoding
- **`src/utils/fido2Hardware.ts`**: WebAuthn API wrappers, `isWebAuthnSupported()` guard
- **`src/utils/localStorage.ts`**: Credential/key storage with `StoredCredential` and `GeneratedKey` interfaces
- **`src/utils/attestationParser.ts`**: Decodes base64url CBOR attestation objects
- **`src/App.tsx`**: Global state, tab navigation, mode selection in header dropdown
- **`src/components/CreateCredentialForm.tsx`**: JSON input parsing, dual-mode credential creation
- **`src/components/SigningPanel.tsx`**: Challenge signing, auto-selection from `allowCredentials[0].id`

## Development Workflow

### Commands

```bash
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # tsc -b && vite build
npm run lint     # ESLint (flat config)
npm run preview  # Preview production build
```

### ESLint Configuration

Uses flat config (`eslint.config.js`) with React Hooks plugin and React Refresh plugin (Vite integration).

### Browser Requirements

- **Hardware mode**: WebAuthn support (Chrome/Firefox/Safari/Edge)
- **Simulated mode**: SubtleCrypto API (all modern browsers)
- Both require `window.crypto.subtle` and localStorage enabled

## Common Pitfalls

1. **Never modify CBOR encoder tag settings** — breaks FIDO2 server compatibility
2. **Always preserve byte ordering** in authenticator data (big-endian for lengths/counters)
3. **Signature base construction**: `authenticatorData + SHA-256(clientDataJSON)` — order matters
4. **Import/export keys as JWK** for localStorage — CryptoKey objects are not serializable
5. **Increment `refreshKey`** after credential operations to trigger re-renders in dependent components
6. **Do not use MUI or other component libraries** — use the custom shadcn-style primitives in `src/components/ui/`
7. **Do not create `tailwind.config.*`** — Tailwind v4 is CSS-first; all tokens live in `src/index.css`

## Testing Notes

This is a **development/testing tool** — simulated mode stores private keys in localStorage (not production-secure). Use hardware mode for production validation.
