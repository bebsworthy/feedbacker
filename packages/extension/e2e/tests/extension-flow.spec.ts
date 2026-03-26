/**
 * E2E Test: Chrome Extension Full Feedback Flow
 *
 * Requires: FEEDBACKER_TEST_MODE=1 build (open shadow DOM)
 * Run: npm run test:e2e:headed
 */

import { test, expect } from '../fixtures';
import {
  waitForExtension,
  activateExtension,
  fabButton,
  fabBadge,
  expandFab,
  clickFabAction,
  overlay,
  modal,
  modalTextarea,
  submitModal,
  cancelModal,
  sidebar,
  sidebarCards,
  sidebarFilterTab,
  exportDialog,
  confirmDialog,
  hoverTestElement,
  clickTestElement,
  pressKeyInShadow,
} from './test-utils';

test.describe('Extension Complete Flow', () => {
  test('full feedback lifecycle', async ({ page, extensionId, context }) => {
    // 1. Navigate to test page
    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');

    // 2. Activate extension via popup
    await activateExtension(page, extensionId, context);

    // 3. Verify FAB is visible
    await expect(fabButton(page)).toBeVisible();

    // 4. Start capture — click FAB → "New feedback"
    await clickFabAction(page, 'New feedback');

    // 5. Verify detection mode — cursor should be crosshair
    // (We can't directly assert cursor style, but we can check overlay behavior)

    // 6. Hover test element → overlay should appear
    await hoverTestElement(page, 'test-button');
    await expect(overlay(page)).toBeVisible({ timeout: 3000 });

    // 7. Click test element → modal should open
    await clickTestElement(page, 'test-button');
    await expect(modal(page)).toBeVisible({ timeout: 5000 });

    // 8. Verify modal has component info
    const modalHeader = modal(page).locator('.fb-modal-header h3');
    await expect(modalHeader).toBeVisible();

    // 9. Type feedback and submit
    await modalTextarea(page).fill('This button needs better contrast');
    await submitModal(page);

    // 10. Verify modal closed and badge shows "1"
    await expect(modal(page)).not.toBeVisible();
    await expect(fabBadge(page)).toBeVisible();
    await expect(fabBadge(page)).toHaveText('1');

    // 11. Open sidebar
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });

    // 12. Verify feedback card exists
    await expect(sidebarCards(page)).toHaveCount(1);
    const card = sidebarCards(page).first();
    await expect(card.locator('.fb-card-comment')).toContainText('This button needs better contrast');

    // 13. Test site filter tabs
    const allSitesTab = sidebarFilterTab(page, 'All sites');
    await allSitesTab.click();
    await expect(sidebarCards(page)).toHaveCount(1);

    const thisSiteTab = sidebarFilterTab(page, 'This site');
    await thisSiteTab.click();
    await expect(sidebarCards(page)).toHaveCount(1);

    // 14. Close sidebar with ESC
    await pressKeyInShadow(page, 'Escape');
    await expect(sidebar(page)).not.toBeVisible();

    // 15. Capture second feedback to test badge count
    await clickFabAction(page, 'New feedback');
    await hoverTestElement(page, 'test-card');
    await clickTestElement(page, 'test-card');
    await expect(modal(page)).toBeVisible({ timeout: 5000 });

    // 16. Test Enter submits
    await modalTextarea(page).fill('Card layout needs work');
    await modalTextarea(page).press('Enter');
    await expect(modal(page)).not.toBeVisible({ timeout: 3000 });
    await expect(fabBadge(page)).toHaveText('2');

    // 17. Test ESC closes modal
    await clickFabAction(page, 'New feedback');
    await clickTestElement(page, 'test-button');
    await expect(modal(page)).toBeVisible({ timeout: 5000 });
    await pressKeyInShadow(page, 'Escape');
    await expect(modal(page)).not.toBeVisible();

    // 18. Test export dialog
    await clickFabAction(page, 'Export');
    await expect(exportDialog(page)).toBeVisible({ timeout: 3000 });
    // Close it
    await pressKeyInShadow(page, 'Escape');
    await expect(exportDialog(page)).not.toBeVisible();

    // 19. Open sidebar and delete a feedback
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });
    await expect(sidebarCards(page)).toHaveCount(2);

    // Click delete on first card
    const deleteBtn = sidebarCards(page).first().locator('button[title="Delete"]');
    await deleteBtn.click();
    await expect(sidebarCards(page)).toHaveCount(1);
    await expect(fabBadge(page)).toHaveText('1');

    // Close sidebar
    await pressKeyInShadow(page, 'Escape');

    // 20. Test clear all with confirm dialog
    await clickFabAction(page, 'Clear all');
    await expect(confirmDialog(page)).toBeVisible({ timeout: 3000 });

    // Confirm deletion
    const confirmBtn = confirmDialog(page).locator('.fb-btn-danger');
    await confirmBtn.click();
    await expect(confirmDialog(page)).not.toBeVisible();

    // Badge should be gone
    await expect(fabBadge(page)).not.toBeVisible();
  });

  test('popup shows feedback count and activates', async ({ page, extensionId, context }) => {
    // Navigate to test page first
    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');

    // Open popup
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    // Should show count
    await expect(popup.locator('#feedback-count')).toHaveText('0');

    // Activate button should exist
    await expect(popup.locator('#activate-btn')).toBeVisible();

    // Settings should be visible
    await expect(popup.locator('#position-select')).toBeVisible();
    await expect(popup.locator('#color-input')).toBeVisible();

    await popup.close();
  });
});
