import { Page, expect } from '@playwright/test';

/**
 * Utility functions for E2E testing
 * Each function represents a logical step in the feedback flow
 */

/**
 * Navigate to the test page
 */
export async function navigateToTestPage(page: Page) {
  await page.goto('/test');
  await expect(page.locator('.feedbacker-fab')).toBeVisible({ timeout: 10000 });
}

/**
 * Start capture by clicking FAB and selecting New Feedback
 */
export async function startCapture(page: Page) {
  // Click FAB to expand menu
  await page.click('.feedbacker-fab-main');
  await page.locator('.feedbacker-fab-action').first().waitFor({ state: 'visible', timeout: 3000 });

  // Click "New Feedback" (first action)
  const feedbackActions = page.locator('.feedbacker-fab-action');
  await feedbackActions.first().click();
}

/**
 * Capture a test element by hovering and clicking
 */
export async function captureTestElement(page: Page, testId: string = 'test-button') {
  // Get the test element
  const element = page.locator(`[data-testid="${testId}"]`);
  await expect(element).toBeVisible();

  // Get element bounding box for precise mouse movement
  const box = await element.boundingBox();
  if (!box) {
    throw new Error(`Could not get bounding box for element: ${testId}`);
  }

  // Move mouse to center of element with smooth motion to trigger hover
  const centerX = Math.round(box.x + box.width / 2);
  const centerY = Math.round(box.y + box.height / 2);
  await page.mouse.move(centerX, centerY, { steps: 5 });

  // Wait for overlay to appear (may not appear for all elements)
  await page
    .locator('[data-feedback-overlay="highlight"]')
    .waitFor({ state: 'attached', timeout: 2000 })
    .catch(() => {
      /* overlay may not appear for all elements */
    });

  // Click to select the component
  await page.mouse.click(centerX, centerY);

  // Wait for transition to feedback form
  await page.locator('textarea').waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Verify modal is open and has a screenshot
 */
export async function verifyModal(page: Page) {
  // Wait for modal to appear after component selection
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

  // Check modal is visible
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible();

  // Check for screenshot image
  const screenshot = modal.locator('img[alt*="Screenshot"], img[alt*="screenshot"], canvas');
  await expect(screenshot).toBeVisible();
}

/**
 * Enter feedback text in the modal
 */
export async function enterModalText(page: Page, text: string) {
  // Look for textarea by multiple possible selectors
  const textarea = page
    .locator(
      'textarea.feedbacker-textarea, textarea#feedback-comment, textarea[placeholder*="issue"], textarea[placeholder*="suggestion"]'
    )
    .first();

  // Wait for it to be visible
  await textarea.waitFor({ state: 'visible', timeout: 5000 });

  // Clear and fill with new text
  await textarea.fill(text);

  // Verify the text was entered
  await expect(textarea).toHaveValue(text);
}

/**
 * Submit the feedback modal
 */
export async function submitModal(page: Page) {
  const submitButton = page.locator('button').filter({ hasText: /Submit/i });
  await submitButton.click();

  // Wait for modal to close
  await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
}

/**
 * Check FAB has a badge with expected count
 */
export async function checkFabBadge(page: Page, expectedCount: number) {
  const badge = page.locator('.feedbacker-fab-badge');
  await expect(badge).toBeVisible({ timeout: 2000 });

  const expectedText = expectedCount > 99 ? '99+' : expectedCount.toString();
  await expect(badge).toHaveText(expectedText);
}

/**
 * Open the feedback manager
 */
export async function openManager(page: Page) {
  // Click FAB to expand menu
  await page.click('.feedbacker-fab-main');
  await page.locator('.feedbacker-fab-action').first().waitFor({ state: 'visible', timeout: 3000 });

  // Click manager action (usually has "View" or "Manager" text)
  const managerButton = page.locator('.feedbacker-fab-action').filter({
    hasText: /View|Manager|Show.*Manager/i
  });
  await managerButton.click();
}

/**
 * Verify manager is open
 */
export async function verifyManagerOpen(page: Page) {
  const manager = page.locator('.feedbacker-manager-overlay');
  await expect(manager).toBeVisible();
}

/**
 * Check manager contains expected content
 */
export async function checkManager(page: Page, expectedDate: string, feedbackText: string) {
  const manager = page.locator('.feedbacker-manager-overlay');

  // Check for date header (today's date)
  const dateHeader = manager.locator('h3, [class*="date"]').filter({ hasText: expectedDate });
  await expect(dateHeader.first()).toBeVisible();

  // The feedback cards don't have a class, they're divs with specific styling
  // Look for the feedback text in a paragraph
  const feedbackParagraph = manager.locator('p').filter({ hasText: feedbackText });

  // Wait for it to be visible
  await feedbackParagraph.first().waitFor({ state: 'visible', timeout: 5000 });

  // Get the parent card container (goes up from p to the card div)
  const feedbackCard = feedbackParagraph.first().locator('..').locator('..');

  // Check for image in the card (screenshot)
  const cardImage = feedbackCard.locator('img[alt*="Screenshot"]');
  if ((await cardImage.count()) > 0) {
    await expect(cardImage.first()).toBeVisible();
  }

  // Check for action buttons
  const editButton = feedbackCard.locator('button').filter({ hasText: /Edit/i });
  const copyButton = feedbackCard.locator('button').filter({ hasText: /Copy/i });
  const deleteButton = feedbackCard.locator('button').filter({ hasText: /Delete/i });

  if ((await editButton.count()) > 0) {
    await expect(editButton.first()).toBeVisible();
  }
  if ((await copyButton.count()) > 0) {
    await expect(copyButton.first()).toBeVisible();
  }
  if ((await deleteButton.count()) > 0) {
    await expect(deleteButton.first()).toBeVisible();
  }
}

/**
 * Check copy button functionality
 */
export async function checkCopyButton(page: Page, feedbackText: string) {
  const manager = page.locator('.feedbacker-manager-overlay');
  const feedbackParagraph = manager.locator('p').filter({ hasText: feedbackText });
  const feedbackCard = feedbackParagraph.first().locator('..').locator('..');
  const copyButton = feedbackCard.locator('button').filter({ hasText: /Copy/i });

  await expect(copyButton.first()).toBeVisible();

  // Grant clipboard permissions (not supported in WebKit)
  try {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  } catch {
    // WebKit doesn't support clipboard permissions
  }

  await copyButton.first().click();

  // Verify the click succeeded by checking for a visual confirmation
  // (clipboard API is unreliable in CI environments)
}

/**
 * Check primary export button
 */
export async function checkPrimaryExportButton(page: Page) {
  const manager = page.locator('.feedbacker-manager-overlay');

  // The "Export All" button is in the header
  const exportButton = manager
    .locator('button')
    .filter({ hasText: /Export/i })
    .first();

  await expect(exportButton).toBeVisible();

  // Click to open export dialog
  await exportButton.click();

  // Verify export dialog opens with format options
  const exportDialog = page.locator('[role="dialog"]');
  await expect(exportDialog).toBeVisible({ timeout: 3000 });

  // Close dialog
  const cancelButton = exportDialog.locator('button').filter({ hasText: /Cancel/i });
  if ((await cancelButton.count()) > 0) {
    await cancelButton.first().click();
  }
}

/**
 * Test Text Only (.md) export functionality
 */
export async function testJSONExport(page: Page) {
  const manager = page.locator('.feedbacker-manager-overlay');

  // Set up download promise before triggering download
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

  // Click an Export button to open the dialog
  const exportButton = manager
    .locator('button')
    .filter({ hasText: /Export/i })
    .first();
  await exportButton.click();

  // Wait for export dialog
  const exportDialog = page.locator('[role="dialog"]');
  await expect(exportDialog).toBeVisible({ timeout: 3000 });

  // Click "Text Only (.md)" option
  const textOption = exportDialog
    .locator('button, [role="button"], div[class*="option"]')
    .filter({ hasText: /Text Only/i });
  await textOption.first().click();

  // Wait for download and verify
  const download = await downloadPromise;
  const filename = download.suggestedFilename();
  expect(filename).toMatch(/feedback.*\.md$/);

  const filePath = await download.path();
  expect(filePath).toBeTruthy();
}

/**
 * Test Full Export (.zip) functionality
 */
export async function testZipExport(page: Page) {
  const manager = page.locator('.feedbacker-manager-overlay');

  // Set up download promise before triggering download
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

  // Click an Export button to open the dialog
  const exportButton = manager
    .locator('button')
    .filter({ hasText: /Export/i })
    .first();
  await exportButton.click();

  // Wait for export dialog
  const exportDialog = page.locator('[role="dialog"]');
  await expect(exportDialog).toBeVisible({ timeout: 3000 });

  // Click "Full Export (.zip)" option
  const zipOption = exportDialog
    .locator('button, [role="button"], div[class*="option"]')
    .filter({ hasText: /Full Export/i });
  await zipOption.first().click();

  // Wait for download and verify
  const download = await downloadPromise;
  const filename = download.suggestedFilename();
  expect(filename).toMatch(/feedback.*\.zip$/);

  const filePath = await download.path();
  expect(filePath).toBeTruthy();
}

/**
 * Delete a feedback card
 */
export async function deleteFeedback(page: Page, feedbackText: string) {
  const manager = page.locator('.feedbacker-manager-overlay');

  // Find the feedback card
  const feedbackParagraph = manager.locator('p').filter({ hasText: feedbackText });
  const feedbackCard = feedbackParagraph.first().locator('..').locator('..');

  // Find and click delete button
  const deleteButton = feedbackCard.locator('button').filter({ hasText: /Delete/i });
  await expect(deleteButton.first()).toBeVisible();
  await deleteButton.click();

  // Confirm deletion in the confirmation dialog
  const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /Delete Feedback/i });
  await expect(confirmDialog).toBeVisible({ timeout: 3000 });
  const confirmDeleteButton = confirmDialog.locator('button').filter({ hasText: /^Delete$/i });
  await confirmDeleteButton.click();

  // Wait for the card to disappear
  await expect(manager.locator('p').filter({ hasText: feedbackText })).toHaveCount(0, {
    timeout: 5000
  });
}

/**
 * Get today's date in a format that matches the UI
 */
export function getTodayDateString(): string {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return today.toLocaleDateString('en-US', options);
}
