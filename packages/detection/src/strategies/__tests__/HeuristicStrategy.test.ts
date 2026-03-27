import { HeuristicStrategy } from '../HeuristicStrategy';

describe('HeuristicStrategy', () => {
  let strategy: HeuristicStrategy;

  beforeEach(() => {
    strategy = new HeuristicStrategy();
  });

  afterEach(() => {
    // Clean up any DOM elements appended to body
    document.body.innerHTML = '';
  });

  // -- Data attribute detection ---------------------------------------------

  // Protects against: data attribute detection failing to produce a result
  // with the correct element reference and a non-empty name
  it.each([
    ['data-component', 'UserProfile', 'Userprofile'],
    ['data-testid', 'login-form', undefined],
    ['data-cy', 'sidebar-menu', undefined],
    ['data-component-name', 'SearchBar', 'Searchbar'],
  ])('detects component from %s attribute', (attr, value, expectedSubstring) => {
    const el = document.createElement('div');
    el.setAttribute(attr, value);
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.element).toBe(el);
    if (expectedSubstring) {
      expect(result!.name).toContain(expectedSubstring);
    } else {
      expect(result!.name).toBeTruthy();
    }
  });

  // -- CSS class analysis ---------------------------------------------------

  it('finds PascalCase class name as component name', () => {
    const el = document.createElement('div');
    el.classList.add('UserAvatar');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    // formatComponentName capitalizes first, lowercases rest
    expect(result!.name).toContain('Useravatar');
  });

  // Protects against: Tailwind utility classes being used as component names
  it('skips Tailwind utility classes and uses a non-Tailwind name', () => {
    const el = document.createElement('div');
    el.classList.add('bg-blue-500', 'text-lg', 'p-4', 'flex');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).not.toMatch(/^(bg|text|p-|flex)/i);
  });

  // -- Semantic HTML mapping ------------------------------------------------

  it('maps <header> to Header', () => {
    const el = document.createElement('header');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toContain('Header');
  });

  it('maps <nav> to Navigation', () => {
    const el = document.createElement('nav');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toContain('Navigation');
  });

  // -- ARIA role mapping ----------------------------------------------------

  it('maps role="dialog" to a useful component name', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'dialog');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toBeTruthy();
    // role="dialog" maps to Modal
    expect(result!.name).toContain('Modal');
  });

  // -- Plain div fallback ---------------------------------------------------

  // Protects against: plain elements with no heuristic signals crashing or
  // returning empty names
  it('returns a result with a non-empty name for a plain div with no signals', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name.length).toBeGreaterThan(0);
    expect(result!.element).toBe(el);
    expect(Array.isArray(result!.path)).toBe(true);
  });

  // -- Deep DOM safety ------------------------------------------------------

  // Protects against: unbounded DOM traversal causing hangs on deep trees
  it('returns a result for deeply nested DOM (50 levels) without hanging', () => {
    let deepest: HTMLElement = document.createElement('div');
    let current = deepest;
    for (let i = 0; i < 50; i++) {
      const parent = document.createElement('div');
      parent.appendChild(current);
      current = parent;
    }
    document.body.appendChild(current);

    const result = strategy.handle(deepest);
    // If this test completes, depth limiting works.
    // The Jest timeout (default 5s) is the hanging guard.
    expect(result).not.toBeNull();
    expect(result!.element).toBe(deepest);
  });

  // -- Path format (buildElementLabel integration) --------------------------

  it('DOM path segments use concise labels, not all-classes join', () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-4 px-6 py-2 bg-gray-100';
    const btn = document.createElement('button');
    btn.className = 'rounded-md shadow-sm text-sm font-medium';
    btn.setAttribute('aria-label', 'Save');
    wrapper.appendChild(btn);
    document.body.appendChild(wrapper);

    const result = strategy.handle(btn);
    expect(result).not.toBeNull();

    // No segment should contain long Tailwind class chains
    for (const segment of result!.path) {
      expect(segment).not.toContain('items-center');
      expect(segment).not.toContain('rounded-md');
    }

    // Button segment should include aria-label
    const btnSegment = result!.path.find((s) => s.startsWith('button'));
    expect(btnSegment).toContain('"Save"');

    wrapper.remove();
  });

  // -- Context guessing from parent elements --------------------------------

  // Protects against: parent context detection failing to incorporate
  // the parent's data-component attribute into the result
  it('infers component name from parent data-component attribute', () => {
    const parent = document.createElement('div');
    parent.setAttribute('data-component', 'Card');
    const child = document.createElement('span');
    parent.appendChild(child);
    document.body.appendChild(parent);

    const result = strategy.handle(child);
    expect(result).not.toBeNull();
    expect(result!.name).toContain('Card');
  });
});
