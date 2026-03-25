import { LocalStorageManager } from '../StorageManager';
import type { Feedback, Draft, FeedbackStore } from '../../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../utils/logger', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  __esModule: true
}));

jest.mock('../migrations', () => ({
  migrateData: jest.fn().mockResolvedValue(null)
}));

jest.mock('../../utils/validation', () => ({
  validateStorageData: jest.fn().mockReturnValue(true)
}));

jest.mock('../../utils/sanitize', () => ({
  sanitizeFeedback: jest.fn((f: Feedback) => f),
  sanitizeDraft: jest.fn((d: Draft) => d)
}));

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------

function createMockStorage() {
  const store: Record<string, string> = {};

  // Use a Proxy so that `for (key in localStorage)` and `localStorage[key]`
  // work the same way as the real Storage object.
  const handler: ProxyHandler<Record<string, any>> = {
    ownKeys() {
      return Object.keys(store);
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (typeof prop === 'string' && prop in store) {
        return { configurable: true, enumerable: true, value: store[prop] };
      }
      return undefined;
    },
    get(_target, prop) {
      // Expose built-in methods / properties first
      if (prop === 'getItem') {
        return mock.getItem;
      }
      if (prop === 'setItem') {
        return mock.setItem;
      }
      if (prop === 'removeItem') {
        return mock.removeItem;
      }
      if (prop === 'clear') {
        return mock.clear;
      }
      if (prop === 'key') {
        return mock.key;
      }
      if (prop === 'length') {
        return Object.keys(store).length;
      }
      if (prop === '_store') {
        return store;
      }
      // Fall through to stored values (needed for getStorageInfo iteration)
      if (typeof prop === 'string' && prop in store) {
        return store[prop];
      }
      return undefined;
    },
    has(_target, prop) {
      return typeof prop === 'string' && prop in store;
    }
  };

  const mock = {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    }),
    key: jest.fn((i: number) => Object.keys(store)[i] ?? null),
    _store: store
  };

  return new Proxy({}, handler) as typeof mock;
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

let feedbackCounter = 0;

function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  feedbackCounter += 1;
  return {
    id: `fb-${feedbackCounter}`,
    componentName: 'Button',
    componentPath: ['App', 'Layout', 'Button'],
    comment: 'Looks good',
    url: 'https://example.com',
    timestamp: new Date(Date.now() - feedbackCounter * 1000).toISOString(),
    browserInfo: {
      userAgent: 'TestAgent',
      viewport: { width: 1024, height: 768 },
      platform: 'TestPlatform'
    },
    ...overrides
  };
}

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    componentInfo: {
      name: 'Card',
      path: ['App', 'Card'],
      element: document.createElement('div')
    },
    comment: 'Draft comment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LocalStorageManager', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    feedbackCounter = 0;
    mockStorage = createMockStorage();
    Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true });
  });

  // ---- save + getAll -------------------------------------------------------

  test('save persists a feedback item that getAll returns', async () => {
    // Protects against: feedback silently dropped during save/load round-trip
    const mgr = new LocalStorageManager();
    const fb = makeFeedback({ id: 'abc', comment: 'Hello' });

    await mgr.save(fb);
    const all = await mgr.getAll();

    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('abc');
    expect(all[0].comment).toBe('Hello');
  });

  // ---- ordering -----------------------------------------------------------

  test('save inserts newest feedback at position 0', async () => {
    // Protects against: new feedback appended to the end instead of prepended
    const mgr = new LocalStorageManager();
    const first = makeFeedback({ id: 'first' });
    const second = makeFeedback({ id: 'second' });

    await mgr.save(first);
    await mgr.save(second);
    const all = await mgr.getAll();

    expect(all[0].id).toBe('second');
    expect(all[1].id).toBe('first');
  });

  // ---- deduplication ------------------------------------------------------

  test('save with existing ID updates in-place instead of duplicating', async () => {
    // Protects against: duplicate entries when re-saving feedback with the same ID
    const mgr = new LocalStorageManager();
    const fb = makeFeedback({ id: 'dup', comment: 'original' });
    await mgr.save(fb);

    const updated = { ...fb, comment: 'updated' };
    await mgr.save(updated);
    const all = await mgr.getAll();

    expect(all).toHaveLength(1);
    expect(all[0].comment).toBe('updated');
  });

  // ---- cap ----------------------------------------------------------------

  test('save enforces MAX_FEEDBACKS limit of 100', async () => {
    // Protects against: unbounded growth in localStorage causing quota errors
    const mgr = new LocalStorageManager();

    // Seed store with 100 items directly to avoid 100 sequential saves
    const seedFeedbacks = Array.from({ length: 100 }, (_, i) => makeFeedback({ id: `seed-${i}` }));
    const seedStore: FeedbackStore = {
      version: '1.0.0',
      feedbacks: seedFeedbacks,
      draft: undefined,
      settings: {}
    };
    mockStorage.setItem('feedbacker', JSON.stringify(seedStore));

    // Save one more
    await mgr.save(makeFeedback({ id: 'overflow' }));
    const all = await mgr.getAll();

    expect(all).toHaveLength(100);
    expect(all[0].id).toBe('overflow');
    // The last seed item should have been trimmed
    expect(all.find((f) => f.id === 'seed-99')).toBeUndefined();
  });

  // ---- draft round-trip ---------------------------------------------------

  test('saveDraft + getDraft round-trips draft data', async () => {
    // Protects against: draft data lost or corrupted during storage round-trip
    const mgr = new LocalStorageManager();
    const draft = makeDraft({ comment: 'WIP note' });

    await mgr.saveDraft(draft);
    const result = await mgr.getDraft();

    expect(result).not.toBeNull();
    expect(result!.comment).toBe('WIP note');
  });

  // ---- save clears draft --------------------------------------------------

  test('save clears any existing draft', async () => {
    // Protects against: stale draft persisting after feedback submission
    const mgr = new LocalStorageManager();
    await mgr.saveDraft(makeDraft());
    await mgr.save(makeFeedback());

    const draft = await mgr.getDraft();
    expect(draft).toBeNull();
  });

  // ---- getDraft returns null when empty -----------------------------------

  test('getDraft returns null when no draft exists', async () => {
    // Protects against: getDraft returning undefined instead of null contract
    const mgr = new LocalStorageManager();
    const draft = await mgr.getDraft();
    expect(draft).toBeNull();
  });

  // ---- delete -------------------------------------------------------------

  test('delete removes feedback by ID', async () => {
    // Protects against: delete not actually filtering the correct item
    const mgr = new LocalStorageManager();
    await mgr.save(makeFeedback({ id: 'keep' }));
    await mgr.save(makeFeedback({ id: 'remove' }));

    await mgr.delete('remove');
    const all = await mgr.getAll();

    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('keep');
  });

  test('delete with non-existent ID does not throw', async () => {
    // Protects against: crash when deleting an already-removed or unknown ID
    const mgr = new LocalStorageManager();
    await mgr.save(makeFeedback({ id: 'only' }));

    await expect(mgr.delete('ghost')).resolves.toBeUndefined();

    const all = await mgr.getAll();
    expect(all).toHaveLength(1);
  });

  // ---- clear --------------------------------------------------------------

  test('clear removes all feedback', async () => {
    // Protects against: clear leaving orphan feedback entries
    const mgr = new LocalStorageManager();
    await mgr.save(makeFeedback({ id: 'a' }));
    await mgr.save(makeFeedback({ id: 'b' }));

    await mgr.clear();
    const all = await mgr.getAll();

    expect(all).toHaveLength(0);
  });

  // ---- corrupted JSON recovery --------------------------------------------

  test('getAll returns empty array when localStorage contains corrupted JSON', async () => {
    // Protects against: JSON.parse crash surfacing to the caller
    const mgr = new LocalStorageManager();
    mockStorage._store['feedbacker'] = '{not valid json!!!';

    const all = await mgr.getAll();
    expect(all).toEqual([]);
  });

  // ---- QuotaExceededError fallback ----------------------------------------

  test('save does not throw on QuotaExceededError, falls back to memory', async () => {
    // Protects against: app crash when device storage is full
    const mgr = new LocalStorageManager();
    // First save to seed a valid store
    await mgr.save(makeFeedback({ id: 'pre' }));

    // Now make setItem throw QuotaExceededError
    const quotaError = new DOMException('quota exceeded', 'QuotaExceededError');
    mockStorage.setItem.mockImplementation(() => {
      throw quotaError;
    });

    const fb = makeFeedback({ id: 'quota' });
    await expect(mgr.save(fb)).resolves.toBeUndefined();

    // Subsequent reads should use memory fallback
    const all = await mgr.getAll();
    expect(all.some((f) => f.id === 'quota')).toBe(true);
  });

  // ---- getStorageInfo -----------------------------------------------------

  test('getStorageInfo returns valid metrics with correct shape', async () => {
    // Protects against: getStorageInfo returning NaN or negative values
    const mgr = new LocalStorageManager();
    await mgr.save(makeFeedback());

    const info = mgr.getStorageInfo();

    expect(info.used).toBeGreaterThanOrEqual(0);
    expect(info.limit).toBe(5 * 1024 * 1024);
    expect(info.available).toBeGreaterThanOrEqual(0);
    expect(info.percentage).toBeGreaterThanOrEqual(0);
    expect(info.percentage).toBeLessThanOrEqual(100);
    expect(info.used + info.available).toBe(info.limit);
  });

  // ---- custom storage key -------------------------------------------------

  test('constructor accepts a custom storage key', async () => {
    // Protects against: multiple widget instances colliding on the same key
    const mgr = new LocalStorageManager('custom-key');
    await mgr.save(makeFeedback({ id: 'custom' }));

    expect(mockStorage._store['custom-key']).toBeDefined();
    expect(mockStorage._store['feedbacker']).toBeUndefined();
  });

  // ---- memory fallback on unavailable localStorage ------------------------

  test('falls back to in-memory storage when localStorage is unavailable', async () => {
    // Protects against: total failure in environments without localStorage (e.g., SSR)
    mockStorage.setItem.mockImplementation(() => {
      throw new Error('localStorage disabled');
    });
    mockStorage.removeItem.mockImplementation(() => {
      throw new Error('localStorage disabled');
    });

    const mgr = new LocalStorageManager('mem-test');

    // The constructor test write triggers fallback — save should still work
    const fb = makeFeedback({ id: 'mem-1' });
    await mgr.save(fb);
    const all = await mgr.getAll();

    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('mem-1');
  });
});
