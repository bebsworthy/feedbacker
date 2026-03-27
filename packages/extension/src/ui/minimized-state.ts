/**
 * MinimizedState — compact floating bar when modal is minimized
 */

interface MinimizedStateOptions {
  componentName: string;
  hasScreenshot: boolean;
  hasDraft: boolean;
  onRestore: () => void;
  onDiscard: () => void;
}

export class MinimizedState {
  private el: HTMLDivElement;

  constructor(container: HTMLElement, opts: MinimizedStateOptions) {
    this.el = document.createElement('div');
    this.el.style.cssText = `
      position: fixed;
      bottom: 88px;
      right: 24px;
      background: var(--fb-bg);
      border: 1px solid var(--fb-border);
      border-radius: var(--fb-radius);
      box-shadow: var(--fb-shadow-lg);
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      z-index: 10000;
      font-family: var(--fb-font);
      font-size: 13px;
      color: var(--fb-text);
      max-width: 280px;
    `;

    // Component name
    const nameEl = document.createElement('span');
    nameEl.style.cssText = 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
    nameEl.textContent = opts.componentName;
    this.el.appendChild(nameEl);

    // Indicators
    if (opts.hasScreenshot) {
      const imgIndicator = document.createElement('span');
      imgIndicator.style.cssText = 'font-size: 11px; color: var(--fb-text-muted);';
      imgIndicator.textContent = '📷';
      this.el.appendChild(imgIndicator);
    }

    if (opts.hasDraft) {
      const draftBadge = document.createElement('span');
      draftBadge.className = 'fb-draft-badge';
      draftBadge.textContent = 'Draft';
      this.el.appendChild(draftBadge);
    }

    // Discard button
    const discardBtn = document.createElement('button');
    discardBtn.style.cssText = `
      background: none; border: none; cursor: pointer;
      color: var(--fb-text-muted); font-size: 16px; padding: 0 2px;
      line-height: 1; min-width: 24px; min-height: 24px;
      display: inline-flex; align-items: center; justify-content: center;
    `;
    discardBtn.textContent = '×';
    discardBtn.title = 'Discard';
    discardBtn.setAttribute('aria-label', 'Discard draft');
    discardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onDiscard();
    });
    this.el.appendChild(discardBtn);

    // Click to restore
    this.el.addEventListener('click', () => opts.onRestore());

    container.appendChild(this.el);
  }

  destroy(): void {
    this.el.remove();
  }
}
