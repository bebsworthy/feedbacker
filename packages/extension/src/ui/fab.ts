/**
 * FAB — Pill-style toolbar for quick capture access
 *
 * Layout: [ 📢 Capture | 3 ]
 * - Click "Capture" → starts feedback capture immediately
 * - Click count badge → opens sidebar/manager
 */

import { megaphoneIcon } from './icons';

interface FABOptions {
  feedbackCount: number;
  hasDraft: boolean;
  position?: string;
  primaryColor?: string;
  onNewFeedback: () => void;
  onShowManager: () => void;
}

export class FAB {
  private container: HTMLElement;
  private opts: FABOptions;
  private pill: HTMLDivElement;
  private captureBtn: HTMLButtonElement;
  private countBtn: HTMLButtonElement;

  constructor(container: HTMLElement, opts: FABOptions) {
    this.container = container;
    this.opts = opts;

    // Pill container
    this.pill = document.createElement('div');
    this.pill.className = 'fb-fab-pill';

    // Capture button (primary action)
    this.captureBtn = document.createElement('button');
    this.captureBtn.className = 'fb-fab-capture';
    this.captureBtn.innerHTML = `${megaphoneIcon(16, 'white')}<span>Capture</span>`;
    this.captureBtn.setAttribute('aria-label', 'Start feedback capture');

    const isMac = navigator.platform.toUpperCase().includes('MAC');
    this.captureBtn.title = `Start capture (${isMac ? 'Opt' : 'Alt'}+Shift+F)`;

    this.captureBtn.addEventListener('click', () => opts.onNewFeedback());
    this.pill.appendChild(this.captureBtn);

    // Count button (opens sidebar)
    this.countBtn = document.createElement('button');
    this.countBtn.className = 'fb-fab-count';
    this.countBtn.textContent = String(opts.feedbackCount);
    this.countBtn.setAttribute('aria-label', `${opts.feedbackCount} feedback items — click to view`);
    this.countBtn.title = 'View feedback';
    this.countBtn.style.display = opts.feedbackCount > 0 ? 'flex' : 'none';
    this.countBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onShowManager();
    });
    this.pill.appendChild(this.countBtn);

    this.applyPosition(opts.position || 'bottom-right');
    if (opts.primaryColor) this.applyColor(opts.primaryColor);

    container.appendChild(this.pill);
  }

  applyPosition(position: string): void {
    this.pill.style.top = 'auto';
    this.pill.style.bottom = 'auto';
    this.pill.style.left = 'auto';
    this.pill.style.right = 'auto';

    switch (position) {
      case 'top-left':
        this.pill.style.top = '24px';
        this.pill.style.left = '24px';
        break;
      case 'top-right':
        this.pill.style.top = '24px';
        this.pill.style.right = '24px';
        break;
      case 'bottom-left':
        this.pill.style.bottom = '24px';
        this.pill.style.left = '24px';
        break;
      default: // bottom-right
        this.pill.style.bottom = '24px';
        this.pill.style.right = '24px';
        break;
    }
  }

  applyColor(color: string): void {
    this.captureBtn.style.background = color;
  }

  /** Hide the pill during capture mode */
  collapse(): void {
    this.pill.style.display = 'none';
  }

  /** Show the pill after capture mode ends */
  expand(): void {
    this.pill.style.display = 'flex';
  }

  updateCount(count: number): void {
    this.opts.feedbackCount = count;
    this.countBtn.textContent = count > 99 ? '99+' : String(count);
    this.countBtn.style.display = count > 0 ? 'flex' : 'none';
    this.countBtn.setAttribute('aria-label', `${count} feedback items — click to view`);
  }

  updateDraft(_hasDraft: boolean): void {
    // Draft state is communicated via MinimizedState bar, not the pill
  }

  setVisible(visible: boolean): void {
    this.pill.style.display = visible ? 'flex' : 'none';
  }

  destroy(): void {
    this.pill.remove();
  }
}
