/**
 * ManagerSidebar — vanilla TS sidebar for viewing/managing feedback
 * Note: Exceeds 200-line guideline due to imperative DOM construction
 * (no JSX/template engine). Cannot be reasonably split further as all
 * methods share private state and the DOM tree is tightly coupled.
 */

import type { Feedback } from '@feedbacker/core';
import { formatDistanceToNow, MarkdownExporter } from '@feedbacker/core';
import { closeIcon, trashIcon, copyIcon, arrowDownTrayIcon, pencilIcon, checkIcon, photoIcon, emptyStateIllustration } from './icons';
import { FocusTrap } from './focus-trap';
import { InlineEditController } from './inline-edit';

interface SidebarOptions {
  feedbacks: Feedback[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onSaveEdit: (id: string, comment: string) => Promise<void>;
  onShowExportDialog: () => void;
  onStartCapture: () => void;
  onAnnounce?: (message: string) => void;
}

type FilterMode = 'this-site' | 'all-sites';

export class ManagerSidebar {
  private container: HTMLElement;
  private opts: SidebarOptions;
  private backdrop: HTMLDivElement;
  private sidebar: HTMLDivElement;
  private body: HTMLDivElement;
  private headerH3: HTMLHeadingElement;
  private focusTrap: FocusTrap | null = null;
  private filterMode: FilterMode = 'this-site';
  private currentOrigin: string;
  private inlineEdit: InlineEditController;

  constructor(container: HTMLElement, opts: SidebarOptions) {
    this.container = container;
    this.opts = opts;
    this.currentOrigin = window.location.origin;
    this.inlineEdit = new InlineEditController({ onSaveEdit: opts.onSaveEdit });

    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'fb-sidebar-backdrop';
    this.backdrop.addEventListener('click', () => opts.onClose());

    // Sidebar
    this.sidebar = document.createElement('div');
    this.sidebar.className = 'fb-sidebar';
    this.sidebar.setAttribute('role', 'complementary');
    this.sidebar.setAttribute('aria-label', 'Feedback manager');

    // Header
    const header = document.createElement('div');
    header.className = 'fb-sidebar-header';
    this.headerH3 = document.createElement('h3');
    header.appendChild(this.headerH3);

    const headerActions = document.createElement('div');
    headerActions.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    const exportBtn = document.createElement('button');
    exportBtn.className = 'fb-btn fb-btn-secondary fb-btn-sm';
    exportBtn.innerHTML = `${arrowDownTrayIcon(16)} <span style="margin-left:4px">Share / Export</span>`;
    exportBtn.setAttribute('aria-label', 'Share / Export');
    exportBtn.addEventListener('click', () => opts.onShowExportDialog());
    headerActions.appendChild(exportBtn);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fb-btn-icon';
    closeBtn.innerHTML = closeIcon(20);
    closeBtn.setAttribute('aria-label', 'Close sidebar');
    closeBtn.addEventListener('click', () => opts.onClose());
    headerActions.appendChild(closeBtn);

    header.appendChild(headerActions);
    this.sidebar.appendChild(header);

    // Filter tabs
    const filterBar = document.createElement('div');
    filterBar.style.cssText = 'display: flex; border-bottom: 1px solid var(--fb-border); padding: 0 16px;';
    filterBar.setAttribute('role', 'tablist');

    const thisSiteBtn = this.createFilterTab('This site', 'this-site');
    const allSitesBtn = this.createFilterTab('All sites', 'all-sites');
    filterBar.appendChild(thisSiteBtn);
    filterBar.appendChild(allSitesBtn);
    this.sidebar.appendChild(filterBar);

    // Body
    this.body = document.createElement('div');
    this.body.className = 'fb-sidebar-body';
    this.sidebar.appendChild(this.body);

    container.appendChild(this.backdrop);
    container.appendChild(this.sidebar);

    // Escape to close (scoped to sidebar element only)
    this.sidebar.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        opts.onClose();
      }
    });

    // Focus trap + initial render
    this.focusTrap = new FocusTrap(this.sidebar);
    this.renderFiltered();
    requestAnimationFrame(() => closeBtn.focus());
  }

  updateFeedbacks(feedbacks: Feedback[]): void {
    this.opts.feedbacks = feedbacks;
    this.renderFiltered();
  }

  destroy(): void {
    this.inlineEdit.destroy();
    this.focusTrap?.destroy();
    this.backdrop.remove();
    this.sidebar.remove();
  }

  private getFilteredFeedbacks(): Feedback[] {
    if (this.filterMode === 'all-sites') {
      return this.opts.feedbacks;
    }
    return this.opts.feedbacks.filter((fb) => {
      try {
        return new URL(fb.url).origin === this.currentOrigin;
      } catch {
        return false;
      }
    });
  }

  private renderFiltered(): void {
    const filtered = this.getFilteredFeedbacks();
    const total = this.opts.feedbacks.length;
    const label = this.filterMode === 'this-site'
      ? `This site (${filtered.length} of ${total})`
      : `All feedback (${total})`;
    this.headerH3.textContent = label;

    this.body.innerHTML = '';
    this.renderFeedbackList(filtered);

    // Update active tab styles and aria-selected
    this.sidebar.querySelectorAll('[data-filter]').forEach((tab) => {
      const el = tab as HTMLElement;
      const isActive = el.dataset.filter === this.filterMode;
      el.style.borderBottom = isActive ? '2px solid var(--fb-primary)' : '2px solid transparent';
      el.style.color = isActive ? 'var(--fb-primary)' : 'var(--fb-text-secondary)';
      el.style.fontWeight = isActive ? '600' : '400';
      el.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  private createFilterTab(label: string, mode: FilterMode): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.dataset.filter = mode;
    btn.textContent = label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', mode === this.filterMode ? 'true' : 'false');
    btn.style.cssText = `
      background: none; border: none; cursor: pointer;
      padding: 8px 12px; font-size: 13px;
      font-family: var(--fb-font);
      border-bottom: 2px solid transparent;
      color: var(--fb-text-secondary);
      transition: all 150ms;
    `;
    btn.addEventListener('click', () => {
      this.filterMode = mode;
      this.renderFiltered();
    });
    return btn;
  }

  private renderFeedbackList(feedbacks: Feedback[]): void {
    if (feedbacks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'fb-empty';

      empty.innerHTML = emptyStateIllustration(64, 'var(--fb-text-muted)');

      const heading = document.createElement('h4');
      heading.textContent = 'No feedback yet';
      heading.style.cssText = 'margin: 16px 0 8px; font-size: 16px; color: var(--fb-text);';
      empty.appendChild(heading);

      const subtext = document.createElement('p');
      subtext.textContent = "Click 'New feedback' to start your review";
      subtext.style.cssText = 'margin: 0 0 16px; font-size: 13px; color: var(--fb-text-secondary);';
      empty.appendChild(subtext);

      const ctaBtn = document.createElement('button');
      ctaBtn.className = 'fb-btn fb-btn-primary';
      ctaBtn.textContent = 'Start reviewing';
      ctaBtn.addEventListener('click', () => {
        this.opts.onStartCapture();
        this.opts.onClose();
      });
      empty.appendChild(ctaBtn);

      this.body.appendChild(empty);
      return;
    }

    for (const fb of feedbacks) {
      this.body.appendChild(this.createCard(fb));
    }
  }

  private async copyImageToClipboard(dataUrl: string, btn: HTMLButtonElement): Promise<void> {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const pngBlob = blob.type === 'image/png' ? blob : await this.convertToPng(dataUrl);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      this.flashCopied(btn, photoIcon(16));
    } catch {
      // Fallback: copy the data URL as text
      await navigator.clipboard.writeText(dataUrl);
      this.flashCopied(btn, photoIcon(16));
    }
  }

  private convertToPng(dataUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/png');
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  private flashCopied(btn: HTMLButtonElement, originalIcon: string): void {
    const originalTooltip = btn.dataset.tooltip || '';
    btn.innerHTML = checkIcon(16);
    btn.dataset.tooltip = 'Copied!';
    btn.style.color = 'var(--fb-success)';
    setTimeout(() => {
      btn.innerHTML = originalIcon;
      btn.dataset.tooltip = originalTooltip;
      btn.style.color = '';
    }, 1500);
  }

  private createCard(fb: Feedback): HTMLDivElement {
    const card = document.createElement('div');
    card.className = 'fb-card';

    // Screenshot
    if (fb.screenshot) {
      const screenshotWrap = document.createElement('div');
      screenshotWrap.style.cssText = 'position: relative;';
      const img = document.createElement('img');
      img.className = 'fb-card-screenshot';
      img.src = fb.screenshot;
      img.alt = 'Screenshot';
      screenshotWrap.appendChild(img);

      const copyImgBtn = document.createElement('button');
      copyImgBtn.className = 'fb-btn-icon fb-screenshot-copy';
      copyImgBtn.innerHTML = photoIcon(16);
      copyImgBtn.dataset.tooltip = 'Copy screenshot';
      copyImgBtn.setAttribute('aria-label', 'Copy screenshot');
      copyImgBtn.addEventListener('click', () => {
        this.copyImageToClipboard(fb.screenshot!, copyImgBtn);
      });
      screenshotWrap.appendChild(copyImgBtn);
      card.appendChild(screenshotWrap);
    }

    // Header
    const header = document.createElement('div');
    header.className = 'fb-card-header';
    const title = document.createElement('span');
    title.className = 'fb-card-title';
    title.textContent = fb.componentName;
    const time = document.createElement('span');
    time.className = 'fb-card-time';
    time.textContent = formatDistanceToNow(new Date(fb.timestamp));
    header.appendChild(title);
    header.appendChild(time);
    card.appendChild(header);

    // Site origin (show when viewing all sites)
    if (this.filterMode === 'all-sites') {
      try {
        const origin = new URL(fb.url).hostname;
        const siteEl = document.createElement('div');
        siteEl.style.cssText = 'font-size: 11px; color: var(--fb-text-muted); margin-bottom: 4px;';
        siteEl.textContent = origin;
        card.appendChild(siteEl);
      } catch {
        // ignore invalid URLs
      }
    }

    // Comment
    const comment = document.createElement('div');
    comment.className = 'fb-card-comment';
    comment.textContent = fb.comment;
    card.appendChild(comment);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'fb-card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'fb-btn-icon';
    editBtn.innerHTML = pencilIcon(16);
    editBtn.dataset.tooltip = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit feedback');
    editBtn.addEventListener('click', () => this.inlineEdit.activateEdit(fb.id, fb.comment, card, this.body));

    const copyBtn = document.createElement('button');
    copyBtn.className = 'fb-btn-icon';
    copyBtn.innerHTML = copyIcon(16);
    copyBtn.dataset.tooltip = 'Copy to clipboard';
    copyBtn.setAttribute('aria-label', 'Copy to clipboard');
    copyBtn.addEventListener('click', () => {
      const markdown = MarkdownExporter.exportSingleItem(fb);
      navigator.clipboard.writeText(markdown).then(() => {
        this.flashCopied(copyBtn, copyIcon(16));
        this.opts.onAnnounce?.('Copied to clipboard');
      });
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'fb-btn-icon';
    deleteBtn.innerHTML = trashIcon(16);
    deleteBtn.dataset.tooltip = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete feedback');
    deleteBtn.style.color = 'var(--fb-error)';
    deleteBtn.addEventListener('click', () => this.opts.onDelete(fb.id));

    actions.appendChild(editBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    return card;
  }
}
