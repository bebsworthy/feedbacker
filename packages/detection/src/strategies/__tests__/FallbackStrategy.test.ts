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

  // Protects against: semantic tag mapping regression where tags stop
  // producing path entries that include the expected component name.
  // FallbackStrategy puts the inferred semantic name into the path
  // (via inferComponentName), not into result.name.
  it.each([
    ['header', 'Header'],
    ['nav', 'Navigation'],
    ['footer', 'Footer'],
    ['main', 'Main'],
    ['aside', 'Sidebar'],
  ])('maps <%s> semantic tag to a path containing "%s"', (tag, expectedName) => {
    const el = document.createElement(tag);
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.path).toContain(expectedName);
    expect(result!.element).toBe(el);
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

  // -- Semantic name from element characteristics --------------------------

  // Protects against: ARIA labels not being included in the fallback name
  it('includes ARIA label in the fallback name', () => {
    const el = document.createElement('div');
    el.setAttribute('aria-label', 'Search');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toContain('Search');
  });

  // Protects against: button text not being used for identification
  it('includes button text in the fallback name', () => {
    const el = document.createElement('button');
    el.textContent = 'Submit';
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toContain('Submit');
  });

  // Protects against: input placeholder not being used for identification
  it('includes input placeholder in the fallback name', () => {
    const el = document.createElement('input');
    el.setAttribute('placeholder', 'Email');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toContain('Email');
  });

  // Protects against: link text not being used for identification
  it('includes link text in the fallback name', () => {
    const el = document.createElement('a');
    el.textContent = 'Home';
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toContain('Home');
  });

  // -- Path format (buildElementLabel integration) --------------------------

  it('path segments use concise format, not all-classes join', () => {
    const parent = document.createElement('div');
    parent.className = 'flex items-center gap-2 p-4 bg-white rounded-lg shadow-md';
    const child = document.createElement('input');
    child.className = 'border-input h-9 w-full rounded-md px-3 text-base';
    child.setAttribute('name', 'email');
    parent.appendChild(child);
    document.body.appendChild(parent);

    const result = strategy.handle(child);
    expect(result).not.toBeNull();

    // Path should NOT contain long Tailwind class strings
    for (const segment of result!.path) {
      expect(segment.length).toBeLessThan(50);
      expect(segment).not.toContain('items-center');
      expect(segment).not.toContain('border-input');
    }

    // The input segment should include [email] name
    const inputSegment = result!.path.find((s) => s.startsWith('input'));
    expect(inputSegment).toContain('[email]');

    parent.remove();
  });

  it('path includes aria-label when present on elements', () => {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Sidebar');
    const list = document.createElement('ul');
    nav.appendChild(list);
    document.body.appendChild(nav);

    const result = strategy.handle(list);
    expect(result).not.toBeNull();

    const navSegment = result!.path.find((s) => s.startsWith('nav'));
    expect(navSegment).toContain('"Sidebar"');

    nav.remove();
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
