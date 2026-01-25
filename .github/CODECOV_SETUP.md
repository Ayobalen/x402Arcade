# Codecov Integration Setup

Quick reference guide for setting up Codecov integration.

## Prerequisites

- GitHub repository access (admin)
- Codecov account linked to GitHub

## Setup Steps

### 1. Create Codecov Account

1. Visit https://codecov.io/
2. Click "Sign Up" or "Login"
3. Choose "Sign in with GitHub"
4. Authorize Codecov to access your GitHub account

### 2. Add Repository to Codecov

1. After login, go to https://codecov.io/gh
2. Find "x402Arcade" in the repository list
3. Click "Setup Repo" if not already configured
4. Codecov will provide an upload token

### 3. Add CODECOV_TOKEN to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click "New repository secret"
4. Add secret:
   - **Name:** `CODECOV_TOKEN`
   - **Value:** `<paste-token-from-codecov>`
5. Click "Add secret"

### 4. Verify Integration

1. Push a commit or open a pull request
2. Check GitHub Actions workflow runs
3. Look for "Upload coverage to Codecov" steps in:
   - Test Frontend job
   - Test Backend job
4. Visit Codecov dashboard to see coverage reports

## Configuration

Coverage configuration is in `codecov.yml` at the repository root.

**Key Settings:**

```yaml
coverage:
  status:
    project:
      target: 75% # Overall coverage target
    patch:
      target: 70% # Coverage for new code

flags:
  frontend: packages/frontend/
  backend: packages/backend/
```

## Codecov Features

### Status Checks

Codecov adds status checks to pull requests:

- ✅ **Pass:** Coverage meets targets
- ⚠️ **Warning:** Coverage within threshold
- ❌ **Fail:** Coverage below threshold

### PR Comments

Codecov automatically comments on PRs with:

- Coverage diff vs base branch
- File-by-file coverage changes
- List of impacted files
- Links to detailed coverage reports

### Dashboard

Visit https://codecov.io/gh/YOUR_ORG/x402Arcade for:

- Overall coverage percentage
- Coverage by flag (frontend/backend)
- Coverage trends over time
- Sunburst visualization
- File browser with line-by-line coverage

## Interpreting Coverage Reports

### Coverage Metrics

- **Project:** Overall coverage of entire codebase
- **Patch:** Coverage of new lines added in PR
- **Diff:** Coverage change compared to base branch

### Coverage Targets

| Metric  | Target | Threshold | Action         |
| ------- | ------ | --------- | -------------- |
| Project | 75%    | ±2%       | Fail below 73% |
| Patch   | 70%    | ±5%       | Fail below 65% |

### Status Icons

- 🟢 **Green:** Coverage improved or maintained
- 🟡 **Yellow:** Coverage decreased within threshold
- 🔴 **Red:** Coverage decreased beyond threshold

## Flags

Coverage is tracked separately for frontend and backend:

**Frontend Flag:**

- Path: `packages/frontend/`
- Upload: Test Frontend job
- File: `packages/frontend/coverage/coverage-final.json`

**Backend Flag:**

- Path: `packages/backend/`
- Upload: Test Backend job
- File: `packages/backend/coverage/coverage-final.json`

**Benefits:**

- Independent coverage tracking
- Identify which part needs more tests
- Set different targets per flag (future)

## Troubleshooting

### Token Not Found

**Error:** "Codecov token not found"

**Fix:**

1. Verify secret name is exactly `CODECOV_TOKEN`
2. Check secret is in "Actions" section, not "Codespaces" or "Dependabot"
3. Regenerate token on Codecov if needed

### No Coverage Uploaded

**Error:** "No coverage reports found"

**Fix:**

1. Verify tests generate coverage:
   ```bash
   pnpm test:coverage:frontend
   pnpm test:coverage:backend
   ```
2. Check coverage files exist:
   ```bash
   ls packages/frontend/coverage/coverage-final.json
   ls packages/backend/coverage/coverage-final.json
   ```
3. Review CI logs for errors in test jobs

### Coverage Decreased

**Warning:** PR shows coverage decrease

**Actions:**

1. Review which files lost coverage (in Codecov comment)
2. Add tests for uncovered lines
3. Consider if threshold adjustment needed

### PR Comment Not Appearing

**Issue:** Codecov doesn't comment on PR

**Fix:**

1. Check Codecov has permission to comment (GitHub app permissions)
2. Verify `comment: behavior: default` in codecov.yml
3. Ensure both frontend and backend uploads completed (wait for 2 builds)
4. Check Codecov dashboard → Settings → PR Comments

## Best Practices

### Writing Tests for Coverage

Focus on:

- ✅ Critical business logic
- ✅ Complex functions
- ✅ Error handling paths
- ✅ Edge cases

Avoid:

- ❌ Testing simple getters/setters
- ❌ Testing third-party libraries
- ❌ 100% coverage at all costs

### Reviewing Coverage in PRs

Before merging:

1. Check Codecov status is passing (or within threshold)
2. Review coverage diff for new files
3. Ensure critical paths are covered
4. Add tests if coverage decreased unexpectedly

### Maintaining Coverage

Regular actions:

- Monitor coverage trends in Codecov dashboard
- Address files with < 60% coverage
- Add tests when fixing bugs
- Update tests when refactoring

## Configuration Options

### Adjust Coverage Targets

Edit `codecov.yml`:

```yaml
coverage:
  status:
    project:
      default:
        target: 80% # Raise target
        threshold: 1% # Tighter threshold
    patch:
      default:
        target: 75% # Require more coverage on new code
```

### Ignore Files

Add to `ignore` section in `codecov.yml`:

```yaml
ignore:
  - 'packages/frontend/src/stories/**'
  - '**/*.stories.tsx'
  - '**/*.config.ts'
```

### Disable PR Comments

```yaml
comment: false
```

### Change Comment Layout

```yaml
comment:
  layout: 'diff, flags, files' # Customize sections
  behavior: 'default' # or "once", "new", "off"
```

## Support

- **Codecov Docs:** https://docs.codecov.com/
- **GitHub Actions Integration:** https://docs.codecov.com/docs/github-actions
- **Support:** support@codecov.io
- **Community:** https://community.codecov.com/

## Quick Links

- [Codecov Dashboard](https://codecov.io/)
- [Codecov Docs - Getting Started](https://docs.codecov.com/docs/quick-start)
- [Codecov Docs - codecov.yml Reference](https://docs.codecov.com/docs/codecov-yaml)
- [Codecov GitHub Action](https://github.com/codecov/codecov-action)
