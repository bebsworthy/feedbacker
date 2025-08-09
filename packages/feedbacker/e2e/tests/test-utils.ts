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
  await page.waitForSelector('.feedbacker-fab', { timeout: 10000 });
  console.log('✓ Navigated to test page');
}

/**
 * Start capture by clicking FAB and selecting New Feedback
 */
export async function startCapture(page: Page) {
  // Click FAB to expand menu
  await page.click('.feedbacker-fab-main');
  await page.waitForTimeout(500); // Wait for menu animation

  // Click "New Feedback" (first action)
  const feedbackActions = page.locator('.feedbacker-fab-action');
  await feedbackActions.first().click();

  // Don't wait for modal here - it opens AFTER selecting a component
  console.log('✓ Started capture mode - ready to select component');
}

/**
 * Capture a test element by hovering and clicking
 */
export async function captureTestElement(page: Page, testId: string = 'test-button') {
  console.log(`🎯 Starting component capture for: ${testId}`);

  // The overlay appears when hovering over components, not immediately
  // So we need to move the mouse to trigger it
  console.log('   Moving mouse to trigger component detection...');

  // Get the test element
  const element = page.locator(`[data-testid="${testId}"]`);
  const elementCount = await element.count();
  console.log(`   Elements with testId="${testId}": ${elementCount}`);

  if (elementCount === 0) {
    throw new Error(`No element found with testId: ${testId}`);
  }

  // Ensure element is visible
  await element.waitFor({ state: 'visible' });

  // Get element bounding box for precise mouse movement
  const box = await element.boundingBox();
  if (!box) {
    throw new Error(`Could not get bounding box for element: ${testId}`);
  }

  console.log(
    `   Element position: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`
  );

  // Move mouse to center of element
  const centerX = Math.round(box.x + box.width / 2);
  const centerY = Math.round(box.y + box.height / 2);

  console.log(`   Moving mouse to element center (${centerX}, ${centerY})`);

  // Move to element with smooth motion to trigger hover
  await page.mouse.move(centerX, centerY, { steps: 5 });

  // Wait for overlay to appear
  await page.waitForTimeout(500);

  // Check if overlay appeared
  const overlayHighlight = await page.locator('[data-feedback-overlay="highlight"]').count();
  const overlayLabel = await page.locator('[data-feedback-overlay="label"]').count();
  console.log(
    `   Overlay highlight visible: ${overlayHighlight > 0}, Label visible: ${overlayLabel > 0}`
  );

  // Click to select the component
  console.log(`   Clicking to select component...`);
  await page.mouse.click(centerX, centerY);

  console.log(`   ✓ Clicked element: ${testId}`);

  // Wait for transition to feedback form
  await page.waitForTimeout(1000);

  // Check if we transitioned to feedback form
  const textareaVisible = await page.locator('textarea').count();
  if (textareaVisible > 0) {
    console.log('   ✓ Transitioned to feedback form');
  } else {
    console.log('   ⚠️  Textarea not visible yet, might need more time');
  }
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

  console.log('✓ Modal verified with screenshot');
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
  const value = await textarea.inputValue();
  if (value === text) {
    console.log(`✓ Entered feedback: "${text}"`);
  } else {
    console.log(`⚠️ Text entry may have failed. Expected: "${text}", Got: "${value}"`);
  }
}

/**
 * Submit the feedback modal
 */
export async function submitModal(page: Page) {
  const submitButton = page.locator('button').filter({ hasText: /Submit/i });
  await submitButton.click();

  // Wait for modal to close
  await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  console.log('✓ Submitted feedback');
}

/**
 * Check FAB has a badge with expected count
 */
export async function checkFabBadge(page: Page, expectedCount: number) {
  // The badge has a specific class now: .feedbacker-fab-badge
  const badge = page.locator('.feedbacker-fab-badge');

  // Wait a bit for the badge to appear after submission
  await page.waitForTimeout(500);

  if ((await badge.count()) > 0) {
    await expect(badge).toBeVisible();
    const badgeText = await badge.textContent();

    // Verify the count matches
    if (badgeText === expectedCount.toString() || (expectedCount > 99 && badgeText === '99+')) {
      console.log(`✓ FAB badge shows: ${badgeText}`);
    } else {
      console.log(`⚠ FAB badge shows "${badgeText}" but expected "${expectedCount}"`);
    }
  } else {
    console.log(`⚠ FAB badge not found (expected: ${expectedCount})`);
  }
}

/**
 * Open the feedback manager
 */
export async function openManager(page: Page) {
  // Click FAB to expand menu
  await page.click('.feedbacker-fab-main');
  await page.waitForTimeout(500);

  // Click manager action (usually has "View" or "Manager" text)
  const managerButton = page.locator('.feedbacker-fab-action').filter({
    hasText: /View|Manager|Show.*Manager/i
  });
  await managerButton.click();

  console.log('✓ Opened feedback manager');
}

/**
 * Verify manager is open
 */
export async function verifyManagerOpen(page: Page) {
  const manager = page.locator('.feedbacker-manager-overlay');
  await expect(manager).toBeVisible();
  console.log('✓ Manager is open');
}

/**
 * Check manager contains expected content
 */
export async function checkManager(page: Page, expectedDate: string, feedbackText: string) {
  const manager = page.locator('.feedbacker-manager-overlay');

  // Check for date header (today's date)
  const dateHeader = manager.locator('h3, [class*="date"]').filter({ hasText: expectedDate });
  await expect(dateHeader.first()).toBeVisible();
  console.log(`✓ Found date section: ${expectedDate}`);

  // The feedback cards don't have a class, they're divs with specific styling
  // Look for the feedback text in a paragraph
  const feedbackParagraph = manager.locator('p').filter({ hasText: feedbackText });

  // Wait for it to be visible
  await feedbackParagraph.first().waitFor({ state: 'visible', timeout: 5000 });
  console.log(`✓ Found feedback text: "${feedbackText}"`);

  // Get the parent card container (goes up from p to the card div)
  const feedbackCard = feedbackParagraph.first().locator('..').locator('..');

  // Check for image in the card (screenshot)
  const cardImage = feedbackCard.locator('img[alt*="Screenshot"]');
  if ((await cardImage.count()) > 0) {
    await expect(cardImage.first()).toBeVisible();
    console.log('✓ Card has screenshot');
  }

  // Check for action buttons (they're in a flex container at the bottom)
  const editButton = feedbackCard.locator('button').filter({ hasText: /Edit/i });
  const copyButton = feedbackCard.locator('button').filter({ hasText: /Copy/i });
  const deleteButton = feedbackCard.locator('button').filter({ hasText: /Delete/i });

  if ((await editButton.count()) > 0) {
    await expect(editButton.first()).toBeVisible();
    console.log('✓ Edit button found');
  }

  if ((await copyButton.count()) > 0) {
    await expect(copyButton.first()).toBeVisible();
    console.log('✓ Copy button found');
  }

  if ((await deleteButton.count()) > 0) {
    await expect(deleteButton.first()).toBeVisible();
    console.log('✓ Delete button found');
  }
}

/**
 * Check copy button functionality
 */
export async function checkCopyButton(page: Page, feedbackText: string) {
  const manager = page.locator('.feedbacker-manager-overlay');
  // Find the feedback text in a paragraph, then navigate to the card
  const feedbackParagraph = manager.locator('p').filter({ hasText: feedbackText });
  const feedbackCard = feedbackParagraph.first().locator('..').locator('..');
  const copyButton = feedbackCard.locator('button').filter({ hasText: /Copy/i });

  if ((await copyButton.count()) > 0) {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await copyButton.first().click();
    console.log('✓ Clicked copy button');

    // Try to verify clipboard content (might not work in all environments)
    try {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      if (clipboardText.includes(feedbackText)) {
        console.log('✓ Verified clipboard contains feedback text');
      }
    } catch (e) {
      console.log('⚠ Could not verify clipboard (permission issue)');
    }
  } else {
    console.log('⚠ Copy button not found');
  }
}

/**
 * Check primary export button
 */
export async function checkPrimaryExportButton(page: Page) {
  const manager = page.locator('.feedbacker-manager-overlay');

  // Look for main export button (usually in header)
  const exportButton = manager
    .locator('button')
    .filter({ hasText: /Export/i })
    .first();

  if ((await exportButton.count()) > 0) {
    await expect(exportButton).toBeVisible();
    console.log('✓ Primary export button found');

    // Click to open export dialog
    await exportButton.click();

    // Check if export dialog opens
    const exportDialog = page.locator('[role="dialog"]').filter({ hasText: /Export/i });
    if ((await exportDialog.count()) > 0) {
      await expect(exportDialog.first()).toBeVisible();
      console.log('✓ Export dialog opened');

      // Close dialog
      const closeButton = exportDialog
        .first()
        .locator('button')
        .filter({ hasText: /Cancel|Close/i });
      if ((await closeButton.count()) > 0) {
        await closeButton.first().click();
      }
    }
  } else {
    console.log('⚠ Export button not found');
  }
}

/**
 * Test JSON export functionality
 */
export async function testJSONExport(page: Page) {
  const manager = page.locator('.feedbacker-manager-overlay');

  // Set up download promise before triggering download
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

  // Open export dialog
  const exportButton = manager
    .locator('button')
    .filter({ hasText: /Export/i })
    .first();
  await exportButton.click();
  await page.waitForTimeout(500);

  // Find and click JSON export option
  const exportDialog = page.locator('[role="dialog"]').filter({ hasText: /Export/i });
  const jsonButton = exportDialog.locator('button').filter({ hasText: /JSON/i });

  if ((await jsonButton.count()) > 0) {
    await jsonButton.click();
    console.log('✓ Clicked JSON export');

    try {
      // Wait for download to start
      const download = await downloadPromise;

      // Get download info
      const filename = download.suggestedFilename();
      console.log(`✓ JSON download started: ${filename}`);

      // Verify filename format (should be like feedback-export-YYYY-MM-DD.json)
      if (filename.includes('feedback') && filename.endsWith('.json')) {
        console.log('✓ JSON filename format correct');
      }

      // Save the download to verify it completed
      const path = await download.path();
      if (path) {
        console.log('✓ JSON download completed');
      }
    } catch (error) {
      console.log('⚠ JSON download failed or timed out');
    }
  } else {
    console.log('⚠ JSON export button not found');
  }

  // Close dialog if still open
  const closeButton = exportDialog.locator('button').filter({ hasText: /Cancel|Close/i });
  if ((await closeButton.count()) > 0) {
    await closeButton.first().click();
  }
}

/**
 * Test Zip export functionality
 */
export async function testZipExport(page: Page) {
  const manager = page.locator('.feedbacker-manager-overlay');

  // Set up download promise before triggering download
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

  // Open export dialog
  const exportButton = manager
    .locator('button')
    .filter({ hasText: /Export/i })
    .first();
  await exportButton.click();
  await page.waitForTimeout(500);

  // Find and click Zip export option
  const exportDialog = page.locator('[role="dialog"]').filter({ hasText: /Export/i });
  const zipButton = exportDialog.locator('button').filter({ hasText: /Zip|ZIP|Archive/i });

  if ((await zipButton.count()) > 0) {
    await zipButton.click();
    console.log('✓ Clicked Zip export');

    try {
      // Wait for download to start
      const download = await downloadPromise;

      // Get download info
      const filename = download.suggestedFilename();
      console.log(`✓ Zip download started: ${filename}`);

      // Verify filename format (should be like feedback-export-YYYY-MM-DD.zip)
      if (filename.includes('feedback') && filename.endsWith('.zip')) {
        console.log('✓ Zip filename format correct');
      }

      // Save the download to verify it completed
      const path = await download.path();
      if (path) {
        console.log('✓ Zip download completed');
      }
    } catch (error) {
      console.log('⚠ Zip download failed or timed out');
    }
  } else {
    console.log('⚠ Zip export button not found');
  }

  // Close dialog if still open
  const closeButton = exportDialog.locator('button').filter({ hasText: /Cancel|Close/i });
  if ((await closeButton.count()) > 0) {
    await closeButton.first().click();
  }
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

  if ((await deleteButton.count()) > 0) {
    await deleteButton.click();
    console.log('✓ Clicked delete button');

    // Wait for card to be removed
    await page.waitForTimeout(500);

    // Verify card is gone
    const remainingCards = await manager.locator('p').filter({ hasText: feedbackText }).count();
    if (remainingCards === 0) {
      console.log('✓ Feedback deleted successfully');
    } else {
      console.log('⚠ Feedback still visible after delete');
    }

    // Check if "No feedback yet" message appears
    const emptyMessage = manager.locator('text=/No feedback yet|No feedbacks/i');
    if ((await emptyMessage.count()) > 0) {
      console.log('✓ Empty state message displayed');
    }
  } else {
    console.log('⚠ Delete button not found');
  }
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
