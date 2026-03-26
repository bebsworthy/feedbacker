# Contributing to Feedbacker

Thank you for your interest in contributing to Feedbacker!

## Important: Discuss Before You Code

**Pull requests without a prior issue discussion will not be reviewed.** Before starting any work:

1. Open an issue describing the bug, feature, or change you want to make
2. Wait for feedback and alignment on the approach
3. Only then start coding and submit a PR referencing the issue

This saves everyone's time and avoids wasted effort on changes that don't fit the project direction.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/feedbacker.git
   cd feedbacker
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the demo:
   ```bash
   npm run dev
   ```

## Monorepo Structure

This project uses npm workspaces:

| Package | Path | Description |
|---------|------|-------------|
| `feedbacker-react` | `packages/feedbacker` | React widget |
| `@feedbacker/extension` | `packages/extension` | Chrome extension |
| `@feedbacker/core` | `packages/core` | Shared types, utilities, exporters |
| `@feedbacker/detection` | `packages/detection` | Component detection strategies |
| `@feedbacker/demo` | `packages/demo` | Landing page and playground |

## Building

```bash
# Build shared packages first (order matters)
npm run build --workspace=@feedbacker/core
npm run build --workspace=@feedbacker/detection

# Build React widget
npm run build --workspace=feedbacker-react

# Build Chrome extension
cd packages/extension && npm run build

# Build demo
npm run build:demo
```

## Testing

```bash
# Unit tests (all packages)
npm test

# React widget e2e tests
npm run test:e2e --workspace=feedbacker-react

# Extension e2e tests (requires headed Chromium)
cd packages/extension && npm run test:e2e:headed

# Type checking
npm run typecheck --workspace=feedbacker-react
```

## Pull Request Process

1. **Open an issue first** and get agreement on the approach
2. Create a feature branch from `main`
3. Make your changes
4. Ensure builds pass: `npm run build`
5. Ensure tests pass: `npm test`
6. Update documentation if needed
7. Submit a PR referencing the issue

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Include a clear description of changes
- Reference the issue number (e.g., "Fixes #42")
- Ensure all TypeScript types are properly defined
- Follow existing code style and conventions

## Code Style

- TypeScript for all new code
- Follow existing patterns in the codebase
- React components should be functional with hooks
- Extension UI uses vanilla TypeScript (no React)
- Use semantic HTML and ARIA attributes
- Avoid external dependencies when possible

## Reporting Issues

- Use the GitHub issue tracker
- Include reproduction steps
- Provide browser and React version information
- Include screenshots for UI issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
