# Security Policy

## NPM Package Security

### Account Protection

Our NPM account is protected with:
- ✅ **2FA enabled** for authentication and publishing
- ✅ **Automation tokens** for CI/CD (GitHub Actions)
- ✅ **Scoped publishing** to prevent accidental publishes
- ✅ **Package provenance** for supply chain security

### Token Types

| Token Type | Purpose | 2FA Bypass | Rotation |
|------------|---------|------------|----------|
| **Automation** | GitHub Actions CI/CD | Yes | Every 90 days |
| **Publish** | Manual publishing | No | Every 30 days |
| **Read-only** | Package installation | N/A | As needed |

### Security Best Practices

1. **Never commit tokens** to the repository
2. **Use GitHub Secrets** for all sensitive data
3. **Rotate tokens regularly** (every 90 days)
4. **Monitor npm audit** for vulnerabilities
5. **Enable 2FA** on all maintainer accounts

## Vulnerability Reporting

### Reporting Security Vulnerabilities

**DO NOT** create public issues for security vulnerabilities.

Instead, please email: bebsworthy@gmail.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work on a fix.

### Security Updates

We use automated tools to keep dependencies secure:

```bash
# Check for vulnerabilities
npm audit

# Auto-fix vulnerabilities (be careful with breaking changes)
npm audit fix

# See which packages need updates
npm outdated
```

## Package Integrity

### Publishing Security

All packages are published with:
- **NPM Provenance** - Cryptographic link between package and source code
- **Package signing** - Ensures package hasn't been tampered with
- **2FA requirement** - Manual publishes require 2FA
- **Automation tokens** - CI/CD uses secure tokens

### Verification

Users can verify package integrity:

```bash
# View package signature
npm view feedbacker-react signatures

# Verify provenance
npm view feedbacker-react provenance

# Check package integrity
npm audit signatures
```

## Dependency Security

### Runtime Dependencies
- `jszip` - Regularly updated and audited

### Peer Dependencies
- `react` - Security updates handled by React team
- `react-dom` - Security updates handled by React team
- Optional screenshot libraries are loaded on-demand

### Development Dependencies
- All dev dependencies are regularly updated
- Automated Dependabot alerts for security issues
- Weekly dependency audits in CI/CD

## CI/CD Security

### GitHub Actions Security

Our workflows follow security best practices:
- ✅ **Minimal permissions** - Only required permissions granted
- ✅ **Pinned action versions** - Using specific versions (e.g., `@v4`)
- ✅ **Secret scanning** - GitHub automatically scans for exposed secrets
- ✅ **CODEOWNERS** - Protected workflow files

### Secrets Management

| Secret | Purpose | Rotation |
|--------|---------|----------|
| `NPM_TOKEN` | NPM publishing | Every 90 days |
| `GITHUB_TOKEN` | GitHub API access | Automatic (GitHub-managed) |

## Security Checklist for Maintainers

### Before Each Release

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Update dependencies if security patches available
- [ ] Verify no secrets in code
- [ ] Check GitHub security alerts
- [ ] Ensure 2FA is active

### Monthly

- [ ] Review npm token usage
- [ ] Check for unusual publish activity
- [ ] Review GitHub Action logs
- [ ] Update dependencies

### Quarterly

- [ ] Rotate NPM automation token
- [ ] Review and update security policy
- [ ] Audit maintainer access
- [ ] Security training for new maintainers

## NPM Account Recovery

If your NPM account is compromised:

1. **Immediately revoke all tokens**:
   - Go to https://www.npmjs.com/settings/~/tokens
   - Revoke all tokens

2. **Unpublish compromised versions** (if within 72 hours):
   ```bash
   npm unpublish feedbacker-react@compromised-version
   ```

3. **Rotate GitHub secrets**:
   - Update NPM_TOKEN in GitHub settings

4. **Publish security fix**:
   ```bash
   npm version patch
   npm publish
   ```

5. **Notify users** via GitHub Security Advisory

## Contact

**Security issues**: bebsworthy@gmail.com
**General issues**: https://github.com/bebsworthy/feedbacker/issues

---

*Last updated: 2025-01-08*
*Next review: 2025-04-08*