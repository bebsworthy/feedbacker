/**
 * Tests for generateCssSelector utility.
 * Covers T-045, T-046, T-047, T-048, T-049.
 */

import { generateCssSelector } from '../utils/css-selector-generator';

describe('generateCssSelector', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  // T-045: Element with unique id="main-submit" returns "#main-submit"
  it('returns #id for element with a stable id (T-045)', () => {
    const el = document.createElement('button');
    el.id = 'main-submit';
    container.appendChild(el);

    const selector = generateCssSelector(el);
    expect(selector).toBe('#main-submit');
  });

  // T-046: Element with data-testid="login-btn" returns '[data-testid="login-btn"]'
  it('returns [data-testid="..."] when present (T-046)', () => {
    const el = document.createElement('button');
    el.setAttribute('data-testid', 'login-btn');
    container.appendChild(el);

    const selector = generateCssSelector(el);
    expect(selector).toBe('[data-testid="login-btn"]');
  });

  // T-047: Element with UUID-like auto-generated id falls back
  it('skips UUID-like auto-generated IDs and falls back (T-047)', () => {
    const el = document.createElement('div');
    el.id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    container.appendChild(el);

    const selector = generateCssSelector(el);
    // Should NOT start with # (the UUID id)
    expect(selector).not.toMatch(/^#a1b2c3d4/);
    // Should still produce a valid selector
    expect(selector).not.toBeNull();
    expect(document.querySelector(selector!)).toBe(el);
  });

  // T-048: Extension-injected element returns null
  it('returns null for extension elements (T-048)', () => {
    const overlay = document.createElement('div');
    overlay.id = 'feedbacker-overlay';
    document.body.appendChild(overlay);

    const selector = generateCssSelector(overlay);
    expect(selector).toBeNull();

    overlay.remove();
  });

  it('returns null for elements inside feedbacker-extension-root (T-048)', () => {
    const root = document.createElement('div');
    root.id = 'feedbacker-extension-root';
    document.body.appendChild(root);

    const child = document.createElement('span');
    root.appendChild(child);

    const selector = generateCssSelector(child);
    expect(selector).toBeNull();

    root.remove();
  });

  // T-049: Generated selector validated with querySelector returns original element
  it('generated selector resolves back to original element (T-049)', () => {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'unique-element');
    container.appendChild(el);

    const selector = generateCssSelector(el);
    expect(selector).not.toBeNull();
    expect(document.querySelector(selector!)).toBe(el);
  });

  it('validates selector for nth-child chain (T-049)', () => {
    const parent = document.createElement('ul');
    container.appendChild(parent);

    const items = Array.from({ length: 5 }, (_, i) => {
      const li = document.createElement('li');
      li.textContent = `Item ${i}`;
      parent.appendChild(li);
      return li;
    });

    // Test the third item (no id, no data attributes)
    const selector = generateCssSelector(items[2]);
    expect(selector).not.toBeNull();
    expect(document.querySelector(selector!)).toBe(items[2]);
  });

  // Additional edge cases

  it('returns null for detached elements', () => {
    const el = document.createElement('div');
    // Not appended to any document
    const selector = generateCssSelector(el);
    expect(selector).toBeNull();
  });

  it('prefers id over data-testid', () => {
    const el = document.createElement('button');
    el.id = 'submit-btn';
    el.setAttribute('data-testid', 'submit');
    container.appendChild(el);

    const selector = generateCssSelector(el);
    expect(selector).toBe('#submit-btn');
  });

  it('prefers data-testid over data-cy', () => {
    const el = document.createElement('button');
    el.setAttribute('data-testid', 'login');
    el.setAttribute('data-cy', 'login-cy');
    container.appendChild(el);

    const selector = generateCssSelector(el);
    expect(selector).toBe('[data-testid="login"]');
  });

  it('uses data-cy when no id or data-testid', () => {
    const el = document.createElement('button');
    el.setAttribute('data-cy', 'save-btn');
    container.appendChild(el);

    const selector = generateCssSelector(el);
    expect(selector).toBe('[data-cy="save-btn"]');
  });

  it('uses data-test when no id, data-testid, or data-cy', () => {
    const el = document.createElement('button');
    el.setAttribute('data-test', 'cancel-btn');
    container.appendChild(el);

    const selector = generateCssSelector(el);
    expect(selector).toBe('[data-test="cancel-btn"]');
  });

  it('skips long hex hash IDs', () => {
    const el = document.createElement('div');
    el.id = 'abcdef1234567890a'; // 17 hex chars
    el.setAttribute('data-testid', 'fallback');
    container.appendChild(el);

    const selector = generateCssSelector(el);
    expect(selector).toBe('[data-testid="fallback"]');
  });

  it('skips React useId-style IDs like :r0:', () => {
    const el = document.createElement('div');
    el.id = ':r0:';
    el.setAttribute('data-testid', 'react-comp');
    container.appendChild(el);

    const selector = generateCssSelector(el);
    expect(selector).toBe('[data-testid="react-comp"]');
  });

  it('skips numeric-only IDs', () => {
    const el = document.createElement('div');
    el.id = '12345';
    el.setAttribute('data-testid', 'numbered');
    container.appendChild(el);

    const selector = generateCssSelector(el);
    expect(selector).toBe('[data-testid="numbered"]');
  });

  it('uses custom data-* attributes as fallback', () => {
    const el = document.createElement('div');
    el.setAttribute('data-section', 'hero');
    container.appendChild(el);

    const selector = generateCssSelector(el);
    expect(selector).toBe('[data-section="hero"]');
  });

  it('builds nth-child chain from ancestor with stable id', () => {
    // container already has id="test-container"
    const wrapper = document.createElement('div');
    container.appendChild(wrapper);

    const el = document.createElement('span');
    wrapper.appendChild(el);

    const selector = generateCssSelector(el);
    expect(selector).not.toBeNull();
    expect(selector).toContain('#test-container');
    expect(document.querySelector(selector!)).toBe(el);
  });
});
