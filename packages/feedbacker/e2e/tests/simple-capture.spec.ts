import { test } from '@playwright/test';
import {
  navigateToTestPage,
  startCapture,
  captureTestElement,
  verifyModal,
  enterModalText,
  submitModal,
  checkFabBadge,
  openManager,
  verifyManagerOpen,
  checkManager,
  checkCopyButton,
  checkPrimaryExportButton,
  testJSONExport,
  testZipExport,
  deleteFeedback,
  getTodayDateString
} from './test-utils';

/**
 * Comprehensive E2E Test for Feedbacker
 *
 * Test Scenario:
 * 1. Navigate to test page
 * 2. Start capture (click FAB → New Feedback)
 * 3. Capture test element (hover and click on test button)
 * 4. Verify modal (check it's open and has screenshot)
 * 5. Enter feedback text "Feedback number 1"
 * 6. Submit modal
 * 7. Check FAB badge shows "1"
 * 8. Open manager (click FAB → Show Manager)
 * 9. Verify manager is open
 * 10. Check manager contains:
 *     - Today's date section
 *     - Feedback card with image and text "Feedback number 1"
 *     - Edit, Copy, Delete buttons
 * 11. Test copy button functionality
 * 12. Check primary export button exists
 * 13. Test JSON export:
 *     - Click export button
 *     - Choose JSON format
 *     - Verify download starts
 * 14. Test Zip export:
 *     - Click export button
 *     - Choose Zip format
 *     - Verify download starts
 * 15. Delete feedback:
 *     - Click delete button on card
 *     - Verify card is removed
 *     - Check for empty state
 */
test.describe('Feedbacker Complete Flow', () => {
  test.afterEach(async ({ page }) => {
    // Small delay to see the final state before closing (only in headed mode)
    if (process.env.HEADED !== 'false') {
      await page.waitForTimeout(1000);
    }
    await page.close();
  });

  test('complete feedback flow', async ({ page }) => {
    const feedbackText = 'Feedback number 1';
    const todayDate = getTodayDateString();

    console.log('\n🚀 Starting Feedbacker E2E Test\n');

    // Step 1: Navigate to test page
    console.log('Step 1: Navigate to test page');
    await navigateToTestPage(page);

    // Step 2: Start capture
    console.log('\nStep 2: Start capture (FAB → New Feedback)');
    await startCapture(page);

    // Step 3: Capture test element
    console.log('\nStep 3: Capture test element');
    await captureTestElement(page, 'test-button');

    // Step 4: Verify modal opened with screenshot
    console.log('\nStep 4: Verify modal');
    await verifyModal(page);

    // Step 5: Enter feedback text
    console.log('\nStep 5: Enter feedback text');
    await enterModalText(page, feedbackText);

    // Step 6: Submit modal
    console.log('\nStep 6: Submit modal');
    await submitModal(page);

    // Step 7: Check FAB badge (might not be implemented yet)
    await checkFabBadge(page, 1);

    // Step 8: Open manager
    await openManager(page);

    // Step 9: Verify manager is open
    await verifyManagerOpen(page);

    // Step 10: Check manager content
    await checkManager(page, todayDate, feedbackText);

    // Step 11: Test copy button
    console.log('\nStep 11: Test copy button');
    await checkCopyButton(page, feedbackText);

    // Step 12: Check export button
    console.log('\nStep 12: Check export button');
    await checkPrimaryExportButton(page);

    // Step 13: Test JSON export
    console.log('\nStep 13: Test JSON export');
    await testJSONExport(page);

    // Step 14: Test Zip export
    console.log('\nStep 14: Test Zip export');
    await testZipExport(page);

    // Step 15: Delete feedback
    console.log('\nStep 15: Delete feedback');
    await deleteFeedback(page, feedbackText);

    console.log('\n✅ Complete feedback flow test passed!');
  });
});
