# Council Review: Phase 3 — Strategic UX Features

**Date:** 2026-03-27
**Phase:** 3 — Strategic UX Features
**Active Experts:** security, architecture, testing, test-quality, frontend

## Summary

| Category | Total | Fixed | Deferred | Descoped |
|----------|-------|-------|----------|----------|
| P1       | 2     | 2     | 0        | 0        |
| P2       | 18    | 4     | 14       | 0        |
| P3       | 14    | 0     | 14       | 0        |
| **Total**| **34**| **6** | **28**   | **0**    |

## P1 Findings (All Fixed)

### FE-006: BreadcrumbTrail not wired into app lifecycle
- **Status:** fixed (1bc1338)
- BreadcrumbTrail was created but never instantiated or wired into FeedbackApp. Added activate/update/deactivate calls.

### FE-013: Keyboard selection missing ARIA announcements
- **Status:** fixed (1bc1338)
- setCurrentElement now calls announceToLiveRegion with the human-readable name.

## P2 Findings

### Fixed

| ID | Issue | Status |
|----|-------|--------|
| ARCH-003/FE-002 | highlightElement captured rect before smooth scroll completed | fixed — changed to `behavior: 'instant'` (1bc1338) |
| ARCH-005 | Multiple highlight overlays accumulated on rapid re-invocation | fixed — cleanup existing overlay before creating new one (1bc1338) |
| FE-014 | Extension element check missing breadcrumb + aria-live IDs | fixed — added to EXTENSION_IDS set (1bc1338) |
| app.test.ts | 8 pre-existing failures due to missing mocks | fixed — added detection, CSS selector, breadcrumb, relocator mocks (1bc1338) |

### Deferred

| ID | Expert | Issue | Rationale |
|----|--------|-------|-----------|
| SEC-001 | security | innerHTML in showToast with message param | Current callers all use hardcoded strings; no user input flows to toast messages. Low risk. |
| SEC-002 | security | Unvalidated postMessage origin in detection controller | Pre-existing pattern, not introduced by phase 3. Address in security-focused phase. |
| SEC-004 | security | Detection bridge accepts selector from any postMessage sender | Pre-existing, same as SEC-002. |
| SEC-005 | security | handleBridgeResult uses untyped 'any' for message data | Pre-existing, lower priority than origin validation. |
| ARCH-001 | architecture | Duplicated buildTypePrefix across both exporters | ~8 lines each; will extract if a third exporter is added. |
| ARCH-004 | architecture | BreadcrumbTrail double ancestor chain traversal | Microsecond-level overhead; optimize if profiling shows it matters. |
| ARCH-007 | architecture | getHumanReadableName has hidden document.getElementById dependency | Works correctly in all current environments; parameterize if SSR support added. |
| FE-003 | frontend | Selection banner doesn't mention scroll/keyboard controls | UX improvement for next phase. |
| FE-005 | frontend | No ARIA announcement at DOM navigation boundaries | UX improvement; current behavior (no-op) is not harmful, just not ideal. |
| FE-007 | frontend | Details toggle missing aria-controls attribute | Accessibility enhancement for next phase. |
| FE-008 | frontend | Sort reorder reverses DOM order instead of sorting by timestamp | Current usage always starts from a known order; refactor if bugs reported. |
| FE-011 | frontend | Sidebar filter tabs lack tabpanel + arrow key navigation | Pre-existing; address in accessibility-focused phase. |
| FE-012 | frontend | Modal focus not restored to trigger on close | Pre-existing; address in accessibility-focused phase. |
| TEST-003 | testing | Detection controller tests mock entire detection package | Acceptable for unit tests; integration coverage provided by E2E tests. |

## P3 Findings (All Deferred)

SEC-003, SEC-006, SEC-007, SEC-008, ARCH-002, ARCH-006, ARCH-008, FE-004, FE-009, FE-010, TEST-008, TQ-001, TQ-002, TQ-005 — all deferred as minor improvements for future phases.

## Dedup Notes

- ARCH-003 and FE-002 identified same issue (highlight position after smooth scroll) — merged, kept frontend expert's fix recommendation.
- TEST-001 reclassified: E2E test files exist at `e2e/tests/*.spec.ts`, alignment checker looked for `e2e/*.e2e.ts` naming.
