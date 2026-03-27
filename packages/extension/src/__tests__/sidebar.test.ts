/**
 * Tests for ManagerSidebar component.
 * Covers T-002, T-009, T-010, T-016, T-018, T-024, T-027.
 */

import { ManagerSidebar } from '../ui/sidebar';
import type { Feedback } from '@feedbacker/core';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    write: jest.fn().mockResolvedValue(undefined),
  },
});

function createFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: overrides.id ?? 'fb_1',
    componentName: overrides.componentName ?? 'TestComponent',
    componentPath: overrides.componentPath ?? ['App', 'TestComponent'],
    comment: overrides.comment ?? 'Test feedback comment',
    url: overrides.url ?? 'https://example.com/page',
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    browserInfo: overrides.browserInfo ?? {
      userAgent: 'test',
      viewport: { width: 1024, height: 768 },
      platform: 'test',
    },
    screenshot: overrides.screenshot,
    htmlSnippet: overrides.htmlSnippet,
  };
}

describe('ManagerSidebar', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // Mock window.location.origin for filtering
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com', href: 'https://example.com/page' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    container.remove();
  });

  function createSidebar(overrides: Partial<{
    feedbacks: Feedback[];
    onClose: jest.Mock;
    onDelete: jest.Mock;
    onSaveEdit: jest.Mock;
    onShowExportDialog: jest.Mock;
    onStartCapture: jest.Mock;
    onAnnounce: jest.Mock;
  }> = {}) {
    return new ManagerSidebar(container, {
      feedbacks: overrides.feedbacks ?? [createFeedback()],
      onClose: overrides.onClose ?? jest.fn(),
      onDelete: overrides.onDelete ?? jest.fn(),
      onSaveEdit: overrides.onSaveEdit ?? jest.fn().mockResolvedValue(undefined),
      onShowExportDialog: overrides.onShowExportDialog ?? jest.fn(),
      onStartCapture: overrides.onStartCapture ?? jest.fn(),
      onAnnounce: overrides.onAnnounce ?? jest.fn(),
    });
  }

  /**
   * T-002: Sidebar card copy button tooltip.
   * Copy button dataset.tooltip equals "Copy to clipboard", NOT "Copy markdown".
   */
  describe('T-002: Copy button tooltip', () => {
    it('has dataset.tooltip "Copy to clipboard"', () => {
      const sidebar = createSidebar();
      const copyBtn = container.querySelector('[aria-label="Copy to clipboard"]') as HTMLButtonElement;
      expect(copyBtn).not.toBeNull();
      expect(copyBtn.dataset.tooltip).toBe('Copy to clipboard');

      sidebar.destroy();
    });

    it('does NOT have "Copy markdown" tooltip', () => {
      const sidebar = createSidebar();
      const allButtons = Array.from(container.querySelectorAll('[data-tooltip]'));
      const hasMarkdownTooltip = allButtons.some(
        (btn) => (btn as HTMLElement).dataset.tooltip === 'Copy markdown'
      );
      expect(hasMarkdownTooltip).toBe(false);

      sidebar.destroy();
    });
  });

  /**
   * T-009: Empty state shows designed layout.
   * Render sidebar with zero feedbacks. .fb-empty container exists with SVG
   * illustration, heading, subtext, and CTA button.
   */
  describe('T-009: Empty state shows designed layout', () => {
    it('renders .fb-empty container with SVG illustration', () => {
      const sidebar = createSidebar({ feedbacks: [] });
      const emptyEl = container.querySelector('.fb-empty');
      expect(emptyEl).not.toBeNull();

      const svg = emptyEl!.querySelector('.fb-empty-illustration');
      expect(svg).not.toBeNull();

      sidebar.destroy();
    });

    it('contains heading "No feedback yet"', () => {
      const sidebar = createSidebar({ feedbacks: [] });
      const emptyEl = container.querySelector('.fb-empty');
      const heading = emptyEl!.querySelector('h4');
      expect(heading).not.toBeNull();
      expect(heading!.textContent).toBe('No feedback yet');

      sidebar.destroy();
    });

    it('contains subtext about starting a review', () => {
      const sidebar = createSidebar({ feedbacks: [] });
      const emptyEl = container.querySelector('.fb-empty');
      const subtext = emptyEl!.querySelector('p');
      expect(subtext).not.toBeNull();
      expect(subtext!.textContent).toContain('New feedback');

      sidebar.destroy();
    });

    it('contains "Start reviewing" CTA button with primary class', () => {
      const sidebar = createSidebar({ feedbacks: [] });
      const emptyEl = container.querySelector('.fb-empty');
      const ctaBtn = emptyEl!.querySelector('.fb-btn.fb-btn-primary') as HTMLButtonElement;
      expect(ctaBtn).not.toBeNull();
      expect(ctaBtn.textContent).toBe('Start reviewing');

      sidebar.destroy();
    });
  });

  /**
   * T-010: Empty state CTA triggers capture flow.
   * Click "Start reviewing" button: onStartCapture is called and sidebar closes.
   */
  describe('T-010: Empty state CTA triggers capture flow', () => {
    it('calls onStartCapture and onClose when CTA is clicked', () => {
      const onStartCapture = jest.fn();
      const onClose = jest.fn();
      const sidebar = createSidebar({ feedbacks: [], onStartCapture, onClose });
      const emptyEl = container.querySelector('.fb-empty');
      const ctaBtn = emptyEl!.querySelector('.fb-btn.fb-btn-primary') as HTMLButtonElement;
      ctaBtn.click();

      expect(onStartCapture).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();

      sidebar.destroy();
    });
  });

  /**
   * T-027: Sidebar header has Share/Export button, footer is removed.
   * No .fb-sidebar-footer element exists. Header contains "Share / Export" button.
   */
  describe('T-027: Sidebar header has Share/Export button, footer is removed', () => {
    it('does not render .fb-sidebar-footer', () => {
      const sidebar = createSidebar();
      const footer = container.querySelector('.fb-sidebar-footer');
      expect(footer).toBeNull();

      sidebar.destroy();
    });

    it('header contains "Share / Export" button', () => {
      const sidebar = createSidebar();
      const header = container.querySelector('.fb-sidebar-header');
      expect(header).not.toBeNull();

      const exportBtn = header!.querySelector('[aria-label="Share / Export"]') as HTMLButtonElement;
      expect(exportBtn).not.toBeNull();
      expect(exportBtn.textContent).toContain('Share / Export');

      sidebar.destroy();
    });

    it('clicking header export button calls onShowExportDialog', () => {
      const onShowExportDialog = jest.fn();
      const sidebar = createSidebar({ onShowExportDialog });
      const header = container.querySelector('.fb-sidebar-header');
      const exportBtn = header!.querySelector('[aria-label="Share / Export"]') as HTMLButtonElement;
      exportBtn.click();

      expect(onShowExportDialog).toHaveBeenCalled();

      sidebar.destroy();
    });
  });

  /**
   * T-016: Sidebar has complementary role.
   * Sidebar element has role="complementary" and aria-label.
   */
  describe('T-016: Sidebar has complementary role', () => {
    it('has role="complementary"', () => {
      const sidebar = createSidebar();
      const sidebarEl = container.querySelector('.fb-sidebar');
      expect(sidebarEl).not.toBeNull();
      expect(sidebarEl!.getAttribute('role')).toBe('complementary');

      sidebar.destroy();
    });

    it('has an aria-label', () => {
      const sidebar = createSidebar();
      const sidebarEl = container.querySelector('.fb-sidebar');
      expect(sidebarEl!.getAttribute('aria-label')).toBe('Feedback manager');

      sidebar.destroy();
    });
  });

  /**
   * T-018: Filter tabs have correct ARIA roles.
   * Filter bar has role="tablist".
   * Each tab has role="tab".
   * Active tab has aria-selected="true", inactive has aria-selected="false".
   * Switching tabs toggles aria-selected.
   */
  describe('T-018: Filter tabs ARIA roles', () => {
    it('filter bar has role="tablist"', () => {
      const sidebar = createSidebar();
      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).not.toBeNull();

      sidebar.destroy();
    });

    it('each tab has role="tab"', () => {
      const sidebar = createSidebar();
      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(2);

      sidebar.destroy();
    });

    it('active tab has aria-selected="true" and inactive has "false"', () => {
      const sidebar = createSidebar();
      const tabs = Array.from(container.querySelectorAll('[role="tab"]')) as HTMLElement[];

      // Default is "this-site" which is the first tab
      const thisSiteTab = tabs.find((t) => t.dataset.filter === 'this-site');
      const allSitesTab = tabs.find((t) => t.dataset.filter === 'all-sites');

      expect(thisSiteTab!.getAttribute('aria-selected')).toBe('true');
      expect(allSitesTab!.getAttribute('aria-selected')).toBe('false');

      sidebar.destroy();
    });

    it('toggles aria-selected when switching tabs', () => {
      const sidebar = createSidebar();
      const tabs = Array.from(container.querySelectorAll('[role="tab"]')) as HTMLElement[];

      const allSitesTab = tabs.find((t) => t.dataset.filter === 'all-sites') as HTMLElement;
      allSitesTab.click();

      // Re-query after render
      const updatedTabs = Array.from(container.querySelectorAll('[role="tab"]')) as HTMLElement[];
      const updatedThisSite = updatedTabs.find((t) => t.dataset.filter === 'this-site');
      const updatedAllSites = updatedTabs.find((t) => t.dataset.filter === 'all-sites');

      expect(updatedAllSites!.getAttribute('aria-selected')).toBe('true');
      expect(updatedThisSite!.getAttribute('aria-selected')).toBe('false');

      sidebar.destroy();
    });
  });

  /**
   * T-024: All icon-only buttons have aria-label.
   * editBtn, copyBtn, deleteBtn each have aria-label.
   * screenshotCopyBtn has aria-label="Copy screenshot".
   */
  describe('T-024: Icon-only buttons have aria-label', () => {
    it('edit button has aria-label', () => {
      const sidebar = createSidebar();
      const editBtn = container.querySelector('[aria-label="Edit feedback"]');
      expect(editBtn).not.toBeNull();

      sidebar.destroy();
    });

    it('copy button has aria-label', () => {
      const sidebar = createSidebar();
      const copyBtn = container.querySelector('[aria-label="Copy to clipboard"]');
      expect(copyBtn).not.toBeNull();

      sidebar.destroy();
    });

    it('delete button has aria-label', () => {
      const sidebar = createSidebar();
      const deleteBtn = container.querySelector('[aria-label="Delete feedback"]');
      expect(deleteBtn).not.toBeNull();

      sidebar.destroy();
    });

    it('close sidebar button has aria-label', () => {
      const sidebar = createSidebar();
      const closeBtn = container.querySelector('[aria-label="Close sidebar"]');
      expect(closeBtn).not.toBeNull();

      sidebar.destroy();
    });

    it('screenshot copy button has aria-label when screenshot exists', () => {
      const sidebar = createSidebar({
        feedbacks: [createFeedback({ screenshot: 'data:image/png;base64,abc' })],
      });
      const copyImgBtn = container.querySelector('[aria-label="Copy screenshot"]');
      expect(copyImgBtn).not.toBeNull();

      sidebar.destroy();
    });
  });
});
