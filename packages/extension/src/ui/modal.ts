/**
 * FeedbackModal — vanilla TS modal for feedback capture
 */

import type { ComponentInfo } from '@feedbacker/detection';
import { closeIcon, minimizeIcon } from './icons';
import { FocusTrap } from './focus-trap';

interface ModalOptions {
  componentInfo: ComponentInfo;
  screenshot?: string;
  htmlSnippet?: string;
  draftComment?: string;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
  onMinimize?: (currentComment: string) => void;
  onDraftSave: (comment: string) => void;
}

export class FeedbackModal {
  private container: HTMLElement;
  private backdrop: HTMLDivElement;
  private textarea: HTMLTextAreaElement;
  private draftTimer: ReturnType<typeof setTimeout> | null = null;
  private focusTrap: FocusTrap | null = null;

  constructor(container: HTMLElement, opts: ModalOptions) {
    this.container = container;

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'fb-modal-backdrop';
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) opts.onCancel();
    });

    const modal = document.createElement('div');
    modal.className = 'fb-modal';

    // Textarea (created early so header can reference it)
    this.textarea = document.createElement('textarea');
    this.textarea.className = 'fb-textarea';
    this.textarea.placeholder = 'Describe the issue or feedback...';
    this.textarea.value = opts.draftComment || '';

    // Header
    const header = document.createElement('div');
    header.className = 'fb-modal-header';
    header.innerHTML = `<h3>${this.escapeHtml(opts.componentInfo.name)}</h3>`;
    const headerActions = document.createElement('div');
    headerActions.style.cssText = 'display: flex; gap: 4px;';

    if (opts.onMinimize) {
      const minBtn = document.createElement('button');
      minBtn.className = 'fb-btn-icon';
      minBtn.innerHTML = minimizeIcon(20);
      minBtn.title = 'Minimize';
      minBtn.addEventListener('click', () => opts.onMinimize!(this.textarea.value));
      headerActions.appendChild(minBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fb-btn-icon';
    closeBtn.innerHTML = closeIcon(20);
    closeBtn.addEventListener('click', () => opts.onCancel());
    headerActions.appendChild(closeBtn);
    header.appendChild(headerActions);
    modal.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'fb-modal-body';

    // Component path
    if (opts.componentInfo.path.length > 0) {
      const pathEl = document.createElement('div');
      pathEl.className = 'fb-component-path';
      pathEl.textContent = opts.componentInfo.path.join(' > ');
      body.appendChild(pathEl);
    }

    // Screenshot preview
    if (opts.screenshot) {
      const img = document.createElement('img');
      img.className = 'fb-screenshot-preview';
      img.src = opts.screenshot;
      img.alt = 'Screenshot';
      body.appendChild(img);
    }

    // Wire textarea events
    this.textarea.addEventListener('input', () => {
      submitBtn.disabled = !this.textarea.value.trim();
      if (this.draftTimer) clearTimeout(this.draftTimer);
      this.draftTimer = setTimeout(() => {
        if (this.textarea.value.trim()) {
          opts.onDraftSave(this.textarea.value);
        }
      }, 2000);
    });
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        // Plain Enter or Ctrl/Cmd+Enter submits (Shift+Enter inserts newline)
        const comment = this.textarea.value.trim();
        if (comment) {
          e.preventDefault();
          opts.onSubmit(comment);
        }
      }
    });
    body.appendChild(this.textarea);
    modal.appendChild(body);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'fb-modal-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'fb-btn fb-btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => opts.onCancel());

    const submitBtn = document.createElement('button');
    submitBtn.className = 'fb-btn fb-btn-primary';
    submitBtn.textContent = 'Submit';
    submitBtn.disabled = !this.textarea.value.trim();
    submitBtn.addEventListener('click', () => {
      const comment = this.textarea.value.trim();
      if (comment) opts.onSubmit(comment);
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(submitBtn);
    modal.appendChild(footer);

    this.backdrop.appendChild(modal);
    container.appendChild(this.backdrop);

    // Escape to close
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        opts.onCancel();
      }
    });

    // Focus trap + auto-focus textarea
    this.focusTrap = new FocusTrap(modal);
    requestAnimationFrame(() => this.textarea.focus());
  }

  getComment(): string {
    return this.textarea.value;
  }

  destroy(): void {
    if (this.draftTimer) clearTimeout(this.draftTimer);
    this.focusTrap?.destroy();
    this.backdrop.remove();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
