# Codebase Structure

## Root Directory
```
/home/jrogerio/open-finance/fido2lab/
├── src/                    # Source code
├── public/                 # Static assets
├── node_modules/           # Dependencies
├── .github/                # GitHub workflows/config
├── .git/                   # Git repository
├── .claude/                # Claude Code configuration
├── .serena/                # Serena MCP server data
├── package.json            # NPM dependencies and scripts
├── package-lock.json       # Locked dependency versions
├── vite.config.js          # Vite build configuration
├── eslint.config.js        # ESLint linting rules
├── index.html              # HTML entry point
├── CLAUDE.md               # Claude Code project instructions
├── README.md               # Project documentation
└── .gitignore              # Git ignore patterns
```

## Source Directory (`src/`)

### Entry Points
- **`main.jsx`**: React application entry point
  - Mounts React app to DOM
  - Imports global CSS

- **`App.jsx`**: Root React component
  - Global state management
  - Theme configuration
  - Component composition

### Components (`src/components/`)
All React UI components:

- **`ChallengeInput.jsx`**: Text input for FIDO2 challenge
- **`ModeSelector.jsx`**: Radio buttons for hardware/simulated mode
- **`KeyGeneratorButton.jsx`**: Pre-generate key pairs with display
- **`CreateCredentialForm.jsx`**: Form to create new credentials
- **`CredentialManager.jsx`**: List and manage stored credentials
- **`SigningPanel.jsx`**: Select credential and create assertions
- **`AssertionDisplay.jsx`**: Collapsible display of generated assertions
- **`JsonDisplay.jsx`**: JSON formatting and display component
- **`SettingsDialog.jsx`**: Settings/configuration dialog

### Utilities (`src/utils/`)
Pure JavaScript utility modules:

- **`crypto.js`**: Cryptographic operations
  - Key generation (RS256, ES256)
  - Signing and verification
  - Base64url encoding/decoding
  - JWK/COSE conversions

- **`localStorage.js`**: Data persistence
  - Credential CRUD operations
  - Generated key management
  - Data export/import

- **`fido2Simulator.js`**: Simulated FIDO2 implementation
  - Software-based credential creation
  - Assertion generation without hardware
  - FIDO2 data structure construction

- **`fido2Hardware.js`**: WebAuthn API wrapper
  - Hardware-based credential creation
  - Real authenticator integration
  - Format conversions

### Assets (`src/assets/`)
- **`react.svg`**: React logo

### Styles
- **`App.css`**: Component-specific styles for App
- **`index.css`**: Global styles

## Build Output
- **`dist/`**: Production build output (gitignored)
- **`dist-ssr/`**: Server-side rendering build (gitignored)

## Configuration Files

### Build & Development
- **`vite.config.js`**: Vite bundler configuration
  - React plugin enabled
  - Default settings (no custom config)

### Code Quality
- **`eslint.config.js`**: ESLint linting rules
  - React Hooks plugin
  - React Refresh plugin
  - ECMAScript 2020 target
  - Custom rule: ignore unused uppercase variables

### Package Management
- **`package.json`**: Dependencies and scripts
  - Runtime: React, MUI, cbor-x, Prism
  - Dev: Vite, ESLint, TypeScript types

### Version Control
- **`.gitignore`**: Excludes node_modules, dist, logs, IDE files, .github

## File Count Summary
- **Components**: 9 JSX files
- **Utilities**: 4 JS files
- **Config files**: 4 files
- **Entry points**: 2 files (main.jsx, index.html)

## Import Patterns

### Component Imports
```javascript
// External dependencies first
import { TextField } from '@mui/material';

// Internal utilities second
import { generateRS256KeyPair } from '../utils/crypto';
```

### Utility Exports
```javascript
// Named exports for utilities
export const base64url = { ... };
export const generateRS256KeyPair = async () => { ... };
```

### Component Exports
```javascript
// Default export for components
export default ChallengeInput;
```

## Key Directories Not in Repo
- **`node_modules/`**: NPM packages (install with `npm install`)
- **`dist/`**: Build output (created by `npm run build`)
- **`.github/`**: Ignored in .gitignore
