/**
 * T-032: Delete-undo flow E2E test
 *
 * Covers: FC-001 (delete with undo toast), FC-002 (undo restores card)
 * Flow: Delete a card -> verify undo toast -> click Undo -> verify card restored
 *       Delete again -> wait 8s+ -> verify permanent removal
 *       Delete A then B quickly -> A finalized, B has undo
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

/**
 * Helper: capture a feedback item with the given comment on a given test element.
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

test.describe('T-032: Delete-undo flow', () => {
  test.beforeEach(async ({ page, extensionId, context }) => {
    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);
  });

  test('delete card shows undo toast, click undo restores card', async ({ page }) => {
    // Capture a feedback item
    await captureFeedback(page, 'Delete me then undo');

    // Open sidebar and verify one card exists
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });
    await expect(sidebarCards(page)).toHaveCount(1);
    await expect(
      sidebarCards(page).first().locator('.fb-card-comment')
    ).toContainText('Delete me then undo');

    // Click delete on the card
    const deleteBtn = sidebarCards(page).first().locator('button[aria-label="Delete feedback"]');
    await deleteBtn.click();

    // Card should be visually removed from sidebar
    await expect(sidebarCards(page)).toHaveCount(0);

    // Undo toast should appear inside shadow DOM
    const undoToast = shadowRoot(page).locator('.fb-toast-undo');
    await expect(undoToast).toBeVisible({ timeout: 3000 });
    await expect(undoToast).toContainText('Feedback deleted');
    await expect(undoToast.locator('.fb-toast-undo-btn')).toBeVisible();

    // Click Undo
    await undoToast.locator('.fb-toast-undo-btn').click();

    // Card should be restored
    await expect(sidebarCards(page)).toHaveCount(1);
    await expect(
      sidebarCards(page).first().locator('.fb-card-comment')
    ).toContainText('Delete me then undo');

    // Undo toast should be gone
    await expect(undoToast).not.toBeVisible();
  });

  test('delete without undo permanently removes after timeout', async ({ page }) => {
    // Capture a feedback item
    await captureFeedback(page, 'Delete permanently');

    // Open sidebar
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });
    await expect(sidebarCards(page)).toHaveCount(1);

    // Delete the card
    const deleteBtn = sidebarCards(page).first().locator('button[aria-label="Delete feedback"]');
    await deleteBtn.click();
    await expect(sidebarCards(page)).toHaveCount(0);

    // Wait for undo timeout to expire (8s + buffer)
    const undoToast = shadowRoot(page).locator('.fb-toast-undo');
    await expect(undoToast).not.toBeVisible({ timeout: 12000 });

    // Badge should reflect zero items
    const badge = shadowRoot(page).locator('.fb-fab-badge');
    await expect(badge).not.toBeVisible({ timeout: 3000 });
  });

  test('deleting A then B quickly finalizes A, B has undo', async ({ page }) => {
    // Capture two feedback items
    await captureFeedback(page, 'Item A');
    await captureFeedback(page, 'Item B', 'test-card');

    // Open sidebar
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });
    await expect(sidebarCards(page)).toHaveCount(2);

    // Delete first card (Item A or Item B depending on order)
    const firstDeleteBtn = sidebarCards(page).first().locator('button[aria-label="Delete feedback"]');
    await firstDeleteBtn.click();
    await expect(sidebarCards(page)).toHaveCount(1);

    // Verify undo toast for first deletion
    const undoToast = shadowRoot(page).locator('.fb-toast-undo');
    await expect(undoToast).toBeVisible({ timeout: 3000 });

    // Delete second card quickly (within 8s window)
    const secondDeleteBtn = sidebarCards(page).first().locator('button[aria-label="Delete feedback"]');
    await secondDeleteBtn.click();
    await expect(sidebarCards(page)).toHaveCount(0);

    // Undo toast should still be visible (for the second deletion)
    await expect(undoToast).toBeVisible();
    await expect(undoToast).toContainText('Feedback deleted');
  });
});
