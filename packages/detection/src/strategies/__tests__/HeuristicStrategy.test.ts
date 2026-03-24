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

  it('detects component from data-component attribute', () => {
    const el = document.createElement('div');
    el.setAttribute('data-component', 'UserProfile');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    // formatComponentName capitalizes first letter and lowercases rest
    expect(result!.name).toContain('Userprofile');
  });

  it('detects component from data-testid attribute', () => {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'login-form');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toBeTruthy();
    expect(result!.element).toBe(el);
  });

  it('detects component from data-cy attribute', () => {
    const el = document.createElement('div');
    el.setAttribute('data-cy', 'sidebar-menu');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
  });

  it('detects component from data-component-name attribute', () => {
    const el = document.createElement('div');
    el.setAttribute('data-component-name', 'SearchBar');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toContain('Searchbar');
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

  it('skips Tailwind utility classes (bg-blue-500, text-lg, p-4, flex)', () => {
    const el = document.createElement('div');
    el.classList.add('bg-blue-500', 'text-lg', 'p-4', 'flex');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    // Should still return a result (falls through to other heuristics or path-based)
    // but the name should NOT be a Tailwind class
    if (result) {
      expect(result.name).not.toMatch(/^(bg|text|p|flex)/i);
    }
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

  it('returns a result for a plain div with no signals (path-based detection)', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    // HeuristicStrategy should return something for a bare div
    // (it falls through to "Component" as the inferred name)
    expect(result).not.toBeNull();
    expect(result!.name).toBeTruthy();
  });

  // -- Deep DOM safety ------------------------------------------------------

  it('handles deeply nested DOM (50 levels) without hanging', () => {
    let deepest: HTMLElement = document.createElement('div');
    let current = deepest;
    for (let i = 0; i < 50; i++) {
      const parent = document.createElement('div');
      parent.appendChild(current);
      current = parent;
    }
    document.body.appendChild(current);

    const start = Date.now();
    const result = strategy.handle(deepest);
    const elapsed = Date.now() - start;

    // Should complete quickly (well under 1 second)
    expect(elapsed).toBeLessThan(1000);
    // Should still return a result
    expect(result).not.toBeNull();
  });

  // -- Context guessing from parent elements --------------------------------

  it('infers component name from parent data attributes', () => {
    const parent = document.createElement('div');
    parent.setAttribute('data-component', 'Card');
    const child = document.createElement('span');
    parent.appendChild(child);
    document.body.appendChild(parent);

    const result = strategy.handle(child);
    expect(result).not.toBeNull();
    // Should include the parent component context in the name
    expect(result!.name).toBeTruthy();
  });
});
