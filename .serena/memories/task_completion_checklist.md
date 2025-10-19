# Task Completion Checklist

## Before Committing Code

When you complete a task that involves code changes, follow these steps:

### 1. Lint the Code
```bash
npm run lint
```
- Fix any linting errors reported by ESLint
- Ensure React Hooks rules are followed
- Check for unused variables (except uppercase constants)

### 2. Test the Build
```bash
npm run build
```
- Ensure production build completes successfully
- Check for any build warnings or errors
- Verify no TypeScript/JSX compilation issues

### 3. Manual Testing
Since this is a browser-based application with no automated tests:
- Run `npm run dev`
- Test both modes (Simulated and Hardware API)
- Verify localStorage operations work correctly
- Test the specific feature you modified

### 4. Review Changes
```bash
git status
git diff
```
- Review all changed files
- Ensure no unintended changes are included
- Check that no credentials or sensitive data are committed

## Code Quality Checks

### JavaScript/JSX Standards
- [ ] Components use function declarations (not arrow functions)
- [ ] Props are properly destructured
- [ ] Imports are organized (external first, internal second)
- [ ] JSDoc comments added for utility functions
- [ ] Async/await used for async operations

### React Best Practices
- [ ] State properly lifted to parent components
- [ ] Callbacks passed via props
- [ ] No direct state mutations
- [ ] useEffect dependencies are correct
- [ ] Components are properly exported (default for components)

### FIDO2 Specific
- [ ] Both simulated and hardware modes tested (if applicable)
- [ ] Challenge encoding/decoding handled correctly
- [ ] Cryptographic operations use SubtleCrypto API
- [ ] localStorage schema maintained correctly

## Optional (Recommended)

### Documentation
- [ ] Update CLAUDE.md if architecture changed
- [ ] Update README.md if user-facing features changed
- [ ] Add comments for complex logic

### Testing Scenarios
For credential operations:
- [ ] Create credential (simulated mode with RS256)
- [ ] Create credential (simulated mode with ES256)
- [ ] Create credential (hardware mode if available)
- [ ] Sign challenge with credential
- [ ] Delete credential
- [ ] Clear all data

For key generation:
- [ ] Generate standalone key (RS256)
- [ ] Generate standalone key (ES256)
- [ ] Use generated key in credential creation
- [ ] Verify key marked as "used"

## Git Workflow
```bash
git add .
git status                    # Verify staged files
git commit -m "descriptive message"
```

## When NOT to Run Tests
This project does not have automated tests (no test scripts in package.json), so:
- No need to run `npm test`
- Manual testing in browser is required instead
