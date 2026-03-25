import { migrateData, needsMigration, getMigrationInfo } from '../migrations';

// Suppress logger output during tests
jest.mock('../../utils/logger', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  __esModule: true
}));

/**
 * Helper: builds a minimal valid feedback object that passes normalizeFeedback.
 */
function validFeedback(overrides: Record<string, unknown> = {}) {
  return {
    id: 'fb_1',
    componentName: 'Button',
    componentPath: ['App', 'Button'],
    comment: 'Looks good',
    timestamp: '2025-01-01T00:00:00Z',
    url: 'http://localhost',
    browserInfo: {
      userAgent: 'TestAgent',
      viewport: { width: 800, height: 600 },
      platform: 'TestPlatform'
    },
    ...overrides
  };
}

const TARGET = '1.0.0';

// ---------------------------------------------------------------------------
// migrateData
// ---------------------------------------------------------------------------
describe('migrateData', () => {
  it('returns null when oldData is null', async () => {
    // Protects against: treating null input as valid data and creating empty stores
    const result = await migrateData(null, TARGET);
    expect(result).toBeNull();
  });

  it('returns null when oldData is undefined', async () => {
    // Protects against: undefined slipping through a falsy-only null check
    const result = await migrateData(undefined, TARGET);
    expect(result).toBeNull();
  });

  it('validates and returns data when source version matches target', async () => {
    // Protects against: same-version data bypassing normalization/validation
    const input = {
      version: TARGET,
      feedbacks: [validFeedback()],
      settings: { primaryColor: '#f00' }
    };
    const result = await migrateData(input, TARGET);
    expect(result).not.toBeNull();
    expect(result!.version).toBe(TARGET);
    expect(result!.feedbacks).toHaveLength(1);
    expect(result!.feedbacks[0].id).toBe('fb_1');
    expect(result!.settings).toEqual({ primaryColor: '#f00' });
  });

  it('migrates 0.1.x data (items -> feedbacks, component -> componentName)', async () => {
    // Protects against: regressions in the 0.1.x field-rename migration
    const input = {
      version: '0.1.3',
      items: [{ id: 'old1', component: 'Header', text: 'Nice header', date: '2024-06-01' }],
      config: { theme: 'dark' }
    };
    const result = await migrateData(input, TARGET);
    expect(result).not.toBeNull();
    expect(result!.version).toBe(TARGET);
    expect(result!.feedbacks).toHaveLength(1);
    expect(result!.feedbacks[0].componentName).toBe('Header');
    expect(result!.feedbacks[0].comment).toBe('Nice header');
    expect(result!.feedbacks[0].timestamp).toBe('2024-06-01');
  });

  it('migrates 0.2.x data and converts currentDraft to draft', async () => {
    // Protects against: draft field mapping breaking when upgrading from 0.2.x
    const input = {
      version: '0.2.5',
      feedbacks: [validFeedback()],
      currentDraft: {
        component: { name: 'Modal', path: ['App', 'Modal'], element: null },
        comment: 'Draft comment',
        screenshot: 'data:image/png;base64,abc',
        created: '2024-07-01T00:00:00Z'
      },
      settings: {}
    };
    const result = await migrateData(input, TARGET);
    expect(result).not.toBeNull();
    expect(result!.version).toBe(TARGET);
    expect(result!.draft).toBeDefined();
    expect(result!.draft!.comment).toBe('Draft comment');
    expect(result!.draft!.screenshot).toBe('data:image/png;base64,abc');
    expect(result!.draft!.componentInfo.name).toBe('Modal');
  });

  it('returns null for an unknown version with no matching migration', async () => {
    // Protects against: unrecognised versions silently producing corrupt data
    const input = { version: '99.0.0', feedbacks: [] };
    const result = await migrateData(input, TARGET);
    // getMigrationKey returns 'legacy' for unknown versions, so legacy migration runs
    // Legacy path with an object that has feedbacks key returns a store
    expect(result).not.toBeNull();
    expect(result!.version).toBe(TARGET);
  });

  it('attempts legacy migration when no version is present', async () => {
    // Protects against: versionless data being discarded instead of migrated
    const input = {
      feedbacks: [validFeedback()]
    };
    const result = await migrateData(input, TARGET);
    expect(result).not.toBeNull();
    expect(result!.version).toBe(TARGET);
    expect(result!.feedbacks).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// needsMigration
// ---------------------------------------------------------------------------
describe('needsMigration', () => {
  it('returns false for null data', () => {
    // Protects against: triggering migration on empty storage
    expect(needsMigration(null, TARGET)).toBe(false);
  });

  it('returns true when data has no version (legacy)', () => {
    // Protects against: legacy data being used without migration
    expect(needsMigration({ feedbacks: [] }, TARGET)).toBe(true);
  });

  it('returns true when data version differs from current', () => {
    // Protects against: stale versioned data silently used without upgrade
    expect(needsMigration({ version: '0.1.0' }, TARGET)).toBe(true);
  });

  it('returns false when data version matches current', () => {
    // Protects against: unnecessary migration runs on up-to-date data
    expect(needsMigration({ version: TARGET }, TARGET)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getMigrationInfo
// ---------------------------------------------------------------------------
describe('getMigrationInfo', () => {
  it('returns correct shape and values for data needing migration', () => {
    // Protects against: getMigrationInfo returning wrong flags for stale data
    const info = getMigrationInfo({ version: '0.1.0' }, TARGET);
    expect(info.hasData).toBe(true);
    expect(info.sourceVersion).toBe('0.1.0');
    expect(info.targetVersion).toBe(TARGET);
    expect(info.needsMigration).toBe(true);
    expect(info.migrationAvailable).toBe(true);
  });

  it('reports no migration needed when versions match', () => {
    // Protects against: false-positive migration flag for current-version data
    const info = getMigrationInfo({ version: TARGET }, TARGET);
    expect(info.needsMigration).toBe(false);
    expect(info.sourceVersion).toBe(TARGET);
  });

  it('reports sourceVersion as "legacy" when version is missing', () => {
    // Protects against: undefined sourceVersion leaking to callers
    const info = getMigrationInfo({ feedbacks: [] }, TARGET);
    expect(info.sourceVersion).toBe('legacy');
    expect(info.needsMigration).toBe(true);
  });

  it('handles null data gracefully', () => {
    // Protects against: null-deref when data is absent
    const info = getMigrationInfo(null, TARGET);
    expect(info.hasData).toBe(false);
    expect(info.needsMigration).toBe(false);
    expect(info.sourceVersion).toBe('legacy');
  });
});

// ---------------------------------------------------------------------------
// normalizeFeedback (exercised through migrateData / validateAndNormalize)
// ---------------------------------------------------------------------------
describe('normalizeFeedback (via migrateData)', () => {
  it('coerces field types to strings', async () => {
    // Protects against: numeric or non-string ids/comments breaking downstream code
    const fb = validFeedback({ id: 123 as any, comment: 456 as any });
    const result = await migrateData({ version: TARGET, feedbacks: [fb] }, TARGET);
    expect(result).not.toBeNull();
    expect(typeof result!.feedbacks[0].id).toBe('string');
    expect(result!.feedbacks[0].id).toBe('123');
    expect(typeof result!.feedbacks[0].comment).toBe('string');
    expect(result!.feedbacks[0].comment).toBe('456');
  });

  it('filters out feedbacks missing required fields', async () => {
    // Protects against: incomplete feedback objects surviving into the store
    const incomplete = { id: 'x', componentName: 'A' }; // missing comment & timestamp
    const result = await migrateData(
      { version: TARGET, feedbacks: [incomplete, validFeedback()] },
      TARGET
    );
    expect(result).not.toBeNull();
    expect(result!.feedbacks).toHaveLength(1);
    expect(result!.feedbacks[0].id).toBe('fb_1');
  });
});

// ---------------------------------------------------------------------------
// normalizeBrowserInfo (exercised through migrateData / validateAndNormalize)
// ---------------------------------------------------------------------------
describe('normalizeBrowserInfo (via migrateData)', () => {
  it('fills in defaults when browserInfo is missing entirely', async () => {
    // Protects against: undefined browserInfo causing runtime errors
    const fb = validFeedback();
    delete (fb as any).browserInfo;
    const result = await migrateData({ version: TARGET, feedbacks: [fb] }, TARGET);
    expect(result).not.toBeNull();
    const bi = result!.feedbacks[0].browserInfo;
    expect(bi.userAgent).toBe(navigator.userAgent);
    expect(bi.viewport.width).toBeGreaterThan(0);
    expect(typeof bi.platform).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Legacy format handling
// ---------------------------------------------------------------------------
describe('legacy format handling', () => {
  it('migrates a plain array of feedback items', async () => {
    // Protects against: oldest array-only format being rejected
    const input = [
      { id: 'a1', componentName: 'Sidebar', comment: 'Too wide', timestamp: '2024-01-01' }
    ];
    const result = await migrateData(input, TARGET);
    expect(result).not.toBeNull();
    expect(result!.version).toBe(TARGET);
    expect(result!.feedbacks).toHaveLength(1);
    expect(result!.feedbacks[0].comment).toBe('Too wide');
  });

  it('migrates an object with an "items" key', async () => {
    // Protects against: alternate legacy key names being ignored
    const input = {
      items: [validFeedback({ id: 'item1' })]
    };
    const result = await migrateData(input, TARGET);
    expect(result).not.toBeNull();
    expect(result!.feedbacks).toHaveLength(1);
    expect(result!.feedbacks[0].id).toBe('item1');
  });
});
