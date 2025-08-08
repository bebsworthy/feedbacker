# Release Process

This document outlines the release process for Feedbacker.

## Pre-release Checklist

- [ ] All tests passing
- [ ] TypeScript build has no errors
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Demo site working

## Release Steps

### 1. Version Bump
```bash
# In packages/feedbacker
npm version patch|minor|major
```

### 2. Update CHANGELOG
Move items from "Unreleased" to the new version section with the release date.

### 3. Build and Test
```bash
npm run build
npm test
```

### 4. Test Package Locally
```bash
cd packages/feedbacker
npm pack
# Test in a fresh React project
```

### 5. Git Tag and Push
```bash
git add .
git commit -m "Release v0.1.0"
git tag v0.1.0
git push origin main --tags
```

### 6. Create GitHub Release
1. Go to GitHub releases page
2. Click "Create a new release"
3. Select the tag
4. Add release notes from CHANGELOG
5. Publish release

### 7. Publish to NPM
```bash
cd packages/feedbacker
npm publish --access public
```

### 8. Verify Publication
- Check https://www.npmjs.com/package/feedbacker-react
- Test installation: `npm install feedbacker-react`
- Verify demo deployment on GitHub Pages

### 9. Post-release
- Announce on social media
- Update any example repositories
- Monitor for issues

## Versioning

We follow [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

## NPM Access

Ensure you have:
1. NPM account with publish access
2. Logged in: `npm login`
3. 2FA enabled for security

## Rollback Process

If issues are discovered:
```bash
npm unpublish feedbacker-react@VERSION
# Fix issues
# Publish patch version
```

Note: Unpublishing is discouraged. Prefer publishing a patch.