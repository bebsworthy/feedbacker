import { MinimizedState } from '../ui/minimized-state';

/**
 * T-025: Discard button meets minimum target size
 * Verifies the discard button has min-width and min-height of at least 24px,
 * and has the correct aria-label for accessibility.
 */
describe('MinimizedState', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  function createMinimizedState() {
    return new MinimizedState(container, {
      componentName: 'TestComponent',
      hasScreenshot: false,
      hasDraft: false,
      onRestore: jest.fn(),
      onDiscard: jest.fn(),
    });
  }

  it('should have min-width of at least 24px on discard button', () => {
    createMinimizedState();
    const discardBtn = container.querySelector('button');
    expect(discardBtn).not.toBeNull();
    expect(discardBtn!.style.minWidth).toBe('24px');
  });

  it('should have min-height of at least 24px on discard button', () => {
    createMinimizedState();
    const discardBtn = container.querySelector('button');
    expect(discardBtn).not.toBeNull();
    expect(discardBtn!.style.minHeight).toBe('24px');
  });

  it('should have aria-label "Discard draft" on discard button', () => {
    createMinimizedState();
    const discardBtn = container.querySelector('button');
    expect(discardBtn).not.toBeNull();
    expect(discardBtn!.getAttribute('aria-label')).toBe('Discard draft');
  });
});
