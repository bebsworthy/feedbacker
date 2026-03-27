/**
 * Tests for ExportDialog component.
 * Covers T-003, T-029.
 */

import { ExportDialog } from '../ui/export-dialog';

describe('ExportDialog', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  function createExportDialog(overrides: Partial<{
    feedbackCount: number;
    onExport: jest.Mock;
    onCancel: jest.Mock;
  }> = {}) {
    return new ExportDialog(container, {
      feedbackCount: overrides.feedbackCount ?? 5,
      onExport: overrides.onExport ?? jest.fn(),
      onCancel: overrides.onCancel ?? jest.fn(),
    });
  }

  /**
   * T-003: Export dialog ZIP option description.
   * ZIP option description text is "Full report with screenshots",
   * does NOT contain "JSON data".
   */
  describe('T-003: ZIP option description', () => {
    it('ZIP option has "Full report with screenshots" description', () => {
      const dialog = createExportDialog();
      const options = container.querySelectorAll('.fb-export-option');

      // The second option is the ZIP option
      const zipOption = options[1];
      expect(zipOption).not.toBeUndefined();
      const description = zipOption.querySelector('.fb-export-option-text p');
      expect(description).not.toBeNull();
      expect(description!.textContent).toBe('Full report with screenshots');

      dialog.destroy();
    });

    it('ZIP option does NOT contain "JSON data"', () => {
      const dialog = createExportDialog();
      const allText = container.textContent || '';
      expect(allText).not.toContain('JSON data');

      dialog.destroy();
    });
  });

  /**
   * T-029: Export dialog has dialog role.
   * Modal element has role="dialog" and aria-modal="true".
   */
  describe('T-029: Export dialog has dialog role', () => {
    it('has role="dialog"', () => {
      const dialog = createExportDialog();
      const modalEl = container.querySelector('.fb-modal');
      expect(modalEl).not.toBeNull();
      expect(modalEl!.getAttribute('role')).toBe('dialog');

      dialog.destroy();
    });

    it('has aria-modal="true"', () => {
      const dialog = createExportDialog();
      const modalEl = container.querySelector('.fb-modal');
      expect(modalEl!.getAttribute('aria-modal')).toBe('true');

      dialog.destroy();
    });

    it('has an aria-label mentioning item count', () => {
      const dialog = createExportDialog({ feedbackCount: 3 });
      const modalEl = container.querySelector('.fb-modal');
      const label = modalEl!.getAttribute('aria-label') || '';
      expect(label).toContain('3');

      dialog.destroy();
    });
  });
});
