# Dream Banking Application

Dream is a TypeScript-based banking/financial web application built with Microsoft Fast Elements and micro-frontend architecture. The application simulates a complete banking experience with accounts, transfers, loans, card management, KYC workflows, and financial health tracking.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Prerequisites and Setup
- Node.js 20+ and Yarn 1.22+ are required (already installed in most environments)
- All work is done in the `/app/` directory: `cd /home/runner/work/dream/dream/app`

### Essential Build and Test Commands
Run these commands in order for any fresh environment setup:

1. **Install dependencies**: `yarn install --frozen-lockfile` 
   - Takes ~12 seconds. Set timeout to 60 seconds minimum.
   
2. **Compile TypeScript**: `yarn tsc`
   - Takes ~3 seconds. Fast compilation check.
   
3. **Run tests**: `yarn test`
   - Takes ~1 second. 44 tests should pass. All repository and service tests.
   - NEVER CANCEL: Set timeout to 30+ seconds to be safe.
   
4. **Build application**: `yarn docker:build`
   - Takes <1 second. Builds production-ready assets in dist/ directory.

### Development Servers
The application has two development modes:

**Standard Development Server (Recommended)**:
```bash
yarn dev
```
- Runs on http://localhost:8001
- Full TypeScript compilation + esbuild watch mode
- Takes ~5 seconds to start
- NEVER CANCEL: Set timeout to 60+ seconds

**CLI Development Server (Alternative)**:
```bash
yarn dev:cli  
```
- Runs on http://localhost:8000
- Direct esbuild serve without TypeScript pre-compilation
- Faster startup but less robust

### Important Development Limitations
⚠️ **CDN Dependency Issue**: The development servers will show a blank page due to blocked CDN requests to jsdelivr.net for Microsoft Fast Elements. This is a known limitation in restricted environments. The application structure and builds work correctly, but the UI won't render due to external dependency blocking.

## Testing and Validation

### Running Tests
- **Unit tests**: `yarn test` - Comprehensive test suite covering repositories, services, and core banking operations
- **Watch mode**: `yarn test:watch` - Continuous testing during development
- All tests use mocked banking data and should pass consistently

### Manual Validation Scenarios
Since the UI may not render due to CDN blocking, validate changes by:

1. **Build validation**: Ensure `yarn docker:build` completes without errors
2. **Test validation**: All 44 tests in `yarn test` should pass
3. **TypeScript validation**: `yarn tsc` should compile without errors
4. **Code structure**: Check that new components follow existing patterns in `/src/widgets/`, `/src/workflows/`, or `/src/pages/`

### Docker Deployment
Build and test the Docker image (may fail in restricted environments):
```bash
docker build -t dream-wallet:test .
docker run -p 80:80 dream-wallet:test
```
Expected: Nginx serving the built application on port 80

## Codebase Navigation

### Key Directories and Files
```
/app/
├── src/
│   ├── widgets/           # UI widgets (account, financial-health, welcome, etc.)
│   ├── workflows/         # Business processes (transfer, loan, KYC, etc.)  
│   ├── pages/            # Main pages (dashboard, investments, savings)
│   ├── services/         # Business logic (user, widget, KYC services)
│   ├── repositories/     # Data access layer (account, card, product repos)
│   ├── components/       # Shared UI components
│   ├── utilities/        # Helper functions and utilities
│   └── main.ts          # Application entry point
├── tests/               # Vitest test files
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── build.mjs           # Production build script
├── develop.mjs         # Development server script
└── dockerfile          # Docker build configuration
```

### Architecture Overview
- **Micro-frontend**: Each widget/workflow is a separate module loaded dynamically
- **Web Components**: Built with Microsoft Fast Elements framework
- **Import Maps**: Uses ES module import maps for dynamic loading
- **State Management**: Repository pattern with local storage for demo data
- **Styling**: CSS custom properties with light/dark theme support

### Common Development Patterns

**Adding a new widget**:
1. Create in `/src/widgets/your-widget/`
2. Add entry point to `build.mjs` and `develop.mjs`
3. Register import map entry in `index.html`
4. Add tests in `/tests/widgets/`

**Adding a new workflow**:  
1. Create in `/src/workflows/your-workflow/`
2. Follow same pattern as existing workflows (transfer, loan, etc.)
3. Add to build entry points and import maps
4. Test the workflow end-to-end

**Modifying banking logic**:
- Account operations: `/src/repositories/account-repository.ts`
- Card management: `/src/repositories/card-repository.ts`
- Product catalog: `/src/repositories/product-repository.ts`
- Always add corresponding tests

## Frequent Tasks and Validations

### Before Making Changes
1. Run `yarn test` to establish baseline (should be 44 passing tests)
2. Run `yarn tsc` to check TypeScript compilation
3. Check existing functionality in relevant repository/service files

### After Making Changes  
1. **ALWAYS run** `yarn test` - ensure no tests are broken
2. **ALWAYS run** `yarn tsc` - ensure TypeScript compiles  
3. **ALWAYS run** `yarn docker:build` - ensure production build works
4. Check that new code follows existing patterns and naming conventions

### Working with Banking Features
- **Accounts**: Use AccountRepository for all account operations
- **Transfers**: Follow TransferWorkflow pattern for money movement
- **Cards**: CardRepository handles all card-related operations  
- **KYC**: KYCService manages know-your-customer workflows
- **Financial Health**: Uses AccountInsightsHelper for analysis

## Important Build Configuration
- **esbuild**: Primary build tool for fast compilation and bundling
- **Code Splitting**: Enabled for optimal loading performance
- **External Dependencies**: Microsoft Fast Elements and Chart.js loaded via CDN
- **Asset Loading**: Supports HTML, SVG, fonts, and other static assets
- **Production Optimization**: Minification, source maps, and tree shaking enabled

## Troubleshooting
- If development server shows blank page: This is expected due to CDN blocking, validate via builds and tests instead
- If tests fail: Check that you haven't modified core banking logic without updating tests  
- If TypeScript compilation fails: Check import paths and type definitions
- If Docker build fails: Often due to network restrictions, focus on local development

## Time Expectations and Timeouts
- **Dependency install**: ~12 seconds (use 60+ second timeout)
- **TypeScript compilation**: ~3 seconds (use 30+ second timeout)
- **Test execution**: ~1 second (use 30+ second timeout to be safe)
- **Production build**: <1 second (use 30+ second timeout)
- **Development server startup**: ~5 seconds (use 60+ second timeout)

**CRITICAL**: Never cancel builds or test runs early. Always wait for completion even if operations seem slow.