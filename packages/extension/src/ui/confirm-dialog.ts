/**
 * ConfirmDialog — vanilla TS confirmation dialog
 */

import { FocusTrap } from './focus-trap';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export class ConfirmDialog {
  private backdrop: HTMLDivElement;
  private focusTrap: FocusTrap;

  constructor(container: HTMLElement, opts: ConfirmDialogOptions) {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'fb-modal-backdrop';
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) opts.onCancel();
    });

    const dialog = document.createElement('div');
    dialog.className = 'fb-confirm';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', opts.title);

    const title = document.createElement('h4');
    title.textContent = opts.title;
    dialog.appendChild(title);

    const message = document.createElement('p');
    message.textContent = opts.message;
    dialog.appendChild(message);

    const actions = document.createElement('div');
    actions.className = 'fb-confirm-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'fb-btn fb-btn-secondary';
    cancelBtn.textContent = opts.cancelLabel || 'Cancel';
    cancelBtn.addEventListener('click', () => opts.onCancel());

    const confirmBtn = document.createElement('button');
    confirmBtn.className = opts.danger ? 'fb-btn fb-btn-danger' : 'fb-btn fb-btn-primary';
    confirmBtn.textContent = opts.confirmLabel || 'Confirm';
    confirmBtn.addEventListener('click', () => opts.onConfirm());

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    dialog.appendChild(actions);

    this.backdrop.appendChild(dialog);
    container.appendChild(this.backdrop);

    // Escape to cancel
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        opts.onCancel();
      }
    });

    this.focusTrap = new FocusTrap(dialog);
    requestAnimationFrame(() => cancelBtn.focus());
  }

  destroy(): void {
    this.focusTrap.destroy();
    this.backdrop.remove();
  }
}
