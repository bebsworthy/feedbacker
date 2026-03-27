/**
 * FeedbackModal — vanilla TS modal for feedback capture
 */

import type { FeedbackType, BugSeverity } from '@feedbacker/core';
import type { ComponentInfo } from '@feedbacker/detection';
import { closeIcon, minimizeIcon, chevronDownIcon } from './icons';
import { FocusTrap } from './focus-trap';
import { createTypeChipBar } from './type-chip-bar';

export interface ModalOptions {
  componentInfo: ComponentInfo;
  screenshot?: string;
  htmlSnippet?: string;
  draftComment?: string;
  draftType?: FeedbackType;
  draftSeverity?: BugSeverity;
  onSubmit: (comment: string, type: FeedbackType, severity?: BugSeverity) => void;
  onCancel: () => void;
  onMinimize?: (currentComment: string, type: FeedbackType, severity?: BugSeverity) => void;
  onDraftSave: (comment: string, type: FeedbackType, severity?: BugSeverity) => void;
}

export class FeedbackModal {
  private container: HTMLElement;
  private backdrop: HTMLDivElement;
  private textarea: HTMLTextAreaElement;
  private draftTimer: ReturnType<typeof setTimeout> | null = null;
  private focusTrap: FocusTrap | null = null;
  private selectedType: FeedbackType;
  private selectedSeverity: BugSeverity | undefined;

  constructor(container: HTMLElement, opts: ModalOptions) {
    this.container = container;
    this.selectedType = opts.draftType ?? 'suggestion';
    this.selectedSeverity = opts.draftSeverity;

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'fb-modal-backdrop';
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) opts.onCancel();
    });

    const modal = document.createElement('div');
    modal.className = 'fb-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', `Feedback for ${opts.componentInfo.name}`);

    // Textarea (created early so header can reference it)
    this.textarea = document.createElement('textarea');
    this.textarea.className = 'fb-textarea';
    this.textarea.placeholder = 'Describe the issue or feedback...';
    this.textarea.value = opts.draftComment || '';
    this.textarea.setAttribute('aria-label', 'Feedback description');

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
      minBtn.setAttribute('aria-label', 'Minimize');
      minBtn.addEventListener('click', () =>
        opts.onMinimize!(this.textarea.value, this.selectedType, this.selectedSeverity)
      );
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

    // Component path (always visible)
    if (opts.componentInfo.path.length > 0) {
      const pathEl = document.createElement('div');
      pathEl.className = 'fb-component-path';
      pathEl.textContent = 'Element location: ' + opts.componentInfo.path.join(' > ');
      body.appendChild(pathEl);
    }

    // HTML snippet (collapsible — can be long)
    if (opts.htmlSnippet) {
      const snippetToggle = document.createElement('button');
      snippetToggle.className = 'fb-details-toggle';
      snippetToggle.setAttribute('aria-expanded', 'false');
      snippetToggle.innerHTML = `${chevronDownIcon(14)} <span>HTML snippet</span>`;

      const snippetContent = document.createElement('div');
      snippetContent.className = 'fb-details-content';
      snippetContent.style.display = 'none';
      const snippetCode = document.createElement('code');
      snippetCode.className = 'fb-detail-snippet';
      snippetCode.textContent = opts.htmlSnippet;
      snippetContent.appendChild(snippetCode);

      snippetToggle.addEventListener('click', () => {
        const isExpanded = snippetContent.style.display !== 'none';
        snippetContent.style.display = isExpanded ? 'none' : 'block';
        snippetToggle.setAttribute('aria-expanded', String(!isExpanded));
      });

      body.appendChild(snippetToggle);
      body.appendChild(snippetContent);
    }

    // Screenshot preview
    if (opts.screenshot) {
      const img = document.createElement('img');
      img.className = 'fb-screenshot-preview';
      img.src = opts.screenshot;
      img.alt = 'Screenshot';
      body.appendChild(img);
    }

    // Type categorization chip bar (PH-012)
    const chipBar = createTypeChipBar({
      initialType: this.selectedType,
      initialSeverity: this.selectedSeverity,
      onChange: (type, severity) => {
        this.selectedType = type;
        this.selectedSeverity = severity;
      },
    });
    body.appendChild(chipBar);

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
          opts.onDraftSave(this.textarea.value, this.selectedType, this.selectedSeverity);
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
          opts.onSubmit(comment, this.selectedType, this.selectedSeverity);
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
      if (comment) opts.onSubmit(comment, this.selectedType, this.selectedSeverity);
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

  getType(): FeedbackType {
    return this.selectedType;
  }

  getSeverity(): BugSeverity | undefined {
    return this.selectedSeverity;
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
