/**
 * Screenshot capture utilities for the background service worker
 * Uses chrome.tabs.captureVisibleTab for native browser screenshots
 */

export async function captureVisibleTab(): Promise<string> {
  return chrome.tabs.captureVisibleTab({
    format: 'png',
    quality: 92
  });
}

/**
 * Crop a screenshot data URL to a specific region
 * This is called in the content script since it needs OffscreenCanvas / Canvas
 */
export function buildCropParams(rect: DOMRect, devicePixelRatio: number) {
  return {
    x: Math.round(rect.x * devicePixelRatio),
    y: Math.round(rect.y * devicePixelRatio),
    width: Math.round(rect.width * devicePixelRatio),
    height: Math.round(rect.height * devicePixelRatio)
  };
}
