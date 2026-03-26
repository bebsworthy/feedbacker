/**
 * ManagerSidebar — vanilla TS sidebar for viewing/managing feedback
 */

import type { Feedback } from '@feedbacker/core';
import { formatDistanceToNow } from '@feedbacker/core';
import { closeIcon, trashIcon, copyIcon, arrowDownTrayIcon, pencilIcon } from './icons';
import { FocusTrap } from './focus-trap';

interface SidebarOptions {
  feedbacks: Feedback[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (feedback: Feedback) => void;
  onExport: (format: 'markdown' | 'zip') => void;
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

  constructor(container: HTMLElement, opts: SidebarOptions) {
    this.container = container;
    this.opts = opts;
    this.currentOrigin = window.location.origin;

    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'fb-sidebar-backdrop';
    this.backdrop.addEventListener('click', () => opts.onClose());

    // Sidebar
    this.sidebar = document.createElement('div');
    this.sidebar.className = 'fb-sidebar';

    // Header
    const header = document.createElement('div');
    header.className = 'fb-sidebar-header';
    this.headerH3 = document.createElement('h3');
    header.appendChild(this.headerH3);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'fb-btn-icon';
    closeBtn.innerHTML = closeIcon(20);
    closeBtn.addEventListener('click', () => opts.onClose());
    header.appendChild(closeBtn);
    this.sidebar.appendChild(header);

    // Filter tabs
    const filterBar = document.createElement('div');
    filterBar.style.cssText = 'display: flex; border-bottom: 1px solid var(--fb-border); padding: 0 16px;';

    const thisSiteBtn = this.createFilterTab('This site', 'this-site');
    const allSitesBtn = this.createFilterTab('All sites', 'all-sites');
    filterBar.appendChild(thisSiteBtn);
    filterBar.appendChild(allSitesBtn);
    this.sidebar.appendChild(filterBar);

    // Body
    this.body = document.createElement('div');
    this.body.className = 'fb-sidebar-body';
    this.sidebar.appendChild(this.body);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'fb-sidebar-footer';

    const exportMdBtn = document.createElement('button');
    exportMdBtn.className = 'fb-btn fb-btn-secondary';
    exportMdBtn.innerHTML = `${arrowDownTrayIcon(16)} <span style="margin-left:4px">Markdown</span>`;
    exportMdBtn.addEventListener('click', () => opts.onExport('markdown'));

    const exportZipBtn = document.createElement('button');
    exportZipBtn.className = 'fb-btn fb-btn-secondary';
    exportZipBtn.innerHTML = `${arrowDownTrayIcon(16)} <span style="margin-left:4px">ZIP</span>`;
    exportZipBtn.addEventListener('click', () => opts.onExport('zip'));

    footer.appendChild(exportMdBtn);
    footer.appendChild(exportZipBtn);
    this.sidebar.appendChild(footer);

    // Escape to close
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        opts.onClose();
        document.removeEventListener('keydown', onKeydown);
      }
    };
    document.addEventListener('keydown', onKeydown);

    container.appendChild(this.backdrop);
    container.appendChild(this.sidebar);

    // Escape to close
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
      ? `This site (${filtered.length}/${total})`
      : `All feedback (${total})`;
    this.headerH3.textContent = label;

    this.body.innerHTML = '';
    this.renderFeedbackList(filtered);

    // Update active tab styles
    this.sidebar.querySelectorAll('[data-filter]').forEach((tab) => {
      const el = tab as HTMLElement;
      const isActive = el.dataset.filter === this.filterMode;
      el.style.borderBottom = isActive ? '2px solid var(--fb-primary)' : '2px solid transparent';
      el.style.color = isActive ? 'var(--fb-primary)' : 'var(--fb-text-secondary)';
      el.style.fontWeight = isActive ? '600' : '400';
    });
  }

  private createFilterTab(label: string, mode: FilterMode): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.dataset.filter = mode;
    btn.textContent = label;
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
      const emptyMsg = this.filterMode === 'this-site'
        ? 'No feedback for this site yet'
        : 'No feedback yet';
      this.body.innerHTML = `<div class="fb-empty"><p>${emptyMsg}</p></div>`;
      return;
    }

    for (const fb of feedbacks) {
      this.body.appendChild(this.createCard(fb));
    }
  }

  private createCard(fb: Feedback): HTMLDivElement {
    const card = document.createElement('div');
    card.className = 'fb-card';

    // Screenshot
    if (fb.screenshot) {
      const img = document.createElement('img');
      img.className = 'fb-card-screenshot';
      img.src = fb.screenshot;
      img.alt = 'Screenshot';
      card.appendChild(img);
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
    editBtn.title = 'Edit';
    editBtn.addEventListener('click', () => this.opts.onEdit(fb));

    const copyBtn = document.createElement('button');
    copyBtn.className = 'fb-btn-icon';
    copyBtn.innerHTML = copyIcon(16);
    copyBtn.title = 'Copy to clipboard';
    copyBtn.addEventListener('click', () => {
      const text = `**${fb.componentName}**\n${fb.comment}\n\nURL: ${fb.url}\nTimestamp: ${fb.timestamp}`;
      navigator.clipboard.writeText(text);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'fb-btn-icon';
    deleteBtn.innerHTML = trashIcon(16);
    deleteBtn.title = 'Delete';
    deleteBtn.style.color = 'var(--fb-error)';
    deleteBtn.addEventListener('click', () => this.opts.onDelete(fb.id));

    actions.appendChild(editBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    return card;
  }
}
