/**
 * T-037: Milestones flow E2E test
 *
 * Covers: FC-015 (toast rotation, milestone celebrations)
 * Flow: Capture 5 feedbacks -> verify milestone text appears in sidebar header
 *       Also verify toast messages rotate between submissions
 *
 * Requires: FEEDBACKER_TEST_MODE=1 build (open shadow DOM)
 * Run: npm run test:e2e
 */

import { test, expect } from '../fixtures';
import {
  activateExtension,
  shadowRoot,
  fabButton,
  fabBadge,
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

/** Available test element IDs to click for captures. */
const TEST_ELEMENTS = ['test-button', 'test-card', 'test-form', 'test-input', 'test-list'];

/**
 * Helper: capture a feedback item using the specified test element.
 * Returns the toast message text displayed after submission.
 */
async function captureFeedbackAndGetToast(
  page: import('@playwright/test').Page,
  comment: string,
  testId: string
): Promise<string> {
  await clickFabAction(page, 'New feedback');
  await hoverTestElement(page, testId);
  await clickTestElement(page, testId);
  await expect(modal(page)).toBeVisible({ timeout: 5000 });
  await modalTextarea(page).fill(comment);
  await submitModal(page);
  await expect(modal(page)).not.toBeVisible({ timeout: 3000 });

  // Capture the toast text
  const toast = shadowRoot(page).locator('.fb-toast');
  await expect(toast).toBeVisible({ timeout: 3000 });
  const text = await toast.innerText();
  // Wait for toast to auto-dismiss before next action
  await expect(toast).not.toBeVisible({ timeout: 5000 });
  return text;
}

test.describe('T-037: Milestones flow', () => {
  test.beforeEach(async ({ page, extensionId, context }) => {
    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);
  });

  test('toast messages rotate and milestone appears at 5 items', async ({ page }) => {
    const toastMessages: string[] = [];
    const expectedRotation = ['Feedback saved!', 'Got it!', 'Captured!', 'Nice catch!'];

    // Capture 5 feedback items, recording toast messages
    for (let i = 0; i < 5; i++) {
      const testId = TEST_ELEMENTS[i % TEST_ELEMENTS.length];
      const toastText = await captureFeedbackAndGetToast(
        page,
        `Milestone test item ${i + 1}`,
        testId
      );
      toastMessages.push(toastText);
    }

    // Verify toast messages are from the rotation set
    for (const msg of toastMessages) {
      const matchesAny = expectedRotation.some((expected) => msg.includes(expected));
      expect(matchesAny).toBe(true);
    }

    // Verify at least 2 different messages were shown in the first 5
    const uniqueMessages = new Set(toastMessages);
    expect(uniqueMessages.size).toBeGreaterThanOrEqual(2);

    // Verify badge shows 5
    await expect(fabBadge(page)).toHaveText('5');

    // Open sidebar to check for milestone
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });

    // Milestone text should appear in sidebar header
    const milestone = sidebar(page).locator('.fb-milestone');
    await expect(milestone).toBeVisible({ timeout: 3000 });
    await expect(milestone).toContainText('Thorough review!');
  });
});
