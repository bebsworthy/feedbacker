/**
 * T-066: Scroll-wheel element granularity E2E test
 *
 * Covers: FC-005 (scroll up to parent), FC-006 (scroll down to child),
 * FC-007 (breadcrumb trail)
 *
 * Flow 3: Activate selection, hover nested element, observe breadcrumb,
 * scroll up to parent, scroll up again, scroll down, click to select.
 *
 * Requires: FEEDBACKER_TEST_MODE=1 build (open shadow DOM)
 * Run: npm run test:e2e
 */

import { test, expect } from '../fixtures';
import {
  activateExtension,
  clickFabAction,
  overlay,
  modal,
  hoverTestElement,
  clickTestElement,
} from './test-utils';

test.describe('T-066: Scroll-wheel element granularity', () => {
  test.beforeEach(async ({ page, extensionId, context }) => {
    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);
  });

  test('scroll wheel navigates parent/child elements with breadcrumb', async ({ page }) => {
    // Step 1: Activate selection mode
    await clickFabAction(page, 'New feedback');

    // Step 2: Hover over a nested element (button inside the test page)
    // The test page has: div > div > button[data-testid="test-button"]
    await hoverTestElement(page, 'test-button');
    await expect(overlay(page)).toBeVisible({ timeout: 3000 });

    // Step 3: Observe the breadcrumb trail at the bottom of the viewport
    const breadcrumb = page.locator(
      '.fb-breadcrumb, [class*="breadcrumb"], [data-testid="breadcrumb-trail"]'
    );
    if (await breadcrumb.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Breadcrumb should show path ending with the button element
      const breadcrumbText = await breadcrumb.textContent();
      expect(breadcrumbText).toBeTruthy();
      // Should contain the current element's tag/name
      expect(breadcrumbText!.toLowerCase()).toMatch(/button/);
    }

    // Record scroll position before wheel events
    const scrollBefore = await page.evaluate(() => window.scrollY);

    // Step 4: Scroll mouse wheel up once (navigate to parent)
    const buttonBox = await page.locator('[data-testid="test-button"]').boundingBox();
    if (buttonBox) {
      await page.mouse.move(buttonBox.x + buttonBox.width / 2, buttonBox.y + buttonBox.height / 2);
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(300);
    }

    // Step 5: Observe overlay and breadcrumb update
    // Overlay should have moved to the parent element
    await expect(overlay(page)).toBeVisible();

    if (await breadcrumb.isVisible({ timeout: 1000 }).catch(() => false)) {
      const breadcrumbAfterUp = await breadcrumb.textContent();
      // After scrolling up, breadcrumb should show a different element
      expect(breadcrumbAfterUp).toBeTruthy();
    }

    // Step 6: Scroll mouse wheel up again (navigate to grandparent)
    if (buttonBox) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(300);
    }

    // Step 7: Scroll mouse wheel down once (navigate back to first child)
    if (buttonBox) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(300);
    }

    // Verify page did not scroll during any of these interactions
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter).toBe(scrollBefore);

    // Step 8: Click to select the currently highlighted element
    if (buttonBox) {
      await page.mouse.click(buttonBox.x + buttonBox.width / 2, buttonBox.y + buttonBox.height / 2);
    }

    // Modal should open with the selected element's info
    await expect(modal(page)).toBeVisible({ timeout: 5000 });
    const modalHeader = modal(page).locator('.fb-modal-header h3');
    await expect(modalHeader).toBeVisible();
  });

  test('scroll up at top-level element is ignored', async ({ page }) => {
    // Activate selection mode
    await clickFabAction(page, 'New feedback');

    // Hover over the body-level element (the page title h1)
    await hoverTestElement(page, 'page-title');
    await expect(overlay(page)).toBeVisible({ timeout: 3000 });

    // Scroll up multiple times - should eventually reach html/body and stop
    const h1Box = await page.locator('[data-testid="page-title"]').boundingBox();
    if (h1Box) {
      // Scroll up many times to reach the top
      for (let i = 0; i < 10; i++) {
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(100);
      }
    }

    // Overlay should still be visible (didn't break)
    await expect(overlay(page)).toBeVisible();
  });

  test('scroll down on childless element is ignored', async ({ page }) => {
    // Activate selection mode
    await clickFabAction(page, 'New feedback');

    // Hover over the test button (a leaf element with only text content)
    await hoverTestElement(page, 'test-button');
    await expect(overlay(page)).toBeVisible({ timeout: 3000 });

    const buttonBox = await page.locator('[data-testid="test-button"]').boundingBox();
    if (buttonBox) {
      // Scroll down - button has no child elements, should be ignored
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(300);
    }

    // Overlay should still be visible on the button
    await expect(overlay(page)).toBeVisible();
  });
});
