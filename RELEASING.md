# Release Process

This project uses automated releases via GitHub Actions. When you push a version tag, it automatically:
1. Runs tests
2. Publishes to npm
3. Creates a GitHub release
4. Deploys the demo to GitHub Pages

## Prerequisites

### 1. Set up NPM Token

You need to add your NPM authentication token as a GitHub secret:

1. Go to https://www.npmjs.com/settings/[your-username]/tokens
2. Click "Generate New Token" → "Classic Token"
3. Choose "Automation" type
4. Copy the token
5. Go to your GitHub repository → Settings → Secrets and variables → Actions
6. Click "New repository secret"
7. Name: `NPM_TOKEN`
8. Value: Paste your npm token
9. Click "Add secret"

## Release Methods

### Method 1: Automated Version Bump (Recommended)

Use the GitHub Actions workflow to bump version and release:

1. Go to Actions → Version Bump
2. Click "Run workflow"
3. Select version type:
   - `patch`: 0.1.0 → 0.1.1 (bug fixes)
   - `minor`: 0.1.0 → 0.2.0 (new features)
   - `major`: 0.1.0 → 1.0.0 (breaking changes)
   - `prerelease`: 0.1.0 → 0.1.1-beta.0
4. Click "Run workflow"

This will:
- Bump the version in package.json
- Update CHANGELOG.md
- Commit changes
- Create and push a version tag
- Trigger the release workflow automatically

### Method 2: Manual Release

If you prefer to manage versions manually:

```bash
# 1. Update version in packages/feedbacker/package.json
cd packages/feedbacker
npm version patch # or minor, major, prerelease

# 2. Commit the change
git add .
git commit -m "chore: bump version to v0.1.1"
git push origin main

# 3. Create and push a tag
git tag v0.1.1
git push origin v0.1.1
```

The tag push will trigger the automated release.

### Method 3: Quick Release Script

Create a local release script:

```bash
#!/bin/bash
# save as release.sh

VERSION_TYPE=${1:-patch}

# Bump version
cd packages/feedbacker
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version | sed 's/v//')

# Update root package.json (optional)
cd ../..
npm version $NEW_VERSION --no-git-tag-version --allow-same-version || true

# Commit and tag
git add .
git commit -m "chore: release v$NEW_VERSION"
git tag v$NEW_VERSION

# Push
git push origin main
git push origin v$NEW_VERSION

echo "✅ Released v$NEW_VERSION"
```

Usage:
```bash
./release.sh patch  # or minor, major
```

## Release Workflow Details

When a version tag is pushed, the release workflow:

1. **Tests** (matrix: Node 18.x, 20.x)
   - Installs dependencies
   - Builds the library
   - Runs type checking
   - Runs tests

2. **Publishes to npm**
   - Builds the library
   - Publishes with provenance
   - Uses NPM_TOKEN secret

3. **Creates GitHub Release**
   - Generates changelog from commits
   - Creates release with installation instructions
   - Marks as prerelease if version contains beta/alpha/rc

4. **Deploys Demo**
   - Builds library and demo
   - Deploys to GitHub Pages

## Version Strategy

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
  - Removing/renaming public APIs
  - Changing component behavior significantly
  - Dropping React version support

- **MINOR** (0.1.0): New features
  - Adding new components
  - Adding new hooks
  - Adding new configuration options

- **PATCH** (0.0.1): Bug fixes
  - Fixing bugs
  - Improving performance
  - Updating documentation

### Prerelease Versions

For testing before stable release:

```bash
# Beta release: 0.1.0-beta.0
npm version prerelease --preid=beta

# RC release: 0.1.0-rc.0
npm version prerelease --preid=rc

# Alpha release: 0.1.0-alpha.0
npm version prerelease --preid=alpha
```

## Rollback Process

If you need to rollback a release:

### 1. Unpublish from npm (within 72 hours)
```bash
npm unpublish feedbacker-react@0.1.1
```

### 2. Delete GitHub release and tag
```bash
# Delete remote tag
git push origin :refs/tags/v0.1.1

# Delete local tag
git tag -d v0.1.1

# Delete GitHub release (via web UI)
```

### 3. Revert commits if needed
```bash
git revert HEAD
git push origin main
```

## Troubleshooting

### Release workflow fails

1. **NPM publish fails**: Check NPM_TOKEN is set correctly
2. **Tests fail**: Fix tests before releasing
3. **Build fails**: Ensure all dependencies are installed

### Manual intervention needed

If automation fails, you can:

1. Publish to npm manually:
```bash
cd packages/feedbacker
npm publish --access public
```

2. Create GitHub release manually via web UI

3. Deploy demo manually:
```bash
npm run build:demo
# Then upload dist folder to GitHub Pages
```

## Release Checklist

Before releasing, ensure:

- [ ] All tests pass locally
- [ ] Build completes without errors
- [ ] TypeScript has no errors (or only acceptable ones)
- [ ] Demo works correctly
- [ ] CHANGELOG is updated (automated via workflow)
- [ ] Documentation is up to date
- [ ] Breaking changes are clearly documented

## Release Notifications

After a successful release:

1. The workflow creates a GitHub release
2. npm sends email notification (if configured)
3. GitHub Pages updates automatically

Consider announcing on:
- Twitter/X
- Reddit (r/reactjs)
- Dev.to
- Discord/Slack communities

## Questions?

For release issues, check:
- GitHub Actions logs
- npm publish logs
- GitHub Pages deployment status

Or open an issue in the repository.