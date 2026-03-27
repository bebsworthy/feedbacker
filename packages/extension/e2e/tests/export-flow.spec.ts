/**
 * T-033: Export flow E2E test
 *
 * Covers: FC-003 (export success toast), FC-010 (copy all), FC-014 (unified export)
 * Flow: Open sidebar -> click "Share / Export" -> verify dialog header ->
 *       verify 3 options -> click copy all -> verify toast
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
  pressKeyInShadow,
} from './test-utils';

/**
 * Helper: capture a feedback item.
 */
async function captureFeedback(
  page: import('@playwright/test').Page,
  comment: string,
  testId = 'test-button'
): Promise<void> {
  await clickFabAction(page, 'New feedback');
  await hoverTestElement(page, testId);
  await clickTestElement(page, testId);
  await expect(modal(page)).toBeVisible({ timeout: 5000 });
  await modalTextarea(page).fill(comment);
  await submitModal(page);
  await expect(modal(page)).not.toBeVisible({ timeout: 3000 });
}

test.describe('T-033: Export flow', () => {
  test.beforeEach(async ({ page, extensionId, context }) => {
    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);
  });

  test('open export dialog via sidebar header, verify header and options', async ({ page }) => {
    // Capture a feedback item so export is available
    await captureFeedback(page, 'Export test feedback');

    // Open sidebar
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });
    await expect(sidebarCards(page)).toHaveCount(1);

    // Click "Share / Export" button in sidebar header
    const exportBtn = sidebar(page).locator('button', { hasText: 'Share / Export' });
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    // Export dialog should open with correct header
    const dialog = shadowRoot(page).locator('.fb-modal').filter({ hasText: 'Share / Export' });
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Verify header text includes "Share / Export"
    const dialogHeader = dialog.locator('.fb-modal-header h3');
    await expect(dialogHeader).toContainText('Share / Export');
    await expect(dialogHeader).toContainText('1 item');

    // Verify three export options exist
    const options = dialog.locator('.fb-export-option');
    await expect(options).toHaveCount(3);

    // First option should be "Copy all to clipboard"
    await expect(options.first()).toContainText('Copy all to clipboard');
  });

  test('copy all shows toast with item count', async ({ page, context }) => {
    // Capture a feedback item
    await captureFeedback(page, 'Copy all test');

    // Grant clipboard permissions via context
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Open sidebar then export dialog
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });

    const exportBtn = sidebar(page).locator('button', { hasText: 'Share / Export' });
    await exportBtn.click();

    const dialog = shadowRoot(page).locator('.fb-modal').filter({ hasText: 'Share / Export' });
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Click "Copy all to clipboard"
    const copyAllOption = dialog.locator('.fb-export-option').first();
    await copyAllOption.click();

    // Dialog should close after copy
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    // Toast should appear with copy confirmation
    const toast = shadowRoot(page).locator('.fb-toast');
    await expect(toast).toBeVisible({ timeout: 3000 });
    await expect(toast).toContainText('Copied');
    await expect(toast).toContainText('1');
  });

  test('export dialog can be closed with Escape', async ({ page }) => {
    await captureFeedback(page, 'Close dialog test');

    // Open export dialog via FAB menu
    await clickFabAction(page, 'Export');
    const dialog = shadowRoot(page).locator('.fb-modal').filter({ hasText: 'Share / Export' });
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Press Escape to close
    await pressKeyInShadow(page, 'Escape');
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });
});
