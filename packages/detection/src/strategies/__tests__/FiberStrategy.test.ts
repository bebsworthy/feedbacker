import { FiberStrategy } from '../FiberStrategy';

/**
 * Helper: attach a fake React fiber to a DOM element so getReactFiber() finds it.
 */
function attachFiber(element: HTMLElement, fiber: Record<string, unknown>): void {
  (element as any)['__reactFiber$testkey'] = fiber;
}

/**
 * Helper: create a function with a specific name (function.name is read-only,
 * so we use Object.defineProperty).
 */
function namedFn(name: string, displayName?: string): () => null {
  const fn = () => null;
  Object.defineProperty(fn, 'name', { value: name, configurable: true });
  if (displayName) {
    (fn as any).displayName = displayName;
  }
  return fn;
}

/**
 * Helper: build a minimal fiber node that represents a function component.
 */
function makeFiber(
  name: string | null,
  opts: {
    displayName?: string;
    parent?: Record<string, unknown>;
    props?: Record<string, unknown>;
  } = {}
): Record<string, unknown> {
  return {
    type: name !== null ? namedFn(name, opts.displayName) : null,
    return: opts.parent ?? null,
    memoizedProps: opts.props ?? {},
  };
}

describe('FiberStrategy', () => {
  let strategy: FiberStrategy;

  beforeEach(() => {
    strategy = new FiberStrategy();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  // -- detect() basics -------------------------------------------------------

  it('returns null when the element has no React fiber attached', () => {
    // Protects against: false positives on plain DOM elements without React
    const el = document.createElement('div');
    document.body.appendChild(el);

    const result = strategy.handle(el);
    expect(result).toBeNull();
  });

  it('extracts component name from fiber type displayName', () => {
    // Protects against: regression where displayName is ignored in favor of name
    const fiber = makeFiber('Btn', { displayName: 'PrimaryButton' });
    const el = document.createElement('button');
    document.body.appendChild(el);
    attachFiber(el, fiber);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('PrimaryButton');
    expect(result!.element).toBe(el);
  });

  it('extracts component name from fiber type function name when no displayName', () => {
    // Protects against: failure to fall back to function.name
    const fiber = makeFiber('UserCard');
    const el = document.createElement('div');
    document.body.appendChild(el);
    attachFiber(el, fiber);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('UserCard');
  });

  // -- buildHybridPath -------------------------------------------------------

  it('builds a hybrid path containing both component name and DOM tag', () => {
    // Protects against: path missing DOM context or component context
    const fiber = makeFiber('DashboardPanel');
    const el = document.createElement('section');
    document.body.appendChild(el);
    attachFiber(el, fiber);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.path).toContain('DashboardPanel');
    expect(result!.path.some((s) => s.startsWith('section'))).toBe(true);
  });

  // -- getComponentNameFromFiber walk ----------------------------------------

  it('walks up to 20 hops to find a valid component name', () => {
    // Protects against: premature termination of fiber tree walk
    // Build a chain of 15 anonymous fibers then a named one
    let top: Record<string, unknown> = makeFiber('RootLayout');
    for (let i = 0; i < 15; i++) {
      // Each intermediate fiber has no function type (null type => skipped)
      top = { type: null, return: top, memoizedProps: {} };
    }

    const el = document.createElement('div');
    document.body.appendChild(el);
    attachFiber(el, top);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('RootLayout');
  });

  // -- Skips wrapper components ----------------------------------------------

  it('skips wrapper components (Provider, Context, Fragment, Suspense) when naming', () => {
    // Protects against: internal wrapper names leaking as the detected component
    const realComponent = makeFiber('TodoList');
    const suspenseWrapper = makeFiber('Suspense', { parent: realComponent });
    const providerWrapper = makeFiber('Provider', { parent: suspenseWrapper });
    const contextWrapper = makeFiber('AppContext', { parent: providerWrapper });

    // The element's direct fiber is a div (string type) whose return chain is wrappers
    const divFiber: Record<string, unknown> = {
      type: 'div',
      return: contextWrapper,
      memoizedProps: {},
    };

    const el = document.createElement('div');
    document.body.appendChild(el);
    attachFiber(el, divFiber);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('TodoList');
    // Ensure none of the wrapper names ended up as the component name
    expect(result!.name).not.toBe('Suspense');
    expect(result!.name).not.toBe('Provider');
  });

  // -- handleSpecialReactTypes -----------------------------------------------

  it('detects forwardRef components and formats the name', () => {
    // Protects against: forwardRef components showing as unnamed or generic
    const renderFn = namedFn('FancyInput');
    (renderFn as any).displayName = 'FancyInput';
    const fiber: Record<string, unknown> = {
      type: {
        $$typeof: Symbol.for('react.forward_ref'),
        render: renderFn,
      },
      return: null,
      memoizedProps: {},
    };

    const el = document.createElement('input');
    document.body.appendChild(el);
    attachFiber(el, fiber);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    // ForwardRef(FancyInput) after sanitization loses parens
    expect(result!.name).toBe('ForwardRefFancyInput');
  });

  it('detects memo components and formats the name', () => {
    // Protects against: React.memo wrapped components losing their identity
    const innerFn = namedFn('ExpensiveList');
    const fiber: Record<string, unknown> = {
      type: {
        $$typeof: Symbol.for('react.memo'),
        type: innerFn,
      },
      return: null,
      memoizedProps: {},
    };

    const el = document.createElement('ul');
    document.body.appendChild(el);
    attachFiber(el, fiber);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('MemoExpensiveList');
  });

  it('detects React.lazy components', () => {
    // Protects against: lazy-loaded components not being identified at all
    const fiber: Record<string, unknown> = {
      type: {
        $$typeof: Symbol.for('react.lazy'),
      },
      return: null,
      memoizedProps: {},
    };

    const el = document.createElement('div');
    document.body.appendChild(el);
    attachFiber(el, fiber);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Lazy');
  });

  // -- Circular reference protection -----------------------------------------

  it('does not infinite-loop on circular fiber references', () => {
    // Protects against: stack overflow or hang when fibers form a cycle
    const fiberA: Record<string, unknown> = {
      type: 'div',
      return: null,
      memoizedProps: {},
    };
    const fiberB: Record<string, unknown> = {
      type: 'span',
      return: fiberA,
      memoizedProps: {},
    };
    // Create cycle: A -> B -> A
    fiberA.return = fiberB;

    const el = document.createElement('div');
    document.body.appendChild(el);
    attachFiber(el, fiberA);

    // Should terminate due to maxIterations guard, not hang
    const result = strategy.handle(el);
    // Result is either null or a fallback -- the important thing is it finishes
    expect(result === null || typeof result!.name === 'string').toBe(true);
  });

  // -- Props extraction ------------------------------------------------------

  it('includes memoizedProps in the result, excluding children', () => {
    // Protects against: props leaking children or dangerouslySetInnerHTML
    const fiber = makeFiber('Card', {
      props: {
        title: 'Hello',
        variant: 'primary',
        children: '<should be removed>',
        dangerouslySetInnerHTML: { __html: '<b>xss</b>' },
      },
    });

    const el = document.createElement('div');
    document.body.appendChild(el);
    attachFiber(el, fiber);

    const result = strategy.handle(el);
    expect(result).not.toBeNull();
    expect(result!.props).toBeDefined();
    expect(result!.props!.title).toBe('Hello');
    expect(result!.props!.variant).toBe('primary');
    expect(result!.props!.children).toBeUndefined();
    expect(result!.props!.dangerouslySetInnerHTML).toBeUndefined();
  });

  // -- Error resilience ------------------------------------------------------

  it('returns null when fiber access throws an error', () => {
    // Protects against: unhandled exceptions crashing the detection pipeline
    const el = document.createElement('div');
    document.body.appendChild(el);

    // Attach a fiber that throws when type is accessed
    const explosiveFiber = {
      get type(): never {
        throw new Error('fiber corrupted');
      },
      return: null,
      memoizedProps: {},
    };
    (el as any)['__reactFiber$testkey'] = explosiveFiber;

    const result = strategy.handle(el);
    expect(result).toBeNull();
  });
});
