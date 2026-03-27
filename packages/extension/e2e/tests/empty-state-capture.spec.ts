/**
 * T-034: Empty-state-capture flow E2E test
 *
 * Covers: FC-004 (empty state layout), FC-005 (CTA activates capture),
 *         FC-007 (selection banner), FC-008 (banner dismisses)
 * Flow: Open sidebar with 0 feedbacks -> verify empty state ->
 *       click CTA -> verify detection mode activates with banner ->
 *       click element -> banner dismisses, modal opens
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
  sidebarCards,
  modal,
  modalTextarea,
  submitModal,
  hoverTestElement,
  clickTestElement,
} from './test-utils';

test.describe('T-034: Empty-state-capture flow', () => {
  test.beforeEach(async ({ page, extensionId, context }) => {
    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);
  });

  test('empty state shows layout, CTA starts capture, banner appears and dismisses', async ({ page }) => {
    // Open sidebar with zero feedbacks
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });

    // Verify empty state layout
    const emptyState = sidebar(page).locator('.fb-empty');
    await expect(emptyState).toBeVisible();

    // Verify empty state heading
    await expect(emptyState.locator('h4')).toContainText('No feedback yet');

    // Verify subtext
    await expect(emptyState.locator('p')).toContainText("Click 'New feedback' to start your review");

    // Verify CTA button
    const ctaButton = emptyState.locator('.fb-btn-primary', { hasText: 'Start reviewing' });
    await expect(ctaButton).toBeVisible();

    // Click CTA -- should close sidebar and start capture mode
    await ctaButton.click();
    await expect(sidebar(page)).not.toBeVisible({ timeout: 3000 });

    // Selection banner should appear on document.body
    const banner = page.locator('.fb-selection-banner');
    await expect(banner).toBeVisible({ timeout: 3000 });
    await expect(banner).toHaveAttribute('role', 'status');
    await expect(banner).toContainText('Click on any element to capture feedback');
    await expect(banner).toContainText('Press Esc to cancel');

    // Cursor should be crosshair (detection mode active)
    const cursor = await page.evaluate(() => document.body.style.cursor);
    expect(cursor).toBe('crosshair');

    // Click a test element -- banner should dismiss, modal should open
    await hoverTestElement(page, 'test-button');
    await clickTestElement(page, 'test-button');

    // Banner should be dismissed
    await expect(banner).not.toBeVisible({ timeout: 3000 });

    // Modal should open
    await expect(modal(page)).toBeVisible({ timeout: 5000 });

    // Submit feedback and verify sidebar now shows a card
    await modalTextarea(page).fill('First feedback via empty state CTA');
    await submitModal(page);
    await expect(modal(page)).not.toBeVisible({ timeout: 3000 });

    // Open sidebar again -- should show card, not empty state
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });
    await expect(sidebarCards(page)).toHaveCount(1);
    await expect(sidebar(page).locator('.fb-empty')).not.toBeVisible();
  });

  test('Escape dismisses selection banner and exits detection mode', async ({ page }) => {
    // Start capture via FAB
    await clickFabAction(page, 'New feedback');

    // Banner should appear
    const banner = page.locator('.fb-selection-banner');
    await expect(banner).toBeVisible({ timeout: 3000 });

    // Press Escape to cancel
    await page.keyboard.press('Escape');

    // Banner should be dismissed
    await expect(banner).not.toBeVisible({ timeout: 3000 });

    // Cursor should return to normal
    const cursor = await page.evaluate(() => document.body.style.cursor);
    expect(cursor).toBe('');
  });
});
