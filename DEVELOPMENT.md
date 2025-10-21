# Development Environment Setup

This document ensures consistent development environments across local machines and CI/CD.

## Environment Alignment Strategy

### 1. Node.js Version
- **Local**: Use `.nvmrc` file to lock Node.js version
- **CI/CD**: GitHub Actions reads from `.nvmrc` automatically
- **Current**: Node.js 20.x

```bash
# Install correct Node version locally
nvm use  # or nvm install && nvm use
```

### 2. Package Versions
- **Strategy**: Exact version pinning for all dev dependencies
- **Lock file**: `package-lock.json` ensures identical installs
- **CI**: Uses `npm ci` for faster, reliable installs

### 3. Linting & Code Quality
- **ESLint**: Exact version `9.36.0`
- **TypeScript**: Exact version `5.9.3`
- **Pre-commit**: Run `npm run pre-commit` before pushing

### 4. Build Consistency
- **Local**: `npm run build`
- **CI**: Same command, same result
- **Output**: `dist/` folder with identical contents

## Commands

### Development
```bash
npm run dev          # Start development server
npm run lint         # Check code quality
npm run lint:fix     # Auto-fix linting issues
npm run test:run     # Run unit tests
npm run build        # Build for production
npm run pre-commit   # Run all checks before commit
```

### CI/CD Pipeline
1. **Checkout code**
2. **Setup Node.js** (from `.nvmrc`)
3. **Install dependencies** (`npm ci`)
4. **Run linting** (`npm run lint`)
5. **Run tests** (`npm run test:run`)
6. **Build** (`npm run build`)
7. **Deploy** (on main branch)

## Troubleshooting

### Local vs CI Differences
If you see different behavior locally vs CI:

1. **Check Node version**: `node --version` should match `.nvmrc`
2. **Reinstall dependencies**: `rm -rf node_modules package-lock.json && npm install`
3. **Run pre-commit**: `npm run pre-commit` to simulate CI locally
4. **Check exact versions**: All dev dependencies use exact versions (no `^` or `~`)

### Common Issues
- **ESLint errors**: Run `npm run lint:fix` to auto-fix
- **TypeScript errors**: Check for missing imports or type definitions
- **Build failures**: Ensure all dependencies are properly installed

## Best Practices

1. **Always use exact versions** for dev dependencies
2. **Run pre-commit checks** before pushing
3. **Keep `.nvmrc` updated** when changing Node versions
4. **Use `npm ci`** in CI environments
5. **Lock all tool versions** to prevent drift
