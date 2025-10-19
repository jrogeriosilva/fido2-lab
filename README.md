# FIDO2 Credential Manager

A testing client for FIDO2 server applications built with React, Vite, and Material-UI. This application allows you to create and test FIDO2 credentials using either real hardware authenticators or simulated credentials.

## Features

- **Challenge Input**: Input FIDO2 challenges from your server (base64url or plain text)
- **Dual Mode Support**:
  - **Hardware API Mode**: Use real hardware authenticators (security keys, platform authenticators)
  - **Simulated Mode**: Create simulated credentials without hardware using cryptographic keys
- **Key Generator**: Pre-generate RS256 or ES256 key pairs for simulated credentials
- **Credential Management**: Store, view, and manage credentials in localStorage
- **Assertion Generation**: Sign challenges with stored credentials to create FIDO2 assertions
- **Collapsible Assertion Display**: View generated assertions with copy-to-clipboard functionality

## Technology Stack

- **React 18** with Vite
- **Material-UI (MUI) v5** for UI components
- **SubtleCrypto API** for cryptographic operations
- **localStorage** for credential persistence
- **Native WebAuthn API** for hardware authenticator support

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5174/` (or another port if 5174 is in use).

### Build

```bash
npm run build
```

## How to Use

### 1. Enter a Challenge

Paste your FIDO2 challenge in the "Challenge Input" field. The challenge can be:
- Base64url encoded string
- Plain text string

### 2. Select Mode

Choose between:
- **Simulated**: No hardware required, uses generated cryptographic keys
- **Hardware API**: Uses real authenticators connected to your system

### 3. Generate Keys (Simulated Mode Only)

In simulated mode, you can pre-generate key pairs:
1. Select algorithm (ES256 or RS256)
2. Click "Generate Key Pair"
3. View generated keys by clicking "Show Generated Keys"

### 4. Create Credential

Fill in the credential details:
- User ID
- User Name
- User Display Name
- RP ID (Relying Party ID)
- RP Name
- Algorithm (simulated mode only)

Optionally use a pre-generated key pair (if available).

Click "Create Credential" to generate and store the credential.

### 5. Sign Challenge

1. Select a stored credential from the dropdown
2. Click "Sign Challenge (Create Assertion)"
3. The assertion will be generated and displayed in a collapsible section

### 6. View Assertion

The generated assertion includes:
- Credential ID
- Raw ID (base64url)
- Authenticator Data
- Signature
- Client Data JSON (both encoded and decoded)
- User Handle

Each field has a copy button for easy clipboard access.

## Supported Algorithms

- **ES256** (ECDSA P-256): Elliptic curve digital signature algorithm
- **RS256** (RSA 2048): RSA signature with SHA-256

## Architecture

### Components

- `App.jsx` - Main application container
- `ChallengeInput.jsx` - Challenge text input
- `ModeSelector.jsx` - Hardware/Simulated mode toggle
- `KeyGeneratorButton.jsx` - Key pair generator with display
- `CredentialManager.jsx` - List and manage stored credentials
- `CreateCredentialForm.jsx` - Form to create new credentials
- `SigningPanel.jsx` - Select credential and create assertions
- `AssertionDisplay.jsx` - Collapsible assertion display

### Utilities

- `crypto.js` - Cryptographic operations (key generation, signing, encoding)
- `localStorage.js` - Storage management for credentials and keys
- `fido2Hardware.js` - WebAuthn API wrapper for hardware authenticators
- `fido2Simulator.js` - Simulated FIDO2 credential creation and signing

## Data Storage

All data is stored in browser localStorage:

- **Credentials**: FIDO2 credentials with public/private keys (simulated) or metadata (hardware)
- **Generated Keys**: Pre-generated key pairs for simulated mode

To clear all data, use the "Clear All" button in the Credential Manager section.

## Testing Your FIDO2 Server

1. Get a registration challenge from your server
2. Paste it into the Challenge Input
3. Create a credential (simulated or hardware)
4. Send the credential response to your server
5. Get an authentication challenge from your server
6. Paste it into the Challenge Input
7. Sign the challenge with your stored credential
8. Send the assertion response to your server

## Browser Compatibility

- **Hardware Mode**: Requires a browser with WebAuthn support (Chrome, Firefox, Safari, Edge)
- **Simulated Mode**: Works in any modern browser with SubtleCrypto API support

## Security Notes

This is a **testing tool** designed for development and testing of FIDO2 servers. The simulated mode stores private keys in localStorage, which is not secure for production use.

For production applications, always use real hardware authenticators.

## License

MIT
