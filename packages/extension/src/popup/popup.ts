/**
 * Popup script — shows quick stats, activation button, and settings
 */

const SETTINGS_KEY = 'feedbacker-settings';

interface ExtensionSettings {
  position: string;
  primaryColor: string;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  position: 'bottom-right',
  primaryColor: '#3b82f6'
};

async function init(): Promise<void> {
  const countEl = document.getElementById('feedback-count');
  const activateBtn = document.getElementById('activate-btn');
  const positionSelect = document.getElementById('position-select') as HTMLSelectElement | null;
  const colorInput = document.getElementById('color-input') as HTMLInputElement | null;

  // Get feedback count
  try {
    const response = await chrome.runtime.sendMessage({ type: 'get-feedback-count' });
    if (countEl && response) {
      countEl.textContent = String(response.count || 0);
    }
  } catch {
    if (countEl) countEl.textContent = '0';
  }

  // Load settings
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  const settings: ExtensionSettings = { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };

  if (positionSelect) positionSelect.value = settings.position;
  if (colorInput) colorInput.value = settings.primaryColor;

  // Save settings on change
  positionSelect?.addEventListener('change', () => {
    settings.position = positionSelect.value;
    saveSettings(settings);
  });

  colorInput?.addEventListener('input', () => {
    settings.primaryColor = colorInput.value;
    saveSettings(settings);
  });

  // Activate on current tab
  activateBtn?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['dist/content/content-script.js']
      });
      window.close();
    }
  });
}

async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

init();
