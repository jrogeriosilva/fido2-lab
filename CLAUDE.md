# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FIDO2 Credential Manager is a browser-based testing client for FIDO2 server applications. It operates in two modes:
- **Hardware API Mode**: Uses real authenticators via WebAuthn API
- **Simulated Mode**: Internally generates cryptographic keys and signatures without hardware

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (default: http://localhost:5174)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Architecture

### Dual-Mode System

The application's core architecture revolves around two parallel authentication paths:

1. **Hardware Path** (`src/utils/fido2Hardware.js`):
   - Wraps `navigator.credentials.create()` and `navigator.credentials.get()`
   - Handles WebAuthn API interactions
   - Returns credential metadata only (private keys remain in hardware)

2. **Simulated Path** (`src/utils/fido2Simulator.js`):
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

**`src/utils/crypto.js`**
- `base64url`: Encoding/decoding for FIDO2 format
- `generateRS256KeyPair()` / `generateES256KeyPair()`: SubtleCrypto key generation
- `signData()`: Creates signatures for assertions
- `importKey()` / `exportKey()`: JWK serialization for localStorage

**`src/utils/localStorage.js`**
- Two separate stores: `fido2_credentials` and `fido2_generated_keys`
- Credentials contain full key material (simulated) or metadata (hardware)
- Generated keys can be pre-created and marked as "used" when assigned to credentials

**`src/utils/fido2Simulator.js`**
- `createSimulatedCredential()`: Generates attestation objects without hardware
- `createSimulatedAssertion()`: Signs challenges using stored private keys
- Manually constructs: authenticatorData, clientDataJSON, rpIdHash (SHA-256)

**`src/utils/fido2Hardware.js`**
- `createCredential()`: Wraps WebAuthn registration
- `getAssertion()`: Wraps WebAuthn authentication
- Converts between WebAuthn format and application storage format

### Component Communication

**State Management Pattern**:
- `App.jsx` maintains global state: `challenge`, `mode`, `assertion`, `refreshKey`
- `refreshKey` is incremented to trigger re-fetching of credentials after creation/deletion
- Components use callbacks to propagate state changes upward

**Key Generator Integration**:
- `KeyGeneratorButton` creates standalone key pairs
- `CreateCredentialForm` can optionally consume these pre-generated keys
- When used, keys are marked as "used" in localStorage

### Theme Configuration

Dark theme with Material-UI customization in `App.jsx`:
- Background: `#0a1929` (deep blue)
- Paper surfaces: `#132f4c` with gradient overlay
- Primary: `#90caf9` (light blue)
- Hover effects: `translateY(-2px)` on Paper components
- All Paper components use `borderRadius: 2` and `elevation: 8`

### localStorage Schema

```javascript
// fido2_credentials
[{
  id: string,
  type: "simulated" | "hardware",
  algorithm: "RS256" | "ES256",
  credentialId: string,
  publicKeyJWK: object,      // JWK format
  privateKeyJWK: object,     // Only for simulated
  rpId: string,
  userId: string,
  userName: string,
  createdAt: ISO8601
}]

// fido2_generated_keys
[{
  id: string,
  algorithm: "RS256" | "ES256",
  publicKey: object,         // JWK format
  privateKey: object,        // JWK format
  createdAt: ISO8601,
  used: boolean
}]
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
