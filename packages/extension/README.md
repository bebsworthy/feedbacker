# @feedbacker/extension

Chrome extension for capturing visual feedback on any website. No code integration needed.

## Install

Download `feedbacker-extension-v*.zip` from the [latest release](https://github.com/bebsworthy/feedbacker/releases), then:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the extracted folder

## Usage

1. Click the Feedbacker icon or press **Alt+Shift+F**
2. Hover to detect elements, click to capture with screenshot
3. Type feedback and press Enter
4. Open sidebar to view, edit, delete, or export

## Features

- Works on any website (React, Vue, Angular, plain HTML)
- Native browser screenshots via `chrome.tabs.captureVisibleTab`
- Cross-site feedback storage via `chrome.storage.local`
- Site filter (current site vs all sites)
- Export as Markdown or ZIP
- Configurable FAB position and accent color
- Shadow DOM isolation (no style/event conflicts with host page)
- Focus traps on all overlays

## Architecture

- **Manifest V3** with `activeTab`, `scripting`, `storage` permissions
- **Content script** injects UI in a closed shadow DOM
- **Background service worker** handles screenshots and activation
- **Detection bridge** runs in page context for React fiber access
- Built with vanilla TypeScript (no React dependency)
- Shared types/utils/exporters from `@feedbacker/core`

## Development

```bash
npm run build           # Development build
npm run build:prod      # Production build (minified)
npm run pack            # Production build + ZIP for distribution
npm run test:e2e:headed # Run Playwright e2e tests
```

## Settings

Configure via the extension popup:
- **Button position**: top-left, top-right, bottom-left, bottom-right
- **Accent color**: any color

Keyboard shortcut customizable at `chrome://extensions/shortcuts`.
