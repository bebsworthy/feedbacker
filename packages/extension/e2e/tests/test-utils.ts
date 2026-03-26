/**
 * Test utilities for extension e2e testing
 * Handles shadow DOM piercing and common interactions
 */

import { Page, Locator, expect } from '@playwright/test';

const HOST_SELECTOR = '#feedbacker-extension-root';
const OVERLAY_SELECTOR = '#feedbacker-overlay';

/**
 * Get the shadow root of the extension host element.
 * Requires FEEDBACKER_TEST_MODE=1 build (open shadow DOM).
 */
export function shadowRoot(page: Page): Locator {
  return page.locator(`${HOST_SELECTOR} >> .feedbacker-container`);
}

/**
 * Wait for the extension to be injected and FAB to appear
 */
export async function waitForExtension(page: Page): Promise<void> {
  // Host element has width:0/height:0, so check for attached (not visible)
  await page.waitForSelector(HOST_SELECTOR, { state: 'attached', timeout: 10000 });
  // FAB inside shadow DOM is the visible indicator
  await expect(shadowRoot(page).locator('.fb-fab')).toBeVisible({ timeout: 5000 });
}

/**
 * Activate the extension on the current page.
 * Sends a message to the service worker to inject the content script.
 */
export async function activateExtension(
  page: Page,
  extensionId: string,
  context: import('@playwright/test').BrowserContext
): Promise<void> {
  // Get the service worker and ask it to inject the content script
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker');

  // Use the service worker to inject content script into our page
  await sw.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['dist/content/content-script.js']
      });
    }
  });

  await waitForExtension(page);
}

// ---- FAB ----

export function fabButton(page: Page): Locator {
  return shadowRoot(page).locator('.fb-fab');
}

export function fabBadge(page: Page): Locator {
  return shadowRoot(page).locator('.fb-fab-badge');
}

export function fabActions(page: Page): Locator {
  return shadowRoot(page).locator('.fb-fab-actions');
}

export async function expandFab(page: Page): Promise<void> {
  await fabButton(page).click();
  await expect(fabActions(page)).toBeVisible({ timeout: 3000 });
}

export async function clickFabAction(page: Page, labelSubstring: string): Promise<void> {
  await expandFab(page);
  const action = fabActions(page).locator('.fb-fab-action', { hasText: labelSubstring });
  await action.click();
}

// ---- Overlay ----

export function overlay(page: Page): Locator {
  return page.locator(OVERLAY_SELECTOR);
}

// ---- Modal ----

export function modal(page: Page): Locator {
  return shadowRoot(page).locator('.fb-modal');
}

export function modalBackdrop(page: Page): Locator {
  return shadowRoot(page).locator('.fb-modal-backdrop');
}

export function modalTextarea(page: Page): Locator {
  return modal(page).locator('.fb-textarea');
}

export async function submitModal(page: Page): Promise<void> {
  await modal(page).locator('.fb-btn-primary', { hasText: 'Submit' }).click();
}

export async function cancelModal(page: Page): Promise<void> {
  await modal(page).locator('.fb-btn-secondary', { hasText: 'Cancel' }).click();
}

// ---- Sidebar ----

export function sidebar(page: Page): Locator {
  return shadowRoot(page).locator('.fb-sidebar');
}

export function sidebarCards(page: Page): Locator {
  return sidebar(page).locator('.fb-card');
}

export function sidebarFilterTab(page: Page, label: string): Locator {
  return shadowRoot(page).locator(`[data-filter]`, { hasText: label });
}

// ---- Confirm Dialog ----

export function confirmDialog(page: Page): Locator {
  return shadowRoot(page).locator('.fb-confirm');
}

// ---- Export Dialog ----

export function exportDialog(page: Page): Locator {
  return shadowRoot(page).locator('.fb-modal').filter({ hasText: 'Export' });
}

// ---- Helpers ----

/**
 * Hover over a test element to trigger component detection
 */
export async function hoverTestElement(page: Page, testId: string = 'test-button'): Promise<void> {
  const element = page.locator(`[data-testid="${testId}"]`);
  await expect(element).toBeVisible();
  const box = await element.boundingBox();
  if (!box) throw new Error(`Could not get bounding box for ${testId}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
}

/**
 * Click a test element during detection mode
 */
export async function clickTestElement(page: Page, testId: string = 'test-button'): Promise<void> {
  const element = page.locator(`[data-testid="${testId}"]`);
  const box = await element.boundingBox();
  if (!box) throw new Error(`Could not get bounding box for ${testId}`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/**
 * Press a key inside the shadow DOM.
 * Finds the topmost visible overlay/modal/sidebar and focuses an element
 * within it so the keypress is received by the right component.
 */
export async function pressKeyInShadow(page: Page, key: string): Promise<void> {
  const container = shadowRoot(page);

  // Try to focus within the topmost visible component (order matters)
  const targets = [
    container.locator('.fb-confirm button').first(),
    container.locator('.fb-modal .fb-textarea'),
    container.locator('.fb-modal button').first(),
    container.locator('.fb-sidebar button').first(),
    container.locator('button, textarea, input, [tabindex]').first(),
  ];

  for (const target of targets) {
    if (await target.isVisible({ timeout: 500 }).catch(() => false)) {
      await target.focus();
      break;
    }
  }

  await page.keyboard.press(key);
}

/**
 * Clear extension storage between tests
 */
export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    chrome.storage.local.clear();
  });
}
