import {
  validateFeedback,
  validateComment,
  validateScreenshot,
  validateFeedbackId,
  validateStorageData,
  isValidFeedback,
  isValidDraft
} from '../validation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validFeedback() {
  return {
    id: 'fb-001',
    componentName: 'Button',
    componentPath: ['App', 'Form', 'Button'],
    comment: 'Looks good',
    url: 'https://example.com/page',
    timestamp: '2026-01-15T10:00:00.000Z',
    browserInfo: {
      userAgent: 'Mozilla/5.0',
      viewport: { width: 1920, height: 1080 },
      platform: 'MacIntel'
    }
  };
}

function validDraft() {
  const el = document.createElement('div');
  return {
    componentInfo: {
      name: 'Button',
      path: ['App', 'Button'],
      element: el
    },
    comment: 'Draft comment',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T11:00:00.000Z'
  };
}

// ---------------------------------------------------------------------------
// validateFeedback
// ---------------------------------------------------------------------------

describe('validateFeedback', () => {
  it('accepts a valid complete feedback object', () => {
    // Protects against: false negatives where valid data is rejected
    const result = validateFeedback(validFeedback());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it.each([
    ['id', { id: undefined }],
    ['componentName', { componentName: undefined }],
    ['comment', { comment: undefined }],
    ['timestamp', { timestamp: undefined }],
    ['url', { url: undefined }]
  ])('rejects feedback missing required field: %s', (_field, override) => {
    // Protects against: accepting incomplete feedback that lacks mandatory data
    const result = validateFeedback({ ...validFeedback(), ...override });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects an invalid timestamp string', () => {
    // Protects against: storing unparseable date strings that break sorting/display
    const result = validateFeedback({ ...validFeedback(), timestamp: 'not-a-date' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Timestamp must be a valid date string');
  });

  it('rejects a malformed URL', () => {
    // Protects against: saving broken URLs that cannot be navigated back to
    const result = validateFeedback({ ...validFeedback(), url: 'not a url' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('URL must be a valid URL format');
  });

  it('rejects a screenshot that is not a data:image/ URL', () => {
    // Protects against: storing arbitrary data strings in the screenshot field
    const result = validateFeedback({
      ...validFeedback(),
      screenshot: 'data:text/plain;base64,abc'
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Screenshot must be a valid data URL');
  });

  it('rejects a non-array componentPath', () => {
    // Protects against: runtime crashes when code iterates over componentPath
    const result = validateFeedback({ ...validFeedback(), componentPath: 'App > Button' as any });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Component path must be an array');
  });

  it('rejects metadata that is not a plain object', () => {
    // Protects against: storing non-serialisable or unexpected metadata shapes
    const result = validateFeedback({ ...validFeedback(), metadata: [1, 2] as any });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Metadata must be an object');
  });
});

// ---------------------------------------------------------------------------
// validateComment
// ---------------------------------------------------------------------------

describe('validateComment', () => {
  it('accepts a valid comment string', () => {
    // Protects against: rejecting normal user input
    const result = validateComment('This is great feedback');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects an empty string', () => {
    // Protects against: submitting blank feedback that has no value
    const result = validateComment('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Comment cannot be empty');
  });

  it('rejects a whitespace-only string', () => {
    // Protects against: bypassing empty check with spaces/tabs
    const result = validateComment('   \t\n  ');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Comment cannot be empty');
  });

  it('rejects a comment longer than 10000 characters', () => {
    // Protects against: denial-of-service via extremely large payloads
    const result = validateComment('a'.repeat(10001));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Comment is too long (maximum 10000 characters)');
  });

  it('rejects a comment containing script tags', () => {
    // Protects against: XSS attacks via inline script injection
    const result = validateComment('Hello <script>alert("xss")</script> world');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Comment contains potentially harmful content');
  });

  it('rejects a comment containing javascript: protocol', () => {
    // Protects against: XSS via javascript: URI scheme injection
    const result = validateComment('Click javascript:alert(1)');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Comment contains potentially harmful content');
  });

  it('rejects a non-string value', () => {
    // Protects against: type confusion when non-string reaches validation
    const result = validateComment(42 as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Comment must be a string');
  });
});

// ---------------------------------------------------------------------------
// validateScreenshot
// ---------------------------------------------------------------------------

describe('validateScreenshot', () => {
  it('accepts a valid PNG data URL', () => {
    // Protects against: rejecting legitimate screenshots
    const result = validateScreenshot('data:image/png;base64,iVBORw0KGgo=');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a data URL exceeding 5 MB', () => {
    // Protects against: localStorage quota exhaustion from oversized images
    const bigPayload = 'data:image/png;base64,' + 'A'.repeat(7 * 1024 * 1024);
    const result = validateScreenshot(bigPayload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Screenshot is too large (maximum 5MB)');
  });

  it('rejects a non-image data URL', () => {
    // Protects against: storing arbitrary non-image data in the screenshot field
    const result = validateScreenshot('data:text/html;base64,abc');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Screenshot must be a data URL with image MIME type');
  });
});

// ---------------------------------------------------------------------------
// validateFeedbackId
// ---------------------------------------------------------------------------

describe('validateFeedbackId', () => {
  it('accepts a valid alphanumeric-hyphen-underscore ID', () => {
    // Protects against: rejecting IDs that follow the expected format
    const result = validateFeedbackId('fb_001-abc');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects an empty ID', () => {
    // Protects against: saving feedback with no identifier, making deletion impossible
    const result = validateFeedbackId('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ID cannot be empty');
  });

  it('rejects an ID containing special characters', () => {
    // Protects against: IDs with chars that break URL routing or storage keys
    const result = validateFeedbackId('id with spaces & symbols!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'ID contains invalid characters (only alphanumeric, hyphens, and underscores allowed)'
    );
  });

  it('rejects an ID longer than 100 characters', () => {
    // Protects against: unbounded key lengths in storage
    const result = validateFeedbackId('a'.repeat(101));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ID is too long (maximum 100 characters)');
  });
});

// ---------------------------------------------------------------------------
// validateStorageData
// ---------------------------------------------------------------------------

describe('validateStorageData', () => {
  it('returns true for a valid storage object', () => {
    // Protects against: rejecting well-formed persisted data on load
    const store = {
      version: '1.0.0',
      feedbacks: [{ id: '1', componentName: 'Btn', comment: 'ok' }]
    };
    expect(validateStorageData(store)).toBe(true);
  });

  it.each([null, undefined, 42, 'string'])('returns false for non-object value: %p', (value) => {
    // Protects against: crashes when localStorage contains corrupted/non-object data
    expect(validateStorageData(value)).toBe(false);
  });

  it('returns false when version is missing', () => {
    // Protects against: loading data from an unknown schema version
    expect(validateStorageData({ feedbacks: [] })).toBe(false);
  });

  it('returns false when feedbacks is not an array', () => {
    // Protects against: iterating over a non-iterable feedbacks field
    expect(validateStorageData({ version: '1', feedbacks: 'none' })).toBe(false);
  });

  it('returns false when a feedback item lacks required fields', () => {
    // Protects against: partial feedback items that cause downstream null errors
    const store = {
      version: '1',
      feedbacks: [{ id: '1' }] // missing componentName and comment
    };
    expect(validateStorageData(store)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidFeedback / isValidDraft (convenience wrappers)
// ---------------------------------------------------------------------------

describe('isValidFeedback', () => {
  it('returns true for valid feedback', () => {
    // Protects against: wrapper not delegating correctly to validateFeedback
    expect(isValidFeedback(validFeedback())).toBe(true);
  });

  it('returns false for invalid feedback', () => {
    // Protects against: wrapper swallowing validation errors
    expect(isValidFeedback({})).toBe(false);
  });
});

describe('isValidDraft', () => {
  it('returns true for a valid draft', () => {
    // Protects against: wrapper not delegating correctly to validateDraft
    expect(isValidDraft(validDraft())).toBe(true);
  });

  it('returns false for an invalid draft', () => {
    // Protects against: wrapper swallowing validation errors
    expect(isValidDraft({})).toBe(false);
  });
});
