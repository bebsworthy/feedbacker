# Feedbacker Library - Feature Specification

## Overview
A drop-in React library for capturing component-level feedback during development and design review. Users can select specific React components, add comments, and export all feedback for sharing via their preferred channels.

## Core Principles
- **Drop-in ready**: Zero configuration, just works
- **Local-first**: All data stored locally, no external dependencies
- **Non-intrusive**: Never blocks the app or gets in the way
- **Export-flexible**: Multiple export formats for different workflows

## Core Features

### 1. Floating Action Button (FAB)
- **Primary FAB**: Always visible, moveable if needed
- **Expanded state**: Shows two actions on hover/tap:
  - "New feedback" - Start component selection
  - "Show manager" - Open feedback sidebar
- **Draft indicator**: Shows dot when comment is in progress
- **Click behavior**: 
  - Default: Expands to show actions
  - With draft: Reopens the minimized comment

### 2. Component Selection Mode
- **Activation**: Click "New feedback" from FAB
- **Desktop**: Hover to highlight, click to select
- **Mobile**: Touch and drag to target, release to select
- **Visual feedback**: Blue outline with component name label
- **Detection strategies** (in order):
  1. React DevTools global hook
  2. React fiber inspection
  3. DOM heuristics
  4. Parent tree traversal
- **Fallback**: TBD based on testing (show "Unknown Component" or nearest parent)

### 3. Feedback Comment Modal
- **Opens after**: Component selection
- **Minimizable**: Can minimize to continue browsing
- **Draft protection**: Warns before losing unsaved comment
- **One at a time**: Only one comment draft allowed
- **Contents**:
  - Component name and path
  - Screenshot preview
  - Comment textarea
  - Submit/Cancel buttons
  - Minimize button

### 4. Feedback Manager Sidebar
- **Access**: Via FAB expanded action
- **Position**: Slides in from right
- **Features**:
  - List all feedback with thumbnails
  - Click to view/edit
  - Individual delete buttons
  - "Clear all" option
  - Export button
- **Hidden by default**: Only shows when requested

### 5. Data Persistence
- **Storage**: localStorage
- **Persistence**: Survives page refreshes
- **No external calls**: Completely local

### 6. Export Functionality

#### Export Options:
1. **Text only** (Quick sharing)
   - Format: Markdown without images
   - Use case: Slack, email, issue trackers

2. **Full export** (Complete archive)
   - Format: ZIP file containing:
     - `feedback.md` - Human-readable with image references
     - `feedback.json` - Machine-readable with base64 images
     - `images/` - Folder with PNG screenshots
   - Use case: Documentation, LLM processing, archival

## Data Captured

### Required Data
- **Component name**: Detected or "Unknown Component"
- **Component path**: Full tree (e.g., `App > Dashboard > Card > Button`)
- **Screenshot**: Of the selected component
- **Comment**: User's feedback text
- **URL**: Current page location
- **Timestamp**: When feedback was created
- **Browser info**: UserAgent, viewport size

### Optional Data (if easily accessible)
- **Console logs**: Recent console output
- **Network activity**: Recent API calls
- **localStorage snapshot**: Current state

## User Flow

```
1. User clicks FAB
2. Selects "New feedback"
3. Clicks/taps component to comment on
4. Modal opens with component info
5. User writes comment
6. Can minimize to keep browsing (optional)
7. Submits feedback → saved to localStorage
8. Continues adding more feedback
9. Opens manager to review all feedback
10. Exports as markdown or ZIP
11. Shares via preferred channel (email, Slack, etc.)
```

## Implementation Notes

### Technology Stack
- **Core**: React 18+ (modern React)
- **Icons**: Embedded SVGs (no external dependencies)
- **Styling**: Plain CSS with CSS variables (no CSS-in-JS libs)
- **Screenshots**: html2canvas (already in POC)
- **Build**: TypeScript + Rollup
- **Package**: npm/yarn compatible

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Android)
- No IE11 support

### Performance Considerations
- Lazy load screenshot library
- Minimal bundle size (<50KB gzipped goal)
- No runtime performance impact when not active

### Security Considerations
- No data leaves the browser
- Screenshot capture respects CORS
- Sanitize HTML in comments for display
- Clear security warnings if capturing sensitive data

## Future Considerations (Not MVP)
- Annotation/drawing on screenshots
- Categories/tags for feedback
- Keyboard shortcuts
- Integration templates for common tools
- Feedback threading/conversations
- Session replay integration

## Success Metrics
- Zero-config installation works on first try
- Can capture feedback on any React component
- Export works reliably across browsers
- No performance impact on host application
- Clear enough for non-technical stakeholders to use