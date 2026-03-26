# @feedbacker/core

Shared types, utilities, and exporters for the Feedbacker ecosystem. Used by both the React widget (`feedbacker-react`) and the Chrome extension (`@feedbacker/extension`).

## What's Included

- **Types** — `Feedback`, `Draft`, `BrowserInfo`, `FeedbackStore`, `StorageManager`, `ExportOptions`, and more
- **Validation** — feedback, draft, screenshot, and comment validators
- **Sanitization** — XSS prevention, HTML stripping, input sanitization
- **Exporters** — `MarkdownExporter` and `ZipExporter` for feedback reports
- **Event bus** — `FeedbackEventEmitter` for pub/sub communication
- **Utilities** — date formatting, HTML snippet capture, logger

## Usage

```typescript
import {
  Feedback, StorageManager,
  sanitizeFeedback, validateFeedback,
  MarkdownExporter, ZipExporter,
  FeedbackEventEmitter, logger
} from '@feedbacker/core';
```

This package is not intended for direct use by end users. It's a shared dependency for Feedbacker packages.
