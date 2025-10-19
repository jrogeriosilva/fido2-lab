# Suggested Commands for Development

## Essential Commands

### Development
```bash
npm install          # Install dependencies (first time setup)
npm run dev          # Start development server (http://localhost:5174)
```

### Code Quality
```bash
npm run lint         # Run ESLint to check code quality
```

### Build & Deploy
```bash
npm run build        # Build production bundle (outputs to dist/)
npm run preview      # Preview production build locally
```

## Project Structure Commands

### File Navigation
```bash
ls src/              # List source files
ls src/components/   # List React components
ls src/utils/        # List utility modules
```

### File Search
```bash
grep -r "pattern" src/              # Search for pattern in source
find src/ -name "*.jsx"             # Find all JSX components
find src/ -name "*.js"              # Find all JavaScript utilities
```

## Git Commands
```bash
git status           # Check current changes
git add .            # Stage all changes
git commit -m "msg"  # Commit with message
git log --oneline    # View commit history
```

## Package Management
```bash
npm list             # List installed packages
npm outdated         # Check for outdated packages
npm update           # Update packages
```

## Development Workflow

### Starting Development
1. `npm install` (if dependencies changed)
2. `npm run dev`
3. Open browser to http://localhost:5174

### Before Committing
1. `npm run lint` (fix any linting errors)
2. `npm run build` (ensure production build works)
3. Test the application manually

## Environment
- **Node.js**: v14 or higher required
- **Browser**: Modern browser with WebAuthn support (Chrome, Firefox, Safari, Edge)
- **Platform**: Cross-platform (Linux, macOS, Windows)
