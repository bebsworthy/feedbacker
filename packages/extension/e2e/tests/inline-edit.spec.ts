/**
 * T-035: Inline-edit flow E2E test
 *
 * Covers: FC-011 (inline edit activation), FC-012 (blur saves),
 *         FC-013 (Escape cancels)
 * Flow: Click pencil icon -> type in textarea -> blur to save ->
 *       verify saved indicator -> click edit again -> Escape ->
 *       verify original saved text restored
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

test.describe('T-035: Inline-edit flow', () => {
  test.beforeEach(async ({ page, extensionId, context }) => {
    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);
  });

  test('edit icon activates textarea, blur saves, Escape cancels', async ({ page }) => {
    // Capture a feedback item
    await captureFeedback(page, 'Original comment');

    // Open sidebar
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });
    await expect(sidebarCards(page)).toHaveCount(1);

    // Verify original comment is displayed
    const card = sidebarCards(page).first();
    await expect(card.locator('.fb-card-comment')).toContainText('Original comment');

    // Click pencil (edit) icon
    const editBtn = card.locator('button[aria-label="Edit feedback"]');
    await editBtn.click();

    // Textarea should appear with original comment
    const textarea = card.locator('.fb-inline-edit-textarea');
    await expect(textarea).toBeVisible({ timeout: 2000 });
    await expect(textarea).toHaveValue('Original comment');

    // Verify textarea has focus
    await expect(textarea).toBeFocused();

    // Sidebar should still be open (not closed by edit activation)
    await expect(sidebar(page)).toBeVisible();

    // Modify the text
    await textarea.fill('Updated comment');

    // Click outside to trigger blur (click on the sidebar body area)
    await sidebar(page).locator('.fb-sidebar-header').click();

    // Wait for debounce (1000ms) + save
    // "Saved" indicator should appear after successful save
    const savedIndicator = card.locator('.fb-saved-indicator');
    await expect(savedIndicator).toBeVisible({ timeout: 3000 });
    await expect(savedIndicator).toContainText('Saved');

    // Textarea should revert to static text with updated comment
    await expect(card.locator('.fb-card-comment')).toContainText('Updated comment');
    await expect(textarea).not.toBeVisible();

    // Now test Escape cancellation:
    // Click edit again
    const editBtn2 = card.locator('button[aria-label="Edit feedback"]');
    await editBtn2.click();

    const textarea2 = card.locator('.fb-inline-edit-textarea');
    await expect(textarea2).toBeVisible({ timeout: 2000 });
    await expect(textarea2).toHaveValue('Updated comment');

    // Modify text but then press Escape
    await textarea2.fill('This should be discarded');
    await textarea2.press('Escape');

    // Should revert to the saved text (not the discarded text)
    await expect(card.locator('.fb-card-comment')).toContainText('Updated comment');
    await expect(textarea2).not.toBeVisible();

    // Sidebar should still be open (Escape in edit mode does NOT close sidebar)
    await expect(sidebar(page)).toBeVisible();
  });
});
