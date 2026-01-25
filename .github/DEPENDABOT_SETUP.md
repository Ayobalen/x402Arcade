# Dependabot Setup Guide

Quick reference for Dependabot automated dependency updates.

## What is Dependabot?

Dependabot is GitHub's automated dependency update service that:

- ✅ Scans dependencies for security vulnerabilities
- ✅ Creates pull requests to update dependencies
- ✅ Groups related updates together
- ✅ Provides changelogs and release notes
- ✅ Runs automatically on a schedule

## Configuration

Dependabot is configured in `.github/dependabot.yml`.

### Update Schedule

- **Frequency:** Weekly (Mondays at 9:00 AM)
- **Max PRs:** 5 per package ecosystem (frontend/backend)
- **Max PRs (Actions):** 3 for GitHub Actions

### Package Ecosystems

1. **Frontend** (`packages/frontend`): React, Vite, testing libraries
2. **Backend** (`packages/backend`): Express, database, blockchain
3. **Root Workspace**: ESLint, Prettier, Storybook, Husky
4. **GitHub Actions**: Workflow dependencies

### Dependency Groups

Related dependencies are grouped into single PRs:

**Frontend:**

- `react`: React and @types/react\*
- `vite`: Vite and @vitejs/\*
- `testing`: Vitest, Playwright, Testing Library
- `three`: Three.js and @react-three/\*
- `tailwind`: Tailwind CSS, PostCSS, Autoprefixer

**Backend:**

- `express`: Express and @types/express\*
- `database`: SQLite packages
- `blockchain`: Viem, Ethers

**Root:**

- `linting`: ESLint, Prettier, lint-staged
- `storybook`: Storybook packages
- `husky`: Husky

## How Dependabot Works

### 1. Scan for Updates

Every Monday at 9:00 AM, Dependabot:

- Checks package.json for outdated dependencies
- Compares with latest versions on npm
- Checks for security vulnerabilities

### 2. Create Pull Requests

For each update:

- Creates a new branch
- Updates package.json and lock file
- Generates PR with changelog
- Assigns reviewers (configured teams)
- Labels PR with `dependencies`, ecosystem, and `automated`

### 3. CI Runs Automatically

The PR triggers CI workflow:

- Lint and type-check
- Security audit
- Tests (frontend and backend)
- Builds

### 4. Review and Merge

Developer reviews the PR:

- Check changelog for breaking changes
- Verify CI passes
- Test locally if needed
- Merge if safe

## Viewing Dependabot Alerts

### Security Alerts

1. Go to your repository on GitHub
2. Click **Security** tab
3. Click **Dependabot alerts**
4. View vulnerabilities by severity

### Dependency Graph

1. Go to **Insights** tab
2. Click **Dependency graph**
3. View all dependencies
4. See Dependabot status

## Managing Dependabot PRs

### Auto-Merge (Optional)

Enable auto-merge for patch/minor updates:

```bash
# Install GitHub CLI
brew install gh

# Enable auto-merge for a Dependabot PR
gh pr merge <pr-number> --auto --squash

# Or use GitHub Action:
# See: https://github.com/dependabot/fetch-metadata
```

### Snooze Updates

Temporarily pause updates for a dependency:

1. Open Dependabot PR
2. Comment: `@dependabot ignore this dependency`
3. Or: `@dependabot ignore this major version`

### Rebase PR

If PR conflicts with main:

```
Comment: @dependabot rebase
```

### Recreate PR

If PR is closed:

```
Comment: @dependabot recreate
```

## Configuring Team Assignments

Update `.github/dependabot.yml` to assign PRs to your teams:

```yaml
reviewers:
  - '@your-org/frontend-team' # Replace with actual team
assignees:
  - '@your-org/frontend-team' # Replace with actual team
```

**To create GitHub teams:**

1. Go to your organization
2. Click **Teams**
3. Create team (e.g., `frontend-team`, `backend-team`)
4. Add members
5. Update dependabot.yml with `@your-org/team-name`

## Ignored Updates

Dependabot ignores major version updates for:

- React (opt-in major updates)
- React DOM (opt-in major updates)

**To allow major updates:**

Remove from `.github/dependabot.yml`:

```yaml
ignore:
  - dependency-name: 'react'
    update-types: ['version-update:semver-major']
```

## Versioning Strategy

- **`increase`**: Always use latest version available
- Applies to all dependencies
- Includes security patches, bug fixes, and features

**Alternative strategies:**

- `increase-if-necessary`: Only update if required by another dependency
- `lockfile-only`: Update lock file only, not package.json
- `widen`: Widen version range

## Labels

Dependabot PRs are automatically labeled:

- **`dependencies`**: All dependency updates
- **`frontend`** / **`backend`** / **`workspace`**: Ecosystem
- **`automated`**: Automated PR

**Use labels to:**

- Filter PRs in GitHub
- Create custom workflows
- Set up notifications

## Commit Messages

Format: `chore(deps): update <package> to <version>`

Examples:

- `chore(deps): update react to 18.3.0`
- `chore(deps): update vite group to latest versions`

## Security Updates

Dependabot prioritizes security updates:

- Creates PRs immediately for vulnerabilities
- Labeled with **`security`**
- Includes vulnerability description
- Links to advisory details

**Review quickly:**

- Check severity (Critical/High = urgent)
- Review changelog for breaking changes
- Merge ASAP if safe

## Troubleshooting

### No PRs Created

**Check:**

1. Dependabot enabled in repository settings
2. Configuration file is valid YAML
3. No rate limit reached (100 PRs/week)
4. Dependencies are not already up to date

### PRs Not Passing CI

**Common issues:**

- Breaking changes in dependency update
- TypeScript type errors
- Test failures

**Solutions:**

- Review dependency changelog
- Update code to match new API
- Update type definitions
- Fix tests

### Too Many PRs

**Reduce PRs:**

- Decrease update frequency (monthly instead of weekly)
- Reduce `open-pull-requests-limit`
- Add more dependency groups
- Ignore non-critical updates

Example:

```yaml
schedule:
  interval: 'monthly' # Instead of weekly
open-pull-requests-limit: 3 # Instead of 5
```

### Wrong Team Assigned

**Fix:**

- Update `reviewers` and `assignees` in `.github/dependabot.yml`
- Push changes to main branch
- Dependabot uses new config for next PRs

## Best Practices

### 1. Review Regularly

- Check Dependabot PRs weekly
- Don't let PRs pile up
- Address security updates quickly

### 2. Test Before Merging

- For major updates, test locally
- Run full test suite
- Check for breaking changes

### 3. Group Related Updates

- Use dependency groups (already configured)
- Merge multiple updates together
- Reduces review overhead

### 4. Enable Dependabot Alerts

Repository Settings → Security & analysis:

- ✅ Dependabot alerts
- ✅ Dependabot security updates

### 5. Monitor Dashboard

- Check Security tab regularly
- Review open Dependabot PRs
- Close or merge stale PRs

## Integration with CI

Dependabot PRs trigger the full CI pipeline:

1. **Lint**: Checks code style
2. **Type Check**: Verifies types
3. **Security Audit**: Scans for vulnerabilities
4. **Tests**: Runs unit and integration tests
5. **Build**: Ensures project builds

All checks must pass before merging.

## Secrets in Dependabot

If CI needs secrets (e.g., `CODECOV_TOKEN`):

- Dependabot has access to repository secrets automatically
- No additional configuration needed

## Alternative Tools

**Renovate:**

- More configurable than Dependabot
- Supports more package ecosystems
- Self-hosted or cloud-hosted

**Greenkeeper:**

- Deprecated (moved to Snyk)
- Similar to Dependabot

**npm-check-updates:**

- Manual CLI tool
- Update package.json interactively

## Resources

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Configuration Options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [Dependabot Commands](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/managing-pull-requests-for-dependency-updates#managing-dependabot-pull-requests-with-comment-commands)
- [Security Advisories](https://github.com/advisories)

## Support

- **GitHub Support:** https://support.github.com/
- **Community Forum:** https://github.community/
- **Security Contact:** security@github.com (for vulnerabilities)
