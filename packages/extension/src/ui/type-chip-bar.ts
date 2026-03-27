/**
 * TypeChipBar — radio-group chip bar for feedback type categorization (PH-012)
 *
 * Renders Suggestion/Bug/Question chips with radio-group ARIA semantics.
 * Bug selection reveals a severity sub-control (Critical/Major/Minor).
 * Keyboard navigation: Arrow Left/Right with wrap, Space/Enter to select.
 */

import type { FeedbackType, BugSeverity } from '@feedbacker/core';

interface TypeChipBarOptions {
  initialType: FeedbackType;
  initialSeverity?: BugSeverity;
  onChange: (type: FeedbackType, severity: BugSeverity | undefined) => void;
}

const CHIP_TYPES: ReadonlyArray<{ value: FeedbackType; label: string }> = [
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'bug', label: 'Bug' },
  { value: 'question', label: 'Question' },
];

const SEVERITY_OPTIONS: ReadonlyArray<{ value: BugSeverity; label: string }> = [
  { value: 'critical', label: 'Critical' },
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
];

/**
 * Creates the type chip bar DOM element with severity sub-control.
 * Returns the wrapper element ready for insertion into the modal body.
 */
export function createTypeChipBar(options: TypeChipBarOptions): HTMLDivElement {
  const { initialType, initialSeverity, onChange } = options;

  let selectedType: FeedbackType = initialType;
  let selectedSeverity: BugSeverity | undefined = initialSeverity;

  const wrapper = document.createElement('div');
  wrapper.className = 'fb-type-chip-wrapper';

  // Chip bar container with radio-group semantics
  const chipBar = document.createElement('div');
  chipBar.className = 'fb-type-chip-bar';
  chipBar.setAttribute('role', 'radiogroup');
  chipBar.setAttribute('aria-label', 'Feedback type');

  const chips: HTMLButtonElement[] = [];

  CHIP_TYPES.forEach(({ value, label }, index) => {
    const chip = document.createElement('button');
    chip.className = 'fb-type-chip';
    chip.setAttribute('role', 'radio');
    chip.setAttribute('data-type', value);
    chip.textContent = label;
    chip.type = 'button';

    const isSelected = value === selectedType;
    updateChipState(chip, value, isSelected);

    // Only the selected chip is in the tab order (roving tabindex)
    chip.tabIndex = isSelected ? 0 : -1;

    chip.addEventListener('click', () => selectType(value));
    chips.push(chip);
    chipBar.appendChild(chip);
  });

  // Keyboard navigation on the chip bar
  chipBar.addEventListener('keydown', (e) => {
    const currentIndex = chips.findIndex(c => c === document.activeElement);
    if (currentIndex === -1) return;

    let newIndex = -1;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % chips.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = (currentIndex - 1 + chips.length) % chips.length;
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      selectType(CHIP_TYPES[currentIndex].value);
      return;
    }

    if (newIndex >= 0) {
      chips[newIndex].focus();
      // Update roving tabindex
      chips.forEach((c, i) => { c.tabIndex = i === newIndex ? 0 : -1; });
    }
  });

  wrapper.appendChild(chipBar);

  // Severity sub-control (hidden unless Bug is selected)
  const severityContainer = document.createElement('div');
  severityContainer.className = 'fb-severity-control';
  severityContainer.setAttribute('role', 'radiogroup');
  severityContainer.setAttribute('aria-label', 'Bug severity');
  severityContainer.style.display = selectedType === 'bug' ? 'flex' : 'none';

  const severityLabel = document.createElement('span');
  severityLabel.className = 'fb-severity-label';
  severityLabel.textContent = 'Severity:';
  severityContainer.appendChild(severityLabel);

  const severityChips: HTMLButtonElement[] = [];

  SEVERITY_OPTIONS.forEach(({ value, label }) => {
    const chip = document.createElement('button');
    chip.className = 'fb-severity-chip';
    chip.setAttribute('role', 'radio');
    chip.setAttribute('data-severity', value);
    chip.textContent = label;
    chip.type = 'button';

    const isSelected = value === selectedSeverity;
    chip.setAttribute('aria-checked', String(isSelected));
    if (isSelected) chip.classList.add('fb-severity-chip-selected');
    chip.tabIndex = isSelected ? 0 : -1;

    chip.addEventListener('click', () => selectSeverity(value));
    severityChips.push(chip);
    severityContainer.appendChild(chip);
  });

  // If no severity is selected initially, set first severity chip to tabindex 0
  if (!selectedSeverity && severityChips.length > 0) {
    severityChips[0].tabIndex = 0;
  }

  // Severity keyboard navigation
  severityContainer.addEventListener('keydown', (e) => {
    const currentIndex = severityChips.findIndex(c => c === document.activeElement);
    if (currentIndex === -1) return;

    let newIndex = -1;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % severityChips.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = (currentIndex - 1 + severityChips.length) % severityChips.length;
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      selectSeverity(SEVERITY_OPTIONS[currentIndex].value);
      return;
    }

    if (newIndex >= 0) {
      severityChips[newIndex].focus();
      severityChips.forEach((c, i) => { c.tabIndex = i === newIndex ? 0 : -1; });
    }
  });

  wrapper.appendChild(severityContainer);

  function selectType(type: FeedbackType): void {
    selectedType = type;

    // Update chip visual states and roving tabindex
    chips.forEach((chip, i) => {
      const isSelected = CHIP_TYPES[i].value === type;
      updateChipState(chip, CHIP_TYPES[i].value, isSelected);
      chip.tabIndex = isSelected ? 0 : -1;
    });

    // Show/hide severity control
    if (type === 'bug') {
      severityContainer.style.display = 'flex';
    } else {
      severityContainer.style.display = 'none';
      // Clear severity when switching away from Bug
      selectedSeverity = undefined;
      severityChips.forEach((c, i) => {
        c.setAttribute('aria-checked', 'false');
        c.classList.remove('fb-severity-chip-selected');
        c.tabIndex = i === 0 ? 0 : -1;
      });
    }

    onChange(selectedType, selectedSeverity);
  }

  function selectSeverity(severity: BugSeverity): void {
    selectedSeverity = severity;
    severityChips.forEach((c, i) => {
      const isSelected = SEVERITY_OPTIONS[i].value === severity;
      c.setAttribute('aria-checked', String(isSelected));
      if (isSelected) {
        c.classList.add('fb-severity-chip-selected');
      } else {
        c.classList.remove('fb-severity-chip-selected');
      }
      c.tabIndex = isSelected ? 0 : -1;
    });
    onChange(selectedType, selectedSeverity);
  }

  return wrapper;
}

function updateChipState(
  chip: HTMLButtonElement,
  type: FeedbackType,
  isSelected: boolean
): void {
  chip.setAttribute('aria-checked', String(isSelected));

  // Remove all type-specific classes
  chip.classList.remove(
    'fb-type-chip-selected',
    'fb-type-chip-suggestion',
    'fb-type-chip-bug',
    'fb-type-chip-question'
  );

  if (isSelected) {
    chip.classList.add('fb-type-chip-selected', `fb-type-chip-${type}`);
  }
}
