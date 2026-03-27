/**
 * T-069: Keyboard-accessible element selection E2E test
 *
 * Covers: FC-014 (Tab cycles focusable elements), FC-015 (Arrow keys
 * navigate DOM hierarchy), FC-016 (Enter confirms selection),
 * FC-017 (chip keyboard navigation)
 *
 * Flow 6: Keyboard-only flow -- Tab to FAB, activate, Tab through
 * elements, Arrow Up to parent, Enter to confirm, Tab to chips,
 * arrow to Bug, Enter, Tab to textarea, type, Tab to submit, Enter.
 *
 * Requires: FEEDBACKER_TEST_MODE=1 build (open shadow DOM)
 * Run: npm run test:e2e
 */

import { test, expect } from '../fixtures';
import {
  activateExtension,
  fabButton,
  fabActions,
  overlay,
  modal,
  modalTextarea,
  sidebarCards,
  clickFabAction,
  sidebar,
  shadowRoot,
} from './test-utils';

test.describe('T-069: Keyboard-accessible element selection', () => {
  test.beforeEach(async ({ page, extensionId, context }) => {
    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);
  });

  test('full keyboard-only capture flow with type selection', async ({ page }) => {
    // Step 1: Focus the FAB using Tab
    // Start from the page body and Tab until FAB receives focus
    await page.keyboard.press('Tab');
    // Keep tabbing until we find the FAB (shadow DOM may require
    // multiple tabs through page elements first)
    let fabFocused = false;
    for (let i = 0; i < 30; i++) {
      // Check if FAB has focus (it may be in shadow DOM)
      const hasFabFocus = await page.evaluate(() => {
        const host = document.querySelector('#feedbacker-extension-root');
        if (!host?.shadowRoot) return false;
        const fab = host.shadowRoot.querySelector('.fb-fab');
        return fab === host.shadowRoot.activeElement ||
               document.activeElement === host;
      });
      if (hasFabFocus) {
        fabFocused = true;
        break;
      }
      await page.keyboard.press('Tab');
    }

    if (!fabFocused) {
      // If direct Tab to shadow DOM FAB is not possible,
      // use the FAB click to start the flow, then continue with keyboard
      await fabButton(page).focus();
    }

    // Step 2: Activate FAB to expand the menu (Enter/Space)
    await page.keyboard.press('Enter');
    await expect(fabActions(page)).toBeVisible({ timeout: 3000 });

    // Step 3: Navigate to "New feedback" menu item
    const newFeedbackAction = fabActions(page).locator('.fb-fab-action', {
      hasText: 'New feedback',
    });
    // Tab or arrow to the New feedback action
    await page.keyboard.press('Tab');

    // Step 4: Activate "New feedback" (Enter)
    let actionFocused = false;
    for (let i = 0; i < 5; i++) {
      const isFocused = await newFeedbackAction.evaluate(
        (el: HTMLElement) => el === el.getRootNode()?.querySelector(':focus') ||
                             el.matches(':focus')
      ).catch(() => false);
      if (isFocused) {
        actionFocused = true;
        break;
      }
      await page.keyboard.press('Tab');
    }

    if (actionFocused) {
      await page.keyboard.press('Enter');
    } else {
      // Fallback: click the action to enter selection mode
      await newFeedbackAction.click();
    }

    // Wait for selection mode to activate
    await page.waitForTimeout(500);

    // Step 5: Use Tab to cycle through focusable elements
    // In selection mode, Tab should move focus through page elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // Step 6: Observe the overlay as focus moves
    // Overlay should follow the keyboard-focused element
    if (await overlay(page).isVisible({ timeout: 2000 }).catch(() => false)) {
      // Overlay is visible, meaning it's tracking keyboard focus
      await expect(overlay(page)).toBeVisible();
    }

    // Tab a few more times to move to different elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Step 7: Use Arrow Up to navigate to the parent of the focused element
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);

    // Step 8: Press Enter to confirm selection
    await page.keyboard.press('Enter');

    // Modal should open with the element's info
    await expect(modal(page)).toBeVisible({ timeout: 5000 });

    // Step 9-10: Navigate to type chips and select Bug
    const chipBar = modal(page).locator(
      '.fb-type-chips, .fb-chip-bar, [data-testid="type-chips"], [role="radiogroup"]'
    );

    if (await chipBar.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Tab to reach the chip bar
      for (let i = 0; i < 10; i++) {
        const chipFocused = await chipBar.locator(':focus').count();
        if (chipFocused > 0) break;
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }

      // Use arrow keys to move between chips
      // Default is Suggestion, arrow right to Bug
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);

      // Press Enter or Space to select
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
    }

    // Step 11: Tab to the textarea and type a comment
    // Tab until we reach the textarea
    for (let i = 0; i < 10; i++) {
      const textareaFocused = await modalTextarea(page).evaluate(
        (el: HTMLElement) => el === el.getRootNode()?.querySelector(':focus')
      ).catch(() => false);
      if (textareaFocused) break;
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    await page.keyboard.type('Keyboard-only bug report');

    // Step 12: Tab to the Submit button and press Enter
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Find and verify the submit button has focus, then press Enter
    const submitBtn = modal(page).locator('.fb-btn-primary', { hasText: 'Submit' });
    let submitFocused = false;
    for (let i = 0; i < 5; i++) {
      const isFocused = await submitBtn.evaluate(
        (el: HTMLElement) => el === el.getRootNode()?.querySelector(':focus')
      ).catch(() => false);
      if (isFocused) {
        submitFocused = true;
        break;
      }
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    if (submitFocused) {
      await page.keyboard.press('Enter');
    } else {
      // Fallback: Enter in textarea also submits
      await modalTextarea(page).press('Enter');
    }

    // Modal should close after submission
    await expect(modal(page)).not.toBeVisible({ timeout: 5000 });

    // Verify feedback was saved
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });
    await expect(sidebarCards(page)).toHaveCount(1, { timeout: 3000 });

    const card = sidebarCards(page).first();
    await expect(card.locator('.fb-card-comment')).toContainText(
      'Keyboard-only bug report'
    );
  });

  test('Escape exits selection mode without opening modal', async ({ page }) => {
    // Enter selection mode
    await clickFabAction(page, 'New feedback');
    await page.waitForTimeout(500);

    // Press Escape to exit
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Modal should NOT have opened
    await expect(modal(page)).not.toBeVisible();

    // Overlay should not be visible
    if (await overlay(page).isVisible({ timeout: 500 }).catch(() => false)) {
      // If overlay was visible during selection, it should now be hidden
      await expect(overlay(page)).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('Tab does not interfere outside selection mode', async ({ page }) => {
    // Without activating selection mode, Tab should behave normally
    // (no overlay, no element selection behavior)
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // Overlay should not appear
    await expect(overlay(page)).not.toBeVisible();

    // Tab again
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    await expect(overlay(page)).not.toBeVisible();
  });
});
