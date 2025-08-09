# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Automated release workflows via GitHub Actions
- Version bump automation workflow
- NPM account security documentation
- Package provenance for supply chain security
- Security policy and vulnerability reporting guidelines

### Security
- Added .npmrc with security configurations
- Documented 2FA setup for NPM account
- Added NPM token rotation guidelines
- Implemented package signing and provenance

## [0.1.0] - 2025-01-09

### Added
- Initial release of Feedbacker React library
- Component-level feedback collection for React applications
- Automatic screenshot capture with pluggable backends (SnapDOM, html2canvas)
- React component detection using multiple strategies:
  - React DevTools integration
  - Fiber tree inspection
  - DOM heuristics
  - Fallback strategy
- Local storage with automatic cleanup and migrations
- Export functionality (Markdown, ZIP with images)
- Mobile support with touch gestures and haptic feedback
- TypeScript support with full type definitions
- Auto-copy and auto-download features
- Customizable UI positioning and theming
- Event system for programmatic control
- Custom capture adapter support

### Features
- Zero configuration setup - just wrap your app
- Smart component detection with production build support
- Pluggable screenshot libraries with CDN fallback
- RequestIdleCallback optimization for performance
- CORS-aware screenshot capture
- Privacy-first design (no external API calls)
- Comprehensive browser information capture
- Draft functionality for unsaved feedback
- Error boundaries to prevent app crashes
- React 18+ support with version checking

### Documentation
- Comprehensive README with usage examples
- Architecture documentation (global and module-specific)
- Configuration guide (CONFIGURATION.md)
- Capture libraries documentation (CAPTURE_LIBRARIES.md)
- Contributing guidelines (CONTRIBUTING.md)
- Release process documentation (RELEASING.md)
- Security policy (SECURITY.md)

### Infrastructure
- GitHub Actions CI/CD pipeline
- Multi-format builds (ESM, CommonJS, UMD)
- GitHub Pages deployment for demo
- NPM package publication as `feedbacker-react`
- Monorepo structure with npm workspaces

### Demo
- Interactive playground with multiple UI frameworks
- Landing page with live examples
- Component showcase for testing
- Performance comparison between capture libraries

---

## Version History

- **0.1.0** (2025-01-09): Initial public release on NPM as `feedbacker-react`

## Links

- [NPM Package](https://www.npmjs.com/package/feedbacker-react)
- [GitHub Repository](https://github.com/bebsworthy/feedbacker)
- [Demo Site](https://bebsworthy.github.io/feedbacker/)
- [Release Notes](https://github.com/bebsworthy/feedbacker/releases)