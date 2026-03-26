/**
 * Detection Bridge — runs in the page's MAIN world JS context
 * Provides React fiber access that content scripts can't reach
 * Communicates results back via window.postMessage
 */

const PREFIX = 'feedbacker-detection';

/**
 * Try to detect React component info from a DOM element
 * This runs in the page's JS context where __reactFiber$ keys are accessible
 */
function detectFromFiber(element: HTMLElement): { name: string; path: string[] } | null {
  try {
    // Find React fiber key on the element
    const fiberKey = Object.keys(element).find(
      (key) => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
    );

    if (!fiberKey) return null;

    const fiber = (element as any)[fiberKey];
    if (!fiber) return null;

    // Walk up the fiber tree to find the component name
    let current = fiber;
    const path: string[] = [];
    let name = 'Unknown';

    while (current) {
      const type = current.type;
      if (type) {
        let componentName: string | null = null;

        if (typeof type === 'string') {
          // HTML element — skip
        } else if (typeof type === 'function') {
          componentName = type.displayName || type.name || null;
        } else if (typeof type === 'object' && type !== null) {
          // Memo, forwardRef, etc.
          if (type.displayName) {
            componentName = type.displayName;
          } else if (type.render?.displayName || type.render?.name) {
            componentName = type.render.displayName || type.render.name;
          }
        }

        if (componentName && !isWrapperComponent(componentName)) {
          if (name === 'Unknown') {
            name = componentName;
          }
          path.push(componentName);
        }
      }

      current = current.return;
      if (path.length >= 10) break; // Safety limit
    }

    if (name === 'Unknown') return null;

    return { name, path: path.reverse() };
  } catch {
    return null;
  }
}

function isWrapperComponent(name: string): boolean {
  const wrappers = [
    'Provider', 'Consumer', 'Context', 'Fragment',
    'Suspense', 'StrictMode', 'Profiler',
    'ErrorBoundary', 'ForwardRef'
  ];
  return wrappers.some((w) => name.includes(w));
}

/**
 * Listen for detection requests from the content script
 */
window.addEventListener('message', (e) => {
  if (e.data?.type === `${PREFIX}:detect` && e.data.selector) {
    try {
      const element = document.querySelector(e.data.selector) as HTMLElement;
      if (!element) return;

      const result = detectFromFiber(element);
      window.postMessage({
        type: `${PREFIX}:result`,
        componentInfo: result,
        requestId: e.data.requestId
      }, '*');
    } catch {
      // Silently fail — content script will use fallback detection
    }
  }
});

// Signal that the bridge is loaded
window.postMessage({ type: `${PREFIX}:ready` }, '*');
