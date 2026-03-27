/**
 * Tests for modal component name, path display, and HTML snippet toggle.
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

describe('Modal component display (T-009, T-010)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  /**
   * T-009: React page — header shows component name, path always visible.
   */
  describe('T-009: React page with component name and path', () => {
    it('shows component name in modal header', () => {
      const modal = createModal(container);

      const header = container.querySelector('.fb-modal-header h3');
      expect(header).not.toBeNull();
      expect(header!.textContent).toBe('SubmitButton');

      modal.destroy();
    });

    it('shows component path always visible (not behind toggle)', () => {
      const modal = createModal(container);

      const pathEl = container.querySelector('.fb-component-path');
      expect(pathEl).not.toBeNull();
      expect(pathEl!.textContent).toContain('App > Form > SubmitButton');

      modal.destroy();
    });

    it('does not show HTML snippet in modal', () => {
      const modal = createModal(container);

      const toggle = container.querySelector('.fb-details-toggle');
      expect(toggle).toBeNull();

      modal.destroy();
    });
  });

  /**
   * T-010: Non-React page — header shows raw name, no path.
   */
  describe('T-010: Non-React page (no component name)', () => {
    it('shows "Unknown" tag name in header when no component name', () => {
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
      // Shows raw name "Unknown" — the tag identity is in the HTML snippet
      expect(header!.textContent).toBe('Unknown');

      modal.destroy();
      el.remove();
    });

    it('does not show path when path is empty', () => {
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

      const pathEl = container.querySelector('.fb-component-path');
      expect(pathEl).toBeNull();

      modal.destroy();
      el.remove();
    });

    it('does not show any toggle when no path', () => {
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

      const toggle = container.querySelector('.fb-details-toggle');
      expect(toggle).toBeNull();

      modal.destroy();
      el.remove();
    });
  });
});
