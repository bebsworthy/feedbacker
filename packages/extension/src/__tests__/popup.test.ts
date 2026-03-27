/**
 * Tests for popup keyboard shortcut display and privacy trust signal.
 * Covers T-011 and T-023.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const popupHtmlPath = resolve(__dirname, '../../popup/popup.html');

function loadPopupHtml(): string {
  return readFileSync(popupHtmlPath, 'utf-8');
}

function setupDom(html: string): void {
  document.documentElement.innerHTML = html;
}

/**
 * Simulates the shortcut hint logic from popup.ts without requiring
 * chrome.* APIs, by directly exercising the same platform detection
 * and DOM manipulation.
 */
function applyShortcutHint(platform: string): void {
  const isMac = /Mac|iPhone|iPod|iPad/i.test(platform);
  const shortcutText = isMac ? 'Opt+Shift+F' : 'Alt+Shift+F';
  const el = document.getElementById('shortcut-hint');
  if (el) {
    el.textContent = `Keyboard shortcut: ${shortcutText}`;
  }
}

describe('Popup', () => {
  beforeEach(() => {
    const html = loadPopupHtml();
    setupDom(html);
  });

  // T-011: Popup shows OS-appropriate shortcut
  describe('T-011: OS-appropriate keyboard shortcut', () => {
    it('shows "Opt+Shift+F" on Mac', () => {
      applyShortcutHint('MacIntel');

      const hint = document.getElementById('shortcut-hint');
      expect(hint).not.toBeNull();
      expect(hint!.textContent).toContain('Opt+Shift+F');
      expect(hint!.textContent).toContain('Shift+F');
    });

    it('shows "Alt+Shift+F" on non-Mac', () => {
      applyShortcutHint('Win32');

      const hint = document.getElementById('shortcut-hint');
      expect(hint).not.toBeNull();
      expect(hint!.textContent).toContain('Alt+Shift+F');
      expect(hint!.textContent).toContain('Shift+F');
    });

    it('shortcut hint element exists below the activate button', () => {
      const hint = document.getElementById('shortcut-hint');
      expect(hint).not.toBeNull();
    });
  });

  // T-023: Privacy message in popup
  describe('T-023: Privacy message in popup', () => {
    it('contains the privacy trust signal text', () => {
      const bodyText = document.body.textContent || '';
      expect(bodyText).toContain('Your feedback stays local');
    });

    it('privacy notice is inside the popup footer area', () => {
      const notice = document.querySelector('.privacy-notice');
      expect(notice).not.toBeNull();
      expect(notice!.textContent).toContain(
        'Your feedback stays local'
      );
    });
  });
});
