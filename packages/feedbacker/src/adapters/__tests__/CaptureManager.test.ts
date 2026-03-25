import { CaptureManager } from '../CaptureManager';
import type { CaptureAdapter } from '../../types/capture';
import { CaptureLibrary } from '../../types/capture';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../utils/logger', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  __esModule: true
}));

jest.mock('../Html2CanvasAdapter', () => ({
  Html2CanvasAdapter: jest.fn().mockImplementation(() => ({
    name: 'html2canvas',
    isSupported: jest.fn().mockResolvedValue(true),
    capture: jest.fn().mockResolvedValue({
      success: true,
      dataUrl: 'data:image/png;base64,html2canvas-mock',
      metadata: { width: 100, height: 100 }
    }),
    preload: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn()
  }))
}));

jest.mock('../SnapDOMAdapter', () => ({
  SnapDOMAdapter: jest.fn().mockImplementation(() => ({
    name: 'snapdom',
    isSupported: jest.fn().mockResolvedValue(true),
    capture: jest.fn().mockResolvedValue({
      success: true,
      dataUrl: 'data:image/png;base64,snapdom-mock',
      metadata: { width: 200, height: 200 }
    }),
    preload: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn()
  }))
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockAdapter(overrides: Partial<CaptureAdapter> = {}): CaptureAdapter {
  return {
    name: 'mock-adapter',
    isSupported: jest.fn().mockResolvedValue(true),
    capture: jest.fn().mockResolvedValue({
      success: true,
      dataUrl: 'data:image/png;base64,mock',
      metadata: { width: 50, height: 50 }
    }),
    preload: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn(),
    ...overrides
  };
}

function createMockElement(): HTMLElement {
  return document.createElement('div');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CaptureManager', () => {
  beforeEach(() => {
    // Reset singleton between tests so each test gets a fresh instance
    (CaptureManager as any).instance = null;
  });

  // ---- Singleton ----

  it('getInstance() returns the same instance on repeated calls', () => {
    // Protects against: broken singleton pattern returning different instances
    const first = CaptureManager.getInstance();
    const second = CaptureManager.getInstance();

    expect(first).toBe(second);
  });

  // ---- registerAdapter ----

  it('registerAdapter() makes a custom adapter available in getAvailableLibraries()', () => {
    // Protects against: adapter registration not persisting in the factory map
    const manager = CaptureManager.getInstance();
    const mockAdapter = createMockAdapter({ name: 'custom-lib' });

    manager.registerAdapter('custom-lib', () => mockAdapter);

    const libs = manager.getAvailableLibraries();
    expect(libs).toContain('custom-lib');
  });

  it('registerAdapter() with setAsDefault=true changes the default library', async () => {
    // Protects against: setAsDefault flag being ignored during registration
    const manager = CaptureManager.getInstance();
    const mockAdapter = createMockAdapter({ name: 'custom-default' });

    manager.registerAdapter('custom-default', () => mockAdapter, true);

    const element = createMockElement();
    await manager.capture(element);

    expect(mockAdapter.capture).toHaveBeenCalledTimes(1);
  });

  // ---- setDefaultLibrary ----

  it('setDefaultLibrary() throws when library is not registered', () => {
    // Protects against: silently accepting an unregistered library as default
    const manager = CaptureManager.getInstance();

    expect(() => manager.setDefaultLibrary('nonexistent')).toThrow(
      "Capture library 'nonexistent' is not registered"
    );
  });

  it('setDefaultLibrary() changes which adapter is used by capture()', async () => {
    // Protects against: setDefaultLibrary not actually switching the adapter used
    const manager = CaptureManager.getInstance();
    const element = createMockElement();

    manager.setDefaultLibrary(CaptureLibrary.SNAPDOM);
    const result = await manager.capture(element);

    expect(result.success).toBe(true);
    expect(result.metadata?.library).toBe('snapdom');
  });

  // ---- capture ----

  it('capture() returns a successful result with library metadata', async () => {
    // Protects against: capture not enriching result metadata with adapter name
    const manager = CaptureManager.getInstance();
    const element = createMockElement();

    const result = await manager.capture(element);

    expect(result.success).toBe(true);
    expect(result.dataUrl).toBe('data:image/png;base64,html2canvas-mock');
    expect(result.metadata?.library).toBe('html2canvas');
  });

  it('capture() times out after the configured timeout', async () => {
    // Protects against: capture hanging indefinitely when the adapter never resolves
    const manager = CaptureManager.getInstance();
    const neverResolves = createMockAdapter({
      name: 'slow-adapter',
      capture: jest.fn().mockReturnValue(new Promise(() => {})) // never resolves
    });
    manager.registerAdapter('slow', () => neverResolves, true);

    const element = createMockElement();
    // Pass library explicitly so it matches defaultLibrary, skipping fallback
    const result = await manager.capture(element, { timeout: 50, library: 'slow' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Screenshot capture timed out after 50ms');
  }, 10000);

  it('capture() falls back to default library when a non-default adapter fails', async () => {
    // Protects against: failure in a non-default adapter not triggering fallback logic
    const manager = CaptureManager.getInstance();
    const failingAdapter = createMockAdapter({
      name: 'failing',
      isSupported: jest.fn().mockResolvedValue(false)
    });
    manager.registerAdapter('failing', () => failingAdapter);

    const element = createMockElement();
    const result = await manager.capture(element, { library: 'failing' });

    // Should have fallen back to default (html2canvas) and succeeded
    expect(result.success).toBe(true);
  });

  // ---- isLibrarySupported ----

  it('isLibrarySupported() returns false for an unregistered library', async () => {
    // Protects against: returning true for libraries that have no factory
    const manager = CaptureManager.getInstance();

    const supported = await manager.isLibrarySupported('unknown-lib');

    expect(supported).toBe(false);
  });

  it('isLibrarySupported() returns true for a registered and supported adapter', async () => {
    // Protects against: isSupported not being called or its result not propagating
    const manager = CaptureManager.getInstance();

    const supported = await manager.isLibrarySupported(CaptureLibrary.HTML2CANVAS);

    expect(supported).toBe(true);
  });

  // ---- getAvailableLibraries ----

  it('getAvailableLibraries() returns built-in libraries by default', () => {
    // Protects against: built-in adapters not being registered in the constructor
    const manager = CaptureManager.getInstance();

    const libs = manager.getAvailableLibraries();

    expect(libs).toContain(CaptureLibrary.HTML2CANVAS);
    expect(libs).toContain(CaptureLibrary.SNAPDOM);
    expect(libs.length).toBeGreaterThanOrEqual(2);
  });

  // ---- cleanup and reset ----

  it('cleanup() calls cleanup on cached adapters and clears the cache', async () => {
    // Protects against: resource leaks when adapters are not cleaned up properly
    const manager = CaptureManager.getInstance();
    const element = createMockElement();

    // Trigger adapter creation by capturing
    await manager.capture(element);

    // After capture, adapter is cached. Now cleanup.
    manager.cleanup();

    // getCurrentAdapterInfo should return null after cleanup
    expect(manager.getCurrentAdapterInfo()).toBeNull();
  });

  it('reset() restores built-in adapters and clears custom registrations', async () => {
    // Protects against: reset leaving stale custom adapters or losing built-ins
    const manager = CaptureManager.getInstance();
    const custom = createMockAdapter({ name: 'temp' });
    manager.registerAdapter('temp', () => custom);

    expect(manager.getAvailableLibraries()).toContain('temp');

    manager.reset();

    const libsAfterReset = manager.getAvailableLibraries();
    expect(libsAfterReset).not.toContain('temp');
    expect(libsAfterReset).toContain(CaptureLibrary.HTML2CANVAS);
    expect(libsAfterReset).toContain(CaptureLibrary.SNAPDOM);
  });

  // ---- Error handling ----

  it('capture() returns an error result when the default adapter is not supported', async () => {
    // Protects against: unhandled exception when no adapter is available
    const manager = CaptureManager.getInstance();
    const unsupported = createMockAdapter({
      name: 'unsupported',
      isSupported: jest.fn().mockResolvedValue(false)
    });

    // Replace the default library with one that is unsupported
    manager.registerAdapter('unsupported', () => unsupported, true);

    const element = createMockElement();
    const result = await manager.capture(element);

    expect(result.success).toBe(false);
    expect(result.error).toBe('All capture methods failed');
  });
});
