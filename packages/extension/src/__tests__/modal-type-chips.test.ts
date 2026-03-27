/**
 * Tests for type categorization chips in FeedbackModal.
 * Covers T-027, T-028, T-029, T-030, T-031, T-032, T-033,
 * T-059, T-060, T-061, T-067.
 */

import { FeedbackModal } from '../ui/modal';

function createComponentInfo() {
  return {
    name: 'TestButton',
    path: ['App', 'TestButton'],
    element: document.createElement('button'),
  };
}

describe('FeedbackModal — Type Chips', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  function createModal(overrides: Partial<{
    onSubmit: jest.Mock;
    onCancel: jest.Mock;
    onMinimize: jest.Mock;
    onDraftSave: jest.Mock;
    draftComment: string;
  }> = {}) {
    return new FeedbackModal(container, {
      componentInfo: createComponentInfo(),
      onSubmit: overrides.onSubmit ?? jest.fn(),
      onCancel: overrides.onCancel ?? jest.fn(),
      onMinimize: overrides.onMinimize ?? jest.fn(),
      onDraftSave: overrides.onDraftSave ?? jest.fn(),
      draftComment: overrides.draftComment,
    });
  }

  function getChips(): HTMLButtonElement[] {
    return Array.from(container.querySelectorAll('.fb-type-chip')) as HTMLButtonElement[];
  }

  function getSeverityChips(): HTMLButtonElement[] {
    return Array.from(container.querySelectorAll('.fb-severity-chip')) as HTMLButtonElement[];
  }

  function getSeverityControl(): HTMLElement | null {
    return container.querySelector('.fb-severity-control');
  }

  /**
   * T-027: Modal opens; "Suggestion" chip is selected by default.
   */
  describe('T-027: Default chip state', () => {
    it('"Suggestion" chip is selected (filled), "Bug" and "Question" are outlined', () => {
      const modal = createModal();

      const chips = getChips();
      expect(chips).toHaveLength(3);

      // Suggestion chip is selected
      const suggestionChip = chips.find(c => c.getAttribute('data-type') === 'suggestion')!;
      expect(suggestionChip.getAttribute('aria-checked')).toBe('true');
      expect(suggestionChip.classList.contains('fb-type-chip-selected')).toBe(true);
      expect(suggestionChip.classList.contains('fb-type-chip-suggestion')).toBe(true);

      // Bug and Question are not selected
      const bugChip = chips.find(c => c.getAttribute('data-type') === 'bug')!;
      expect(bugChip.getAttribute('aria-checked')).toBe('false');
      expect(bugChip.classList.contains('fb-type-chip-selected')).toBe(false);

      const questionChip = chips.find(c => c.getAttribute('data-type') === 'question')!;
      expect(questionChip.getAttribute('aria-checked')).toBe('false');
      expect(questionChip.classList.contains('fb-type-chip-selected')).toBe(false);

      modal.destroy();
    });
  });

  /**
   * T-028: Click "Bug" chip — it becomes filled red, "Suggestion" becomes outlined.
   */
  describe('T-028: Click Bug chip', () => {
    it('"Bug" chip becomes selected, "Suggestion" becomes outlined', () => {
      const modal = createModal();
      const chips = getChips();

      const bugChip = chips.find(c => c.getAttribute('data-type') === 'bug')!;
      bugChip.click();

      expect(bugChip.getAttribute('aria-checked')).toBe('true');
      expect(bugChip.classList.contains('fb-type-chip-selected')).toBe(true);
      expect(bugChip.classList.contains('fb-type-chip-bug')).toBe(true);

      const suggestionChip = chips.find(c => c.getAttribute('data-type') === 'suggestion')!;
      expect(suggestionChip.getAttribute('aria-checked')).toBe('false');
      expect(suggestionChip.classList.contains('fb-type-chip-selected')).toBe(false);

      modal.destroy();
    });
  });

  /**
   * T-029: Submit feedback with "Bug" selected — onSubmit called with type: 'bug'.
   */
  describe('T-029: Submit with Bug', () => {
    it('onSubmit called with type "bug"', () => {
      const onSubmit = jest.fn();
      const modal = createModal({ onSubmit, draftComment: 'bug report' });
      const chips = getChips();

      const bugChip = chips.find(c => c.getAttribute('data-type') === 'bug')!;
      bugChip.click();

      const submitBtn = container.querySelector('.fb-btn-primary') as HTMLButtonElement;
      submitBtn.click();

      expect(onSubmit).toHaveBeenCalledWith('bug report', 'bug', undefined);

      modal.destroy();
    });
  });

  /**
   * T-030: Submit without changing default — onSubmit called with type: 'suggestion'.
   */
  describe('T-030: Submit with default', () => {
    it('onSubmit called with type "suggestion"', () => {
      const onSubmit = jest.fn();
      const modal = createModal({ onSubmit, draftComment: 'a suggestion' });

      const submitBtn = container.querySelector('.fb-btn-primary') as HTMLButtonElement;
      submitBtn.click();

      expect(onSubmit).toHaveBeenCalledWith('a suggestion', 'suggestion', undefined);

      modal.destroy();
    });
  });

  /**
   * T-031: Bug chip selected — severity control appears with Critical, Major, Minor.
   * No default severity selection.
   */
  describe('T-031: Severity control appears for Bug', () => {
    it('shows severity options with no default selection', () => {
      const modal = createModal();

      // Initially severity control is hidden
      const severityControl = getSeverityControl()!;
      expect(severityControl.style.display).toBe('none');

      // Click Bug chip
      const chips = getChips();
      const bugChip = chips.find(c => c.getAttribute('data-type') === 'bug')!;
      bugChip.click();

      expect(severityControl.style.display).toBe('flex');

      const severityChips = getSeverityChips();
      expect(severityChips).toHaveLength(3);
      expect(severityChips[0].textContent).toBe('Critical');
      expect(severityChips[1].textContent).toBe('Major');
      expect(severityChips[2].textContent).toBe('Minor');

      // No default selection
      severityChips.forEach(c => {
        expect(c.getAttribute('aria-checked')).toBe('false');
      });

      modal.destroy();
    });
  });

  /**
   * T-032: Switch from Bug to Suggestion after selecting severity —
   * severity control hidden and severity value cleared.
   */
  describe('T-032: Switching from Bug clears severity', () => {
    it('hides severity control and clears value', () => {
      const onSubmit = jest.fn();
      const modal = createModal({ onSubmit, draftComment: 'some text' });
      const chips = getChips();

      // Select Bug
      chips.find(c => c.getAttribute('data-type') === 'bug')!.click();

      // Select Major severity
      getSeverityChips()[1].click();
      expect(getSeverityChips()[1].getAttribute('aria-checked')).toBe('true');

      // Switch to Suggestion
      chips.find(c => c.getAttribute('data-type') === 'suggestion')!.click();

      // Severity control hidden
      expect(getSeverityControl()!.style.display).toBe('none');

      // Submit — severity should be undefined
      const submitBtn = container.querySelector('.fb-btn-primary') as HTMLButtonElement;
      submitBtn.click();
      expect(onSubmit).toHaveBeenCalledWith('some text', 'suggestion', undefined);

      modal.destroy();
    });
  });

  /**
   * T-033: Bug selected, no severity chosen, submit —
   * onSubmit called with type 'bug', severity undefined.
   */
  describe('T-033: Bug without severity', () => {
    it('submits with type bug and severity undefined', () => {
      const onSubmit = jest.fn();
      const modal = createModal({ onSubmit, draftComment: 'bug text' });
      const chips = getChips();

      chips.find(c => c.getAttribute('data-type') === 'bug')!.click();

      const submitBtn = container.querySelector('.fb-btn-primary') as HTMLButtonElement;
      submitBtn.click();

      expect(onSubmit).toHaveBeenCalledWith('bug text', 'bug', undefined);

      modal.destroy();
    });
  });

  /**
   * T-059: Arrow Right on first chip moves focus to second chip.
   */
  describe('T-059: Arrow Right keyboard navigation', () => {
    it('moves focus from first to second chip', () => {
      const modal = createModal();
      const chips = getChips();

      // Focus the first chip (Suggestion)
      chips[0].focus();
      expect(document.activeElement).toBe(chips[0]);

      // Press ArrowRight
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      chips[0].dispatchEvent(event);

      expect(document.activeElement).toBe(chips[1]);

      modal.destroy();
    });
  });

  /**
   * T-060: Arrow Right on last chip (Question) wraps to first chip (Suggestion).
   */
  describe('T-060: Arrow Right wraps at edge', () => {
    it('wraps from last chip to first chip', () => {
      const modal = createModal();
      const chips = getChips();

      // Focus the last chip (Question)
      chips[2].focus();
      chips[2].tabIndex = 0;

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      chips[2].dispatchEvent(event);

      expect(document.activeElement).toBe(chips[0]);

      modal.destroy();
    });
  });

  /**
   * T-061: Space pressed on focused chip selects it.
   */
  describe('T-061: Space selects chip', () => {
    it('selects the focused chip on Space', () => {
      const modal = createModal();
      const chips = getChips();

      // Focus Bug chip
      chips[1].focus();

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      chips[1].dispatchEvent(event);

      expect(chips[1].getAttribute('aria-checked')).toBe('true');
      expect(chips[1].classList.contains('fb-type-chip-selected')).toBe(true);
      expect(chips[1].classList.contains('fb-type-chip-bug')).toBe(true);

      // Suggestion is now deselected
      expect(chips[0].getAttribute('aria-checked')).toBe('false');

      modal.destroy();
    });
  });

  /**
   * T-067: E2E flow — chip bar default, click Bug, severity, select Major,
   * submit. Verified via unit test assertions on callback arguments.
   */
  describe('T-067: Full type categorization flow', () => {
    it('default -> Bug -> Major severity -> submit', () => {
      const onSubmit = jest.fn();
      const modal = createModal({ onSubmit, draftComment: 'full flow test' });
      const chips = getChips();

      // Default is Suggestion
      expect(chips[0].getAttribute('aria-checked')).toBe('true');

      // Click Bug
      chips.find(c => c.getAttribute('data-type') === 'bug')!.click();

      // Severity appears
      const severityControl = getSeverityControl()!;
      expect(severityControl.style.display).toBe('flex');

      // Select Major
      const majorChip = getSeverityChips().find(c => c.getAttribute('data-severity') === 'major')!;
      majorChip.click();
      expect(majorChip.getAttribute('aria-checked')).toBe('true');
      expect(majorChip.classList.contains('fb-severity-chip-selected')).toBe(true);

      // Submit
      const submitBtn = container.querySelector('.fb-btn-primary') as HTMLButtonElement;
      submitBtn.click();

      expect(onSubmit).toHaveBeenCalledWith('full flow test', 'bug', 'major');

      modal.destroy();
    });
  });

  /**
   * Chip bar has correct ARIA radiogroup semantics.
   */
  describe('ARIA semantics', () => {
    it('chip bar has role=radiogroup and aria-label', () => {
      const modal = createModal();

      const chipBar = container.querySelector('.fb-type-chip-bar')!;
      expect(chipBar.getAttribute('role')).toBe('radiogroup');
      expect(chipBar.getAttribute('aria-label')).toBe('Feedback type');

      const chips = getChips();
      chips.forEach(chip => {
        expect(chip.getAttribute('role')).toBe('radio');
      });

      modal.destroy();
    });

    it('severity control has role=radiogroup', () => {
      const modal = createModal();

      const severityControl = getSeverityControl()!;
      expect(severityControl.getAttribute('role')).toBe('radiogroup');
      expect(severityControl.getAttribute('aria-label')).toBe('Bug severity');

      modal.destroy();
    });
  });

  /**
   * Cmd/Ctrl+Enter submit also passes type and severity.
   */
  describe('Keyboard submit passes type and severity', () => {
    it('Cmd+Enter passes selected type and severity', () => {
      const onSubmit = jest.fn();
      const modal = createModal({ onSubmit });
      const textarea = container.querySelector('.fb-textarea') as HTMLTextAreaElement;
      textarea.value = 'keyboard submit';

      // Select Bug + Critical
      const chips = getChips();
      chips.find(c => c.getAttribute('data-type') === 'bug')!.click();
      getSeverityChips()[0].click(); // Critical

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      textarea.dispatchEvent(event);

      expect(onSubmit).toHaveBeenCalledWith('keyboard submit', 'bug', 'critical');

      modal.destroy();
    });
  });

  /**
   * Draft save passes type and severity.
   */
  describe('Draft save passes type and severity', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    it('onDraftSave receives current type and severity', () => {
      const onDraftSave = jest.fn();
      const modal = createModal({ onDraftSave });

      // Select Bug + Minor
      const chips = getChips();
      chips.find(c => c.getAttribute('data-type') === 'bug')!.click();
      getSeverityChips()[2].click(); // Minor

      const textarea = container.querySelector('.fb-textarea') as HTMLTextAreaElement;
      textarea.value = 'draft content';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      jest.advanceTimersByTime(2100);

      expect(onDraftSave).toHaveBeenCalledWith('draft content', 'bug', 'minor');

      modal.destroy();
    });
  });
});
