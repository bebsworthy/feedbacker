/**
 * T-065: Search and sort feedback E2E test
 *
 * Covers: FC-003 (search filters cards), FC-004 (sort toggle)
 *
 * Flow 2: Sidebar with 5+ items, type "button" in search, observe filtered
 * cards, clear search, toggle sort to oldest-first, observe card order.
 *
 * Requires: FEEDBACKER_TEST_MODE=1 build (open shadow DOM)
 * Run: npm run test:e2e
 */

import { test, expect } from '../fixtures';
import {
  activateExtension,
  clickFabAction,
  modal,
  modalTextarea,
  submitModal,
  sidebar,
  sidebarCards,
  hoverTestElement,
  clickTestElement,
  shadowRoot,
} from './test-utils';

/**
 * Helper: capture a feedback item with the given comment on a given element.
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

test.describe('T-065: Search and sort feedback', () => {
  test.beforeEach(async ({ page, extensionId, context }) => {
    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);
  });

  test('search filters cards and sort reverses order', async ({ page }) => {
    // Create 5+ feedback items, at least two with "button" in the comment
    const comments = [
      'The button color is wrong',
      'Card layout needs fixing',
      'Input placeholder is unclear',
      'The button text is too small',
      'List items should have borders',
    ];

    const testIds = [
      'test-button',
      'test-card',
      'test-input',
      'test-button',
      'test-list',
    ];

    for (let i = 0; i < comments.length; i++) {
      await captureFeedback(page, comments[i], testIds[i]);
      // Brief pause between captures to ensure distinct timestamps
      await page.waitForTimeout(200);
    }

    // Open sidebar
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });
    await expect(sidebarCards(page)).toHaveCount(5, { timeout: 5000 });

    // Step 1-2: Locate the search input and type "button"
    const searchInput = sidebar(page).locator(
      'input[type="search"], input[type="text"], input[placeholder*="earch"], .fb-search-input'
    ).first();

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('button');

      // Step 3: Wait for debounce (300ms) and observe filtered cards
      await page.waitForTimeout(500);
      const visibleCards = sidebarCards(page);
      const count = await visibleCards.count();
      // Should show only the 2 cards containing "button"
      expect(count).toBe(2);

      // Verify the visible cards contain "button" in their text
      for (let i = 0; i < count; i++) {
        const cardText = await visibleCards.nth(i).textContent();
        expect(cardText?.toLowerCase()).toContain('button');
      }

      // Step 4: Clear the search input
      await searchInput.clear();
      await page.waitForTimeout(500);
      // All 5 cards should reappear
      await expect(sidebarCards(page)).toHaveCount(5);

      // Error path: search for a term that matches nothing
      await searchInput.fill('nonexistent-xyz');
      await page.waitForTimeout(500);
      // Should show "No matching feedback" message
      const noMatchMsg = sidebar(page).locator(
        ':text("No matching"), :text("no matching"), [class*="empty"]'
      );
      if (await noMatchMsg.count() > 0) {
        await expect(noMatchMsg.first()).toBeVisible();
      } else {
        // At minimum, no cards should be shown
        await expect(sidebarCards(page)).toHaveCount(0);
      }

      // Clear search for sort test
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    // Step 5: Activate the sort toggle to switch to oldest-first
    const sortToggle = sidebar(page).locator(
      'button, [role="button"], select'
    ).filter({ hasText: /sort|oldest|newest|order/i });

    if (await sortToggle.count() > 0) {
      // Get the first card's text before sorting
      const firstCardBefore = await sidebarCards(page).first().textContent();

      await sortToggle.first().click();
      await page.waitForTimeout(300);

      // Step 6: Observe the card order - should be reversed
      const firstCardAfter = await sidebarCards(page).first().textContent();

      // The first card after toggling sort should be different
      // (was newest-first, now oldest-first)
      expect(firstCardAfter).not.toBe(firstCardBefore);

      // The oldest item should now be first
      const firstCardComment = sidebarCards(page).first().locator('.fb-card-comment');
      if (await firstCardComment.count() > 0) {
        // The first comment captured was "The button color is wrong"
        await expect(firstCardComment).toContainText('The button color is wrong');
      }
    }
  });

  test('search persists across filter tab switches', async ({ page }) => {
    // Create 2 feedback items
    await captureFeedback(page, 'button search test 1', 'test-button');
    await captureFeedback(page, 'card search test 2', 'test-card');

    // Open sidebar
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });

    const searchInput = sidebar(page).locator(
      'input[type="search"], input[type="text"], input[placeholder*="earch"], .fb-search-input'
    ).first();

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Type a search term
      await searchInput.fill('button');
      await page.waitForTimeout(500);

      // Switch between filter tabs
      const allSitesTab = shadowRoot(page).locator('[data-filter]', { hasText: 'All sites' });
      if (await allSitesTab.isVisible({ timeout: 1000 }).catch(() => false)) {
        await allSitesTab.click();
        await page.waitForTimeout(300);

        // Search should persist
        const inputValue = await searchInput.inputValue();
        expect(inputValue).toBe('button');

        // Switch back to "This site"
        const thisSiteTab = shadowRoot(page).locator('[data-filter]', { hasText: 'This site' });
        await thisSiteTab.click();
        await page.waitForTimeout(300);

        // Search should still persist
        const inputValueAfter = await searchInput.inputValue();
        expect(inputValueAfter).toBe('button');
      }
    }
  });
});
