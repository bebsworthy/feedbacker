/**
 * Tests for modal technical details toggle and human-readable names.
 * Covers T-009 (React page), T-010 (non-React page).
 */

import { FeedbackModal } from '../ui/modal';
import type { ComponentInfo } from '@feedbacker/detection';

function createComponentInfo(overrides: Partial<ComponentInfo> = {}): ComponentInfo {
  const el = overrides.element ?? document.createElement('button');
  return {
    name: overrides.name ?? 'SubmitButton',
    path: overrides.path ?? ['App', 'Form', 'SubmitButton'],
    element: el,
    htmlSnippet: overrides.htmlSnippet ?? '<button class="btn-primary">Submit Order</button>',
  };
}

function createModal(
  container: HTMLElement,
  overrides: Partial<{
    componentInfo: ComponentInfo;
    htmlSnippet: string;
    onSubmit: () => void;
    onCancel: () => void;
    onDraftSave: () => void;
  }> = {}
) {
  const info = overrides.componentInfo ?? createComponentInfo();
  return new FeedbackModal(container, {
    componentInfo: info,
    htmlSnippet: overrides.htmlSnippet ?? info.htmlSnippet,
    onSubmit: overrides.onSubmit ?? jest.fn(),
    onCancel: overrides.onCancel ?? jest.fn(),
    onDraftSave: overrides.onDraftSave ?? jest.fn(),
  });
}

describe('Modal technical details (T-009, T-010)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  /**
   * T-009: Modal opened with ComponentInfo including name and path on a React page.
   * - Modal header shows human-readable name.
   * - Technical details toggle exists.
   * - Clicking toggle reveals component name, path, and HTML snippet.
   * - Details hidden by default.
   */
  describe('T-009: React page with component name and path', () => {
    it('shows human-readable name in modal header', () => {
      const el = document.createElement('button');
      el.textContent = 'Submit Order';
      document.body.appendChild(el);

      const modal = createModal(container, {
        componentInfo: createComponentInfo({ element: el }),
      });

      const header = container.querySelector('.fb-modal-header h3');
      expect(header).not.toBeNull();
      // Human-readable name should resolve from element text "Submit Order"
      expect(header!.textContent).toBe('Submit Order');

      modal.destroy();
      el.remove();
    });

    it('has a technical details toggle', () => {
      const modal = createModal(container);

      const toggle = container.querySelector('.fb-details-toggle');
      expect(toggle).not.toBeNull();
      expect(toggle!.textContent).toContain('Technical details');

      modal.destroy();
    });

    it('technical details are hidden by default', () => {
      const modal = createModal(container);

      const toggle = container.querySelector('.fb-details-toggle') as HTMLButtonElement;
      expect(toggle.getAttribute('aria-expanded')).toBe('false');

      const content = container.querySelector('.fb-details-content') as HTMLElement;
      expect(content.style.display).toBe('none');

      modal.destroy();
    });

    it('clicking toggle reveals component name, path, and HTML snippet', () => {
      const modal = createModal(container);

      const toggle = container.querySelector('.fb-details-toggle') as HTMLButtonElement;
      toggle.click();

      expect(toggle.getAttribute('aria-expanded')).toBe('true');

      const content = container.querySelector('.fb-details-content') as HTMLElement;
      expect(content.style.display).toBe('block');

      const rows = content.querySelectorAll('.fb-detail-row');
      const texts = Array.from(rows).map((r) => r.textContent ?? '');

      // Component name row
      const componentRow = texts.find((t) => t.includes('Component:'));
      expect(componentRow).toBeDefined();
      expect(componentRow).toContain('SubmitButton');

      // Path row
      const pathRow = texts.find((t) => t.includes('Path:'));
      expect(pathRow).toBeDefined();
      expect(pathRow).toContain('App > Form > SubmitButton');

      // HTML snippet row
      const htmlRow = texts.find((t) => t.includes('HTML:'));
      expect(htmlRow).toBeDefined();
      expect(htmlRow).toContain('<button class="btn-primary">Submit Order</button>');

      modal.destroy();
    });

    it('toggle can collapse details again', () => {
      const modal = createModal(container);

      const toggle = container.querySelector('.fb-details-toggle') as HTMLButtonElement;
      toggle.click(); // expand
      toggle.click(); // collapse

      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      const content = container.querySelector('.fb-details-content') as HTMLElement;
      expect(content.style.display).toBe('none');

      modal.destroy();
    });
  });

  /**
   * T-010: Modal opened with ComponentInfo on a non-React page (no component name).
   * - Technical details section shows tag name and HTML snippet only.
   * - No component path shown.
   */
  describe('T-010: Non-React page (no component name)', () => {
    it('shows tag name in header when no component name', () => {
      const el = document.createElement('div');
      el.className = 'hero-section';
      document.body.appendChild(el);

      const info: ComponentInfo = {
        name: 'Unknown',
        path: [],
        element: el,
        htmlSnippet: '<div class="hero-section"></div>',
      };

      const modal = createModal(container, {
        componentInfo: info,
        htmlSnippet: info.htmlSnippet,
      });

      const header = container.querySelector('.fb-modal-header h3');
      expect(header).not.toBeNull();
      // With name "Unknown", no aria-label, no text, no role ->
      // falls through to tag.class fallback: "div.hero-section"
      expect(header!.textContent).toBe('div.hero-section');

      modal.destroy();
      el.remove();
    });

    it('does not show component name or path rows', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const info: ComponentInfo = {
        name: 'Unknown',
        path: [],
        element: el,
        htmlSnippet: '<div></div>',
      };

      const modal = createModal(container, {
        componentInfo: info,
        htmlSnippet: info.htmlSnippet,
      });

      const toggle = container.querySelector('.fb-details-toggle') as HTMLButtonElement;
      expect(toggle).not.toBeNull();
      toggle.click();

      const content = container.querySelector('.fb-details-content') as HTMLElement;
      const rows = content.querySelectorAll('.fb-detail-row');
      const texts = Array.from(rows).map((r) => r.textContent ?? '');

      // No component row (name is "Unknown")
      const componentRow = texts.find((t) => t.includes('Component:'));
      expect(componentRow).toBeUndefined();

      // No path row (path is empty)
      const pathRow = texts.find((t) => t.includes('Path:'));
      expect(pathRow).toBeUndefined();

      // HTML snippet row should still exist
      const htmlRow = texts.find((t) => t.includes('HTML:'));
      expect(htmlRow).toBeDefined();
      expect(htmlRow).toContain('<div></div>');

      modal.destroy();
      el.remove();
    });

    it('shows only snippet when no component name and no path', () => {
      const el = document.createElement('span');
      document.body.appendChild(el);

      const info: ComponentInfo = {
        name: 'Unknown',
        path: [],
        element: el,
        htmlSnippet: '<span></span>',
      };

      const modal = createModal(container, {
        componentInfo: info,
        htmlSnippet: info.htmlSnippet,
      });

      const toggle = container.querySelector('.fb-details-toggle') as HTMLButtonElement;
      expect(toggle).not.toBeNull();
      toggle.click();

      const content = container.querySelector('.fb-details-content') as HTMLElement;
      const rows = content.querySelectorAll('.fb-detail-row');
      // Should have exactly 1 row (HTML snippet only)
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain('HTML:');

      modal.destroy();
      el.remove();
    });
  });
});
