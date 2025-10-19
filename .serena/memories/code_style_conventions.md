# Code Style and Conventions

## File Organization
- **Components**: `src/components/*.jsx` - React components
- **Utilities**: `src/utils/*.js` - Pure JavaScript utility modules
- **Assets**: `src/assets/` - Static resources
- **Entry Point**: `src/main.jsx` - React app entry
- **Root Component**: `src/App.jsx` - Main application container

## Naming Conventions

### Files
- **Components**: PascalCase with `.jsx` extension (e.g., `ChallengeInput.jsx`)
- **Utilities**: camelCase with `.js` extension (e.g., `fido2Simulator.js`)
- **Config files**: lowercase with dots (e.g., `vite.config.js`, `eslint.config.js`)

### Code
- **Components**: PascalCase function declarations (e.g., `function ModeSelector() {}`)
- **Functions**: camelCase (e.g., `generateRS256KeyPair`, `saveCredential`)
- **Variables**: camelCase (e.g., `challenge`, `mode`, `credentialId`)
- **Constants**: UPPER_SNAKE_CASE for objects (e.g., `STORAGE_KEYS`)
- **Exports**: Named exports for utilities, default export for components

## Component Patterns

### Functional Components
- Use function declarations, not arrow functions for components
- Export default at the end of the file
- Props are destructured in function parameters

Example:
```javascript
function ChallengeInput({ challenge, onChange }) {
  return (
    <TextField
      value={challenge}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default ChallengeInput;
```

### State Management
- Use React hooks (`useState`, `useEffect`)
- State is lifted to parent components (typically `App.jsx`)
- Child components receive callbacks via props (e.g., `onChange`, `onCredentialCreated`)

## Code Documentation

### JSDoc Comments
- Utility functions have JSDoc comments with types
- Include `@param` and `@returns` tags
- Example:
```javascript
/**
 * Generate ES256 key pair
 * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
 */
export const generateES256KeyPair = async () => { ... }
```

### File-level Comments
- Utility files have brief description at the top
- Example: `// Crypto utilities for FIDO2 key generation and signing`

## Import Organization
- External dependencies first (React, MUI, etc.)
- Internal utilities second
- Blank line between groups

Example:
```javascript
import { TextField } from '@mui/material';
import { generateRS256KeyPair } from '../utils/crypto';
```

## Async/Await
- Use `async/await` instead of `.then()` chains
- All cryptographic operations are async

## ESLint Rules
- **no-unused-vars**: Error, but ignores uppercase variables (constants)
- **React Hooks**: Uses recommended rules from `eslint-plugin-react-hooks`
- **React Refresh**: Vite-specific rules for Fast Refresh
- **ECMAVersion**: 2020/latest
- **Source Type**: ES modules

## Code Style
- **Semicolons**: Not consistently used (project is mixed)
- **Quotes**: Single quotes preferred for strings
- **Indentation**: 2 spaces (typical React/Vite default)
- **Arrow Functions**: Used for inline callbacks, regular functions for top-level
- **Template Literals**: Used for string interpolation
