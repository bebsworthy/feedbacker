/**
 * FeedbackApp — main controller that wires together all UI components
 * Renders FAB, modal, sidebar, and overlay in the shadow DOM container
 *
 * Note: Exceeds 200-line guideline due to imperative DOM construction and
 * controller coordination across FAB, modal, sidebar, overlay, toast, banner,
 * and undo-delete lifecycle. Cannot be reasonably split as all methods share
 * private state (pendingDelete, selectionBanner, toastMessageIndex) and the
 * DOM container reference.
 */

import type { Feedback } from '@feedbacker/core';
import { captureHtmlSnippet, logger, MarkdownExporter } from '@feedbacker/core';
import type { ComponentInfo } from '@feedbacker/detection';
import { StateManager } from '../core/state-manager';
import { DetectionController } from '../core/detection-controller';
import { FAB } from './fab';
import { FeedbackModal } from './modal';
import { ManagerSidebar } from './sidebar';
import { ComponentOverlayUI } from './overlay';
import { ConfirmDialog } from './confirm-dialog';
import { ExportDialog } from './export-dialog';
import { MinimizedState } from './minimized-state';
import { checkIcon } from './icons';

/** Rotating toast messages for submit confirmation (PH-012) */
const SUBMIT_TOAST_MESSAGES = [
  'Feedback saved!',
  'Got it!',
  'Captured!',
  'Nice catch!',
] as const;

/** Milestone thresholds and messages (PH-012) */
const MILESTONES: ReadonlyArray<{ count: number; text: string }> = [
  { count: 5, text: 'Thorough review!' },
  { count: 10, text: 'Detailed review!' },
];

/** Tracks a deferred deletion awaiting undo or finalization (PH-009) */
interface PendingDelete {
  id: string;
  feedback: Feedback;
  timer: ReturnType<typeof setTimeout>;
  previousIndex: number;
}

export class FeedbackApp {
  private container: HTMLDivElement;
  private state: StateManager;
  private detection: DetectionController;
  private visible = true;
  private settings: { position?: string; primaryColor?: string; autoCopy?: boolean } = {};

  // UI components
  private fab: FAB | null = null;
  private modal: FeedbackModal | null = null;
  private sidebar: ManagerSidebar | null = null;
  private overlay: ComponentOverlayUI | null = null;
  private confirmDialog: ConfirmDialog | null = null;
  private exportDialog: ExportDialog | null = null;
  private minimizedState: MinimizedState | null = null;
  private liveRegion: HTMLDivElement | null = null;

  // Undo delete state (PH-009)
  private pendingDelete: PendingDelete | null = null;

  // Selection banner (PH-011)
  private selectionBanner: HTMLDivElement | null = null;

  // Toast message rotation (PH-012)
  private toastMessageIndex = 0;

  constructor(container: HTMLDivElement, state: StateManager, detection: DetectionController) {
    this.container = container;
    this.state = state;
    this.detection = detection;

    // Set up detection callbacks
    this.detection.setCallbacks(
      (info) => this.onComponentHover(info),
      (info) => this.onComponentSelect(info)
    );

    // Set up lifecycle callbacks for selection banner (PH-011)
    this.detection.setLifecycleCallbacks(
      () => this.showSelectionBanner(),
      () => this.dismissSelectionBanner()
    );
  }

  render(settings?: { position?: string; primaryColor?: string; autoCopy?: boolean }): void {
    this.settings = settings || {};
    // Create FAB
    this.fab = new FAB(this.container, {
      feedbackCount: this.state.feedbacks.length,
      hasDraft: this.state.draft !== null,
      position: settings?.position,
      primaryColor: settings?.primaryColor,
      onNewFeedback: () => this.startCapture(),
      onShowManager: () => this.showSidebar(),
      onExport: () => this.showExportDialog()
    });

    // Create overlay (outside shadow DOM — appended to document.body)
    this.overlay = new ComponentOverlayUI();

    // ARIA live region for screen reader announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.style.cssText = 'position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap;';
    this.container.appendChild(this.liveRegion);

    // First-use coach mark
    chrome.storage.local.get('feedbacker-onboarding-shown').then((result) => {
      if (!result['feedbacker-onboarding-shown']) {
        this.showCoachMark();
      }
    }).catch(() => {
      this.showCoachMark(); // On error, show it anyway
    });

    logger.debug('FeedbackApp rendered');
  }

  applySettings(settings: { position?: string; primaryColor?: string; autoCopy?: boolean }): void {
    this.settings = { ...this.settings, ...settings };
    if (settings.position) this.fab?.applyPosition(settings.position);
    if (settings.primaryColor) this.fab?.applyColor(settings.primaryColor);
  }

  toggle(): void {
    this.visible = !this.visible;
    if (this.fab) {
      this.fab.setVisible(this.visible);
    }
    if (!this.visible) {
      this.detection.deactivate();
      this.overlay?.hide();
    }
  }

  destroy(): void {
    if (this.pendingDelete) {
      clearTimeout(this.pendingDelete.timer);
      this.pendingDelete = null;
    }
    this.dismissSelectionBanner();
    this.fab?.destroy();
    this.modal?.destroy();
    this.sidebar?.destroy();
    this.overlay?.destroy();
    this.detection.destroy();
    this.container.innerHTML = '';
  }

  // ---- Announcements and feedback ----

  private announce(message: string): void {
    if (!this.liveRegion) return;
    this.liveRegion.textContent = '';
    requestAnimationFrame(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    });
  }

  private showToast(message: string, durationMs = 3500): void {
    // Remove any existing toast (undo or informational)
    this.container.querySelector('.fb-toast')?.remove();

    const toast = document.createElement('div');
    toast.className = 'fb-toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `${checkIcon(16, 'var(--fb-success)')} <span>${message}</span>`;
    this.container.appendChild(toast);

    // Badge count animation
    const badge = this.container.querySelector('.fb-fab-badge') as HTMLElement | null;
    if (badge) {
      badge.classList.add('fb-badge-bump');
      setTimeout(() => badge.classList.remove('fb-badge-bump'), 400);
    }

    setTimeout(() => toast.remove(), durationMs);
  }

  /** Show undo toast with action button; overrides any active informational toast (PH-009) */
  private showUndoToast(message: string, onUndo: () => void, timeoutMs = 8000): void {
    // Remove any existing toast (priority override per ADR-P2-002)
    this.container.querySelector('.fb-toast')?.remove();

    const toast = document.createElement('div');
    toast.className = 'fb-toast fb-toast-undo';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `<span>${message}</span>`;

    const undoBtn = document.createElement('button');
    undoBtn.className = 'fb-toast-undo-btn';
    undoBtn.textContent = 'Undo';
    undoBtn.addEventListener('click', () => {
      toast.remove();
      onUndo();
    });
    toast.appendChild(undoBtn);

    this.container.appendChild(toast);

    setTimeout(() => toast.remove(), timeoutMs);
  }

  private showCoachMark(): void {
    const mark = document.createElement('div');
    mark.className = 'fb-coach-mark';
    mark.textContent = 'Click to start giving feedback';
    this.container.appendChild(mark);

    // Pulse animation on FAB
    const fabEl = this.container.querySelector('.fb-fab') as HTMLElement | null;
    if (fabEl) fabEl.classList.add('fb-fab-pulse');

    const dismiss = (): void => {
      mark.remove();
      fabEl?.classList.remove('fb-fab-pulse');
      chrome.storage.local.set({ 'feedbacker-onboarding-shown': true }).catch(() => {});
    };

    mark.addEventListener('click', dismiss);
    fabEl?.addEventListener('click', dismiss, { once: true });
    setTimeout(dismiss, 8000);
  }

  // ---- Actions ----

  private startCapture(): void {
    this.fab?.collapse();
    this.detection.activate();
  }

  private onComponentHover(info: ComponentInfo | null): void {
    if (info) {
      this.overlay?.show(info);
    } else {
      this.overlay?.hide();
    }
  }

  private async onComponentSelect(info: ComponentInfo): Promise<void> {
    this.overlay?.hide();

    // Capture screenshot
    let screenshot: string | undefined;
    try {
      const response = await chrome.runtime.sendMessage({ type: 'capture-screenshot' });
      if (response?.success) {
        screenshot = await this.cropScreenshot(response.dataUrl, info.element);
      }
    } catch (error) {
      logger.warn('Screenshot capture failed:', error);
    }

    // Capture HTML snippet
    let htmlSnippet: string | undefined;
    try {
      htmlSnippet = captureHtmlSnippet(info.element);
    } catch {
      // Ignore
    }

    // Show modal
    this.showModal(info, screenshot, htmlSnippet);
  }

  private showModal(info: ComponentInfo, screenshot?: string, htmlSnippet?: string): void {
    this.modal?.destroy();
    this.modal = new FeedbackModal(this.container, {
      componentInfo: info,
      screenshot,
      htmlSnippet,
      draftComment: this.state.draft?.comment,
      onSubmit: async (comment: string) => {
        const feedback: Feedback = {
          id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          componentName: info.name,
          componentPath: info.path,
          comment,
          screenshot,
          htmlSnippet,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          browserInfo: {
            userAgent: navigator.userAgent,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            platform: navigator.platform
          }
        };
        await this.state.addFeedback(feedback);
        if (this.settings.autoCopy) {
          const markdown = MarkdownExporter.exportSingleItem(feedback);
          navigator.clipboard.writeText(markdown).catch(() => {});
        }
        this.modal?.destroy();
        this.modal = null;
        this.fab?.updateCount(this.state.feedbacks.length);
        this.fab?.updateDraft(false);
        this.showRotatingSubmitToast();
        this.showMilestoneIfNeeded();
        this.announce('Feedback saved');
      },
      onCancel: () => {
        this.modal?.destroy();
        this.modal = null;
      },
      onMinimize: (currentComment: string) => {
        this.modal?.destroy();
        this.modal = null;
        this.minimizedState?.destroy();
        this.minimizedState = new MinimizedState(this.container, {
          componentName: info.name,
          hasScreenshot: !!screenshot,
          hasDraft: !!currentComment.trim(),
          onRestore: () => {
            this.minimizedState?.destroy();
            this.minimizedState = null;
            this.showModal(info, screenshot, htmlSnippet);
          },
          onDiscard: () => {
            this.minimizedState?.destroy();
            this.minimizedState = null;
            this.state.clearDraft();
            this.fab?.updateDraft(false);
          }
        });
      },
      onDraftSave: (comment: string) => {
        this.state.saveDraft(info, comment, screenshot);
        this.fab?.updateDraft(true);
      }
    });
  }

  private showSidebar(): void {
    this.fab?.collapse();
    this.sidebar?.destroy();
    this.sidebar = new ManagerSidebar(this.container, {
      feedbacks: this.state.feedbacks,
      onClose: () => {
        this.sidebar?.destroy();
        this.sidebar = null;
      },
      onDelete: (id: string) => {
        this.handleDeleteWithUndo(id);
      },
      onSaveEdit: async (id: string, comment: string) => {
        const existing = this.state.feedbacks.find(f => f.id === id);
        if (existing) {
          const updated = { ...existing, comment, timestamp: new Date().toISOString() };
          await this.state.addFeedback(updated);
          this.sidebar?.updateFeedbacks(this.state.feedbacks);
        }
      },
      onShowExportDialog: () => this.showExportDialog(),
      onStartCapture: () => this.startCapture(),
      onAnnounce: (message: string) => this.announce(message)
    });
  }

  private showExportDialog(): void {
    this.fab?.collapse();
    if (this.state.feedbacks.length === 0) return;

    this.exportDialog?.destroy();
    this.exportDialog = new ExportDialog(this.container, {
      feedbackCount: this.state.feedbacks.length,
      onExport: (format) => this.doExport(format),
      onCopyAll: () => this.copyAllToClipboard(),
      onCancel: () => {
        this.exportDialog?.destroy();
        this.exportDialog = null;
      }
    });
  }

  private async copyAllToClipboard(): Promise<void> {
    try {
      const feedbacks = this.state.feedbacks;
      const markdown = MarkdownExporter.exportAsMarkdown(feedbacks);
      await navigator.clipboard.writeText(markdown);
      this.showToast(`Copied ${feedbacks.length} item${feedbacks.length !== 1 ? 's' : ''} to clipboard`);
      this.announce(`Copied ${feedbacks.length} items to clipboard`);
    } catch {
      this.showToast('Failed to copy. Please try again.');
    }
  }

  private async doExport(format: 'markdown' | 'zip'): Promise<void> {
    try {
      const { MarkdownExporter: MdExp, ZipExporter: ZipExp } = await import('@feedbacker/core');
      const feedbacks = this.state.feedbacks;

      if (format === 'markdown') {
        MdExp.downloadMarkdown(feedbacks, MdExp.generateFilename(feedbacks));
      } else {
        await ZipExp.downloadZip(feedbacks, ZipExp.generateZipFilename(feedbacks));
      }
      this.showToast('Report downloaded');
    } catch (error) {
      logger.error('Export failed:', error);
      this.showToast('Export failed. Please try again.');
    }
  }

  private confirmClearAll(): void {
    this.fab?.collapse();
    if (this.state.feedbacks.length === 0) return;

    this.confirmDialog?.destroy();
    this.confirmDialog = new ConfirmDialog(this.container, {
      title: 'Clear all feedback?',
      message: `This will permanently delete all ${this.state.feedbacks.length} feedback items.`,
      confirmLabel: 'Delete all',
      danger: true,
      onConfirm: () => {
        this.state.clearAll().then(() => {
          this.fab?.updateCount(0);
          this.fab?.updateDraft(false);
          this.sidebar?.updateFeedbacks([]);
          this.announce('All feedback deleted');
        });
        this.confirmDialog?.destroy();
        this.confirmDialog = null;
      },
      onCancel: () => {
        this.confirmDialog?.destroy();
        this.confirmDialog = null;
      }
    });
  }

  editFeedback(feedback: Feedback): void {
    this.sidebar?.destroy();
    this.sidebar = null;

    // Create a synthetic ComponentInfo for the edit
    const info: ComponentInfo = {
      name: feedback.componentName,
      path: feedback.componentPath,
      element: document.body, // Placeholder — original element is no longer available
    };

    this.modal?.destroy();
    this.modal = new FeedbackModal(this.container, {
      componentInfo: info,
      screenshot: feedback.screenshot,
      htmlSnippet: feedback.htmlSnippet,
      draftComment: feedback.comment,
      onSubmit: async (comment: string) => {
        const updated: Feedback = { ...feedback, comment, timestamp: new Date().toISOString() };
        await this.state.addFeedback(updated); // save with same ID = update
        this.modal?.destroy();
        this.modal = null;
        this.fab?.updateCount(this.state.feedbacks.length);
      },
      onCancel: () => {
        this.modal?.destroy();
        this.modal = null;
        this.showSidebar(); // Return to sidebar
      },
      onDraftSave: () => {} // No draft for edits
    });
  }

  // ---- Undo delete (PH-009) ----

  private handleDeleteWithUndo(id: string): void {
    const feedbackIndex = this.state.feedbacks.findIndex(f => f.id === id);
    if (feedbackIndex === -1) return;
    const feedback = this.state.feedbacks[feedbackIndex];

    // If there is already a pending delete, finalize it immediately
    if (this.pendingDelete) {
      this.finalizePendingDelete();
    }

    // Hide card from sidebar without deleting from storage
    const visualFeedbacks = this.state.feedbacks.filter(f => f.id !== id);
    this.sidebar?.updateFeedbacks(visualFeedbacks);
    this.fab?.updateCount(visualFeedbacks.length);

    logger.debug(`Pending delete: ${id}, 8s timeout started`);

    const timer = setTimeout(() => {
      this.finalizePendingDelete();
    }, 8000);

    this.pendingDelete = { id, feedback, timer, previousIndex: feedbackIndex };

    this.showUndoToast('Feedback deleted', () => {
      this.undoDelete();
    });

    this.announce('Feedback deleted');
  }

  private finalizePendingDelete(): void {
    if (!this.pendingDelete) return;
    const { id, feedback, previousIndex } = this.pendingDelete;
    clearTimeout(this.pendingDelete.timer);
    this.pendingDelete = null;

    // Remove undo toast
    this.container.querySelector('.fb-toast-undo')?.remove();

    this.state.deleteFeedback(id).then(() => {
      logger.debug(`Delete finalized: ${id}`);
      this.fab?.updateCount(this.state.feedbacks.length);
    }).catch((error) => {
      logger.error(`Failed to finalize delete: ${id}`, error);
      this.restoreDeletedCard(feedback, previousIndex);
      this.showToast('Failed to delete. Item restored.');
    });
  }

  private undoDelete(): void {
    if (!this.pendingDelete) return;
    const { id, previousIndex } = this.pendingDelete;
    clearTimeout(this.pendingDelete.timer);
    this.pendingDelete = null;

    logger.debug(`Delete undone: ${id}`);

    // Restore card: sidebar shows current state feedbacks (item was never removed from state)
    this.sidebar?.updateFeedbacks(this.state.feedbacks);
    this.fab?.updateCount(this.state.feedbacks.length);
    this.announce('Feedback restored');
  }

  private restoreDeletedCard(feedback: Feedback, _previousIndex: number): void {
    // Item was never removed from state if finalization failed, so just refresh
    this.sidebar?.updateFeedbacks(this.state.feedbacks);
    this.fab?.updateCount(this.state.feedbacks.length);
  }

  // ---- Selection banner (PH-011) ----

  private showSelectionBanner(): void {
    this.dismissSelectionBanner();

    const banner = document.createElement('div');
    banner.className = 'fb-selection-banner';
    banner.setAttribute('role', 'status');
    banner.textContent = 'Click on any element to capture feedback. Press Esc to cancel.';

    // Inline styles for rendering on document.body outside shadow DOM (ADR-P2-003)
    banner.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; z-index: 2147483646;
      background: #3b82f6; color: white; text-align: center;
      padding: 10px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px; font-weight: 500;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      pointer-events: none;
    `;

    document.body.appendChild(banner);
    this.selectionBanner = banner;
    logger.debug('Selection banner displayed');
  }

  private dismissSelectionBanner(): void {
    if (this.selectionBanner) {
      this.selectionBanner.remove();
      this.selectionBanner = null;
      logger.debug('Selection banner dismissed');
    }
  }

  // ---- Toast rotation and milestones (PH-012) ----

  private showRotatingSubmitToast(): void {
    const message = SUBMIT_TOAST_MESSAGES[this.toastMessageIndex % SUBMIT_TOAST_MESSAGES.length];
    this.toastMessageIndex++;
    this.showToast(message);
  }

  private showMilestoneIfNeeded(): void {
    const count = this.state.feedbacks.length;
    const milestone = MILESTONES.find(m => m.count === count);
    if (!milestone) return;

    logger.debug(`Milestone reached: ${count} items`);

    // Show milestone in sidebar header if sidebar is open
    if (this.sidebar) {
      const header = this.container.querySelector('.fb-sidebar-header');
      if (header) {
        // Remove any existing milestone
        header.querySelector('.fb-milestone')?.remove();

        const badge = document.createElement('span');
        badge.className = 'fb-milestone';
        badge.textContent = milestone.text;
        header.appendChild(badge);
      }
    }
  }

  private async cropScreenshot(dataUrl: string, element: HTMLElement): Promise<string> {
    const rect = element.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        const sx = Math.round(rect.x * dpr);
        const sy = Math.round(rect.y * dpr);
        const sw = Math.round(rect.width * dpr);
        const sh = Math.round(rect.height * dpr);

        // Clamp to image bounds
        const clampedW = Math.min(sw, img.width - sx);
        const clampedH = Math.min(sh, img.height - sy);

        if (clampedW <= 0 || clampedH <= 0) {
          resolve(dataUrl);
          return;
        }

        canvas.width = clampedW;
        canvas.height = clampedH;
        ctx.drawImage(img, sx, sy, clampedW, clampedH, 0, 0, clampedW, clampedH);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
}
