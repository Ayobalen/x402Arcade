# Branch Protection and Security Policies

This document describes the recommended branch protection rules and security policies for x402Arcade.

## Branch Protection Rules

### Protected Branches

The following branches should be protected:

- **`main`** - Production-ready code
- **`develop`** - Integration branch for features (optional)

### Recommended Settings for `main`

#### 1. Require Pull Request Reviews

- ✅ **Require pull request reviews before merging**
  - Required approving reviews: **1** (minimum)
  - Dismiss stale pull request approvals when new commits are pushed: **Yes**
  - Require review from Code Owners: **Yes** (if CODEOWNERS file exists)
  - Restrict who can dismiss pull request reviews: **Yes** (admins only)

#### 2. Require Status Checks to Pass

- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging: **Yes**
  - Required status checks:
    - `All Checks Passed` (summary job from CI)
    - Or individual jobs:
      - `Lint`
      - `Type Check`
      - `Security Audit`
      - `Test Frontend`
      - `Test Backend`
      - `Build Frontend`
      - `Build Backend`

#### 3. Require Conversation Resolution

- ✅ **Require conversation resolution before merging**
  - All review comments must be resolved

#### 4. Require Signed Commits

- ⚠️ **Optional:** Require signed commits
  - Enforces GPG/SSH commit signing
  - Adds extra security but requires setup

#### 5. Require Linear History

- ⚠️ **Optional:** Require linear history
  - Prevents merge commits
  - Enforces rebase or squash merge

#### 6. Include Administrators

- ❌ **Do not allow bypassing the above settings**
  - Admins must follow the same rules
  - Recommended for consistency

#### 7. Restrict Force Pushes

- ✅ **Do not allow force pushes**
  - Prevents accidental history rewriting
  - Essential for main branch

#### 8. Restrict Deletions

- ✅ **Do not allow deletions**
  - Prevents accidental branch deletion

#### 9. Lock Branch

- ❌ **Do not lock branch**
  - Keep unlocked for regular development

#### 10. Allow Fork Syncing

- ✅ **Allow fork syncing**
  - Users can sync forks with upstream

## How to Configure Branch Protection

### Via GitHub Web UI

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule**
4. Enter branch name pattern: `main`
5. Configure settings as described above
6. Click **Create** or **Save changes**

### Via GitHub CLI

```bash
# Install GitHub CLI (if not installed)
brew install gh  # macOS
# or see: https://cli.github.com/

# Authenticate
gh auth login

# Create branch protection rule for main
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["All Checks Passed"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_conversation_resolution=true
```

### Via GitHub API

See full API documentation: https://docs.github.com/en/rest/branches/branch-protection

## Security Policies

### 1. Dependabot Configuration

Dependabot is configured in `.github/dependabot.yml` to:

**Automated Dependency Updates:**

- Checks for updates **weekly** (Mondays at 9am)
- Creates PRs for security and non-security updates
- Groups related dependencies (React, Vite, testing, etc.)
- Limits open PRs to 5 per package ecosystem

**Security Updates:**

- Enabled automatically for all dependencies
- Creates high-priority PRs for vulnerabilities
- Ignores major version updates for stable packages (opt-in)

**Coverage:**

- Frontend dependencies (packages/frontend)
- Backend dependencies (packages/backend)
- Root workspace dependencies
- GitHub Actions

### 2. Security Audit Job

The CI pipeline includes a security audit job that:

**npm audit:**

- Runs on every push and PR
- Checks all dependencies for known vulnerabilities
- Severity levels: Critical, High, Moderate, Low

**Failure Criteria:**

- ❌ Fails build on **Critical** vulnerabilities
- ❌ Fails build on **High** vulnerabilities
- ⚠️ Warns on **Moderate** vulnerabilities (does not block)
- ✅ Passes on **Low** vulnerabilities

**Reporting:**

- Generates JSON audit report
- Displays summary in GitHub Actions summary
- Uploads audit report as artifact (30-day retention)

### 3. Dependency Review Action

For pull requests, the Dependency Review action:

**Checks:**

- Scans new dependencies added in PR
- Checks for known vulnerabilities
- Verifies licenses are allowed

**Configuration:**

- Fails on severity: **Moderate** or higher
- Denies licenses: GPL-3.0, AGPL-3.0 (copyleft)
- Comments summary in PR automatically

**Benefits:**

- Prevents vulnerable dependencies from being added
- Catches licensing issues early
- Provides context in PR reviews

### 4. Vulnerability Handling Process

When a vulnerability is detected:

**1. Assessment:**

- Review severity and impact
- Check if vulnerability affects our code
- Determine urgency of fix

**2. Mitigation:**

For Critical/High severity:

- **Immediate action required**
- Update dependency to patched version
- If no patch available:
  - Apply workaround if possible
  - Remove dependency if feasible
  - Create security advisory

For Moderate severity:

- **Plan update within 1 week**
- Schedule during next maintenance window
- Document in issue tracker

For Low severity:

- **Include in next dependency update cycle**
- No urgent action required

**3. Update Process:**

```bash
# Update specific package
pnpm update <package-name>

# Update all dependencies (within version constraints)
pnpm update

# Check for outdated packages
pnpm outdated

# Run audit
pnpm audit

# Fix vulnerabilities automatically (if possible)
pnpm audit --fix
```

**4. Verification:**

- Run full test suite
- Verify application functionality
- Re-run security audit
- Create PR with security fix

**5. Communication:**

- Document fix in PR description
- Update CHANGELOG.md
- Notify team of critical fixes

## Code Owners

Create a `.github/CODEOWNERS` file to define code ownership:

```
# Default owners for everything
* @your-org/core-team

# Frontend code
/packages/frontend/** @your-org/frontend-team

# Backend code
/packages/backend/** @your-org/backend-team

# CI/CD configuration
/.github/** @your-org/devops-team

# Documentation
/docs/** @your-org/docs-team

# Security-sensitive files
/packages/backend/src/server/x402/** @your-org/security-team
```

**Benefits:**

- Auto-assigns reviewers based on files changed
- Ensures domain experts review relevant changes
- Required reviewers for sensitive code

## Signed Commits

### Why Sign Commits?

- **Verify identity:** Proves commits are from you
- **Prevent impersonation:** Others cannot commit as you
- **Compliance:** Required by some organizations

### Setup GPG Signing

**1. Generate GPG key:**

```bash
gpg --full-generate-key
# Choose: RSA and RSA, 4096 bits, no expiration
# Enter name and email (must match GitHub)
```

**2. Get key ID:**

```bash
gpg --list-secret-keys --keyid-format LONG
# Copy the key ID (e.g., 3AA5C34371567BD2)
```

**3. Add to GitHub:**

```bash
gpg --armor --export YOUR_KEY_ID
# Copy output and add to GitHub: Settings → SSH and GPG keys
```

**4. Configure Git:**

```bash
git config --global user.signingkey YOUR_KEY_ID
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

**5. Test signing:**

```bash
git commit -S -m "Test signed commit"
git log --show-signature
```

### Setup SSH Signing (Alternative)

**1. Generate SSH key (if needed):**

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

**2. Add to GitHub:**

- Copy public key: `cat ~/.ssh/id_ed25519.pub`
- Add to GitHub: Settings → SSH and GPG keys → New SSH key
- Select "Signing Key" as key type

**3. Configure Git:**

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

**4. Test signing:**

```bash
git commit -S -m "Test signed commit"
```

## Merge Strategies

### Squash and Merge (Recommended)

**Pros:**

- Clean, linear history
- One commit per PR
- Easy to revert features

**Cons:**

- Loses individual commit history
- Harder to track progress within PR

**When to use:**

- Feature branches
- Small to medium PRs
- Clean up messy commit history

### Merge Commit

**Pros:**

- Preserves full commit history
- Shows PR merge point
- Easy to see feature branches

**Cons:**

- Cluttered history
- Merge commits add noise

**When to use:**

- Large, complex PRs
- Multiple contributors
- Important to preserve history

### Rebase and Merge

**Pros:**

- Linear history
- Preserves individual commits
- No merge commits

**Cons:**

- Rewrites commit hashes
- Can be confusing for new contributors

**When to use:**

- Small, clean PRs
- Well-structured commits
- Team comfortable with rebasing

## Security Best Practices

### 1. Secret Management

- ❌ **Never commit secrets** (API keys, tokens, passwords)
- ✅ Use environment variables
- ✅ Use GitHub Secrets for CI/CD
- ✅ Use `.env` files (gitignored)
- ✅ Rotate secrets regularly

### 2. Code Review

- ✅ Review all code before merging
- ✅ Check for security vulnerabilities
- ✅ Verify input validation
- ✅ Look for injection risks (SQL, XSS, etc.)
- ✅ Check authentication/authorization

### 3. Dependency Management

- ✅ Keep dependencies up to date
- ✅ Review dependency changes
- ✅ Audit dependencies regularly
- ✅ Minimize dependency count
- ✅ Prefer well-maintained packages

### 4. Access Control

- ✅ Use principle of least privilege
- ✅ Limit repository access
- ✅ Use teams for group permissions
- ✅ Review access regularly
- ✅ Remove access when no longer needed

### 5. Audit Logging

- ✅ Enable repository audit logs
- ✅ Monitor suspicious activity
- ✅ Review security events regularly
- ✅ Set up alerts for critical events

## Compliance and Regulations

### GDPR Considerations

If handling EU user data:

- Document data processing activities
- Implement data deletion mechanisms
- Ensure data encryption
- Maintain audit logs

### SOC 2 Compliance

If pursuing SOC 2:

- Enforce branch protection
- Require signed commits
- Maintain audit logs
- Document security policies
- Regular security reviews

## Incident Response

### Security Incident Process

**1. Detection:**

- Vulnerability report received
- Security alert triggered
- Suspicious activity detected

**2. Assessment:**

- Determine severity
- Identify affected systems
- Estimate impact

**3. Containment:**

- Isolate affected systems
- Disable compromised accounts
- Apply emergency patches

**4. Eradication:**

- Remove vulnerability
- Update dependencies
- Patch security holes

**5. Recovery:**

- Restore normal operations
- Verify fixes
- Monitor for recurrence

**6. Post-Incident:**

- Document incident
- Update policies
- Conduct retrospective
- Implement preventive measures

## Resources

### GitHub Documentation

- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Dependency Review](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review)
- [Code Owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Signed Commits](https://docs.github.com/en/authentication/managing-commit-signature-verification)

### Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm Audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)
- [GitHub Security Advisories](https://github.com/advisories)

### Tools

- [GitHub CLI](https://cli.github.com/)
- [GPG Suite](https://gpgtools.org/) (macOS)
- [Kleopatra](https://www.openpgp.org/software/kleopatra/) (Windows)
- [Snyk CLI](https://snyk.io/product/snyk-cli/)
