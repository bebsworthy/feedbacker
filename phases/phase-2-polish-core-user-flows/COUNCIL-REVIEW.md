# Council Review: Phase 2 — Polish Core User Flows

date: 2026-03-27
phase: 2
title: Polish Core User Flows
experts: security, architecture, testing, test-quality, frontend

## Summary

| Category | Total | Fixed | Deferred | Descoped |
|----------|-------|-------|----------|----------|
| P1 Critical | 4 | 4 | 0 | 0 |
| P2 Important | 17 | 8 | 9 | 0 |
| P3 Minor | 13 | 0 | 13 | 0 |
| **Total** | **34** | **12** | **22** | **0** |

## P1 Findings (All Resolved)

### FE-001: Undo toast button missing focus-visible indicator
- **Domain:** frontend
- **File:** extension-css.ts
- **Disposition:** fixed (1b9dcf0)
- Added `.fb-toast-undo-btn:focus-visible` to focus ring selector list

### TQ-001 / TEST-002: Milestone tests assert logger.debug instead of UI
- **Domain:** test-quality, testing
- **File:** app.test.ts
- **Disposition:** fixed (1b9dcf0)
- Rewrote T-030/T-031 to assert `.fb-milestone` DOM elements

### TQ-010: T-029 doesn't verify rotation
- **Domain:** test-quality
- **File:** app.test.ts
- **Disposition:** fixed (1b9dcf0)
- Renamed to "Toast message is from valid set"; T-030 covers actual rotation

### FE-011: Filter tabs missing tabpanel and arrow key navigation
- **Domain:** frontend
- **File:** sidebar.ts
- **Disposition:** fixed — pre-existing accessibility gap addressed in P1 fix batch
- Note: This is a pre-existing issue from Phase 1, but classified P1 for WCAG compliance

## P2 Findings

### ARCH-002 / FE-002 / SEC-009: Duplicate Escape handlers + leak
- **Domain:** architecture, frontend, security
- **File:** sidebar.ts
- **Disposition:** fixed (1b9dcf0)
- Removed document-level listener; sidebar-scoped listener is sufficient

### ARCH-005: Pending-delete item appears in exports
- **Domain:** architecture
- **File:** app.ts
- **Disposition:** fixed (1b9dcf0)
- Added `getVisibleFeedbacks()` helper filtering pendingDelete.id

### ARCH-007 / FE-004: Error toast uses success icon
- **Domain:** architecture, frontend
- **File:** app.ts
- **Disposition:** fixed (1b9dcf0)
- Added type parameter to showToast; error variant uses cross icon

### ARCH-008: Blur save has 1s debounce risking data loss
- **Domain:** architecture
- **File:** inline-edit.ts
- **Disposition:** fixed (1b9dcf0)
- Blur now saves immediately; debounce only for typing auto-save

### ARCH-009: Inline edit destroy doesn't flush pending save
- **Domain:** architecture
- **File:** inline-edit.ts
- **Disposition:** fixed (1b9dcf0)
- destroy() now flushes pending save before clearing

### ARCH-010 / FE-010: Export dialog closes before async clipboard completes
- **Domain:** architecture, frontend
- **File:** export-dialog.ts, app.ts
- **Disposition:** deferred — dialog-stays-open pattern requires refactoring ExportDialog callback contract; low real-world impact since toast still shows error

### FE-006: Milestone badge persists forever
- **Domain:** frontend
- **File:** app.ts
- **Disposition:** fixed (1b9dcf0)
- Added 5s auto-remove timer

### FE-008 / TEST-004: Copy All not disabled at zero count
- **Domain:** frontend, testing
- **File:** export-dialog.ts
- **Disposition:** deferred — caller already guards with count check; defensive-only gap

### FE-012: Inline edit error indicator has no ARIA announcement
- **Domain:** frontend
- **File:** inline-edit.ts
- **Disposition:** deferred — phase 3 accessibility pass

### SEC-001 / SEC-002: innerHTML with message parameter
- **Domain:** security
- **File:** app.ts
- **Disposition:** deferred — all callers use hardcoded strings; pattern is fragile but safe today

### SEC-003: postMessage listener lacks origin validation
- **Domain:** security
- **File:** detection-controller.ts
- **Disposition:** deferred — pre-existing, not introduced in phase 2

### SEC-007: querySelector with unescaped ID
- **Domain:** security
- **File:** inline-edit.ts
- **Disposition:** deferred — IDs are internally generated with Date.now + Math.random, no user input

### ARCH-004 / FE-013: Banner not in isExtensionElement
- **Domain:** architecture, frontend
- **File:** detection-controller.ts
- **Disposition:** deferred — pointer-events: none mitigates; no practical attack vector

### ARCH-006: showMilestoneIfNeeded reaches into sidebar DOM
- **Domain:** architecture
- **File:** app.ts
- **Disposition:** deferred — refactor candidate for phase 3; works correctly today

### TQ-002: T-013/T-014 are identical tests
- **Domain:** test-quality
- **File:** app.test.ts
- **Disposition:** deferred — both paths converge on same callback; E2E covers distinct triggers

### TQ-004: Export option selected by positional index
- **Domain:** test-quality
- **File:** app.test.ts
- **Disposition:** deferred — fragile but functional; documented with comments

## P3 Findings (All Deferred)

| ID | Title | Domain | Rationale |
|----|-------|--------|-----------|
| ARCH-001 | Dead editFeedback method | architecture | Cleanup candidate for phase 3 |
| ARCH-003 / FE-003 | Dead CSS for selection banner | architecture | No runtime impact |
| ARCH-011 | Reduced motion gap for banner | architecture | Banner has no animation currently |
| ARCH-012 | addFeedback used for create+update | architecture | Semantic rename candidate |
| SEC-004 | handleBridgeResult untyped any | security | Pre-existing |
| SEC-005 | Export dialog feedbackCount innerHTML | security | Type-safe number |
| SEC-006 | createOption innerHTML | security | Hardcoded callers only |
| SEC-008 | Banner on document.body | security | Accepted ADR-P2-003 |
| SEC-010 | Non-crypto randomness for IDs | security | Local-only storage |
| FE-005 | Textarea focus vs focus-visible | frontend | Acceptable for textareas |
| FE-007 | Save fires on unchanged content | frontend | Low impact |
| FE-009 | CTA destroys sidebar from within | frontend | Works due to JS event model |
| FE-014 | Comment line-clamp truncation | frontend | Intentional compact display |

## Dedup Notes

- ARCH-002 + FE-002 + SEC-009: Same duplicate Escape handler issue from three angles → kept ARCH-002 as primary
- ARCH-003 + FE-003: Same dead CSS → kept ARCH-003
- ARCH-007 + FE-004: Same error icon issue → merged
- ARCH-004 + FE-013: Same banner isExtensionElement → merged
- ARCH-010 + FE-010: Same dialog-close-before-async → merged
- TEST-002 + TQ-001: Same milestone logger assertion → kept TQ-001
- TEST-007 + TQ-012: Same E2E milestone count-10 gap → kept TQ-012
- TEST-010 + TQ-005: Same CSS string-matching concern → kept TQ-005
- TEST-004 + FE-008: Same zero-count Copy All gap → kept FE-008
