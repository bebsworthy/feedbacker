import { DevToolsStrategy } from '../DevToolsStrategy';

// Helper to create a minimal fiber object
function makeFiber(overrides: Record<string, any> = {}): any {
  return {
    type: null,
    stateNode: null,
    memoizedProps: {},
    return: null,
    ...overrides,
  };
}

describe('DevToolsStrategy', () => {
  let strategy: DevToolsStrategy;
  const originalHook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

  afterEach(() => {
    // Restore the original state (undefined in most test environments)
    if (originalHook === undefined) {
      delete (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    } else {
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = originalHook;
    }
  });

  // -- No DevTools available --------------------------------------------------

  // Protects against: strategy crashing or returning a false positive when
  // React DevTools is not installed
  it('returns null when DevTools hook is not available', () => {
    delete (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    strategy = new DevToolsStrategy();

    const el = document.createElement('div');
    const result = strategy.handle(el);

    expect(result).toBeNull();
  });

  // -- findFiberByHostInstance returns null ------------------------------------

  // Protects against: returning a result when the element has no associated
  // React fiber (e.g. a plain DOM node outside a React tree)
  it('returns null when findFiberByHostInstance returns null', () => {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      findFiberByHostInstance: jest.fn().mockReturnValue(null),
    };
    strategy = new DevToolsStrategy();

    const el = document.createElement('div');
    const result = strategy.handle(el);

    expect(result).toBeNull();
  });

  // -- Function component with displayName ------------------------------------

  // Protects against: failing to read displayName from a function component's
  // fiber type, which is the primary identification mechanism
  it('detects a function component via displayName', () => {
    const fiberType = function MyButton() {};
    fiberType.displayName = 'MyButton';

    const fiber = makeFiber({
      type: fiberType,
    });

    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      findFiberByHostInstance: jest.fn().mockReturnValue(fiber),
    };
    strategy = new DevToolsStrategy();

    const el = document.createElement('button');
    const result = strategy.handle(el);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('MyButton');
    expect(result!.element).toBe(el);
  });

  // -- Function component with name (no displayName) -------------------------

  // Protects against: falling through when displayName is absent but the
  // function's .name property is available
  it('detects a function component via function name when displayName is absent', () => {
    function SearchBar() {}

    const fiber = makeFiber({
      type: SearchBar,
    });

    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      findFiberByHostInstance: jest.fn().mockReturnValue(fiber),
    };
    strategy = new DevToolsStrategy();

    const el = document.createElement('div');
    const result = strategy.handle(el);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('SearchBar');
  });

  // -- Class component with stateNode ----------------------------------------

  // Protects against: missing class component detection which relies on
  // stateNode.constructor rather than fiber.type
  it('detects a class component via stateNode constructor', () => {
    class UserProfile {}

    const fiber = makeFiber({
      type: 'div', // class components may have a string type at host level
      stateNode: new UserProfile(),
    });

    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      findFiberByHostInstance: jest.fn().mockReturnValue(fiber),
    };
    strategy = new DevToolsStrategy();

    const el = document.createElement('div');
    const result = strategy.handle(el);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('UserProfile');
  });

  // -- ForwardRef component ---------------------------------------------------

  // Protects against: forwardRef wrappers hiding the inner component name,
  // which uses a different $$typeof / render path
  it('detects a forwardRef component', () => {
    function InnerInput() {}
    InnerInput.displayName = 'FancyInput';

    const fiber = makeFiber({
      type: {
        $$typeof: Symbol.for('react.forward_ref'),
        render: InnerInput,
      },
    });

    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      findFiberByHostInstance: jest.fn().mockReturnValue(fiber),
    };
    strategy = new DevToolsStrategy();

    const el = document.createElement('input');
    const result = strategy.handle(el);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('FancyInput');
  });

  // -- Memo component ---------------------------------------------------------

  // Protects against: React.memo wrapper obscuring the wrapped component name,
  // which lives at fiber.type.type rather than fiber.type
  it('detects a memo component', () => {
    function ExpensiveList() {}

    const fiber = makeFiber({
      type: {
        $$typeof: Symbol.for('react.memo'),
        type: ExpensiveList,
      },
    });

    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      findFiberByHostInstance: jest.fn().mockReturnValue(fiber),
    };
    strategy = new DevToolsStrategy();

    const el = document.createElement('ul');
    const result = strategy.handle(el);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('ExpensiveList');
  });

  // -- Renderer fallback ------------------------------------------------------

  // Protects against: detection silently failing when the top-level
  // findFiberByHostInstance is absent but a renderer provides it
  it('falls back to renderers map when top-level findFiberByHostInstance is missing', () => {
    function Sidebar() {}

    const fiber = makeFiber({ type: Sidebar });

    const rendererMap = new Map();
    rendererMap.set(1, {
      findFiberByHostInstance: jest.fn().mockReturnValue(fiber),
    });

    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      // no findFiberByHostInstance at top level
      renderers: rendererMap,
    };
    strategy = new DevToolsStrategy();

    const el = document.createElement('nav');
    const result = strategy.handle(el);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Sidebar');
  });

  // -- Error resilience: findFiberByHostInstance throws ------------------------

  // Protects against: an exception in the DevTools hook propagating up and
  // crashing the entire detection pipeline
  it('returns null when findFiberByHostInstance throws', () => {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      findFiberByHostInstance: jest.fn().mockImplementation(() => {
        throw new Error('DevTools internal error');
      }),
    };
    strategy = new DevToolsStrategy();

    const el = document.createElement('div');
    const result = strategy.handle(el);

    expect(result).toBeNull();
  });

  // -- Error resilience: fiber with no extractable name -----------------------

  // Protects against: returning a result with an undefined or empty name when
  // the fiber exists but has no readable component name (e.g. an anonymous
  // arrow function with no displayName)
  it('returns null when fiber has no extractable component name', () => {
    // An anonymous arrow function has .name === '' in most engines
    const fiber = makeFiber({
      type: () => null, // anonymous arrow
    });
    // Ensure the anonymous function truly has no name
    Object.defineProperty(fiber.type, 'name', { value: '' });

    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      findFiberByHostInstance: jest.fn().mockReturnValue(fiber),
    };
    strategy = new DevToolsStrategy();

    const el = document.createElement('div');
    const result = strategy.handle(el);

    expect(result).toBeNull();
  });
});
