/**
 * Extension CSS — injected into shadow DOM as a string
 * Uses :host instead of :root for shadow DOM variable scoping
 */

export const EXTENSION_CSS = `
:host {
  /* Colors */
  --fb-primary: #3b82f6;
  --fb-primary-hover: #2563eb;
  --fb-error: #ef4444;
  --fb-success: #10b981;
  --fb-warning: #f59e0b;

  /* Text */
  --fb-text: #1f2937;
  --fb-text-secondary: #6b7280;
  --fb-text-muted: #6b7280;
  --fb-text-inverse: #ffffff;

  /* Backgrounds */
  --fb-bg: #ffffff;
  --fb-bg-secondary: #f9fafb;
  --fb-bg-tertiary: #f3f4f6;
  --fb-bg-overlay: rgba(0, 0, 0, 0.5);

  /* Borders */
  --fb-border: #e5e7eb;
  --fb-border-focus: #3b82f6;

  /* Shadows */
  --fb-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --fb-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --fb-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  /* Typography */
  --fb-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --fb-radius: 8px;
  --fb-transition: 200ms ease-in-out;

  font-family: var(--fb-font);
  font-size: 14px;
  line-height: 1.5;
  color: var(--fb-text);
}

@media (prefers-color-scheme: dark) {
  :host {
    --fb-text: #f9fafb;
    --fb-text-secondary: #d1d5db;
    --fb-text-muted: #d1d5db;
    --fb-text-inverse: #111827;
    --fb-bg: #1f2937;
    --fb-bg-secondary: #374151;
    --fb-bg-tertiary: #4b5563;
    --fb-bg-overlay: rgba(0, 0, 0, 0.7);
    --fb-border: #4b5563;
  }
}

.feedbacker-container {
  all: initial;
  font-family: var(--fb-font);
  font-size: 14px;
  line-height: 1.5;
  color: var(--fb-text);
}

/* ---- FAB ---- */
/* ---- Pill FAB ---- */
.fb-fab-pill {
  position: fixed;
  display: flex;
  align-items: center;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: var(--fb-shadow-lg);
  z-index: 10000;
  transition: transform var(--fb-transition), box-shadow var(--fb-transition);
}
.fb-fab-pill:hover {
  transform: scale(1.04);
  box-shadow: var(--fb-shadow-xl);
}
.fb-fab-capture {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--fb-primary);
  color: white;
  border: none;
  cursor: pointer;
  font-family: var(--fb-font);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: background var(--fb-transition);
}
.fb-fab-capture:hover {
  background: var(--fb-primary-hover);
}
.fb-fab-count {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  background: var(--fb-primary);
  color: white;
  border: none;
  border-left: 1px solid rgba(255,255,255,0.25);
  cursor: pointer;
  font-family: var(--fb-font);
  font-size: 13px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
  transition: background var(--fb-transition);
}
.fb-fab-count:hover {
  background: var(--fb-primary-hover);
}

/* ---- Modal ---- */
.fb-modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--fb-bg-overlay);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fb-modal {
  background: var(--fb-bg);
  border-radius: 12px;
  box-shadow: var(--fb-shadow-xl);
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: auto;
  z-index: 10002;
  animation: fb-modal-in 200ms ease-out;
}
.fb-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--fb-border);
}
.fb-modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--fb-text);
}
.fb-modal-body {
  padding: 20px;
}
.fb-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--fb-border);
}
.fb-screenshot-preview {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: var(--fb-radius);
  border: 1px solid var(--fb-border);
  margin-bottom: 12px;
}
/* Type chip bar (PH-012) */
.fb-type-chip-wrapper {
  margin-bottom: 12px;
}
.fb-type-chip-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.fb-type-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: 16px;
  border: 1.5px solid var(--fb-border);
  background: var(--fb-bg);
  color: var(--fb-text);
  font-family: var(--fb-font);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms;
  outline: none;
}
.fb-type-chip:hover {
  border-color: var(--fb-border-focus);
}
.fb-type-chip:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
.fb-type-chip-selected.fb-type-chip-suggestion {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}
.fb-type-chip-selected.fb-type-chip-bug {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}
.fb-type-chip-selected.fb-type-chip-question {
  background: #8b5cf6;
  border-color: #8b5cf6;
  color: #fff;
}
/* Severity sub-control */
.fb-severity-control {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.fb-severity-label {
  font-size: 13px;
  color: var(--fb-text-secondary);
  font-weight: 500;
}
.fb-severity-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid var(--fb-border);
  background: var(--fb-bg);
  color: var(--fb-text);
  font-family: var(--fb-font);
  font-size: 12px;
  cursor: pointer;
  transition: all 150ms;
  outline: none;
}
.fb-severity-chip:hover {
  border-color: var(--fb-border-focus);
}
.fb-severity-chip:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
.fb-severity-chip-selected {
  background: #fef2f2;
  border-color: #ef4444;
  color: #dc2626;
}
.fb-textarea {
  width: 100%;
  min-height: 100px;
  padding: 10px 12px;
  border: 1px solid var(--fb-border);
  border-radius: var(--fb-radius);
  font-family: var(--fb-font);
  font-size: 14px;
  resize: vertical;
  color: var(--fb-text);
  background: var(--fb-bg);
  box-sizing: border-box;
}
.fb-textarea:focus {
  outline: none;
  border-color: var(--fb-border-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.fb-component-path {
  font-size: 12px;
  color: var(--fb-text-secondary);
  margin-bottom: 12px;
}

/* ---- Buttons ---- */
.fb-btn {
  padding: 8px 16px;
  border-radius: var(--fb-radius);
  font-family: var(--fb-font);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background var(--fb-transition);
}
.fb-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.fb-btn-primary {
  background: var(--fb-primary);
  color: white;
}
.fb-btn-primary:hover:not(:disabled) { background: var(--fb-primary-hover); }
.fb-btn-secondary {
  background: var(--fb-bg-secondary);
  color: var(--fb-text);
  border-color: var(--fb-border);
}
.fb-btn-secondary:hover { background: var(--fb-bg-tertiary); }
.fb-btn-danger {
  background: var(--fb-error);
  color: white;
}
.fb-btn-danger:hover { background: #dc2626; }
.fb-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  color: var(--fb-text-secondary);
}
.fb-btn-icon:hover {
  background: var(--fb-bg-tertiary);
  color: var(--fb-text);
}
.fb-btn-icon[data-tooltip] {
  position: relative;
}
.fb-btn-icon[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background: var(--fb-text);
  color: var(--fb-bg);
  font-size: 11px;
  font-family: var(--fb-font);
  white-space: nowrap;
  border-radius: 4px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 100ms;
}
.fb-btn-icon[data-tooltip]:hover::after {
  opacity: 1;
}

/* ---- Sidebar ---- */
.fb-sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: var(--fb-bg-overlay);
  z-index: 10001;
}
.fb-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  max-width: 90vw;
  height: 100vh;
  background: var(--fb-bg);
  box-shadow: var(--fb-shadow-xl);
  z-index: 10002;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fb-sidebar-in 200ms ease-out;
}
.fb-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--fb-border);
}
.fb-sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.fb-sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* ---- Feedback Card ---- */
.fb-card {
  background: var(--fb-bg);
  border: 1px solid var(--fb-border);
  border-radius: var(--fb-radius);
  padding: 12px;
  margin-bottom: 8px;
}
.fb-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.fb-card-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--fb-text);
}
.fb-card-time {
  font-size: 11px;
  color: var(--fb-text-muted);
}
.fb-card-comment {
  font-size: 13px;
  color: var(--fb-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.fb-screenshot-wrap {
  position: relative;
  border: 1px solid var(--fb-border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}
.fb-card-screenshot {
  width: 100%;
  max-height: 120px;
  object-fit: cover;
  display: block;
}
.fb-screenshot-copy {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--fb-bg) !important;
  border: 1px solid var(--fb-border) !important;
  box-shadow: var(--fb-shadow);
  opacity: 0;
  transition: opacity 150ms;
}
.fb-screenshot-wrap:hover .fb-screenshot-copy {
  opacity: 0.85;
}
.fb-screenshot-copy:hover {
  opacity: 1 !important;
}
.fb-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.fb-card-hidden {
  display: none !important;
}

/* ---- Type Badge ---- */
.fb-type-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 4px;
  font-family: var(--fb-font);
}
.fb-type-bug {
  background: #fde8e8;
  color: #b91c1c;
}
.fb-type-suggestion {
  background: #dbeafe;
  color: #1d4ed8;
}
.fb-type-question {
  background: #ede9fe;
  color: #6d28d9;
}
.fb-badge-row {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}
.fb-severity-critical {
  background: #fde8e8;
  color: #b91c1c;
}
.fb-severity-major {
  background: #fef3c7;
  color: #92400e;
}
.fb-severity-minor {
  background: var(--fb-bg-tertiary);
  color: var(--fb-text-secondary);
}

/* ---- Search & Sort Bar ---- */
.fb-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--fb-border);
}
.fb-search-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--fb-border);
  border-radius: var(--fb-radius);
  font-size: 13px;
  font-family: var(--fb-font);
  background: var(--fb-bg);
  color: var(--fb-text);
  outline: none;
  transition: border-color 150ms;
}
.fb-search-input:focus {
  border-color: var(--fb-primary);
}
.fb-search-input::placeholder {
  color: var(--fb-text-muted);
}
.fb-sort-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid var(--fb-border);
  border-radius: var(--fb-radius);
  font-size: 12px;
  font-family: var(--fb-font);
  background: var(--fb-bg);
  color: var(--fb-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms;
}
.fb-sort-btn:hover {
  border-color: var(--fb-primary);
  color: var(--fb-primary);
}
.fb-no-match {
  text-align: center;
  padding: 32px 16px;
  color: var(--fb-text-muted);
  font-size: 13px;
}

/* ---- Confirm Dialog ---- */
.fb-confirm {
  background: var(--fb-bg);
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  box-shadow: var(--fb-shadow-xl);
}
.fb-confirm h4 {
  margin: 0 0 8px;
  font-size: 16px;
}
.fb-confirm p {
  margin: 0 0 20px;
  color: var(--fb-text-secondary);
  font-size: 14px;
}
.fb-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* ---- Export Dialog ---- */
.fb-export-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--fb-border);
  border-radius: var(--fb-radius);
  cursor: pointer;
  margin-bottom: 8px;
  transition: border-color var(--fb-transition);
}
.fb-export-option:hover {
  border-color: var(--fb-primary);
}
.fb-export-option-text h4 {
  margin: 0;
  font-size: 14px;
}
.fb-export-option-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--fb-text-secondary);
}

/* ---- Empty state ---- */
.fb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--fb-text-muted);
  text-align: center;
}
.fb-empty-illustration {
  color: var(--fb-text-muted);
  margin-bottom: 16px;
}
.fb-empty h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--fb-text);
}
.fb-empty p {
  margin: 0 0 20px;
  font-size: 13px;
  color: var(--fb-text-secondary);
}
.fb-empty .fb-btn {
  margin-top: 4px;
}

/* ---- Draft indicator ---- */
.fb-draft-badge {
  font-size: 11px;
  color: var(--fb-warning);
  font-weight: 500;
}

/* ---- Focus-visible (box-shadow per ADR-001) ---- */
.fb-btn:focus-visible,
.fb-btn-icon:focus-visible,
.fb-fab-capture:focus-visible,
.fb-fab-count:focus-visible,
.fb-export-option:focus-visible,
.fb-toast-undo-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

/* ---- Submit hint ---- */
.fb-submit-hint {
  font-size: 12px;
  color: var(--fb-text-muted);
  margin-right: auto;
  align-self: center;
}

/* ---- Draft saved indicator ---- */
.fb-draft-saved {
  font-size: 12px;
  color: var(--fb-success);
  margin-top: 4px;
  transition: opacity 300ms ease;
}

/* ---- Toast ---- */
.fb-toast {
  position: fixed;
  bottom: 88px;
  right: 24px;
  background: var(--fb-bg);
  border: 1px solid var(--fb-border);
  border-radius: var(--fb-radius);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--fb-shadow-lg);
  z-index: 10003;
  font-family: var(--fb-font);
  font-size: 13px;
  color: var(--fb-text);
  animation: fb-toast-in 200ms ease-out;
}

@keyframes fb-toast-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ---- Badge bump ---- */
@keyframes fb-badge-bump {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}
.fb-badge-bump {
  animation: fb-badge-bump 300ms ease-in-out;
}

/* ---- Coach mark ---- */
.fb-coach-mark {
  position: fixed;
  bottom: 88px;
  right: 24px;
  background: var(--fb-text);
  color: var(--fb-bg);
  padding: 8px 12px;
  border-radius: var(--fb-radius);
  font-size: 13px;
  font-family: var(--fb-font);
  box-shadow: var(--fb-shadow-lg);
  z-index: 10000;
  white-space: nowrap;
  pointer-events: auto;
}

/* ---- FAB pulse ---- */
@keyframes fb-pulse {
  0%, 100% { box-shadow: var(--fb-shadow-lg); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), var(--fb-shadow-lg); }
}
.fb-fab-pulse {
  animation: fb-pulse 1.5s ease-in-out infinite;
}

/* ---- Undo toast (inline in sidebar) ---- */
.fb-toast-inline {
  background: var(--fb-bg-secondary);
  border: 1px solid var(--fb-border);
  border-radius: var(--fb-radius);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--fb-font);
  font-size: 13px;
  color: var(--fb-text);
  margin: 8px 12px;
  animation: fb-toast-in 200ms ease-out;
}
.fb-toast-undo {
  border-left: 4px solid var(--fb-error);
}
.fb-toast-undo-btn {
  background: none;
  border: none;
  color: var(--fb-primary);
  font-family: var(--fb-font);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
  white-space: nowrap;
}
.fb-toast-undo-btn:hover {
  background: var(--fb-bg-tertiary);
}

/* ---- Inline edit ---- */
.fb-inline-edit-textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px 10px;
  border: 1px solid var(--fb-border-focus);
  border-radius: 4px;
  font-family: var(--fb-font);
  font-size: 13px;
  resize: vertical;
  color: var(--fb-text);
  background: var(--fb-bg);
  box-sizing: border-box;
  line-height: 1.5;
}
.fb-inline-edit-textarea:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

/* ---- Saved indicator ---- */
.fb-saved-indicator {
  font-size: 12px;
  color: var(--fb-success);
  font-weight: 500;
  animation: fb-saved-fade 2s ease-out forwards;
}
@keyframes fb-saved-fade {
  0%, 60% { opacity: 1; }
  100% { opacity: 0; }
}

/* ---- Milestone ---- */
.fb-milestone {
  font-size: 12px;
  font-weight: 600;
  color: var(--fb-primary);
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.1);
  animation: fb-milestone-pulse 1.5s ease-in-out;
}
@keyframes fb-milestone-pulse {
  0%, 100% { background: rgba(59, 130, 246, 0.1); }
  50% { background: rgba(59, 130, 246, 0.2); }
}

/* ---- Selection banner ---- */
.fb-selection-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2147483646;
  background: var(--fb-primary);
  color: white;
  text-align: center;
  padding: 10px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* ---- Entrance animations ---- */
@keyframes fb-sidebar-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes fb-modal-in {
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
/* ---- Reduced motion (ADR-002) ---- */
@media (prefers-reduced-motion: reduce) {
  :host *,
  :host *::before,
  :host *::after {
    transition-duration: 0s !important;
    animation-duration: 0s !important;
    transition-delay: 0s !important;
    animation-delay: 0s !important;
  }
}
`;
