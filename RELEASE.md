# Release Process

## Automated Release (Recommended)

Releases are automated via GitHub Actions. The process:

1. **Trigger version bump**: Go to Actions → "Version Bump" → Run workflow → choose `patch`, `minor`, or `major`
2. The workflow bumps versions in all packages (feedbacker, core, detection, extension, manifest.json), commits, creates a git tag, and pushes
3. The tag triggers `ci-release.yml` which:
   - Runs all tests (unit + e2e, across Node 20/24 and React 18/19)
   - Publishes `feedbacker-react` to npm
   - Builds and packs the Chrome extension ZIP
   - Creates a GitHub release with the extension ZIP attached
   - Deploys the demo site to GitHub Pages

## Manual Release

If you need to release manually:

### Pre-release Checklist

- [ ] All tests passing (`npm test`)
- [ ] TypeScript builds clean (`npm run build` in all packages)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

### Steps

```bash
# 1. Build all packages (order matters)
npm run build --workspace=@feedbacker/core
npm run build --workspace=@feedbacker/detection
npm run build --workspace=feedbacker-react
cd packages/extension && npm run pack && cd ../..

# 2. Tag and push
git tag v0.X.0
git push origin v0.X.0
# CI handles the rest (npm publish, GitHub release, demo deploy)
```

### Packages Released

| Package | Published To | Artifact |
|---------|-------------|----------|
| `feedbacker-react` | npm | npm package |
| `@feedbacker/extension` | GitHub Releases | `feedbacker-extension-v*.zip` |
| `@feedbacker/core` | Internal (not published to npm) | — |
| `@feedbacker/detection` | Internal (not published to npm) | — |

## Versioning

All packages share the same version number, bumped together. We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes

## Rollback

If issues are discovered after publishing:
```bash
npm unpublish feedbacker-react@VERSION
# Fix issues, then publish a patch
```

Note: Unpublishing is discouraged. Prefer publishing a patch version.
