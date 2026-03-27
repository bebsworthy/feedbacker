/**
 * T-036: Animations flow E2E test
 *
 * Covers: FC-009 (entrance animations, prefers-reduced-motion)
 * Flow: Verify sidebar has animation class; verify prefers-reduced-motion
 *       disables animations
 *
 * Requires: FEEDBACKER_TEST_MODE=1 build (open shadow DOM)
 * Run: npm run test:e2e
 */

import { test, expect } from '../fixtures';
import {
  activateExtension,
  shadowRoot,
  clickFabAction,
  sidebar,
  fabActions,
  expandFab,
  modal,
  modalTextarea,
  hoverTestElement,
  clickTestElement,
} from './test-utils';

test.describe('T-036: Animations flow', () => {
  test.beforeEach(async ({ page, extensionId, context }) => {
    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);
  });

  test('sidebar has slide-in animation', async ({ page }) => {
    // Open sidebar
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });

    // Verify the sidebar element has the animation applied
    const animationName = await sidebar(page).evaluate((el) => {
      return window.getComputedStyle(el).animationName;
    });
    expect(animationName).toContain('fb-sidebar-in');
  });

  test('FAB menu items have cascade animation', async ({ page }) => {
    // Expand FAB menu
    await expandFab(page);
    await expect(fabActions(page)).toBeVisible({ timeout: 3000 });

    // Check that fab action items have animation
    const firstAction = fabActions(page).locator('.fb-fab-action').first();
    const animationName = await firstAction.evaluate((el) => {
      return window.getComputedStyle(el).animationName;
    });
    expect(animationName).toContain('fb-fab-cascade');
  });

  test('modal has slide-up/fade animation', async ({ page }) => {
    // Start capture and open modal
    await clickFabAction(page, 'New feedback');
    await hoverTestElement(page, 'test-button');
    await clickTestElement(page, 'test-button');
    await expect(modal(page)).toBeVisible({ timeout: 5000 });

    // Verify modal has the animation
    const animationName = await modal(page).evaluate((el) => {
      return window.getComputedStyle(el).animationName;
    });
    expect(animationName).toContain('fb-modal-in');
  });

  test('prefers-reduced-motion disables all animations', async ({ page, context }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Open sidebar
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });

    // With prefers-reduced-motion, animation-duration should be 0s
    const animationDuration = await sidebar(page).evaluate((el) => {
      return window.getComputedStyle(el).animationDuration;
    });
    expect(animationDuration).toBe('0s');
  });
});
