/**
 * ComponentOverlayUI — renders outside the shadow DOM to visually cover page elements
 */

import { type ComponentInfo, getHumanReadableName } from '@feedbacker/detection';

export class ComponentOverlayUI {
  private overlayEl: HTMLDivElement;
  private tooltipEl: HTMLDivElement;

  constructor() {
    // Create overlay element on the page body (not in shadow DOM)
    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'feedbacker-overlay';
    this.overlayEl.style.cssText = `
      position: fixed;
      pointer-events: none;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.08);
      z-index: 2147483646;
      display: none;
      transition: all 50ms ease-out;
      box-sizing: border-box;
    `;

    this.tooltipEl = document.createElement('div');
    this.tooltipEl.style.cssText = `
      position: absolute;
      bottom: 100%;
      left: 0;
      padding: 4px 8px;
      background: #1e3a5f;
      color: white;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      border-radius: 4px;
      white-space: nowrap;
      margin-bottom: 4px;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    this.overlayEl.appendChild(this.tooltipEl);

    document.body.appendChild(this.overlayEl);
  }

  show(info: ComponentInfo): void {
    const rect = info.element.getBoundingClientRect();

    this.overlayEl.style.display = 'block';
    this.overlayEl.style.top = `${rect.top}px`;
    this.overlayEl.style.left = `${rect.left}px`;
    this.overlayEl.style.width = `${rect.width}px`;
    this.overlayEl.style.height = `${rect.height}px`;

    // Position tooltip above or below depending on space
    const humanName = getHumanReadableName(info.element, info.name);
    this.tooltipEl.textContent = humanName;

    if (rect.top < 40) {
      // Not enough space above — show below
      this.tooltipEl.style.bottom = 'auto';
      this.tooltipEl.style.top = '100%';
      this.tooltipEl.style.marginBottom = '0';
      this.tooltipEl.style.marginTop = '4px';
    } else {
      this.tooltipEl.style.top = 'auto';
      this.tooltipEl.style.bottom = '100%';
      this.tooltipEl.style.marginTop = '0';
      this.tooltipEl.style.marginBottom = '4px';
    }
  }

  hide(): void {
    this.overlayEl.style.display = 'none';
  }

  destroy(): void {
    this.overlayEl.remove();
  }
}
