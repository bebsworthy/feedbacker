/**
 * InlineEditController — manages inline textarea editing for feedback cards.
 * Extracted from ManagerSidebar to keep component size under limits.
 *
 * Uses a cancel-flag pattern (ADR-P2-004) to handle Escape vs blur conflict:
 * When Escape is pressed, editCancelled is set true before blur fires.
 * The blur handler checks this flag and skips the save if set.
 */

interface InlineEditCallbacks {
  onSaveEdit: (id: string, comment: string) => Promise<void>;
}

export class InlineEditController {
  private editingCardId: string | null = null;
  private editCancelled = false;
  private editDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private callbacks: InlineEditCallbacks;

  constructor(callbacks: InlineEditCallbacks) {
    this.callbacks = callbacks;
  }

  /** The ID of the card currently being edited, or null. */
  get currentEditId(): string | null {
    return this.editingCardId;
  }

  /** Activate inline edit mode for a card. */
  activateEdit(
    feedbackId: string,
    originalComment: string,
    card: HTMLDivElement,
    container: HTMLElement
  ): void {
    // If another card is editing, save and close it first
    if (this.editingCardId && this.editingCardId !== feedbackId) {
      this.saveAndCloseCurrentEdit(container);
    }
    if (this.editingCardId === feedbackId) return;
    this.editingCardId = feedbackId;
    this.editCancelled = false;

    const commentEl = card.querySelector('.fb-card-comment') as HTMLElement | null;
    if (!commentEl) return;

    const textarea = document.createElement('textarea');
    textarea.className = 'fb-inline-edit-textarea';
    textarea.value = originalComment;
    textarea.setAttribute('data-fb-id', feedbackId);
    textarea.setAttribute('aria-label', 'Edit comment');

    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        this.editCancelled = true;
        this.clearDebounceTimer();
        this.revertToStaticText(card, originalComment);
        this.editingCardId = null;
      }
    });

    textarea.addEventListener('blur', () => {
      if (this.editCancelled) {
        this.editCancelled = false;
        return;
      }
      this.commitEdit(textarea, feedbackId);
    });

    commentEl.replaceWith(textarea);
    textarea.focus();
  }

  /** Clean up timers when sidebar is destroyed. */
  destroy(): void {
    this.clearDebounceTimer();
    this.editingCardId = null;
  }

  /** Save the currently editing card and revert to static text. */
  private saveAndCloseCurrentEdit(container: HTMLElement): void {
    if (!this.editingCardId) return;
    const textarea = container.querySelector(
      `.fb-inline-edit-textarea[data-fb-id="${this.editingCardId}"]`
    ) as HTMLTextAreaElement | null;
    if (textarea) {
      this.commitEdit(textarea, this.editingCardId);
    }
  }

  /** Debounced commit: save edited text after 1000ms. */
  private commitEdit(textarea: HTMLTextAreaElement, feedbackId: string): void {
    this.clearDebounceTimer();
    const updatedComment = textarea.value;

    this.editDebounceTimer = setTimeout(() => {
      this.callbacks
        .onSaveEdit(feedbackId, updatedComment)
        .then(() => {
          const card = textarea.closest('.fb-card') as HTMLDivElement | null;
          if (card) {
            this.revertToStaticText(card, updatedComment);
            this.showSavedIndicator(card);
          }
          this.editingCardId = null;
        })
        .catch(() => {
          this.showErrorIndicator(textarea);
        });
    }, 1000);
  }

  /** Replace textarea with static comment text. */
  private revertToStaticText(card: HTMLDivElement, text: string): void {
    const textarea = card.querySelector('.fb-inline-edit-textarea');
    if (!textarea) return;
    const comment = document.createElement('div');
    comment.className = 'fb-card-comment';
    comment.textContent = text;
    textarea.replaceWith(comment);
  }

  /** Show a "Saved" indicator on the card briefly. */
  private showSavedIndicator(card: HTMLDivElement): void {
    const indicator = document.createElement('span');
    indicator.className = 'fb-saved-indicator';
    indicator.textContent = 'Saved';
    const actions = card.querySelector('.fb-card-actions');
    if (actions) {
      actions.parentElement?.insertBefore(indicator, actions);
    } else {
      card.appendChild(indicator);
    }
    setTimeout(() => indicator.remove(), 2100);
  }

  /** Show an error indicator near the textarea on save failure. */
  private showErrorIndicator(textarea: HTMLTextAreaElement): void {
    const existing = textarea.parentElement?.querySelector('.fb-error-indicator');
    if (existing) return;
    const indicator = document.createElement('span');
    indicator.className = 'fb-error-indicator';
    indicator.textContent = 'Save failed';
    indicator.style.cssText =
      'font-size: 12px; color: var(--fb-error); font-weight: 500; margin-top: 4px; display: block;';
    textarea.insertAdjacentElement('afterend', indicator);
    setTimeout(() => indicator.remove(), 3000);
  }

  private clearDebounceTimer(): void {
    if (this.editDebounceTimer !== null) {
      clearTimeout(this.editDebounceTimer);
      this.editDebounceTimer = null;
    }
  }
}
