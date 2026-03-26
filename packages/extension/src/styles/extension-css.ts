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
  --fb-text-muted: #9ca3af;
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
    --fb-text-muted: #9ca3af;
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
.fb-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--fb-primary);
  color: var(--fb-text-inverse);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--fb-shadow-lg);
  transition: transform var(--fb-transition), box-shadow var(--fb-transition);
  z-index: 10000;
}
.fb-fab:hover {
  transform: scale(1.08);
  box-shadow: var(--fb-shadow-xl);
  background: var(--fb-primary-hover);
}
.fb-fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--fb-error);
  color: white;
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
.fb-fab-draft {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--fb-warning);
  border: 2px solid var(--fb-primary);
}

/* ---- FAB Actions ---- */
.fb-fab-actions {
  position: fixed;
  bottom: 88px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10000;
}
.fb-fab-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--fb-bg);
  border: 1px solid var(--fb-border);
  border-radius: var(--fb-radius);
  cursor: pointer;
  box-shadow: var(--fb-shadow);
  white-space: nowrap;
  font-family: var(--fb-font);
  font-size: 13px;
  color: var(--fb-text);
  transition: transform var(--fb-transition), box-shadow var(--fb-transition);
}
.fb-fab-action:hover {
  transform: translateX(-4px);
  box-shadow: var(--fb-shadow-lg);
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
.fb-btn-primary {
  background: var(--fb-primary);
  color: white;
}
.fb-btn-primary:hover { background: var(--fb-primary-hover); }
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
  padding: 6px;
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
.fb-sidebar-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--fb-border);
  display: flex;
  gap: 8px;
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
.fb-card-screenshot {
  width: 100%;
  max-height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
}
.fb-card-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
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
  text-align: center;
  padding: 40px 20px;
  color: var(--fb-text-muted);
}
.fb-empty p {
  margin: 8px 0 0;
  font-size: 13px;
}

/* ---- Draft indicator ---- */
.fb-draft-badge {
  font-size: 11px;
  color: var(--fb-warning);
  font-weight: 500;
}
`;
