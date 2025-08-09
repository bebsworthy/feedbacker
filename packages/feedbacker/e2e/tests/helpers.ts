import { Page } from '@playwright/test';

/**
 * Helper function to open the feedback modal
 */
export async function openFeedbackModal(page: Page) {
  // Click the FAB to expand menu
  await page.click('.feedbacker-fab-main');

  // Wait for menu animation
  await page.waitForTimeout(300);

  // Click on "New Feedback" action (first action)
  const newFeedbackButton = page.locator('.feedbacker-fab-action').first();
  await newFeedbackButton.click();

  // Wait for modal to appear
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
}

/**
 * Helper function to open the feedback manager
 */
export async function openFeedbackManager(page: Page) {
  // Click the FAB to expand menu
  await page.click('.feedbacker-fab-main');

  // Wait for menu animation
  await page.waitForTimeout(300);

  // Click on manager action (usually second or has "View" text)
  const managerButton = page
    .locator('.feedbacker-fab-action')
    .filter({ hasText: /View|Manager|Feedback/i });
  await managerButton.click();

  // Wait for manager to appear
  await page.waitForSelector('.feedbacker-manager-overlay', { timeout: 5000 });
}
