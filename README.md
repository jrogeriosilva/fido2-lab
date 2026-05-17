# FIDO2 Lab

A browser-based testing client for FIDO2 server applications. Test registration and authentication flows using real hardware authenticators or fully simulated credentials — no hardware required.

## Features

- **Dual Mode**: Switch between Simulated (SubtleCrypto) and Hardware (WebAuthn API) at any time via the header dropdown
- **Create Credential**: Register new FIDO2 credentials with configurable RP, user, and algorithm settings
- **Sign / Assert**: Select a stored credential and sign a challenge to produce a WebAuthn assertion
- **Key Generator**: Pre-generate ES256 or RS256 key pairs for reuse across credential creation
- **Base64 Tool**: Encode/decode base64url strings inline
- **Attestation Decoder**: Parse and inspect CBOR attestation objects
- **Credential Manager**: View, inspect, and delete stored credentials from localStorage

## Technology Stack

- **React 19** with Vite 7 and **TypeScript** (strict mode)
- **Tailwind v4** (CSS-first, tokens defined in `src/index.css` via `@theme`)
- **`@base-ui-components/react`** — headless UI primitives
- **`class-variance-authority`** + `clsx` + `tailwind-merge` — variant and class utilities
- **`lucide-react`** — icons
- **`cbor-x`** — CBOR encoding/decoding for attestation objects
- **`shiki`** — syntax highlighting in the code viewer
- **SubtleCrypto API** — all cryptographic operations (no external crypto libraries)
- **localStorage** — credential and key persistence
- **WebAuthn API** — hardware authenticator support

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application starts at `http://localhost:5173`.

### Build

```bash
npm run build   # tsc -b && vite build
npm run preview # preview the production build
npm run lint    # run ESLint
```

## How to Use

### 1. Select a Mode

Use the dropdown in the header to choose:

- **Simulated** — no hardware needed; keys are generated and stored in localStorage via SubtleCrypto
- **Hardware (WebAuthn)** — delegates to `navigator.credentials` and your system authenticator

### 2. Create a Credential

Go to **Create Credential** and fill in:

| Field | Description |
|---|---|
| User ID | Unique identifier for the user |
| User Name | Human-readable username |
| User Display Name | Display name shown to the user |
| RP ID | Relying Party domain (e.g. `localhost`) |
| RP Name | Human-readable RP name |
| Algorithm | ES256 or RS256 (simulated only) |
| Challenge | Base64url or plain-text challenge from your server |

Optionally select a pre-generated key pair from the **Credentials → Key Generator** tab.

Click **Create Credential**. The credential is stored in localStorage and its registration response is displayed.

### 3. Sign a Challenge

Go to **Sign / Assert**, paste the authentication challenge from your server, select a stored credential, and click **Sign**. The assertion response is displayed with per-field copy buttons.

### 4. Utilities

| Tab | Purpose |
|---|---|
| Base64 Tool | Encode or decode base64url strings |
| Attestation Decoder | Paste a base64url attestation object to inspect its CBOR structure |
| Credentials | View stored credentials and pre-generated keys; delete individual entries |

## Supported Algorithms

| Algorithm | Details |
|---|---|
| **ES256** | ECDSA with P-256 curve and SHA-256 |
| **RS256** | RSASSA-PKCS1-v1_5 with SHA-256, 2048-bit modulus |

## Architecture

### Components (`src/components/`)

| File | Role |
|---|---|
| `App.tsx` | Root layout, tab navigation, mode dropdown, global state |
| `CreateCredentialForm.tsx` | Registration form for simulated and hardware credentials |
| `SigningPanel.tsx` | Credential selector and assertion trigger |
| `AssertionDisplay.tsx` | Structured display of the assertion response |
| `KeyGeneratorButton.tsx` | Standalone key-pair generator |
| `CredentialManager.tsx` | List and delete stored credentials |
| `Base64Decoder.tsx` | Encode/decode base64url |
| `AttestationObjectDecoder.tsx` | CBOR attestation object inspector |

### UI Primitives (`src/components/ui/`)

Shadcn-style primitives — do not replace with external component libraries.

| File | Description |
|---|---|
| `button.tsx` | `cva` Button — variants: `default \| outline \| secondary \| ghost \| destructive \| link`; sizes: `xs \| sm \| default \| lg \| icon \| icon-xs \| icon-sm \| icon-lg` |
| `badge.tsx` | Pill badge — variants: `default \| secondary \| destructive \| warning \| outline \| ghost \| link` |
| `textarea.tsx` | Auto-grow textarea (max 320 px), monospace |
| `copy-button.tsx` | Copy → check feedback for 1500 ms |
| `json-tree.tsx` | Recursive JSON tree with One-Dark colors, expand/collapse, per-node copy |
| `code-block.tsx` | Shiki-powered syntax-highlighted code block |
| `code-editor.tsx` | Editable code area with syntax highlighting |

### Utilities (`src/utils/`)

| File | Description |
|---|---|
| `crypto.ts` | `base64url`, `generateRS256KeyPair`, `generateES256KeyPair`, `signData`, `importKey`, `exportKey`, `jwkToCOSE` |
| `localStorage.ts` | `StoredCredential` and `GeneratedKey` CRUD; keys `fido2_credentials` and `fido2_generated_keys` |
| `fido2Simulator.ts` | `createSimulatedCredential`, `createSimulatedAssertion` — manually constructs WebAuthn structures |
| `fido2Hardware.ts` | `createCredential`, `getAssertion`, `isWebAuthnSupported` — thin WebAuthn API wrappers |
| `attestationParser.ts` | `parseAttestationObject` — decodes base64url CBOR attestation objects |

### Data Flow

```
Challenge + Mode
       │
       ▼
CreateCredentialForm ──► fido2Simulator / fido2Hardware
                                  │
                         localStorage (fido2_credentials)
                                  │
                                  ▼
SigningPanel ──► createSimulatedAssertion / getAssertion ──► AssertionDisplay
```

## localStorage Schema

```typescript
// key: "fido2_credentials"
interface StoredCredential {
  id: string
  type: 'simulated' | 'hardware'
  algorithm: string           // 'RS256' | 'ES256'
  credentialId: string
  publicKeyJWK?: JsonWebKey
  privateKeyJWK?: JsonWebKey  // simulated only
  response?: Record<string, unknown>
  rpId: string
  rpName?: string
  userId: string
  userName?: string
  userDisplayName?: string
  createdAt: string           // ISO 8601
}

// key: "fido2_generated_keys"
interface GeneratedKey {
  id: string
  algorithm: string           // 'RS256' | 'ES256'
  publicKey: JsonWebKey
  privateKey: JsonWebKey
  createdAt: string           // ISO 8601
  used: boolean
}
```

## Testing Your FIDO2 Server

**Registration flow**

1. Get a registration challenge from your server
2. Paste it into Create Credential → Challenge field
3. Fill in user and RP details, click **Create Credential**
4. Copy the credential response and send it to your server's registration endpoint

**Authentication flow**

1. Get an authentication challenge from your server
2. Go to **Sign / Assert**, paste the challenge
3. Select the stored credential, click **Sign**
4. Copy the assertion response and send it to your server's authentication endpoint

## Browser Requirements

- **Hardware Mode**: WebAuthn support (Chrome, Firefox, Safari, Edge)
- **Simulated Mode**: SubtleCrypto API — any modern browser
- localStorage must be available

## Security Notes

This is a **development and testing tool**. Simulated mode stores private keys in localStorage, which is not appropriate for production use. Always use real hardware authenticators in production.

## License

MIT
