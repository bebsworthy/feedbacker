import { buildElementLabel } from '../element-label';

describe('buildElementLabel', () => {
  describe('basic format', () => {
    it('returns tag name for bare element', () => {
      const el = document.createElement('div');
      expect(buildElementLabel(el)).toBe('div');
    });

    it('returns tag.class for element with meaningful class', () => {
      const el = document.createElement('div');
      el.className = 'hero-section';
      expect(buildElementLabel(el)).toBe('div.hero-section');
    });

    it('returns tag[name] for form input with name attr', () => {
      const el = document.createElement('input');
      el.setAttribute('name', 'email');
      expect(buildElementLabel(el)).toBe('input[email]');
    });

    it('returns tag "aria" for element with aria-label', () => {
      const el = document.createElement('button');
      el.setAttribute('aria-label', 'Submit form');
      expect(buildElementLabel(el)).toBe('button "Submit form"');
    });

    it('returns all parts combined', () => {
      const el = document.createElement('input');
      el.className = 'custom-input';
      el.setAttribute('name', 'username');
      el.setAttribute('aria-label', 'Enter username');
      expect(buildElementLabel(el)).toBe('input.custom-input[username] "Enter username"');
    });
  });

  describe('Tailwind utility class filtering', () => {
    it('skips common utility classes and returns just tag', () => {
      const el = document.createElement('div');
      el.className = 'flex items-center gap-2 p-4 bg-blue-500';
      expect(buildElementLabel(el)).toBe('div');
    });

    it('skips all sizing/spacing utilities', () => {
      const el = document.createElement('div');
      el.className = 'w-full h-9 px-3 py-1 mt-2 mb-4 mx-auto';
      expect(buildElementLabel(el)).toBe('div');
    });

    it('skips layout utilities', () => {
      const el = document.createElement('div');
      el.className = 'absolute top-0 left-0 z-50 overflow-hidden';
      expect(buildElementLabel(el)).toBe('div');
    });

    it('skips visual utilities', () => {
      const el = document.createElement('div');
      el.className = 'border rounded-md shadow-xs opacity-50 transition-all';
      expect(buildElementLabel(el)).toBe('div');
    });

    it('skips typography utilities', () => {
      const el = document.createElement('span');
      el.className = 'text-sm font-medium leading-6 tracking-tight';
      expect(buildElementLabel(el)).toBe('span');
    });

    it('picks first meaningful class among utilities', () => {
      const el = document.createElement('div');
      el.className = 'flex items-center card-header p-4 bg-white';
      expect(buildElementLabel(el)).toBe('div.card-header');
    });

    it('picks meaningful class even if it comes later', () => {
      const el = document.createElement('div');
      el.className = 'w-full h-auto p-2 m-1 sidebar-nav rounded';
      expect(buildElementLabel(el)).toBe('div.sidebar-nav');
    });
  });

  describe('variant prefix filtering', () => {
    it('skips file: variant prefix classes', () => {
      const el = document.createElement('input');
      el.className = 'file:text-foreground file:bg-transparent file:text-sm';
      expect(buildElementLabel(el)).toBe('input');
    });

    it('skips hover:/focus:/dark: variant classes', () => {
      const el = document.createElement('button');
      el.className = 'hover:bg-blue-600 focus:ring-2 dark:bg-gray-800';
      expect(buildElementLabel(el)).toBe('button');
    });

    it('skips responsive variant classes', () => {
      const el = document.createElement('div');
      el.className = 'md:text-sm lg:w-1/2 sm:hidden';
      expect(buildElementLabel(el)).toBe('div');
    });

    it('skips aria-invalid: and similar compound variants', () => {
      const el = document.createElement('input');
      el.className = 'aria-invalid:ring-destructive dark:aria-invalid:ring-destructive/40';
      expect(buildElementLabel(el)).toBe('input');
    });

    it('picks meaningful class among variant classes', () => {
      const el = document.createElement('input');
      el.className = 'file:text-foreground hover:bg-blue custom-field dark:bg-gray';
      expect(buildElementLabel(el)).toBe('input.custom-field');
    });
  });

  describe('form name attribute', () => {
    it('adds [name] for input elements', () => {
      const el = document.createElement('input');
      el.setAttribute('name', 'email');
      expect(buildElementLabel(el)).toBe('input[email]');
    });

    it('adds [name] for select elements', () => {
      const el = document.createElement('select');
      el.setAttribute('name', 'country');
      expect(buildElementLabel(el)).toBe('select[country]');
    });

    it('adds [name] for textarea elements', () => {
      const el = document.createElement('textarea');
      el.setAttribute('name', 'message');
      expect(buildElementLabel(el)).toBe('textarea[message]');
    });

    it('does NOT add [name] for non-form elements', () => {
      const el = document.createElement('div');
      el.setAttribute('name', 'my-div');
      expect(buildElementLabel(el)).toBe('div');
    });

    it('does NOT add [name] for button elements', () => {
      const el = document.createElement('button');
      el.setAttribute('name', 'submit-btn');
      expect(buildElementLabel(el)).toBe('button');
    });
  });

  describe('aria-label', () => {
    it('appends aria-label in quotes', () => {
      const el = document.createElement('nav');
      el.setAttribute('aria-label', 'Main navigation');
      expect(buildElementLabel(el)).toBe('nav "Main navigation"');
    });

    it('truncates aria-label at 30 chars with ellipsis', () => {
      const el = document.createElement('div');
      el.setAttribute('aria-label', 'This is a very long aria label that exceeds the limit');
      const result = buildElementLabel(el);
      expect(result).toBe('div "This is a very long aria label\u2026"');
      // Verify the aria portion is exactly 30 chars + ellipsis
      const ariaMatch = result.match(/"(.+)"/);
      expect(ariaMatch![1].replace('\u2026', '')).toHaveLength(30);
    });

    it('skips empty aria-label', () => {
      const el = document.createElement('div');
      el.setAttribute('aria-label', '');
      expect(buildElementLabel(el)).toBe('div');
    });

    it('skips whitespace-only aria-label', () => {
      const el = document.createElement('div');
      el.setAttribute('aria-label', '   ');
      expect(buildElementLabel(el)).toBe('div');
    });

    it('trims aria-label before using', () => {
      const el = document.createElement('button');
      el.setAttribute('aria-label', '  Close dialog  ');
      expect(buildElementLabel(el)).toBe('button "Close dialog"');
    });
  });

  describe('single-char class filtering', () => {
    it('skips single-character classes', () => {
      const el = document.createElement('div');
      el.className = 'x';
      expect(buildElementLabel(el)).toBe('div');
    });

    it('keeps two-character+ meaningful classes', () => {
      const el = document.createElement('div');
      el.className = 'ab';
      expect(buildElementLabel(el)).toBe('div.ab');
    });
  });

  describe('real-world Tailwind component', () => {
    it('handles a typical Tailwind input with many classes', () => {
      const el = document.createElement('input');
      el.className = 'file:text-foreground placeholder:text-muted-foreground border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs';
      el.setAttribute('name', 'email');
      el.setAttribute('aria-label', 'Email address');
      // All classes are Tailwind utilities/variants — no meaningful class
      expect(buildElementLabel(el)).toBe('input[email] "Email address"');
    });

    it('handles a semantic component with mixed classes', () => {
      const el = document.createElement('nav');
      el.className = 'flex items-center sidebar-menu gap-4 px-2';
      el.setAttribute('aria-label', 'Main navigation');
      expect(buildElementLabel(el)).toBe('nav.sidebar-menu "Main navigation"');
    });
  });
});
