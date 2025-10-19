# FIDO2 Credential Manager - Project Overview

## Purpose
FIDO2 Credential Manager is a browser-based testing client for FIDO2 server applications. It enables developers to test FIDO2/WebAuthn server implementations without requiring physical security keys by providing both hardware and simulated authentication modes.

## Key Features
- **Dual-Mode Authentication System**:
  - **Hardware API Mode**: Uses real authenticators via WebAuthn API (security keys, platform authenticators)
  - **Simulated Mode**: Internally generates cryptographic keys and signatures without hardware
- **Challenge Processing**: Accepts FIDO2 challenges from servers in base64url or plain text format
- **Credential Management**: Create, store, view, and manage credentials in localStorage
- **Key Generation**: Pre-generate RS256 or ES256 key pairs for testing
- **Assertion Generation**: Sign challenges with stored credentials to create FIDO2 assertions
- **Browser-based UI**: Built with React and Material-UI for easy interaction

## Use Case
This tool is designed for **development and testing** of FIDO2 server implementations. The simulated mode is NOT secure for production (stores private keys in localStorage) but is extremely useful for testing server-side FIDO2 logic without requiring hardware authenticators.

## Target Users
- Backend developers implementing FIDO2/WebAuthn servers
- QA engineers testing authentication flows
- Security researchers analyzing FIDO2 protocols
