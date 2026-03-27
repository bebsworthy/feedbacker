/**
 * Tests for FAB (Floating Action Button) component.
 * Covers T-001, T-012, T-017, T-030.
 */

import { FAB } from '../ui/fab';

// Mock navigator.platform for OS-detection
const originalPlatform = Object.getOwnPropertyDescriptor(navigator, 'platform');

function mockPlatform(value: string): void {
  Object.defineProperty(navigator, 'platform', {
    value,
    writable: true,
    configurable: true,
  });
}

function restorePlatform(): void {
  if (originalPlatform) {
    Object.defineProperty(navigator, 'platform', originalPlatform);
  }
}

describe('FAB', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    restorePlatform();
  });

  function createFAB(overrides: Partial<{
    feedbackCount: number;
    hasDraft: boolean;
    position: string;
    primaryColor: string;
  }> = {}) {
    return new FAB(container, {
      feedbackCount: overrides.feedbackCount ?? 3,
      hasDraft: overrides.hasDraft ?? false,
      position: overrides.position,
      primaryColor: overrides.primaryColor,
      onNewFeedback: jest.fn(),
      onShowManager: jest.fn(),
      onExport: jest.fn(),
    });
  }

  /**
   * T-001: FAB expand() renders menu items with correct labels.
   * Menu contains "New feedback", "View feedback (N)", "Share / Export".
   * Menu does NOT contain "Clear all" or "Show manager" or "Export" (standalone).
   */
  describe('T-001: FAB expand() renders correct menu items', () => {
    it('renders "New feedback", "View feedback (N)", "Share / Export" when expanded', () => {
      const fab = createFAB({ feedbackCount: 5 });
      const button = container.querySelector('.fb-fab') as HTMLButtonElement;
      button.click(); // expand

      const actionLabels = Array.from(container.querySelectorAll('.fb-fab-action span'))
        .map((el) => el.textContent);

      expect(actionLabels).toContain('New feedback');
      expect(actionLabels).toContain('View feedback (5)');
      expect(actionLabels).toContain('Share / Export');

      fab.destroy();
    });

    it('does NOT contain "Clear all" in the menu', () => {
      const fab = createFAB();
      const button = container.querySelector('.fb-fab') as HTMLButtonElement;
      button.click();

      const allText = container.textContent || '';
      expect(allText).not.toContain('Clear all');

      fab.destroy();
    });

    it('does NOT contain standalone "Export" or "Show manager" labels', () => {
      const fab = createFAB();
      const button = container.querySelector('.fb-fab') as HTMLButtonElement;
      button.click();

      const actionLabels = Array.from(container.querySelectorAll('.fb-fab-action span'))
        .map((el) => el.textContent);

      // Should not have "Export" as a standalone label (only "Share / Export")
      expect(actionLabels).not.toContain('Export');
      // Should not have "Show manager" (only "View feedback")
      const hasShowManager = actionLabels.some((l) => l?.includes('Show manager'));
      expect(hasShowManager).toBe(false);

      fab.destroy();
    });
  });

  /**
   * T-012: FAB button has tooltip with keyboard shortcut.
   * button.title contains "Shift+F".
   */
  describe('T-012: FAB tooltip with keyboard shortcut', () => {
    it('has a title attribute containing "Shift+F" on Mac', () => {
      mockPlatform('MacIntel');
      const fab = createFAB();
      const button = container.querySelector('.fb-fab') as HTMLButtonElement;
      expect(button.title).toContain('Opt+Shift+F');

      fab.destroy();
    });

    it('has a title attribute containing "Shift+F" on non-Mac', () => {
      mockPlatform('Win32');
      const fab = createFAB();
      const button = container.querySelector('.fb-fab') as HTMLButtonElement;
      expect(button.title).toContain('Alt+Shift+F');

      fab.destroy();
    });
  });

  /**
   * T-017: FAB has aria-label and aria-expanded toggles.
   * Before expand: aria-expanded="false".
   * After expand: aria-expanded="true".
   * After collapse: aria-expanded="false".
   */
  describe('T-017: FAB aria-label and aria-expanded toggles', () => {
    it('has aria-label="Feedbacker menu"', () => {
      const fab = createFAB();
      const button = container.querySelector('.fb-fab') as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toBe('Feedbacker menu');

      fab.destroy();
    });

    it('has aria-expanded="false" before expand', () => {
      const fab = createFAB();
      const button = container.querySelector('.fb-fab') as HTMLButtonElement;
      expect(button.getAttribute('aria-expanded')).toBe('false');

      fab.destroy();
    });

    it('has aria-expanded="true" after expand', () => {
      const fab = createFAB();
      const button = container.querySelector('.fb-fab') as HTMLButtonElement;
      button.click(); // expand
      expect(button.getAttribute('aria-expanded')).toBe('true');

      fab.destroy();
    });

    it('has aria-expanded="false" after collapse', () => {
      const fab = createFAB();
      const button = container.querySelector('.fb-fab') as HTMLButtonElement;
      button.click(); // expand
      button.click(); // collapse
      expect(button.getAttribute('aria-expanded')).toBe('false');

      fab.destroy();
    });
  });

  /**
   * T-030: Badge has descriptive aria-label.
   * Badge element has aria-label containing "feedback items".
   */
  describe('T-030: Badge has descriptive aria-label', () => {
    it('has aria-label containing "feedback items"', () => {
      const fab = createFAB({ feedbackCount: 7 });
      const badge = container.querySelector('.fb-fab-badge') as HTMLElement;
      expect(badge).not.toBeNull();
      expect(badge.getAttribute('aria-label')).toContain('feedback items');
      expect(badge.getAttribute('aria-label')).toContain('7');

      fab.destroy();
    });

    it('updates aria-label when count changes', () => {
      const fab = createFAB({ feedbackCount: 3 });
      fab.updateCount(10);
      const badge = container.querySelector('.fb-fab-badge') as HTMLElement;
      expect(badge.getAttribute('aria-label')).toContain('10');
      expect(badge.getAttribute('aria-label')).toContain('feedback items');

      fab.destroy();
    });
  });
});
