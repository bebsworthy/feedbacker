/**
 * Tests for ExportDialog component.
 * Covers T-003, T-018, T-028, T-029.
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
    onCopyAll: jest.Mock;
    onCancel: jest.Mock;
  }> = {}) {
    return new ExportDialog(container, {
      feedbackCount: overrides.feedbackCount ?? 5,
      onExport: overrides.onExport ?? jest.fn(),
      onCopyAll: overrides.onCopyAll ?? jest.fn(),
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

      // The third option is the ZIP option (copy-all is first, markdown is second)
      const zipOption = options[2];
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
   * T-018: Copy all option exists and is first in dialog.
   * ExportDialog renders three options. First option has text "Copy all to clipboard"
   * with clipboard icon.
   */
  describe('T-018: Copy all option exists and is first in dialog', () => {
    it('renders three options', () => {
      const dialog = createExportDialog();
      const options = container.querySelectorAll('.fb-export-option');
      expect(options.length).toBe(3);

      dialog.destroy();
    });

    it('first option has text "Copy all to clipboard"', () => {
      const dialog = createExportDialog();
      const options = container.querySelectorAll('.fb-export-option');
      const firstOption = options[0];
      const title = firstOption.querySelector('.fb-export-option-text h4');
      expect(title).not.toBeNull();
      expect(title!.textContent).toBe('Copy all to clipboard');

      dialog.destroy();
    });

    it('first option has clipboard icon (SVG)', () => {
      const dialog = createExportDialog();
      const options = container.querySelectorAll('.fb-export-option');
      const firstOption = options[0];
      const svg = firstOption.querySelector('svg');
      expect(svg).not.toBeNull();

      dialog.destroy();
    });

    it('clicking Copy all invokes onCopyAll', () => {
      const onCopyAll = jest.fn();
      const dialog = createExportDialog({ onCopyAll });
      const options = container.querySelectorAll('.fb-export-option');
      (options[0] as HTMLElement).click();

      expect(onCopyAll).toHaveBeenCalled();

      dialog.destroy();
    });
  });

  /**
   * T-028: Export dialog header says "Share / Export".
   * Header h3 text is "Share / Export N items" (not "Export N items").
   */
  describe('T-028: Export dialog header says "Share / Export"', () => {
    it('header h3 contains "Share / Export" prefix', () => {
      const dialog = createExportDialog({ feedbackCount: 5 });
      const h3 = container.querySelector('.fb-modal-header h3');
      expect(h3).not.toBeNull();
      expect(h3!.textContent).toBe('Share / Export 5 items');

      dialog.destroy();
    });

    it('uses singular "item" for count of 1', () => {
      const dialog = createExportDialog({ feedbackCount: 1 });
      const h3 = container.querySelector('.fb-modal-header h3');
      expect(h3!.textContent).toBe('Share / Export 1 item');

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
