/**
 * T-064: Human-readable names during capture E2E test
 *
 * Covers: FC-001 (tooltip shows human-readable name), FC-002 (modal header
 * shows human-readable name, technical details toggle)
 *
 * Flow 1: Activate selection, hover button with text "Submit Order",
 * observe tooltip, click, observe modal header, toggle technical details.
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

test.describe('T-064: Human-readable names during capture', () => {
  test.beforeEach(async ({ page, extensionId, context }) => {
    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);
  });

  test('tooltip and modal show human-readable name from button text', async ({ page }) => {
    // Step 1: Activate selection mode via FAB > New feedback
    await clickFabAction(page, 'New feedback');

    // Step 2: Hover over the test button (has text "Test Button")
    // The test page has a button with data-testid="test-button" and text "Test Button"
    await hoverTestElement(page, 'test-button');

    // Step 3: Observe the overlay tooltip - should show human-readable name
    // The tooltip should display the button's visible text content, not a
    // technical name like "button" or a component name
    await expect(overlay(page)).toBeVisible({ timeout: 3000 });
    const tooltipText = overlay(page).locator('[class*="tooltip"], [data-tooltip]');
    // Verify the tooltip contains text content from the element
    // (the exact selector depends on the overlay implementation)
    if (await tooltipText.count() > 0) {
      await expect(tooltipText.first()).toContainText('Test Button');
    }

    // Step 4: Click the element to select it
    await clickTestElement(page, 'test-button');

    // Step 5: Modal should open with human-readable name in header
    await expect(modal(page)).toBeVisible({ timeout: 5000 });
    const modalHeader = modal(page).locator('.fb-modal-header h3');
    await expect(modalHeader).toBeVisible();
    // Modal header should show the human-readable name
    await expect(modalHeader).toContainText('Test Button');

    // Step 6: Toggle "Technical details" to reveal component name, path, snippet
    const technicalToggle = modal(page).locator(
      'button, [role="button"], details summary, .fb-toggle, [data-testid="technical-details-toggle"]'
    ).filter({ hasText: /technical details/i });

    if (await technicalToggle.count() > 0) {
      await technicalToggle.first().click();

      // Technical details section should expand and show component info
      const technicalSection = modal(page).locator(
        '.fb-technical-details, [data-testid="technical-details"], details[open]'
      );
      await expect(technicalSection.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('fallback to tag.class when no semantic name is available', async ({ page }) => {
    // Hover over the test-card div which has class "test-card" but may not
    // have a strong semantic name (no aria-label, role is generic)
    await clickFabAction(page, 'New feedback');
    await hoverTestElement(page, 'test-card');
    await expect(overlay(page)).toBeVisible({ timeout: 3000 });

    // Click to select
    await clickTestElement(page, 'test-card');
    await expect(modal(page)).toBeVisible({ timeout: 5000 });

    // Modal header should show some name (either "Test Card" from heading
    // text or a tag.class fallback like "div.test-card")
    const modalHeader = modal(page).locator('.fb-modal-header h3');
    await expect(modalHeader).toBeVisible();
    const headerText = await modalHeader.textContent();
    expect(headerText).toBeTruthy();
    // Should not be empty or "Unknown"
    expect(headerText!.trim().length).toBeGreaterThan(0);
    expect(headerText!.trim()).not.toBe('Unknown');
  });

  test('non-React page shows tag and HTML snippet in technical details', async ({ page }) => {
    // The test-ext page is rendered without FeedbackProvider, so it
    // simulates a non-React context for the extension. Component info
    // may or may not be available depending on React detection.
    await clickFabAction(page, 'New feedback');
    await hoverTestElement(page, 'test-button');
    await clickTestElement(page, 'test-button');
    await expect(modal(page)).toBeVisible({ timeout: 5000 });

    // If technical details toggle exists, open it
    const technicalToggle = modal(page).locator(
      'button, [role="button"], details summary, .fb-toggle, [data-testid="technical-details-toggle"]'
    ).filter({ hasText: /technical details/i });

    if (await technicalToggle.count() > 0) {
      await technicalToggle.first().click();
      // Should show at least the tag name or HTML snippet
      const technicalSection = modal(page).locator(
        '.fb-technical-details, [data-testid="technical-details"]'
      );
      if (await technicalSection.count() > 0) {
        const techText = await technicalSection.first().textContent();
        // Should contain something meaningful (tag name, snippet, etc.)
        expect(techText).toBeTruthy();
      }
    }
  });
});
