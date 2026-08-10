import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import MedicationForm from './MedicationForm';

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

function renderForm() {
  render(
    <MemoryRouter>
      <MedicationForm />
    </MemoryRouter>,
  );
}

function setForm(value: string) {
  fireEvent.change(screen.getByLabelText('Form'), { target: { value } });
}

// Opens a time-of-day row by its header, whose accessible name is
// "<time of day>, <dose>" — matching on the prefix avoids having to know
// the current dose text.
function expandRow(label: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${label}, `) }));
}

function rowHeader(label: string) {
  return screen.getByRole('button', { name: new RegExp(`^${label}, `) });
}

// A dose typed against a non-tablet form is capped at FREE_DOSE_MAX (999),
// far above the tablet picker's CUSTOM_WHOLE_MAX (10). Both caps are only
// applied at the keystroke, so a value that crossed from one control to the
// other would arrive unchecked — 250 ml becoming 250 tablets, and (because
// switching to a tablet form also turns goesInPack back on) 250-tablet
// PackEntry rows downstream. Changing between the two sides resets the
// doses so nothing crosses.
describe('MedicationForm: changing Form across the tablet/non-tablet boundary', () => {
  it('resets a 250 liquid dose to 0 when the form changes back to tablet', () => {
    renderForm();

    setForm('liquid');
    expandRow('Morning');
    fireEvent.change(screen.getByLabelText('Morning: dose'), { target: { value: '250' } });
    expect(rowHeader('Morning')).toHaveAccessibleName('Morning, 250');

    setForm('tablet');

    expect(rowHeader('Morning')).toHaveAccessibleName('Morning, Not given');
    expect(screen.getByLabelText(/^Morning: custom whole tablets/)).toHaveValue('');

    // The read-out could in principle show "Not given" while the state
    // still held 250, so check the value itself: submitting now must fail
    // the "at least one dose" rule, which only passes when a dose is > 0.
    fireEvent.click(screen.getByRole('button', { name: 'Add medication' }));
    expect(
      screen.getByRole('link', { name: 'Enter a dose for at least one time of day' }),
    ).toBeInTheDocument();
  });

  it('resets the doses when the form changes from tablet to liquid', () => {
    renderForm();

    expandRow('Morning');
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(rowHeader('Morning')).toHaveAccessibleName('Morning, 3 tablets');

    setForm('liquid');

    expect(rowHeader('Morning')).toHaveAccessibleName('Morning, Not given');
  });

  it('keeps the doses when the form changes from tablet to capsule', () => {
    renderForm();

    expandRow('Morning');
    fireEvent.click(screen.getByRole('button', { name: '3' }));

    setForm('capsule');

    expect(rowHeader('Morning')).toHaveAccessibleName('Morning, 3 capsules');
  });

  it('keeps the doses when the form changes from liquid to injection', () => {
    renderForm();

    setForm('liquid');
    expandRow('Morning');
    fireEvent.change(screen.getByLabelText('Morning: dose'), { target: { value: '2.5' } });

    setForm('injection');

    expect(rowHeader('Morning')).toHaveAccessibleName('Morning, 2.5');
  });
});
