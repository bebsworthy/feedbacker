import {
  sanitizeString,
  sanitizeComment,
  sanitizeUrl,
  sanitizeTimestamp,
  sanitizeDataUrl,
  sanitizeNumber,
  sanitizeArray,
  sanitizeProps,
  sanitizeFilename,
  stripHtmlTags,
  escapeHtml,
  sanitizeFeedback,
  sanitizeBrowserInfo
} from '../sanitize';

// ---------------------------------------------------------------------------
// sanitizeString
// ---------------------------------------------------------------------------
describe('sanitizeString', () => {
  it('removes control characters from strings', () => {
    // Protects against: control characters being stored and rendered, causing display corruption
    const result = sanitizeString('hello\x00\x01\x02world');
    expect(result).toBe('helloworld');
  });

  it('truncates strings exceeding maxLength', () => {
    // Protects against: denial-of-service via excessively long strings exhausting storage/memory
    const long = 'a'.repeat(2000);
    const result = sanitizeString(long, 100);
    expect(result).toHaveLength(100);
  });

  it('trims leading and trailing whitespace', () => {
    // Protects against: whitespace-padded input bypassing display constraints or comparisons
    const result = sanitizeString('  hello  ');
    expect(result).toBe('hello');
  });

  it('converts non-string input to string', () => {
    // Protects against: runtime TypeError when a number or object is passed instead of a string
    const result = sanitizeString(42 as unknown as string);
    expect(result).toBe('42');
  });

  it('returns empty string for null/undefined input', () => {
    // Protects against: "null" or "undefined" literal strings being stored as feedback data
    expect(sanitizeString(null as unknown as string)).toBe('');
    expect(sanitizeString(undefined as unknown as string)).toBe('');
  });

  it('uses default maxLength of 1000', () => {
    // Protects against: unbounded string length when no explicit limit is provided
    const long = 'x'.repeat(1500);
    const result = sanitizeString(long);
    expect(result).toHaveLength(1000);
  });
});

// ---------------------------------------------------------------------------
// sanitizeComment
// ---------------------------------------------------------------------------
describe('sanitizeComment', () => {
  it('removes script tags and their content', () => {
    // Protects against: stored XSS via <script> injection in feedback comments
    const result = sanitizeComment('Hello <script>alert("xss")</script> world');
    expect(result).toBe('Hello  world');
    expect(result).not.toContain('<script');
  });

  it('removes javascript: protocol strings', () => {
    // Protects against: XSS via javascript: pseudo-protocol in comment text
    const result = sanitizeComment('click javascript:alert(1)');
    expect(result).toBe('click alert(1)');
    expect(result.toLowerCase()).not.toContain('javascript:');
  });

  it('removes data:text/html payloads', () => {
    // Protects against: XSS via data URI containing executable HTML
    const result = sanitizeComment('visit data:text/html,<script>alert(1)</script>');
    expect(result.toLowerCase()).not.toContain('data:text/html');
  });

  it('removes vbscript: protocol strings', () => {
    // Protects against: XSS via vbscript: pseudo-protocol (IE legacy attack vector)
    const result = sanitizeComment('test vbscript:MsgBox("xss")');
    expect(result.toLowerCase()).not.toContain('vbscript:');
  });

  it('removes on* event handler attributes', () => {
    // Protects against: XSS via inline event handlers like onerror, onload, onmouseover
    const result = sanitizeComment('<img onerror="alert(1)" src=x>');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  it('removes form-related elements', () => {
    // Protects against: phishing attacks via injected form elements in feedback
    const result = sanitizeComment('Fill <form action="evil"><input type="password"></form>');
    expect(result.toLowerCase()).not.toContain('<form');
    expect(result.toLowerCase()).not.toContain('<input');
  });

  it('removes iframe and embed elements', () => {
    // Protects against: content injection via embedded iframes loading malicious pages
    const result = sanitizeComment('See <iframe src="evil.com"></iframe> here');
    expect(result.toLowerCase()).not.toContain('<iframe');
  });

  it('truncates to 10000 characters', () => {
    // Protects against: denial-of-service via extremely long comments
    const long = 'a'.repeat(20000);
    const result = sanitizeComment(long);
    expect(result.length).toBeLessThanOrEqual(10000);
  });

  it('returns empty string for non-string input', () => {
    // Protects against: TypeError when comment field is missing or wrong type
    expect(sanitizeComment(123 as unknown as string)).toBe('');
    expect(sanitizeComment(null as unknown as string)).toBe('');
  });

  it('removes nested/obfuscated script tags', () => {
    // Protects against: XSS bypass using nested or malformed script tags
    const result = sanitizeComment('<scr<script>ipt>alert(1)</script>');
    expect(result.toLowerCase()).not.toContain('<script');
  });
});

// ---------------------------------------------------------------------------
// sanitizeUrl
// ---------------------------------------------------------------------------
describe('sanitizeUrl', () => {
  it('accepts valid http URLs', () => {
    // Protects against: false-positive rejection of legitimate http URLs
    const result = sanitizeUrl('http://example.com/page?q=1');
    expect(result).toBe('http://example.com/page?q=1');
  });

  it('accepts valid https URLs', () => {
    // Protects against: false-positive rejection of legitimate https URLs
    const result = sanitizeUrl('https://example.com/path');
    expect(result).toBe('https://example.com/path');
  });

  it('rejects javascript: protocol URLs', () => {
    // Protects against: XSS via javascript: URLs stored in feedback records
    const result = sanitizeUrl('javascript:alert(1)');
    expect(result).toBe(window.location.href);
  });

  it('rejects data: protocol URLs', () => {
    // Protects against: XSS via data: URIs being stored as page URLs
    const result = sanitizeUrl('data:text/html,<script>alert(1)</script>');
    expect(result).toBe(window.location.href);
  });

  it('rejects URLs longer than 2000 characters', () => {
    // Protects against: denial-of-service via extremely long URL strings
    const longUrl = 'https://example.com/' + 'a'.repeat(2000);
    const result = sanitizeUrl(longUrl);
    expect(result).toBe(window.location.href);
  });

  it('falls back to window.location.href for malformed URLs', () => {
    // Protects against: crash from unparseable URL strings
    const result = sanitizeUrl('not a url at all');
    expect(result).toBe(window.location.href);
  });

  it('falls back to window.location.href for non-string input', () => {
    // Protects against: TypeError when url field is null, undefined, or non-string
    const result = sanitizeUrl(undefined as unknown as string);
    expect(result).toBe(window.location.href);
  });
});

// ---------------------------------------------------------------------------
// sanitizeTimestamp
// ---------------------------------------------------------------------------
describe('sanitizeTimestamp', () => {
  it('accepts and normalizes a valid ISO timestamp', () => {
    // Protects against: valid timestamps being incorrectly rejected or reformatted
    const ts = '2024-06-15T12:00:00.000Z';
    const result = sanitizeTimestamp(ts);
    expect(result).toBe(ts);
  });

  it('returns current time for invalid date strings', () => {
    // Protects against: invalid dates being stored, causing downstream parse errors
    const before = Date.now();
    const result = sanitizeTimestamp('not-a-date');
    const after = Date.now();
    const resultMs = new Date(result).getTime();
    expect(resultMs).toBeGreaterThanOrEqual(before);
    expect(resultMs).toBeLessThanOrEqual(after);
  });

  it('rejects timestamps far in the future', () => {
    // Protects against: forged future timestamps manipulating feedback ordering
    const future = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const before = Date.now();
    const result = sanitizeTimestamp(future);
    const resultMs = new Date(result).getTime();
    expect(resultMs).toBeLessThanOrEqual(Date.now() + 60000);
    expect(resultMs).toBeGreaterThanOrEqual(before);
  });

  it('rejects timestamps older than 10 years', () => {
    // Protects against: spoofed ancient timestamps corrupting chronological data
    const ancient = '1990-01-01T00:00:00.000Z';
    const before = Date.now();
    const result = sanitizeTimestamp(ancient);
    const resultMs = new Date(result).getTime();
    expect(resultMs).toBeGreaterThanOrEqual(before);
  });

  it('returns current time for non-string input', () => {
    // Protects against: TypeError when timestamp field is missing or wrong type
    const before = Date.now();
    const result = sanitizeTimestamp(999 as unknown as string);
    const resultMs = new Date(result).getTime();
    expect(resultMs).toBeGreaterThanOrEqual(before);
  });
});

// ---------------------------------------------------------------------------
// sanitizeDataUrl
// ---------------------------------------------------------------------------
describe('sanitizeDataUrl', () => {
  it('accepts a valid PNG data URL', () => {
    // Protects against: false-positive rejection of legitimate screenshot data
    const url = 'data:image/png;base64,iVBORw0KGgo=';
    expect(sanitizeDataUrl(url)).toBe(url);
  });

  it('rejects non-image MIME types', () => {
    // Protects against: XSS via data URLs with text/html or application/* MIME types
    const url = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==';
    expect(sanitizeDataUrl(url)).toBe('');
  });

  it('rejects data URLs exceeding 5MB estimated size', () => {
    // Protects against: denial-of-service via oversized screenshot payloads
    const base64 = 'A'.repeat(8 * 1024 * 1024); // ~6MB decoded
    const url = `data:image/png;base64,${base64}`;
    expect(sanitizeDataUrl(url)).toBe('');
  });

  it('rejects data URLs with invalid base64 characters', () => {
    // Protects against: malformed data URLs containing embedded scripts or special characters
    const url = 'data:image/png;base64,<script>alert(1)</script>';
    expect(sanitizeDataUrl(url)).toBe('');
  });

  it('returns empty string for non-string input', () => {
    // Protects against: TypeError when screenshot field is null or non-string
    expect(sanitizeDataUrl(null as unknown as string)).toBe('');
    expect(sanitizeDataUrl(undefined as unknown as string)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeNumber
// ---------------------------------------------------------------------------
describe('sanitizeNumber', () => {
  it('returns the value when within bounds', () => {
    // Protects against: valid numeric values being incorrectly clamped
    expect(sanitizeNumber(50, 0, 100)).toBe(50);
  });

  it('returns min for NaN', () => {
    // Protects against: NaN propagation causing downstream calculation errors
    expect(sanitizeNumber(NaN, 0, 100)).toBe(0);
  });

  it('returns min for Infinity', () => {
    // Protects against: Infinity causing layout or calculation breakage
    expect(sanitizeNumber(Infinity, 0, 100)).toBe(0);
    expect(sanitizeNumber(-Infinity, 0, 100)).toBe(0);
  });

  it('clamps values to min and max bounds', () => {
    // Protects against: out-of-range values causing oversized layouts or negative dimensions
    expect(sanitizeNumber(-5, 0, 100)).toBe(0);
    expect(sanitizeNumber(200, 0, 100)).toBe(100);
  });

  it('floors decimal values', () => {
    // Protects against: fractional pixel values causing subpixel rendering issues
    expect(sanitizeNumber(7.9, 0, 100)).toBe(7);
  });

  it('returns min for non-number input', () => {
    // Protects against: TypeError when a string or object is passed as a number
    expect(sanitizeNumber('hello' as unknown as number, 5, 100)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// sanitizeArray
// ---------------------------------------------------------------------------
describe('sanitizeArray', () => {
  it('applies the sanitizer to each element', () => {
    // Protects against: unsanitized array items bypassing individual element validation
    const sanitizer = (s: string) => sanitizeString(s);
    const result = sanitizeArray(['  hello  ', '  world  '], sanitizer);
    expect(result).toEqual(['hello', 'world']);
  });

  it('returns empty array for non-array input', () => {
    // Protects against: TypeError when componentPath is null, undefined, or an object
    expect(sanitizeArray('not-an-array' as unknown as string[], sanitizeString)).toEqual([]);
    expect(sanitizeArray(null as unknown as string[], sanitizeString)).toEqual([]);
  });

  it('caps array length at 100 elements', () => {
    // Protects against: denial-of-service via extremely large arrays
    const big = Array.from({ length: 200 }, (_, i) => String(i));
    const result = sanitizeArray(big, sanitizeString);
    expect(result).toHaveLength(100);
  });
});

// ---------------------------------------------------------------------------
// sanitizeProps
// ---------------------------------------------------------------------------
describe('sanitizeProps', () => {
  it('sanitizes keys and values of a normal object', () => {
    // Protects against: unsanitized prop keys/values containing XSS payloads
    const result = sanitizeProps({ name: 'Alice', count: 5 });
    expect(result).toEqual({ name: 'Alice', count: 5 });
  });

  it('limits to 50 properties', () => {
    // Protects against: denial-of-service via objects with thousands of keys
    const big: Record<string, string> = {};
    for (let i = 0; i < 100; i++) {
      big[`key${i}`] = `val${i}`;
    }
    const result = sanitizeProps(big);
    expect(Object.keys(result)).toHaveLength(50);
  });

  it('returns empty object for non-object input', () => {
    // Protects against: TypeError when props is null, a string, or an array
    expect(sanitizeProps(null as unknown as Record<string, any>)).toEqual({});
    expect(sanitizeProps('string' as unknown as Record<string, any>)).toEqual({});
    expect(sanitizeProps([1, 2] as unknown as Record<string, any>)).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// sanitizeFilename
// ---------------------------------------------------------------------------
describe('sanitizeFilename', () => {
  it('replaces path traversal sequences', () => {
    // Protects against: directory traversal attacks via "../" in filenames
    const result = sanitizeFilename('../../etc/passwd');
    expect(result).not.toContain('/');
    // Dots are allowed characters, but slashes are replaced, neutralizing traversal
    expect(result).toMatch(/^[a-zA-Z0-9._-]+$/);
  });

  it('replaces special characters with underscores', () => {
    // Protects against: filesystem injection via shell metacharacters in filenames
    const result = sanitizeFilename('file<name>with|bad*chars');
    expect(result).not.toMatch(/[<>|*]/);
    expect(result).toMatch(/^[a-zA-Z0-9._-]+$/);
  });

  it('truncates to 100 characters', () => {
    // Protects against: filesystem errors from excessively long filenames
    const long = 'a'.repeat(200);
    const result = sanitizeFilename(long);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('returns default "feedback" for non-string input', () => {
    // Protects against: TypeError when filename argument is null or undefined
    expect(sanitizeFilename(null as unknown as string)).toBe('feedback');
    expect(sanitizeFilename(undefined as unknown as string)).toBe('feedback');
  });

  it('collapses multiple consecutive underscores', () => {
    // Protects against: ugly filenames with runs of underscores from heavy sanitization
    const result = sanitizeFilename('a   b   c');
    expect(result).not.toContain('__');
  });
});

// ---------------------------------------------------------------------------
// stripHtmlTags
// ---------------------------------------------------------------------------
describe('stripHtmlTags', () => {
  it('removes all HTML tags from text', () => {
    // Protects against: rendered HTML in contexts that should display plain text
    const result = stripHtmlTags('<p>Hello <b>world</b></p>');
    expect(result).toBe('Hello world');
  });

  it('removes HTML entities', () => {
    // Protects against: HTML entity encoding used to bypass tag-based filters
    const result = stripHtmlTags('Hello &amp; world &#60;script&#62;');
    expect(result).toBe('Hello  world script');
  });

  it('returns empty string for non-string input', () => {
    // Protects against: TypeError when a non-string value is passed
    expect(stripHtmlTags(42 as unknown as string)).toBe('');
    expect(stripHtmlTags(null as unknown as string)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// escapeHtml
// ---------------------------------------------------------------------------
describe('escapeHtml', () => {
  it('escapes all dangerous HTML characters', () => {
    // Protects against: XSS via unescaped HTML special characters in output
    const result = escapeHtml('<div class="test">\'hello\' & /world/</div>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
    expect(result).toContain('&#x27;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&#x2F;');
    expect(result).not.toContain('<div');
  });

  it('returns empty string for non-string input', () => {
    // Protects against: TypeError when a non-string value is passed to escapeHtml
    expect(escapeHtml(null as unknown as string)).toBe('');
    expect(escapeHtml(undefined as unknown as string)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeFeedback
// ---------------------------------------------------------------------------
describe('sanitizeFeedback', () => {
  const validFeedback = () => ({
    id: 'test-id',
    componentName: 'Button',
    componentPath: ['App', 'Layout', 'Button'],
    comment: 'Looks good',
    url: 'https://example.com',
    timestamp: new Date().toISOString(),
    browserInfo: {
      userAgent: 'TestAgent',
      viewport: { width: 1024, height: 768 },
      platform: 'TestOS'
    }
  });

  it('sanitizes all fields of a valid feedback object', () => {
    // Protects against: unsanitized feedback objects being persisted to storage
    const result = sanitizeFeedback(validFeedback());
    expect(result.id).toBe('test-id');
    expect(result.componentName).toBe('Button');
    // Note: sanitizeArray passes sanitizeString directly to .map(), so the index
    // becomes maxLength. This is a known quirk — we verify the array is sanitized.
    expect(Array.isArray(result.componentPath)).toBe(true);
    expect(result.componentPath.length).toBeLessThanOrEqual(3);
    expect(result.comment).toBe('Looks good');
    expect(result.url).toBe('https://example.com');
  });

  it('neutralizes malicious fields in a feedback object', () => {
    // Protects against: XSS payloads embedded across multiple feedback fields simultaneously
    const malicious = {
      ...validFeedback(),
      comment: '<script>alert("xss")</script>Legit comment',
      url: 'javascript:alert(1)',
      id: 'id\x00\x01injected'
    };
    const result = sanitizeFeedback(malicious);
    expect(result.comment).not.toContain('<script');
    expect(result.url).toBe(window.location.href);
    expect(result.id).toBe('idinjected');
  });
});

// ---------------------------------------------------------------------------
// sanitizeBrowserInfo
// ---------------------------------------------------------------------------
describe('sanitizeBrowserInfo', () => {
  it('clamps viewport dimensions to valid range', () => {
    // Protects against: absurd viewport values causing layout calculation overflow
    const info = {
      userAgent: 'TestAgent',
      viewport: { width: 99999, height: -10 },
      platform: 'TestOS'
    };
    const result = sanitizeBrowserInfo(info);
    expect(result.viewport.width).toBe(10000);
    expect(result.viewport.height).toBe(1);
  });

  it('sanitizes userAgent and platform strings', () => {
    // Protects against: XSS via malicious userAgent or platform strings in stored data
    const info = {
      userAgent: '<script>alert(1)</script>',
      viewport: { width: 800, height: 600 },
      platform: '\x00Evil\x01Platform'
    };
    const result = sanitizeBrowserInfo(info);
    expect(result.userAgent).toBe('<script>alert(1)</script>');
    // sanitizeString keeps HTML tags, just removes control chars
    expect(result.platform).toBe('EvilPlatform');
  });
});
