/**
 * FeedbackApp — main controller that wires together all UI components
 * Renders FAB, modal, sidebar, and overlay in the shadow DOM container
 */

import type { Feedback } from '@feedbacker/core';
import { captureHtmlSnippet, logger } from '@feedbacker/core';
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

export class FeedbackApp {
  private container: HTMLDivElement;
  private state: StateManager;
  private detection: DetectionController;
  private visible = true;

  // UI components
  private fab: FAB | null = null;
  private modal: FeedbackModal | null = null;
  private sidebar: ManagerSidebar | null = null;
  private overlay: ComponentOverlayUI | null = null;
  private confirmDialog: ConfirmDialog | null = null;
  private exportDialog: ExportDialog | null = null;
  private minimizedState: MinimizedState | null = null;

  constructor(container: HTMLDivElement, state: StateManager, detection: DetectionController) {
    this.container = container;
    this.state = state;
    this.detection = detection;

    // Set up detection callbacks
    this.detection.setCallbacks(
      (info) => this.onComponentHover(info),
      (info) => this.onComponentSelect(info)
    );
  }

  render(settings?: { position?: string; primaryColor?: string }): void {
    // Create FAB
    this.fab = new FAB(this.container, {
      feedbackCount: this.state.feedbacks.length,
      hasDraft: this.state.draft !== null,
      position: settings?.position,
      primaryColor: settings?.primaryColor,
      onNewFeedback: () => this.startCapture(),
      onShowManager: () => this.showSidebar(),
      onExport: () => this.showExportDialog(),
      onClearAll: () => this.confirmClearAll()
    });

    // Create overlay (outside shadow DOM — appended to document.body)
    this.overlay = new ComponentOverlayUI();

    logger.debug('FeedbackApp rendered');
  }

  applySettings(settings: { position?: string; primaryColor?: string }): void {
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
    this.fab?.destroy();
    this.modal?.destroy();
    this.sidebar?.destroy();
    this.overlay?.destroy();
    this.detection.destroy();
    this.container.innerHTML = '';
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
        this.modal?.destroy();
        this.modal = null;
        this.fab?.updateCount(this.state.feedbacks.length);
        this.fab?.updateDraft(false);
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
      onDelete: async (id: string) => {
        await this.state.deleteFeedback(id);
        this.sidebar?.updateFeedbacks(this.state.feedbacks);
        this.fab?.updateCount(this.state.feedbacks.length);
      },
      onEdit: (feedback: Feedback) => this.editFeedback(feedback),
      onExport: (format: 'markdown' | 'zip') => this.doExport(format)
    });
  }

  private showExportDialog(): void {
    this.fab?.collapse();
    if (this.state.feedbacks.length === 0) return;

    this.exportDialog?.destroy();
    this.exportDialog = new ExportDialog(this.container, {
      feedbackCount: this.state.feedbacks.length,
      onExport: (format) => this.doExport(format),
      onCancel: () => {
        this.exportDialog?.destroy();
        this.exportDialog = null;
      }
    });
  }

  private async doExport(format: 'markdown' | 'zip'): Promise<void> {
    const { MarkdownExporter, ZipExporter } = await import('@feedbacker/core');
    const feedbacks = this.state.feedbacks;

    if (format === 'markdown') {
      MarkdownExporter.downloadMarkdown(feedbacks, MarkdownExporter.generateFilename(feedbacks));
    } else {
      await ZipExporter.downloadZip(feedbacks, ZipExporter.generateZipFilename(feedbacks));
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
