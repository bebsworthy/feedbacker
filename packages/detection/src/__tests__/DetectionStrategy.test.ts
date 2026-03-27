import { DetectionStrategy, DetectionChain } from '../DetectionStrategy';
import { ComponentInfo } from '../types';

/**
 * Minimal concrete subclass for testing chain-of-responsibility behavior.
 * Does NOT expose protected helpers — those are tested through behavioral
 * assertions on the results returned by handle().
 */
class TestStrategy extends DetectionStrategy {
  private result: ComponentInfo | null;

  constructor(result: ComponentInfo | null = null) {
    super();
    this.result = result;
  }

  protected detect(element: HTMLElement): ComponentInfo | null {
    return this.result;
  }
}

/**
 * Strategy that exercises protected helpers inside detect() and returns
 * their results as part of the ComponentInfo, so tests go through handle().
 */
class HelperExercisingStrategy extends DetectionStrategy {
  private mode:
    | { type: 'buildComponentPath'; fiber: any }
    | { type: 'buildHybridPath'; fiber: any }
    | { type: 'getReactFiber' }
    | { type: 'sanitizeComponentName'; name: string }
    | { type: 'extractProps'; fiber: any };

  constructor(mode: HelperExercisingStrategy['mode']) {
    super();
    this.mode = mode;
  }

  protected detect(element: HTMLElement): ComponentInfo | null {
    switch (this.mode.type) {
      case 'buildComponentPath': {
        const path = this.buildComponentPath(this.mode.fiber);
        return { name: path.join('/'), path, element };
      }
      case 'buildHybridPath': {
        const path = this.buildHybridPath(element, this.mode.fiber);
        return { name: 'hybrid', path, element };
      }
      case 'getReactFiber': {
        const fiber = this.getReactFiber(element);
        if (fiber === null) return null;
        return { name: 'found-fiber', path: [], element };
      }
      case 'sanitizeComponentName': {
        const name = this.sanitizeComponentName(this.mode.name);
        return { name, path: [name], element };
      }
      case 'extractProps': {
        const props = this.extractProps(this.mode.fiber);
        return { name: 'props-test', path: [], element, props };
      }
    }
  }
}

/**
 * A strategy that throws an error when detect() is called.
 */
class ThrowingStrategy extends DetectionStrategy {
  protected detect(_element: HTMLElement): ComponentInfo | null {
    throw new Error('Detection exploded');
  }
}

describe('DetectionStrategy', () => {
  const makeInfo = (name: string): ComponentInfo => ({
    name,
    path: [name],
    element: document.createElement('div'),
  });

  // -- setNext / chaining --------------------------------------------------

  it('setNext() returns the next strategy (for chaining)', () => {
    const a = new TestStrategy(null);
    const b = new TestStrategy(null);
    const returned = a.setNext(b);
    expect(returned).toBe(b);
  });

  // -- handle() -------------------------------------------------------------

  it('handle() returns detect() result when non-null', () => {
    const info = makeInfo('Foo');
    const strategy = new TestStrategy(info);
    const result = strategy.handle(document.createElement('div'));
    expect(result).toBe(info);
  });

  it('handle() delegates to next strategy when detect() returns null', () => {
    const info = makeInfo('Bar');
    const first = new TestStrategy(null);
    const second = new TestStrategy(info);
    first.setNext(second);

    const result = first.handle(document.createElement('div'));
    expect(result).toBe(info);
  });

  it('handle() returns null at end of chain when all strategies return null', () => {
    const a = new TestStrategy(null);
    const b = new TestStrategy(null);
    a.setNext(b);

    const result = a.handle(document.createElement('div'));
    expect(result).toBeNull();
  });

  // -- buildComponentPath (via handle) --------------------------------------

  // Protects against: null fiber producing an empty path
  it('buildComponentPath returns ["Component"] when given null fiber', () => {
    const strategy = new HelperExercisingStrategy({ type: 'buildComponentPath', fiber: null });
    const result = strategy.handle(document.createElement('div'));
    expect(result).not.toBeNull();
    expect(result!.path).toEqual(['Component']);
  });

  // Protects against: wrapper components (Provider, Context) leaking into the path
  it('buildComponentPath filters out wrapper components', () => {
    const myPageType = function () {};
    (myPageType as any).displayName = 'MyPage';
    const providerType = function () {};
    (providerType as any).displayName = 'Provider';
    const fiber = {
      type: myPageType,
      return: { type: providerType, return: null },
    };

    const strategy = new HelperExercisingStrategy({ type: 'buildComponentPath', fiber });
    const result = strategy.handle(document.createElement('div'));
    expect(result).not.toBeNull();
    expect(result!.path).toContain('MyPage');
    expect(result!.path).not.toContain('Provider');
  });

  // -- buildHybridPath (depth guard regression, via handle) -----------------

  // Protects against: infinite loop when detecting deeply nested DOM elements
  it('buildHybridPath terminates with deeply nested plain DOM elements (30+ levels)', () => {
    const strategy = new HelperExercisingStrategy({ type: 'buildHybridPath', fiber: null });

    let deepest: HTMLElement = document.createElement('div');
    let current = deepest;
    for (let i = 0; i < 50; i++) {
      const parent = document.createElement('div');
      parent.appendChild(current);
      current = parent;
    }
    document.body.appendChild(current);

    const result = strategy.handle(deepest);
    expect(result).not.toBeNull();
    expect(Array.isArray(result!.path)).toBe(true);
    expect(result!.path.length).toBeLessThanOrEqual(35);

    document.body.removeChild(current);
  });

  it('buildHybridPath uses buildElementLabel format for all DOM segments', () => {
    const strategy = new HelperExercisingStrategy({ type: 'buildHybridPath', fiber: null });

    const grandparent = document.createElement('section');
    grandparent.setAttribute('aria-label', 'Main content');
    const parent = document.createElement('form');
    parent.className = 'flex gap-4 p-6 signup-form';
    const child = document.createElement('input');
    child.className = 'border-input h-9 w-full rounded-md';
    child.setAttribute('name', 'email');
    grandparent.appendChild(parent);
    parent.appendChild(child);
    document.body.appendChild(grandparent);

    const result = strategy.handle(child);
    expect(result).not.toBeNull();

    // No segment should have Tailwind class explosion
    for (const segment of result!.path) {
      expect(segment.length).toBeLessThan(80);
      expect(segment).not.toContain('border-input');
      expect(segment).not.toContain('rounded-md');
    }

    // Input should have form name
    const inputSeg = result!.path.find((s) => s.startsWith('input'));
    expect(inputSeg).toContain('[email]');

    // Form should pick meaningful class
    const formSeg = result!.path.find((s) => s.startsWith('form'));
    expect(formSeg).toBe('form.signup-form');

    // Section should have aria-label
    const sectionSeg = result!.path.find((s) => s.startsWith('section'));
    expect(sectionSeg).toContain('"Main content"');

    grandparent.remove();
  });

  // -- getReactFiber (via handle) -------------------------------------------

  // Protects against: getReactFiber crashing on plain DOM elements
  it('getReactFiber returns null for plain DOM elements', () => {
    const strategy = new HelperExercisingStrategy({ type: 'getReactFiber' });
    const result = strategy.handle(document.createElement('div'));
    // Returns null because getReactFiber returns null, so detect() returns null
    expect(result).toBeNull();
  });

  // -- sanitizeComponentName (via handle) -----------------------------------

  // Protects against: special characters in component names breaking rendering
  it('sanitizeComponentName strips special characters', () => {
    const strategy = new HelperExercisingStrategy({ type: 'sanitizeComponentName', name: 'My<Component>' });
    const result = strategy.handle(document.createElement('div'));
    expect(result).not.toBeNull();
    expect(result!.name).toBe('MyComponent');
  });

  // Protects against: extremely long component names consuming memory
  it('sanitizeComponentName truncates at 100 characters', () => {
    const strategy = new HelperExercisingStrategy({ type: 'sanitizeComponentName', name: 'A'.repeat(150) });
    const result = strategy.handle(document.createElement('div'));
    expect(result).not.toBeNull();
    expect(result!.name.length).toBe(100);
  });

  // -- extractProps (via handle) --------------------------------------------

  // Protects against: children and dangerouslySetInnerHTML leaking into extracted props
  it('extractProps removes children and dangerouslySetInnerHTML', () => {
    const fiber = {
      memoizedProps: {
        className: 'btn',
        children: '<span>hi</span>',
        dangerouslySetInnerHTML: { __html: '<b>no</b>' },
      },
    };
    const strategy = new HelperExercisingStrategy({ type: 'extractProps', fiber });
    const result = strategy.handle(document.createElement('div'));
    expect(result).not.toBeNull();
    expect(result!.props).toBeDefined();
    expect(result!.props!.className).toBe('btn');
    expect(result!.props!.children).toBeUndefined();
    expect(result!.props!.dangerouslySetInnerHTML).toBeUndefined();
  });
});

describe('DetectionChain', () => {
  const makeInfo = (name: string): ComponentInfo => ({
    name,
    path: [name],
    element: document.createElement('div'),
  });

  it('buildChain links 4 strategies and returns the first', () => {
    const chain = new DetectionChain();
    const s1 = new TestStrategy(null);
    const s2 = new TestStrategy(null);
    const s3 = new TestStrategy(null);
    const s4 = new TestStrategy(makeInfo('Fallback'));

    const first = chain.buildChain(s1, s2, s3, s4);
    expect(first).toBe(s1);

    // Verify the chain works end-to-end: first three return null, fourth returns info
    const result = chain.detectComponent(document.createElement('div'));
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Fallback');
  });

  it('detectComponent throws if chain not built', () => {
    const chain = new DetectionChain();
    expect(() => chain.detectComponent(document.createElement('div'))).toThrow(
      'Detection chain not built'
    );
  });

  it('detectComponent catches errors and returns null', () => {
    const chain = new DetectionChain();
    const throwing = new ThrowingStrategy();
    const s2 = new TestStrategy(null);
    const s3 = new TestStrategy(null);
    const s4 = new TestStrategy(null);

    chain.buildChain(throwing, s2, s3, s4);
    // The throwing strategy throws in detect(), which is called by handle().
    // DetectionChain.detectComponent wraps in try/catch.
    const result = chain.detectComponent(document.createElement('div'));
    expect(result).toBeNull();
  });
});
