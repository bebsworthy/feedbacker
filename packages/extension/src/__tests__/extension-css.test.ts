/**
 * Tests for extension CSS styles.
 * Covers T-014, T-020, T-021, T-022, T-026.
 */

import { EXTENSION_CSS } from '../styles/extension-css';

/**
 * Calculate relative luminance of a hex color (WCAG 2.1 formula).
 */
function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const srgb = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * Calculate WCAG contrast ratio between two hex colors.
 */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Extension CSS', () => {
  /**
   * T-014: Focus-visible styles exist for all interactive classes.
   * CSS string contains :focus-visible rules for .fb-btn, .fb-btn-icon,
   * .fb-fab, .fb-fab-action, .fb-export-option.
   */
  describe('T-014: Focus-visible styles', () => {
    it('contains :focus-visible rules for .fb-btn', () => {
      expect(EXTENSION_CSS).toContain('.fb-btn:focus-visible');
    });

    it('contains :focus-visible rules for .fb-btn-icon', () => {
      expect(EXTENSION_CSS).toContain('.fb-btn-icon:focus-visible');
    });

    it('contains :focus-visible rules for .fb-fab', () => {
      expect(EXTENSION_CSS).toContain('.fb-fab:focus-visible');
    });

    it('contains :focus-visible rules for .fb-fab-action', () => {
      expect(EXTENSION_CSS).toContain('.fb-fab-action:focus-visible');
    });

    it('contains :focus-visible rules for .fb-export-option', () => {
      expect(EXTENSION_CSS).toContain('.fb-export-option:focus-visible');
    });

    it('uses box-shadow for focus indicators (not outline)', () => {
      // Extract the focus-visible block
      const focusVisibleMatch = EXTENSION_CSS.match(
        /\.fb-btn:focus-visible[\s\S]*?\{([\s\S]*?)\}/
      );
      expect(focusVisibleMatch).not.toBeNull();
      const block = focusVisibleMatch![1];
      expect(block).toContain('box-shadow');
      expect(block).toContain('outline: none');
    });
  });

  /**
   * T-020: Light mode muted text contrast passes AA.
   * --fb-text-muted in light mode is #6b7280.
   * Verify contrast ratio >= 4.5:1 against #ffffff.
   */
  describe('T-020: Light mode muted text contrast', () => {
    it('--fb-text-muted is #6b7280 in light mode', () => {
      // Match the first (light mode) declaration of --fb-text-muted
      const match = EXTENSION_CSS.match(/--fb-text-muted:\s*(#[0-9a-fA-F]{6})/);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('#6b7280');
    });

    it('contrast ratio of #6b7280 on #ffffff >= 4.5:1 (AA)', () => {
      const ratio = contrastRatio('#6b7280', '#ffffff');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  /**
   * T-021: Dark mode muted text contrast passes AA.
   * --fb-text-muted in dark mode (prefers-color-scheme: dark) is #d1d5db.
   * Verify contrast ratio >= 4.5:1 against #1f2937.
   */
  describe('T-021: Dark mode muted text contrast', () => {
    it('--fb-text-muted is #d1d5db in dark mode block', () => {
      // Find the dark mode media query block
      const darkMatch = EXTENSION_CSS.match(
        /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?--fb-text-muted:\s*(#[0-9a-fA-F]{6})/
      );
      expect(darkMatch).not.toBeNull();
      expect(darkMatch![1]).toBe('#d1d5db');
    });

    it('contrast ratio of #d1d5db on #1f2937 >= 4.5:1 (AA)', () => {
      const ratio = contrastRatio('#d1d5db', '#1f2937');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  /**
   * T-022: Reduced motion media query exists.
   * CSS string contains @media (prefers-reduced-motion: reduce) with
   * transition-duration: 0s and animation-duration: 0s.
   */
  describe('T-022: Reduced motion media query', () => {
    it('contains @media (prefers-reduced-motion: reduce)', () => {
      expect(EXTENSION_CSS).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('sets transition-duration: 0s', () => {
      const reducedMotionBlock = EXTENSION_CSS.match(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\}\s*\}/
      );
      expect(reducedMotionBlock).not.toBeNull();
      expect(reducedMotionBlock![1]).toContain('transition-duration: 0s');
    });

    it('sets animation-duration: 0s', () => {
      const reducedMotionBlock = EXTENSION_CSS.match(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\}\s*\}/
      );
      expect(reducedMotionBlock).not.toBeNull();
      expect(reducedMotionBlock![1]).toContain('animation-duration: 0s');
    });
  });

  /**
   * T-026: Screenshot copy button is always visible.
   * CSS for .fb-screenshot-copy does NOT have opacity: 0 as default.
   * Opacity is >= 0.85 by default.
   */
  describe('T-026: Screenshot copy button always visible', () => {
    it('does NOT have opacity: 0 as default for .fb-screenshot-copy', () => {
      // Extract the .fb-screenshot-copy block (not the hover variant)
      const match = EXTENSION_CSS.match(
        /\.fb-screenshot-copy\s*\{([\s\S]*?)\}/
      );
      expect(match).not.toBeNull();
      const block = match![1];

      // Should not contain "opacity: 0" (but may contain "opacity: 0.85")
      const opacityValues = block.match(/opacity:\s*([0-9.]+)/g) || [];
      for (const val of opacityValues) {
        const num = parseFloat(val.replace('opacity:', '').trim());
        expect(num).not.toBe(0);
      }
    });

    it('has default opacity >= 0.85', () => {
      const match = EXTENSION_CSS.match(
        /\.fb-screenshot-copy\s*\{([\s\S]*?)\}/
      );
      expect(match).not.toBeNull();
      const block = match![1];

      const opacityMatch = block.match(/opacity:\s*([0-9.]+)/);
      expect(opacityMatch).not.toBeNull();
      const opacity = parseFloat(opacityMatch![1]);
      expect(opacity).toBeGreaterThanOrEqual(0.85);
    });
  });
});
