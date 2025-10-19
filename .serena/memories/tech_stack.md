# Technology Stack

## Frontend Framework
- **React 19.1.1**: Component-based UI library
- **Vite 7.1.7**: Build tool and dev server (fast HMR, ES modules)
- **ES Modules**: Modern JavaScript module system

## UI Library
- **Material-UI (MUI) v7**: 
  - `@mui/material`: Core components
  - `@mui/icons-material`: Icon library
  - `@emotion/react` & `@emotion/styled`: CSS-in-JS styling engine

## Cryptography
- **SubtleCrypto API**: Browser's native cryptographic operations
  - RS256 (RSASSA-PKCS1-v1_5 with SHA-256, 2048-bit modulus)
  - ES256 (ECDSA with P-256 curve and SHA-256)
- **WebAuthn API**: Native browser API for hardware authenticators
- **cbor-x**: CBOR encoding/decoding for FIDO2 data structures

## Code Display
- **Prism.js**: Syntax highlighting
- **react-syntax-highlighter**: React wrapper for syntax highlighting
- **react-simple-code-editor**: Code editor component

## Storage
- **localStorage**: Browser storage for credentials and generated keys
  - Two stores: `fido2_credentials` and `fido2_generated_keys`

## Development Tools
- **ESLint 9.36.0**: Linting with React-specific plugins
  - `eslint-plugin-react-hooks`: React Hooks linting
  - `eslint-plugin-react-refresh`: Fast Refresh validation
- **Vite Plugin React**: JSX transformation and Fast Refresh

## Language
- **JavaScript (ES2020+)**: Modern JavaScript with JSX
- **TypeScript types**: Type definitions for React (@types/react, @types/react-dom)

## Browser APIs Used
- `navigator.credentials`: WebAuthn API
- `crypto.subtle`: Cryptographic operations
- `localStorage`: Data persistence
- `window.crypto.getRandomValues`: Random number generation
