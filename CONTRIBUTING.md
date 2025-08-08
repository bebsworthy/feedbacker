# Contributing to Feedbacker

Thank you for your interest in contributing to Feedbacker! We welcome contributions from the community.

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
4. Start development:
   ```bash
   npm run dev
   ```

## Development Setup

This is a monorepo using npm workspaces:
- `/packages/feedbacker` - Core library
- `/packages/demo` - Demo application

### Running the Demo

```bash
npm run dev
# Opens at http://localhost:3001
```

### Building

```bash
# Build library
npm run build

# Build demo
npm run build:demo
```

### Testing

```bash
# Run tests
npm test

# Type checking
npm run typecheck --workspace=@feedbacker/core
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure the build passes: `npm run build`
4. Update documentation if needed
5. Submit a pull request

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Include a clear description of changes
- Update CHANGELOG.md in the "Unreleased" section
- Ensure all TypeScript types are properly defined
- Follow existing code style and conventions

## Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Components should be functional with hooks
- Use semantic HTML and ARIA attributes
- Avoid external dependencies when possible

## Reporting Issues

- Use the GitHub issue tracker
- Include reproduction steps
- Provide browser and React version information
- Include screenshots for UI issues

## Feature Requests

- Open an issue with the "enhancement" label
- Describe the use case and benefits
- Consider submitting a PR with the implementation

## Testing Guidelines

- Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- Test mobile interactions
- Verify screenshot capture works
- Check TypeScript types compile correctly

## Documentation

- Update README.md for API changes
- Add JSDoc comments for public APIs
- Include code examples for new features
- Update TypeScript definitions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.