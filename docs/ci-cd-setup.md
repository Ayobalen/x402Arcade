# CI/CD Configuration Guide

This document describes the CI/CD pipeline configuration for x402Arcade.

## Overview

The CI/CD pipeline is configured using GitHub Actions and includes:

- **Lint checks** - ESLint for frontend and backend
- **Type checking** - TypeScript compilation verification
- **Unit tests** - Vitest (frontend) and Jest (backend)
- **Coverage tracking** - Codecov integration with flags
- **Build verification** - Production builds with bundle analysis
- **Performance budgets** - Automated bundle size checks

## Pipeline Structure

```
Setup (dependencies + caching)
  ├─> Lint (ESLint)
  ├─> Type Check (tsc --noEmit)
  ├─> Test Frontend (Vitest + Codecov)
  │   └─> Build Frontend (bundle size check)
  └─> Test Backend (Jest + Codecov)
      └─> Build Backend (artifact verification)
          └─> All Checks Passed (summary)
```

## Jobs

### 1. Setup Job

Installs dependencies and caches them for other jobs.

**Caching Strategy:**

- pnpm store directory
- node_modules directories
- Restore keys for cache fallback

**Outputs:**

- `cache-hit`: Whether dependencies were cached

### 2. Lint Job

Runs ESLint on frontend and backend codebases.

**Commands:**

```bash
pnpm lint:frontend  # packages/frontend
pnpm lint:backend   # packages/backend
```

**Fails on:**

- ESLint errors
- ESLint warnings configured as errors

### 3. Type Check Job

Runs TypeScript compiler in no-emit mode.

**Commands:**

```bash
tsc --noEmit --project packages/frontend/tsconfig.json
tsc --noEmit --project packages/backend/tsconfig.json
```

**Caching:**

- TypeScript build info (tsconfig.tsbuildinfo)

**Fails on:**

- Type errors
- Missing type definitions

### 4. Test Frontend Job

Runs unit tests for frontend with Vitest.

**Commands:**

```bash
pnpm test:ci:frontend
```

**Features:**

- Code coverage collection
- Codecov upload with `frontend` flag
- Artifacts: coverage reports, test results

**Coverage Targets:**

- Project: 75% (±2% threshold)
- Patch: 70% (±5% threshold)

### 5. Test Backend Job

Runs unit tests for backend with Jest.

**Commands:**

```bash
pnpm test:ci:backend
```

**Features:**

- Code coverage collection
- Codecov upload with `backend` flag
- Artifacts: coverage reports, test results

**Coverage Targets:**

- Project: 75% (±2% threshold)
- Patch: 70% (±5% threshold)

### 6. Build Frontend Job

Builds frontend for production and verifies output.

**Commands:**

```bash
pnpm build:frontend
```

**Verification Steps:**

1. Verify dist/ directory exists
2. Verify index.html exists
3. Calculate bundle sizes (JS, CSS)
4. Check against performance budgets
5. Generate build metrics report

**Performance Budgets:**

- Total JS: 500KB
- Total CSS: 50KB

**Artifacts:**

- Frontend build (dist/)
- Retention: 7 days

**Metrics Reported:**

- Total JS size vs budget
- Total CSS size vs budget
- Total build size
- File count
- Largest 5 JS bundles

### 7. Build Backend Job

Builds backend for production and verifies artifacts.

**Commands:**

```bash
pnpm build:backend
```

**Verification Steps:**

1. Verify dist/ directory exists
2. Count files in build output
3. Calculate total build size
4. Generate build metrics report

**Artifacts:**

- Backend build (dist/)
- Retention: 7 days

**Metrics Reported:**

- Total build size
- File count
- Largest 5 files

### 8. All Checks Passed Job

Summary job for branch protection rules.

**Purpose:**

- Single job to require in branch protection
- Generates pipeline results table
- Fails if any required job fails

**Required Jobs:**

- lint
- typecheck
- test-frontend
- test-backend
- build-frontend
- build-backend

## Codecov Integration

### Configuration

Coverage is configured in `codecov.yml` with:

**Status Checks:**

- Project coverage: 75% target, 2% threshold
- Patch coverage: 70% target, 5% threshold

**Flags:**

- `frontend`: packages/frontend/
- `backend`: packages/backend/

**PR Comments:**

- Layout: reach, diff, flags, files
- Behavior: default (comment on every commit)

### Setup Instructions

1. **Create Codecov Account:**
   - Visit https://codecov.io/
   - Sign in with GitHub
   - Add x402Arcade repository

2. **Get Codecov Token:**
   - Navigate to repository settings
   - Copy the upload token

3. **Add GitHub Secret:**

   ```
   Repository Settings → Secrets → Actions
   Name: CODECOV_TOKEN
   Value: <your-token>
   ```

4. **Verify Integration:**
   - Push a commit or open a PR
   - Check CI logs for "Upload coverage to Codecov" steps
   - Visit codecov.io dashboard for coverage reports

### Codecov Features

**Status Checks:**

- ✅ Pass if coverage meets targets
- ⚠️ Warning if within threshold
- ❌ Fail if below threshold

**PR Comments:**

- Coverage diff vs base branch
- File-by-file breakdown
- Impacted files list

**Dashboard:**

- Sunburst coverage visualization
- File tree with line-by-line coverage
- Historical coverage trends
- Flag-based coverage (frontend/backend)

## Performance Budgets

Bundle size budgets are enforced during the frontend build job.

**Budgets:**

```
Total JS:  500KB
Total CSS: 50KB
```

**Actions on Budget Violation:**

- ⚠️ Warning printed to console
- ⚠️ Warning in build metrics summary
- ✅ Build continues (soft limit)

**To Make Strict:**
Change `build-frontend` job to fail on budget violation:

```yaml
- name: Check bundle size
  run: |
    # ... calculate sizes ...
    if [ "$js_kb" -gt 500 ]; then
      echo "Error: JS bundle exceeds budget!"
      exit 1
    fi
```

## Branch Protection Rules

Recommended branch protection for `main` and `develop`:

1. **Required Status Checks:**
   - ✅ All Checks Passed

2. **Settings:**
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings

3. **Optional:**
   - Require pull request reviews (1+ approvals)
   - Dismiss stale reviews when new commits are pushed

## Caching Strategy

**pnpm Store:**

- Key: `pnpm-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}`
- Restore keys: `pnpm-${{ runner.os }}-`

**node_modules:**

- Key: `node-modules-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}`
- Saves after setup job
- Restored in all dependent jobs

**TypeScript Build Info:**

- Key: `tsc-${{ runner.os }}-${{ hashFiles('**/tsconfig.json') }}-${{ github.sha }}`
- Restore keys: `tsc-${{ runner.os }}-${{ hashFiles('**/tsconfig.json') }}-`
- Speeds up incremental type checking

## Optimization Tips

### Parallel Execution

Jobs run in parallel where possible:

```
Setup
 ├─> Lint ──────┐
 ├─> TypeCheck ─┤
 └──────────────┴─> Tests ─> Builds ─> Summary
```

### Cache Hit Rate

Monitor cache effectiveness:

- Check "Restore pnpm store" logs
- Look for "Cache restored successfully" messages
- Low hit rate = review cache keys

### Artifact Size

Keep artifacts small:

- Coverage: ~1-5MB
- Frontend build: ~2-10MB
- Backend build: ~500KB-2MB

### Secrets Management

Required secrets:

- `CODECOV_TOKEN` - For coverage uploads
- (Optional) `GITHUB_TOKEN` - Automatically provided

## Troubleshooting

### Coverage Upload Fails

**Symptom:** Codecov step fails with "Error: Codecov token not found"

**Solution:**

1. Verify CODECOV_TOKEN secret is set
2. Check token has correct permissions
3. Ensure repository is added to Codecov

### Build Size Check False Positive

**Symptom:** Bundle size warning but files look reasonable

**Solution:**

- Check if source maps are included in bundle
- Review vite.config.ts `build.rollupOptions`
- Use `npm run build -- --mode production`

### Cache Not Restoring

**Symptom:** "Cache not found" in every run

**Solution:**

1. Check if pnpm-lock.yaml is committed
2. Verify cache key matches across jobs
3. Review GitHub Actions cache limits (10GB total)

### Type Check Intermittent Failures

**Symptom:** Type check passes locally but fails in CI

**Solution:**

- Clear local TypeScript cache: `rm -rf packages/*/tsconfig.tsbuildinfo`
- Ensure all dependencies are in pnpm-lock.yaml
- Check for different TypeScript versions

## Local Testing

Test CI pipeline locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or see: https://github.com/nektos/act#installation

# Run workflow locally
act push

# Run specific job
act -j lint
act -j typecheck
act -j test-frontend

# With secrets
act -s CODECOV_TOKEN=<token>
```

**Note:** Some features may not work identically in act (e.g., artifacts, caching).

## Metrics & Monitoring

**GitHub Actions:**

- Workflow run history
- Job execution times
- Cache hit rates
- Artifact sizes

**Codecov Dashboard:**

- Coverage trends over time
- Coverage by flag (frontend/backend)
- File-level coverage heatmap
- Pull request impact

**Build Metrics (in PR summary):**

- Bundle sizes vs budgets
- File counts
- Largest bundles

## Future Enhancements

**Planned:**

- [ ] E2E tests with Playwright in CI
- [ ] Lighthouse CI for performance audits
- [ ] Visual regression testing (Chromatic)
- [ ] Dependency vulnerability scanning
- [ ] Automated dependency updates (Renovate/Dependabot)
- [ ] Docker image builds and pushes
- [ ] Deployment to staging/production

**Under Consideration:**

- [ ] Bundle analysis reports (webpack-bundle-analyzer)
- [ ] Code quality metrics (SonarQube)
- [ ] Security scanning (Snyk, CodeQL)
- [ ] Performance budgets for runtime metrics
