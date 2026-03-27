/**
 * ExportDialog — vanilla TS export format picker
 */

import { documentTextIcon, archiveBoxIcon, closeIcon } from './icons';
import { FocusTrap } from './focus-trap';

interface ExportDialogOptions {
  feedbackCount: number;
  onExport: (format: 'markdown' | 'zip') => void;
  onCancel: () => void;
}

export class ExportDialog {
  private backdrop: HTMLDivElement;
  private focusTrap: FocusTrap | null = null;

  constructor(container: HTMLElement, opts: ExportDialogOptions) {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'fb-modal-backdrop';
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) opts.onCancel();
    });

    const modal = document.createElement('div');
    modal.className = 'fb-modal';
    modal.style.width = '380px';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute(
      'aria-label',
      `Export ${opts.feedbackCount} item${opts.feedbackCount !== 1 ? 's' : ''}`
    );

    // Header
    const header = document.createElement('div');
    header.className = 'fb-modal-header';
    header.innerHTML = `<h3>Export ${opts.feedbackCount} item${opts.feedbackCount !== 1 ? 's' : ''}</h3>`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'fb-btn-icon';
    closeBtn.setAttribute('aria-label', 'Close export dialog');
    closeBtn.innerHTML = closeIcon(20);
    closeBtn.addEventListener('click', () => opts.onCancel());
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'fb-modal-body';

    // Markdown option
    const mdOption = this.createOption(
      documentTextIcon(24),
      'Markdown',
      'Text-only export without images',
      () => {
        opts.onExport('markdown');
        opts.onCancel();
      }
    );
    body.appendChild(mdOption);

    // ZIP option
    const zipOption = this.createOption(
      archiveBoxIcon(24),
      'ZIP Archive',
      'Full report with screenshots',
      () => {
        opts.onExport('zip');
        opts.onCancel();
      }
    );
    body.appendChild(zipOption);

    modal.appendChild(body);
    this.backdrop.appendChild(modal);
    container.appendChild(this.backdrop);

    // Escape to cancel
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        opts.onCancel();
      }
    });

    this.focusTrap = new FocusTrap(modal);
    requestAnimationFrame(() => closeBtn.focus());
  }

  private createOption(icon: string, title: string, description: string, onClick: () => void): HTMLDivElement {
    const option = document.createElement('div');
    option.className = 'fb-export-option';
    option.tabIndex = 0;
    option.setAttribute('role', 'button');
    option.innerHTML = `
      <div>${icon}</div>
      <div class="fb-export-option-text">
        <h4>${title}</h4>
        <p>${description}</p>
      </div>
    `;
    option.addEventListener('click', onClick);
    return option;
  }

  destroy(): void {
    this.focusTrap?.destroy();
    this.backdrop.remove();
  }
}
