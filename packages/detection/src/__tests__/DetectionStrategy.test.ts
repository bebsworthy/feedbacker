import { DetectionStrategy, DetectionChain } from '../DetectionStrategy';
import { ComponentInfo } from '../types';

/**
 * Concrete test subclass of the abstract DetectionStrategy.
 * Returns a configurable result from detect().
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

  // Expose protected helpers for testing
  public exposedBuildComponentPath(fiber: any): string[] {
    return this.buildComponentPath(fiber);
  }

  public exposedBuildHybridPath(element: HTMLElement, fiber: any): string[] {
    return this.buildHybridPath(element, fiber);
  }

  public exposedGetReactFiber(element: HTMLElement): any {
    return this.getReactFiber(element);
  }

  public exposedSanitizeComponentName(name: string): string {
    return this.sanitizeComponentName(name);
  }

  public exposedExtractProps(fiber: any): Record<string, any> | undefined {
    return this.extractProps(fiber);
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

  // -- buildComponentPath ---------------------------------------------------

  it('buildComponentPath returns ["Component"] when given null fiber', () => {
    const strategy = new TestStrategy(null);
    const path = strategy.exposedBuildComponentPath(null);
    expect(path).toEqual(['Component']);
  });

  it('buildComponentPath filters out wrapper components', () => {
    const strategy = new TestStrategy(null);
    // Build a minimal fake fiber chain: Provider -> MyPage
    const myPageType = function () {};
    myPageType.displayName = 'MyPage';
    const providerType = function () {};
    providerType.displayName = 'Provider';
    const myPageFiber = {
      type: myPageType,
      return: {
        type: providerType,
        return: null,
      },
    };

    const path = strategy.exposedBuildComponentPath(myPageFiber);
    expect(path).toContain('MyPage');
    expect(path).not.toContain('Provider');
  });

  // -- buildHybridPath (depth guard regression) -----------------------------

  it('buildHybridPath terminates with deeply nested plain DOM elements (30+ levels)', () => {
    const strategy = new TestStrategy(null);

    // Build a 50-level deep DOM tree
    let deepest: HTMLElement = document.createElement('div');
    let current = deepest;
    for (let i = 0; i < 50; i++) {
      const parent = document.createElement('div');
      parent.appendChild(current);
      current = parent;
    }
    document.body.appendChild(current);

    // Should not hang; the depth guard limits traversal
    const path = strategy.exposedBuildHybridPath(deepest, null);
    expect(Array.isArray(path)).toBe(true);
    // maxDomDepth is 30, so the path length should be capped
    expect(path.length).toBeLessThanOrEqual(35);

    document.body.removeChild(current);
  });

  // -- getReactFiber --------------------------------------------------------

  it('getReactFiber returns null for plain DOM elements', () => {
    const strategy = new TestStrategy(null);
    const div = document.createElement('div');
    expect(strategy.exposedGetReactFiber(div)).toBeNull();
  });

  // -- sanitizeComponentName ------------------------------------------------

  it('sanitizeComponentName strips special characters', () => {
    const strategy = new TestStrategy(null);
    expect(strategy.exposedSanitizeComponentName('My<Component>')).toBe('MyComponent');
    expect(strategy.exposedSanitizeComponentName('Foo.Bar/Baz')).toBe('FooBarBaz');
  });

  it('sanitizeComponentName truncates at 100 characters', () => {
    const strategy = new TestStrategy(null);
    const longName = 'A'.repeat(150);
    const result = strategy.exposedSanitizeComponentName(longName);
    expect(result.length).toBe(100);
  });

  // -- extractProps ---------------------------------------------------------

  it('extractProps removes children and dangerouslySetInnerHTML', () => {
    const strategy = new TestStrategy(null);
    const fiber = {
      memoizedProps: {
        className: 'btn',
        children: '<span>hi</span>',
        dangerouslySetInnerHTML: { __html: '<b>no</b>' },
      },
    };
    const props = strategy.exposedExtractProps(fiber);
    expect(props).toBeDefined();
    expect(props!.className).toBe('btn');
    expect(props!.children).toBeUndefined();
    expect(props!.dangerouslySetInnerHTML).toBeUndefined();
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
