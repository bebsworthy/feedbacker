# Feedbacker

Monorepo with 5 packages:

| Package | Path | Description |
|---------|------|-------------|
| `feedbacker-react` | `packages/feedbacker` | React widget (npm published) |
| `@feedbacker/extension` | `packages/extension` | Chrome extension |
| `@feedbacker/core` | `packages/core` | Shared types, utilities, exporters |
| `@feedbacker/detection` | `packages/detection` | Component detection strategies |
| `@feedbacker/demo` | `packages/demo` | Landing page and playground |

Build order matters: core → detection → feedbacker → extension → demo.
