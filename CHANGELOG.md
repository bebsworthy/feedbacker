# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Feedbacker
- Component-level feedback collection for React applications
- Automatic screenshot capture with pluggable backends (SnapDOM, html2canvas)
- React component detection using multiple strategies
- Local storage with automatic cleanup
- Export functionality (Markdown, ZIP with images)
- Mobile support with touch gestures and haptic feedback
- TypeScript support with full type definitions
- Auto-copy and auto-download features
- Customizable UI positioning and theming
- Event system for programmatic control
- Custom capture adapter support

### Features
- Zero configuration setup
- Smart component detection (React DevTools, Fiber tree, DOM heuristics)
- Pluggable screenshot libraries with CDN fallback
- RequestIdleCallback optimization for performance
- CORS-aware screenshot capture
- Privacy-first design (no external API calls)
- Comprehensive browser information capture
- Draft functionality for unsaved feedback

## [0.1.0] - TBD
- Initial public release