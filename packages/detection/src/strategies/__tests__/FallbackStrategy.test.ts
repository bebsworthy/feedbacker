import { FallbackStrategy } from '../FallbackStrategy';

describe('FallbackStrategy', () => {
  let strategy: FallbackStrategy;

  beforeEach(() => {
    strategy = new FallbackStrategy();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  // -- Always returns non-null ----------------------------------------------

  it('always returns a non-null ComponentInfo', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
  });

  it('result has name, path, and element fields', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(typeof result!.name).toBe('string');
    expect(result!.name.length).toBeGreaterThan(0);
    expect(Array.isArray(result!.path)).toBe(true);
    expect(result!.path.length).toBeGreaterThan(0);
    expect(result!.element).toBe(el);
  });

  // -- Element ID in name ---------------------------------------------------

  it('uses element ID in the fallback name when present', () => {
    const el = document.createElement('div');
    el.id = 'main-content';
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toContain('main-content');
  });

  // -- Meaningful class in name ---------------------------------------------

  it('uses a meaningful class in the fallback name', () => {
    const el = document.createElement('div');
    el.classList.add('user-profile');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toContain('user-profile');
  });

  // -- Semantic tag mapping -------------------------------------------------

  it('maps <header> semantic tag to a component-like name', () => {
    const el = document.createElement('header');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toBeTruthy();
  });

  it('maps <nav> semantic tag', () => {
    const el = document.createElement('nav');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
  });

  it('maps <footer> semantic tag', () => {
    const el = document.createElement('footer');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
  });

  // -- Stops at document.body -----------------------------------------------

  it('stops DOM traversal at document.body', () => {
    const grandparent = document.createElement('section');
    const parent = document.createElement('div');
    const child = document.createElement('span');
    grandparent.appendChild(parent);
    parent.appendChild(child);
    document.body.appendChild(grandparent);

    const result = strategy.handle(child);
    expect(result).not.toBeNull();
    // Path should not include 'body' or 'html'
    const pathLower = result!.path.map((s) => s.toLowerCase());
    expect(pathLower).not.toContain('body');
    expect(pathLower).not.toContain('html');
  });

  // -- Detached elements ----------------------------------------------------

  it('handles elements not attached to the document', () => {
    const el = document.createElement('div');
    // Intentionally NOT appending to document

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.element).toBe(el);
  });

  // -- Error resilience -----------------------------------------------------

  it('handles error during detection gracefully and still returns a result', () => {
    // Create a Proxy element that throws on className access to simulate errors.
    // FallbackStrategy's catch block should still return a basic result.
    const el = document.createElement('div');
    document.body.appendChild(el);

    // Override classList to throw
    Object.defineProperty(el, 'classList', {
      get() {
        throw new Error('classList exploded');
      },
    });

    const result = strategy.handle(el);
    // The outer catch in detect() should produce a fallback result
    expect(result).not.toBeNull();
    expect(result!.name).toContain('Unknown');
  });
});
