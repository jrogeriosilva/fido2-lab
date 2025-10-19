# Architecture Overview

## Dual-Mode System Architecture

The application's core design revolves around two parallel authentication paths that produce compatible FIDO2 output:

### 1. Hardware Path (`src/utils/fido2Hardware.js`)
- Wraps `navigator.credentials.create()` and `navigator.credentials.get()`
- Delegates to browser's WebAuthn API
- Private keys remain in hardware (security keys, TPM, TouchID, etc.)
- Returns credential metadata only for storage
- Requires real authenticator hardware

### 2. Simulated Path (`src/utils/fido2Simulator.js`)
- Manually constructs FIDO2 data structures
- Uses SubtleCrypto API for key generation (RS256/ES256)
- Stores complete credentials including private keys in localStorage
- No hardware required - fully software-based
- Useful for testing server implementations

## Data Flow

```
Challenge Input (from server)
        ↓
Mode Selection (hardware/simulated)
        ↓
Credential Creation OR Assertion Generation
        ↓
localStorage Persistence (credentials + keys)
        ↓
Output FIDO2 Response (to server)
```

## Component Architecture

### State Management
- **Root State** (`App.jsx`):
  - `challenge`: Current FIDO2 challenge input
  - `mode`: "simulated" or "hardware"
  - `assertion`: Generated assertion data
  - `refreshKey`: Counter to trigger credential list refresh

- **Pattern**: State lifted to parent, callbacks passed to children
- **Refresh Mechanism**: `refreshKey` incremented after create/delete operations

### Component Hierarchy

```
App.jsx (root)
├── ChallengeInput.jsx (challenge text input)
├── ModeSelector.jsx (hardware/simulated toggle)
├── KeyGeneratorButton.jsx (pre-generate key pairs)
├── CreateCredentialForm.jsx (credential creation)
├── CredentialManager.jsx (list/manage credentials)
├── SigningPanel.jsx (select credential, create assertion)
└── AssertionDisplay.jsx (collapsible assertion output)
```

## Core Utilities

### `src/utils/crypto.js`
**Purpose**: Low-level cryptographic operations

Key Functions:
- `base64url`: Encoding/decoding for FIDO2 format
- `generateRS256KeyPair()`: Create RSA 2048-bit key pair
- `generateES256KeyPair()`: Create ECDSA P-256 key pair
- `signData()`: Sign data with private key
- `importKey()` / `exportKey()`: JWK serialization for localStorage
- `jwkToCOSE()`: Convert JWK to COSE format (FIDO2 requirement)

### `src/utils/localStorage.js`
**Purpose**: Data persistence layer

Two Stores:
1. **`fido2_credentials`**: Stores credentials with metadata and keys
2. **`fido2_generated_keys`**: Stores pre-generated key pairs

Key Functions:
- `getCredentials()` / `saveCredential()` / `deleteCredential()`
- `getGeneratedKeys()` / `saveGeneratedKey()` / `deleteGeneratedKey()`
- `markKeyAsUsed()`: Mark pre-generated key as consumed
- `clearAllCredentials()` / `clearAllGeneratedKeys()`
- `exportAllData()` / `importData()`: Backup/restore

### `src/utils/fido2Simulator.js`
**Purpose**: Software-based FIDO2 implementation

Key Functions:
- `createSimulatedCredential()`: Generate attestation without hardware
- `createSimulatedAssertion()`: Sign challenges with stored private keys
- Manually constructs: authenticatorData, clientDataJSON, rpIdHash (SHA-256)

### `src/utils/fido2Hardware.js`
**Purpose**: WebAuthn API wrapper

Key Functions:
- `createCredential()`: Wrap WebAuthn registration
- `getAssertion()`: Wrap WebAuthn authentication
- Convert between WebAuthn format and application storage format

## Data Schemas

### Credential Schema
```javascript
{
  id: string,                    // Unique ID
  type: "simulated" | "hardware",
  algorithm: "RS256" | "ES256",
  credentialId: string,          // FIDO2 credential ID
  publicKeyJWK: object,          // JWK format
  privateKeyJWK: object,         // Only for simulated
  rpId: string,                  // Relying Party ID
  userId: string,                // User ID
  userName: string,              // User name
  createdAt: ISO8601             // Timestamp
}
```

### Generated Key Schema
```javascript
{
  id: string,                    // Unique ID
  algorithm: "RS256" | "ES256",
  publicKey: object,             // JWK format
  privateKey: object,            // JWK format
  createdAt: ISO8601,            // Timestamp
  used: boolean                  // Marked when consumed
}
```

## Key Integration Points

### Key Generator → Credential Creation
1. `KeyGeneratorButton` creates standalone key pairs
2. `CreateCredentialForm` can optionally consume pre-generated keys
3. When used, keys are marked as "used" via `markKeyAsUsed()`

### Challenge Handling
Both modes handle challenges identically:
1. Try `base64url.decode()` first (assumes base64url encoding)
2. Fall back to `TextEncoder` if decode fails (plain text)

## Theme Configuration

Dark theme with Material-UI customization in `App.jsx`:
- Background: `#0a1929` (deep blue)
- Paper surfaces: `#132f4c` with gradient overlay
- Primary: `#90caf9` (light blue)
- Hover effects: `translateY(-2px)` on Paper components
- All Paper components: `borderRadius: 2`, `elevation: 8`
