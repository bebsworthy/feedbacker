/**
 * FAB — Floating Action Button (vanilla TS)
 */

import { megaphoneIcon, closeIcon, messageIcon, listIcon, arrowDownTrayIcon } from './icons';

interface FABOptions {
  feedbackCount: number;
  hasDraft: boolean;
  position?: string;
  primaryColor?: string;
  onNewFeedback: () => void;
  onShowManager: () => void;
  onExport: () => void;
}

export class FAB {
  private container: HTMLElement;
  private opts: FABOptions;
  private button: HTMLButtonElement;
  private badge: HTMLSpanElement;
  private actionsEl: HTMLDivElement | null = null;
  private expanded = false;

  constructor(container: HTMLElement, opts: FABOptions) {
    this.container = container;
    this.opts = opts;

    // Create FAB button
    this.button = document.createElement('button');
    this.button.className = 'fb-fab';
    this.button.innerHTML = megaphoneIcon(24, 'white');
    this.button.setAttribute('aria-label', 'Feedbacker menu');
    this.button.setAttribute('aria-expanded', 'false');

    const isMac = navigator.platform.toUpperCase().includes('MAC');
    this.button.title = `Feedbacker (${isMac ? 'Opt' : 'Alt'}+Shift+F)`;

    this.button.addEventListener('click', () => this.toggleExpanded());

    // Badge
    this.badge = document.createElement('span');
    this.badge.className = 'fb-fab-badge';
    this.badge.style.display = opts.feedbackCount > 0 ? 'flex' : 'none';
    this.badge.textContent = String(opts.feedbackCount);
    this.badge.setAttribute('aria-label', `${opts.feedbackCount} feedback items`);
    this.button.appendChild(this.badge);

    this.applyPosition(opts.position || 'bottom-right');
    if (opts.primaryColor) this.applyColor(opts.primaryColor);

    container.appendChild(this.button);
  }

  applyPosition(position: string): void {
    this.button.style.top = 'auto';
    this.button.style.bottom = 'auto';
    this.button.style.left = 'auto';
    this.button.style.right = 'auto';

    switch (position) {
      case 'top-left':
        this.button.style.top = '24px';
        this.button.style.left = '24px';
        break;
      case 'top-right':
        this.button.style.top = '24px';
        this.button.style.right = '24px';
        break;
      case 'bottom-left':
        this.button.style.bottom = '24px';
        this.button.style.left = '24px';
        break;
      default: // bottom-right
        this.button.style.bottom = '24px';
        this.button.style.right = '24px';
        break;
    }
  }

  applyColor(color: string): void {
    this.button.style.background = color;
  }

  private toggleExpanded(): void {
    if (this.expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  private expand(): void {
    this.expanded = true;
    this.button.setAttribute('aria-expanded', 'true');
    this.button.innerHTML = closeIcon(24, 'white');
    this.button.appendChild(this.badge);

    this.actionsEl = document.createElement('div');
    this.actionsEl.className = 'fb-fab-actions';

    const actions = [
      { icon: messageIcon(18), label: 'New feedback', onClick: this.opts.onNewFeedback },
      { icon: listIcon(18), label: `View feedback (${this.opts.feedbackCount})`, onClick: this.opts.onShowManager },
      { icon: arrowDownTrayIcon(18), label: 'Share / Export', onClick: this.opts.onExport }
    ];

    for (const action of actions) {
      const btn = document.createElement('button');
      btn.className = 'fb-fab-action';
      btn.innerHTML = `${action.icon}<span>${action.label}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        action.onClick();
      });
      this.actionsEl.appendChild(btn);
    }

    this.container.appendChild(this.actionsEl);
  }

  collapse(): void {
    this.expanded = false;
    this.button.setAttribute('aria-expanded', 'false');
    this.button.innerHTML = megaphoneIcon(24, 'white');
    this.button.appendChild(this.badge);
    this.actionsEl?.remove();
    this.actionsEl = null;
  }

  updateCount(count: number): void {
    this.opts.feedbackCount = count;
    this.badge.textContent = count > 99 ? '99+' : String(count);
    this.badge.style.display = count > 0 ? 'flex' : 'none';
    this.badge.setAttribute('aria-label', `${count} feedback items`);
  }

  updateDraft(_hasDraft: boolean): void {
    // Draft state is communicated via MinimizedState bar, not the FAB
  }

  setVisible(visible: boolean): void {
    this.button.style.display = visible ? 'flex' : 'none';
    if (!visible) this.collapse();
  }

  destroy(): void {
    this.collapse();
    this.button.remove();
  }
}
