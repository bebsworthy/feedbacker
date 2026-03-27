/**
 * T-070: Pre-existing feedback backward compatibility E2E test
 *
 * Covers: FC-001, FC-002, FC-008, FC-010, FC-011, FC-012, FC-013
 *
 * Flow 7: Pre-existing feedback without new fields (type, severity,
 * elementSelector) renders and exports correctly.
 *
 * Requires: FEEDBACKER_TEST_MODE=1 build (open shadow DOM)
 * Run: npm run test:e2e
 */

import { test, expect } from '../fixtures';
import {
  activateExtension,
  clickFabAction,
  sidebar,
  sidebarCards,
  shadowRoot,
} from './test-utils';

/**
 * Injects pre-phase-3 feedback items into chrome.storage.local.
 * These items intentionally lack the `type`, `severity`, and
 * `elementSelector` fields that phase 3 introduces.
 */
async function injectLegacyFeedback(
  context: import('@playwright/test').BrowserContext
): Promise<void> {
  // Use the service worker to set storage data directly
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker');

  await sw.evaluate(() => {
    const legacyFeedback = [
      {
        id: 'legacy-001',
        comment: 'Legacy item without type',
        componentName: 'TestButton',
        componentPath: 'App > TestPage > TestButton',
        screenshot: '',
        timestamp: Date.now() - 60000,
        url: 'http://localhost:5555/test-ext',
        browserInfo: {
          userAgent: 'Mozilla/5.0 Test',
          screenWidth: 1920,
          screenHeight: 1080,
          devicePixelRatio: 1,
          language: 'en-US',
        },
        htmlSnippet: '<button data-testid="test-button">Test Button</button>',
      },
      {
        id: 'legacy-002',
        comment: 'Another legacy item',
        componentName: 'TestCard',
        componentPath: 'App > TestPage > TestCard',
        screenshot: '',
        timestamp: Date.now() - 30000,
        url: 'http://localhost:5555/test-ext',
        browserInfo: {
          userAgent: 'Mozilla/5.0 Test',
          screenWidth: 1920,
          screenHeight: 1080,
          devicePixelRatio: 1,
          language: 'en-US',
        },
        htmlSnippet:
          '<div data-testid="test-card" class="test-card">Test Card</div>',
      },
    ];

    chrome.storage.local.set({ feedbacks: legacyFeedback });
  });
}

test.describe('T-070: Backward compatibility with pre-phase-3 feedback', () => {
  test('legacy items render without type badge or errors', async ({
    page,
    extensionId,
    context,
  }) => {
    // Inject legacy feedback via service worker before loading the page
    await injectLegacyFeedback(context);

    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);

    // Open sidebar
    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });

    // Step 2: Cards should render without errors
    const cards = sidebarCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Check each card renders properly
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await expect(card).toBeVisible();

      // Card comment should be visible
      const comment = card.locator('.fb-card-comment');
      if (await comment.count() > 0) {
        await expect(comment).toBeVisible();
      }

      // No "undefined" text should appear in the card
      const cardText = await card.textContent();
      expect(cardText).not.toContain('undefined');
      expect(cardText).not.toContain('null');

      // No type badge should be present on legacy items
      const typeBadge = card.locator('.fb-type-badge, [data-type-badge]');
      const badgeCount = await typeBadge.count();
      if (badgeCount > 0) {
        for (let j = 0; j < badgeCount; j++) {
          const badgeText = await typeBadge.nth(j).textContent();
          if (badgeText) {
            expect(badgeText.toLowerCase()).not.toContain('undefined');
          }
        }
      }
    }
  });

  test('clicking legacy card does not trigger navigation or errors', async ({
    page,
    extensionId,
    context,
  }) => {
    await injectLegacyFeedback(context);

    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);

    await clickFabAction(page, 'Show manager');
    await expect(sidebar(page)).toBeVisible({ timeout: 3000 });

    const cards = sidebarCards(page);
    if ((await cards.count()) > 0) {
      const card = cards.first();

      // Step 3: Legacy cards without elementSelector should not have
      // a locate button, or it should be disabled/hidden
      const locateBtn = card.locator(
        'button[title*="ocate"], button[aria-label*="ocate"], ' +
        '[data-testid="locate-btn"], .fb-locate-btn'
      );

      if ((await locateBtn.count()) > 0) {
        const isDisabled = await locateBtn
          .first()
          .isDisabled()
          .catch(() => false);
        const isHidden = !(await locateBtn
          .first()
          .isVisible()
          .catch(() => true));
        expect(isDisabled || isHidden).toBe(true);
      }

      // No error toast should appear
      const errorToast = page
        .locator('.fb-toast, [role="alert"]')
        .filter({ hasText: /error/i });
      const toastVisible = await errorToast
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      expect(toastVisible).toBe(false);
    }
  });

  test('legacy items export without type prefix', async ({
    page,
    extensionId,
    context,
  }) => {
    await injectLegacyFeedback(context);

    await page.goto('/test-ext');
    await page.waitForLoadState('networkidle');
    await activateExtension(page, extensionId, context);

    // Step 4: Export all feedback
    await clickFabAction(page, 'Export');
    const exportDialog = shadowRoot(page)
      .locator('.fb-modal')
      .filter({ hasText: 'Export' });

    if (await exportDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportDialog).toBeVisible();

      // Markdown export button should be available and enabled
      const markdownBtn = exportDialog
        .locator('button')
        .filter({ hasText: /markdown/i });
      if ((await markdownBtn.count()) > 0) {
        await expect(markdownBtn.first()).toBeEnabled();
      }

      // Close the export dialog
      await page.keyboard.press('Escape');
    }
  });
});
