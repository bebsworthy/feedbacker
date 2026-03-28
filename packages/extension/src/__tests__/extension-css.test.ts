/**
 * Tests for extension CSS styles.
 * Covers Phase 1: T-014, T-020, T-021, T-022, T-026.
 * Covers Phase 2: T-011 (icon sizing), T-015 (keyframes),
 *   T-016 (animation classes), T-017 (reduced motion).
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
   * .fb-fab-capture, .fb-fab-count, .fb-export-option.
   */
  describe('T-014: Focus-visible styles', () => {
    it('contains :focus-visible rules for .fb-btn', () => {
      expect(EXTENSION_CSS).toContain('.fb-btn:focus-visible');
    });

    it('contains :focus-visible rules for .fb-btn-icon', () => {
      expect(EXTENSION_CSS).toContain('.fb-btn-icon:focus-visible');
    });

    it('contains :focus-visible rules for .fb-fab-capture', () => {
      expect(EXTENSION_CSS).toContain('.fb-fab-capture:focus-visible');
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
   * CSS for .fb-screenshot-copy is hidden by default and revealed on hover.
   */
  describe('T-026: Screenshot copy button revealed on hover', () => {
    it('has opacity: 0 by default for .fb-screenshot-copy', () => {
      const match = EXTENSION_CSS.match(
        /\.fb-screenshot-copy\s*\{([\s\S]*?)\}/
      );
      expect(match).not.toBeNull();
      const block = match![1];

      const opacityMatch = block.match(/opacity:\s*([0-9.]+)/);
      expect(opacityMatch).not.toBeNull();
      expect(parseFloat(opacityMatch![1])).toBe(0);
    });

    it('shows on hover with opacity >= 0.85', () => {
      const match = EXTENSION_CSS.match(
        /\.fb-screenshot-wrap:hover\s+\.fb-screenshot-copy\s*\{([\s\S]*?)\}/
      );
      expect(match).not.toBeNull();
      const block = match![1];

      const opacityMatch = block.match(/opacity:\s*([0-9.]+)/);
      expect(opacityMatch).not.toBeNull();
      expect(parseFloat(opacityMatch![1])).toBeGreaterThanOrEqual(0.85);
    });
  });

  // ============================================================
  // Phase 2 Tests
  // ============================================================

  /**
   * T-011: .fb-btn-icon has padding 8px, .fb-card-actions has gap 8px.
   */
  describe('T-011: Card action icon sizing', () => {
    it('.fb-btn-icon has padding: 8px', () => {
      const match = EXTENSION_CSS.match(
        /\.fb-btn-icon\s*\{([\s\S]*?)\}/
      );
      expect(match).not.toBeNull();
      expect(match![1]).toContain('padding: 8px');
    });

    it('.fb-card-actions has gap: 8px', () => {
      const match = EXTENSION_CSS.match(
        /\.fb-card-actions\s*\{([\s\S]*?)\}/
      );
      expect(match).not.toBeNull();
      expect(match![1]).toContain('gap: 8px');
    });
  });

  /**
   * T-015: Animation keyframes defined (fb-sidebar-in, fb-modal-in, fb-fab-cascade).
   */
  describe('T-015: Entrance animation keyframes exist', () => {
    it('contains @keyframes fb-sidebar-in', () => {
      expect(EXTENSION_CSS).toContain('@keyframes fb-sidebar-in');
    });

    it('fb-sidebar-in animates from translateX(100%) to translateX(0)', () => {
      // Match the full keyframes block including nested braces
      const match = EXTENSION_CSS.match(
        /@keyframes fb-sidebar-in\s*\{([\s\S]*?)\}\s*\}/
      );
      expect(match).not.toBeNull();
      const block = match![1];
      expect(block).toContain('translateX(100%)');
      expect(block).toContain('translateX(0)');
    });

    it('contains @keyframes fb-modal-in', () => {
      expect(EXTENSION_CSS).toContain('@keyframes fb-modal-in');
    });

    it('fb-modal-in animates from translateY(12px) opacity 0 to final', () => {
      const match = EXTENSION_CSS.match(
        /@keyframes fb-modal-in\s*\{([\s\S]*?)\}\s*\}/
      );
      expect(match).not.toBeNull();
      const block = match![1];
      expect(block).toContain('translateY(12px)');
      expect(block).toContain('opacity: 0');
    });

    it('pill has hover transition instead of cascade animation', () => {
      expect(EXTENSION_CSS).toContain('.fb-fab-pill:hover');
    });
  });

  /**
   * T-016: Animation classes applied (.fb-sidebar, .fb-modal, .fb-fab-action).
   */
  describe('T-016: Animation classes are applied to elements', () => {
    it('.fb-sidebar has animation: fb-sidebar-in 200ms ease-out', () => {
      // Find the .fb-sidebar rule (not .fb-sidebar-backdrop, etc.)
      const match = EXTENSION_CSS.match(
        /\.fb-sidebar\s*\{([\s\S]*?)\}/
      );
      expect(match).not.toBeNull();
      expect(match![1]).toContain('animation: fb-sidebar-in 200ms ease-out');
    });

    it('.fb-modal has animation: fb-modal-in 200ms ease-out', () => {
      const match = EXTENSION_CSS.match(
        /\.fb-modal\s*\{([\s\S]*?)\}/
      );
      expect(match).not.toBeNull();
      expect(match![1]).toContain('animation: fb-modal-in 200ms ease-out');
    });

    it('.fb-fab-pill has transition for hover effects', () => {
      const match = EXTENSION_CSS.match(
        /\.fb-fab-pill\s*\{([\s\S]*?)\}/
      );
      expect(match).not.toBeNull();
      expect(match![1]).toContain('transition');
    });
  });

  /**
   * T-017: prefers-reduced-motion suppresses animations.
   */
  describe('T-017: prefers-reduced-motion disables all animations', () => {
    it('contains @media (prefers-reduced-motion: reduce) block', () => {
      expect(EXTENSION_CSS).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('sets animation-duration: 0s !important', () => {
      const reducedMotionBlock = EXTENSION_CSS.match(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\}\s*\}/
      );
      expect(reducedMotionBlock).not.toBeNull();
      expect(reducedMotionBlock![1]).toContain('animation-duration: 0s !important');
    });

    it('sets transition-duration: 0s !important', () => {
      const reducedMotionBlock = EXTENSION_CSS.match(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\}\s*\}/
      );
      expect(reducedMotionBlock).not.toBeNull();
      expect(reducedMotionBlock![1]).toContain('transition-duration: 0s !important');
    });
  });
});
