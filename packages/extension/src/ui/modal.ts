/**
 * FeedbackModal — vanilla TS modal for feedback capture
 */

import { type ComponentInfo, getHumanReadableName } from '@feedbacker/detection';
import { closeIcon, minimizeIcon, chevronDownIcon } from './icons';
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
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    const humanName = getHumanReadableName(
      opts.componentInfo.element,
      opts.componentInfo.name
    );
    modal.setAttribute('aria-label', `Feedback for ${humanName}`);

    // Textarea (created early so header can reference it)
    this.textarea = document.createElement('textarea');
    this.textarea.className = 'fb-textarea';
    this.textarea.placeholder = 'Describe the issue or feedback...';
    this.textarea.value = opts.draftComment || '';
    this.textarea.setAttribute('aria-label', 'Feedback description');

    // Header
    const header = document.createElement('div');
    header.className = 'fb-modal-header';
    header.innerHTML = `<h3>${this.escapeHtml(humanName)}</h3>`;
    const headerActions = document.createElement('div');
    headerActions.style.cssText = 'display: flex; gap: 4px;';

    if (opts.onMinimize) {
      const minBtn = document.createElement('button');
      minBtn.className = 'fb-btn-icon';
      minBtn.innerHTML = minimizeIcon(20);
      minBtn.title = 'Minimize';
      minBtn.setAttribute('aria-label', 'Minimize');
      minBtn.addEventListener('click', () => opts.onMinimize!(this.textarea.value));
      headerActions.appendChild(minBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fb-btn-icon';
    closeBtn.innerHTML = closeIcon(20);
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', () => opts.onCancel());
    headerActions.appendChild(closeBtn);
    header.appendChild(headerActions);
    modal.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'fb-modal-body';

    // Technical details toggle (collapsed by default)
    const hasComponentName = opts.componentInfo.name && opts.componentInfo.name !== 'Unknown';
    const hasPath = opts.componentInfo.path.length > 0;
    const hasSnippet = !!opts.htmlSnippet;

    if (hasComponentName || hasPath || hasSnippet) {
      const detailsToggle = document.createElement('button');
      detailsToggle.className = 'fb-details-toggle';
      detailsToggle.setAttribute('aria-expanded', 'false');
      detailsToggle.innerHTML = `${chevronDownIcon(14)} <span>Technical details</span>`;

      const detailsContent = document.createElement('div');
      detailsContent.className = 'fb-details-content';
      detailsContent.style.display = 'none';

      if (hasComponentName) {
        const nameEl = document.createElement('div');
        nameEl.className = 'fb-detail-row';
        nameEl.innerHTML = `<span class="fb-detail-label">Component:</span> <span class="fb-detail-value">${this.escapeHtml(opts.componentInfo.name)}</span>`;
        detailsContent.appendChild(nameEl);
      }

      if (hasPath) {
        const pathEl = document.createElement('div');
        pathEl.className = 'fb-detail-row';
        pathEl.innerHTML = `<span class="fb-detail-label">Path:</span> <span class="fb-detail-value">${this.escapeHtml(opts.componentInfo.path.join(' > '))}</span>`;
        detailsContent.appendChild(pathEl);
      }

      if (hasSnippet) {
        const snippetEl = document.createElement('div');
        snippetEl.className = 'fb-detail-row';
        const snippetLabel = document.createElement('span');
        snippetLabel.className = 'fb-detail-label';
        snippetLabel.textContent = 'HTML:';
        snippetEl.appendChild(snippetLabel);
        const snippetCode = document.createElement('code');
        snippetCode.className = 'fb-detail-snippet';
        snippetCode.textContent = opts.htmlSnippet!;
        snippetEl.appendChild(snippetCode);
        detailsContent.appendChild(snippetEl);
      }

      detailsToggle.addEventListener('click', () => {
        const isExpanded = detailsContent.style.display !== 'none';
        detailsContent.style.display = isExpanded ? 'none' : 'block';
        detailsToggle.setAttribute('aria-expanded', String(!isExpanded));
      });

      body.appendChild(detailsToggle);
      body.appendChild(detailsContent);
    }

    // Screenshot preview
    if (opts.screenshot) {
      const img = document.createElement('img');
      img.className = 'fb-screenshot-preview';
      img.src = opts.screenshot;
      img.alt = 'Screenshot';
      body.appendChild(img);
    }

    // Draft saved indicator
    const draftIndicator = document.createElement('span');
    draftIndicator.className = 'fb-draft-saved';
    draftIndicator.textContent = 'Draft saved';
    draftIndicator.style.display = 'none';

    // Wire textarea events
    this.textarea.addEventListener('input', () => {
      submitBtn.disabled = !this.textarea.value.trim();
      if (this.draftTimer) clearTimeout(this.draftTimer);
      this.draftTimer = setTimeout(() => {
        if (this.textarea.value.trim()) {
          opts.onDraftSave(this.textarea.value);
          draftIndicator.style.display = 'inline';
          draftIndicator.style.opacity = '1';
          setTimeout(() => {
            draftIndicator.style.opacity = '0';
            setTimeout(() => { draftIndicator.style.display = 'none'; }, 300);
          }, 1500);
        }
      }, 2000);
    });
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        const comment = this.textarea.value.trim();
        if (comment) {
          e.preventDefault();
          opts.onSubmit(comment);
        }
      }
    });
    body.appendChild(this.textarea);
    body.appendChild(draftIndicator);
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

    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const hint = document.createElement('span');
    hint.className = 'fb-submit-hint';
    hint.textContent = `${isMac ? 'Cmd' : 'Ctrl'}+Enter to submit`;

    footer.appendChild(hint);
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
