# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FIDO2 Credential Manager is a browser-based testing client for FIDO2 server applications. It operates in two modes:
- **Hardware API Mode**: Uses real authenticators via WebAuthn API
- **Simulated Mode**: Internally generates cryptographic keys and signatures without hardware

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (default: http://localhost:5173)
npm run build        # Type-check + build for production (tsc -b && vite build)
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Tech Stack

- **TypeScript** (strict mode) — all source files are `.ts` / `.tsx`
- **React 18** with Vite
- **Tailwind v4** CSS-first (no `tailwind.config.*`; tokens defined in `src/index.css` via `@theme`)
- **`@base-ui-components/react@^1.0.0-rc.0`** — base primitives
- **`class-variance-authority`** + **`clsx`** + **`tailwind-merge`** — variant + class utilities
- **`lucide-react`** — icons
- **`@fontsource-variable/geist`** — Geist Variable sans-serif font
- **`cbor-x`** — CBOR encoding/decoding (attestation objects)
- Path alias: `@/*` → `src/*`

## Architecture

### Dual-Mode System

The application's core architecture revolves around two parallel authentication paths:

1. **Hardware Path** (`src/utils/fido2Hardware.ts`):
   - Wraps `navigator.credentials.create()` and `navigator.credentials.get()`
   - Handles WebAuthn API interactions
   - Returns credential metadata only (private keys remain in hardware)

2. **Simulated Path** (`src/utils/fido2Simulator.ts`):
   - Manually constructs FIDO2 data structures
   - Uses SubtleCrypto API for key generation (RS256/ES256)
   - Stores complete credentials including private keys in localStorage

Both paths produce compatible FIDO2 output structures for server testing.

### Data Flow

```
Challenge Input → Mode Selection → Credential Creation/Selection → Assertion Generation
                                            ↓
                                    localStorage persistence
                                            ↓
                                    (credentials + generated keys)
```

### Core Utilities

**`src/utils/crypto.ts`**
- `base64url`: Encoding/decoding for FIDO2 format
- `generateRS256KeyPair()` / `generateES256KeyPair()`: SubtleCrypto key generation
- `signData()`: Creates signatures for assertions
- `importKey()` / `exportKey()`: JWK serialization for localStorage
- `jwkToCOSE()`: Converts JWK public key to COSE format for authenticatorData

**`src/utils/localStorage.ts`**
- Two separate stores: `fido2_credentials` and `fido2_generated_keys`
- Credentials contain full key material (simulated) or metadata (hardware)
- Generated keys can be pre-created and marked as "used" when assigned to credentials
- Exports `StoredCredential` and `GeneratedKey` interfaces

**`src/utils/fido2Simulator.ts`**
- `createSimulatedCredential()`: Generates attestation objects without hardware
- `createSimulatedAssertion()`: Signs challenges using stored private keys
- Manually constructs: authenticatorData, clientDataJSON, rpIdHash (SHA-256)

**`src/utils/fido2Hardware.ts`**
- `createCredential()`: Wraps WebAuthn registration
- `getAssertion()`: Wraps WebAuthn authentication
- `isWebAuthnSupported()`: Feature detection guard

**`src/utils/attestationParser.ts`**
- `parseAttestationObject()`: Decodes base64url CBOR attestation objects
- Returns structured result with rpIdHash, flags, signCount, attestedCredentialData

### Component Communication

**State Management Pattern**:
- `App.tsx` maintains global state: `mode`, `assertion`, `refreshKey`, `activeTab`
- `refreshKey` is incremented to trigger re-fetching of credentials after creation/deletion
- Components use callbacks to propagate state changes upward
- Mode selection lives in the header dropdown (no separate Settings tab)

**Key Generator Integration**:
- `KeyGeneratorButton` creates standalone key pairs stored in `fido2_generated_keys`
- `CreateCredentialForm` can optionally consume these pre-generated keys
- When used, keys are marked as `used: true` in localStorage

### UI Components (`src/components/ui/`)

Custom shadcn-style primitives — do not replace with MUI or other component libraries:

- **`button.tsx`** — `cva` Button, variants: `default | outline | secondary | ghost | destructive | link`, sizes: `xs | sm | default | lg | icon | icon-xs | icon-sm | icon-lg`
- **`badge.tsx`** — Pill badge, variants: `default | secondary | destructive | warning | outline | ghost | link`
- **`textarea.tsx`** — Auto-grow textarea (capped at 320px) with `font-mono` styling
- **`copy-button.tsx`** — Copy → Check (green) feedback for 1500ms
- **`json-tree.tsx`** — Custom recursive JSON tree with One-Dark syntax colors, expand/collapse, per-node copy on hover
- **`src/lib/utils.ts`** — `cn()` helper (`clsx` + `tailwind-merge`)

### Design Tokens (defined in `src/index.css`)

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

## Important Implementation Details

### Challenge Handling
The application accepts challenges as:
- Base64url encoded strings (tries `base64url.decode()` first)
- Plain text (falls back to `TextEncoder` if decode fails)

Both hardware and simulated modes handle this identically in their respective utility files.

### Cryptographic Operations
- **RS256**: RSASSA-PKCS1-v1_5 with SHA-256, 2048-bit modulus
- **ES256**: ECDSA with P-256 curve and SHA-256
- All operations use browser's SubtleCrypto API (no external crypto libraries)
- `crypto.subtle.importKey` is called via a bound alias typed as `any` to work around TS overload restrictions on `'jwk'` format

### Assertion Structure
Both modes produce similar outputs:
- `id` / `rawId`: Credential identifier
- `response.authenticatorData`: Includes RP ID hash, flags, sign counter
- `response.signature`: Signed over (authenticatorData + SHA-256(clientDataJSON))
- `response.clientDataJSON`: Contains type, challenge, origin

The simulated mode manually constructs these structures to match WebAuthn format.

## Browser Requirements

- **Hardware Mode**: WebAuthn support (Chrome/Firefox/Safari/Edge)
- **Simulated Mode**: SubtleCrypto API (all modern browsers)
- Both require `window.crypto.subtle` for cryptographic operations
- localStorage must be available and enabled
