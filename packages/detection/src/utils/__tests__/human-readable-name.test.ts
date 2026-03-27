import { getHumanReadableName } from '../human-readable-name';

describe('getHumanReadableName', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  // T-001: Element with aria-label
  it('returns aria-label when present', () => {
    const el = document.createElement('button');
    el.setAttribute('aria-label', 'Submit Order');
    document.body.appendChild(el);

    expect(getHumanReadableName(el)).toBe('Submit Order');
  });

  // T-002: Element with aria-labelledby pointing to a visible label
  it('returns referenced label text for aria-labelledby', () => {
    const label = document.createElement('span');
    label.id = 'my-label';
    label.textContent = 'Email Address';
    document.body.appendChild(label);

    const el = document.createElement('input');
    el.setAttribute('aria-labelledby', 'my-label');
    document.body.appendChild(el);

    expect(getHumanReadableName(el)).toBe('Email Address');
  });

  // T-003: Button with textContent and no aria attributes
  it('returns textContent when no aria attributes present', () => {
    const el = document.createElement('button');
    el.textContent = 'Click me';
    document.body.appendChild(el);

    expect(getHumanReadableName(el)).toBe('Click me');
  });

  // T-004: Element with role="navigation" and no text
  it('returns capitalized role when no text or aria', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'navigation');
    document.body.appendChild(el);

    expect(getHumanReadableName(el)).toBe('Navigation');
  });

  // T-005: Element with componentName fallback
  it('returns componentName when no semantic info', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    expect(getHumanReadableName(el, 'NavButton')).toBe('NavButton');
  });

  // T-006: Bare div with no attributes, no text, no component name
  it('returns tag name as final fallback', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    expect(getHumanReadableName(el)).toBe('div');
  });

  // T-007: Long textContent truncated to 40 chars with ellipsis
  it('truncates long text to 40 characters with ellipsis', () => {
    const el = document.createElement('p');
    const longText = 'This is a very long piece of text that should definitely be truncated';
    el.textContent = longText;
    document.body.appendChild(el);

    const result = getHumanReadableName(el);
    expect(result.length).toBe(41); // 40 chars + ellipsis character
    expect(result).toBe('This is a very long piece of text that s\u2026');
  });

  // T-008: Container with many children skips text extraction
  it('skips text extraction for containers with >2 children', () => {
    const el = document.createElement('div');
    el.innerHTML = '<span>One</span><span>Two</span><span>Three</span>';
    // Add some direct text too, which should be ignored due to >2 children
    el.appendChild(document.createTextNode(' extra text'));
    document.body.appendChild(el);

    // Should fall back past text extraction. No role, no componentName,
    // so it should return the tag name
    expect(getHumanReadableName(el)).toBe('div');
  });

  // Additional edge cases

  it('returns aria-label over textContent when both present', () => {
    const el = document.createElement('button');
    el.setAttribute('aria-label', 'Close dialog');
    el.textContent = 'X';
    document.body.appendChild(el);

    expect(getHumanReadableName(el)).toBe('Close dialog');
  });

  it('returns tag.className when element has a class but no other info', () => {
    const el = document.createElement('div');
    el.className = 'hero-section highlight';
    document.body.appendChild(el);

    expect(getHumanReadableName(el)).toBe('div.hero-section');
  });

  it('never returns an empty string', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const result = getHumanReadableName(el);
    expect(result.length).toBeGreaterThan(0);
  });

  it('skips componentName "Unknown"', () => {
    const el = document.createElement('span');
    document.body.appendChild(el);

    expect(getHumanReadableName(el, 'Unknown')).toBe('span');
  });

  it('trims whitespace from aria-label', () => {
    const el = document.createElement('button');
    el.setAttribute('aria-label', '  Save changes  ');
    document.body.appendChild(el);

    expect(getHumanReadableName(el)).toBe('Save changes');
  });

  it('handles aria-labelledby with missing target element', () => {
    const el = document.createElement('input');
    el.setAttribute('aria-labelledby', 'nonexistent-id');
    document.body.appendChild(el);

    // Falls through to later steps; input with no text/role/component -> tag name
    expect(getHumanReadableName(el)).toBe('input');
  });

  it('handles container with exactly 2 children - extracts direct text', () => {
    const el = document.createElement('div');
    el.innerHTML = '<span>A</span><span>B</span>';
    el.insertBefore(document.createTextNode('Hello'), el.firstChild);
    document.body.appendChild(el);

    expect(getHumanReadableName(el)).toBe('Hello');
  });

  it('uses role fallback for container with >2 children', () => {
    const el = document.createElement('nav');
    el.setAttribute('role', 'navigation');
    el.innerHTML = '<a>Home</a><a>About</a><a>Contact</a>';
    document.body.appendChild(el);

    expect(getHumanReadableName(el)).toBe('Navigation');
  });
});
