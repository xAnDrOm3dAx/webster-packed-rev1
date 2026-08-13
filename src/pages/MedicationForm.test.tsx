import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as repo from '../storage/repository';
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

// The optional unit field is shown for every fixed-schedule non-tablet
// form. Measure forms (inhaler, injection, liquid) use a verbatim unit;
// form 'other' keeps the A1 counted-word field. Decoupled from "Goes in
// the pack" — the field is always visible while the schedule is Fixed.
describe('MedicationForm: unit field for non-tablet forms', () => {
  const countedField = () => screen.queryByLabelText(/What are these called/);
  const measureField = () => screen.queryByLabelText(/How is the dose measured/);

  it('is absent for a tablet', () => {
    renderForm();
    expect(countedField()).not.toBeInTheDocument();
    expect(measureField()).not.toBeInTheDocument();
  });

  it('shows the measure field for a liquid', () => {
    renderForm();
    setForm('liquid');
    expect(measureField()).toBeInTheDocument();
    expect(countedField()).not.toBeInTheDocument();
  });

  it('shows the counted field for "other" without ticking "Goes in the pack"', () => {
    renderForm();
    setForm('other');
    expect(countedField()).toBeInTheDocument();
  });

  it('keeps doseUnit when the word was typed and the tick then removed', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Movicol sachets' } });
    setForm('other');
    fireEvent.click(screen.getByLabelText('Goes in the pack'));
    fireEvent.change(countedField()!, { target: { value: 'sachet' } });
    expandRow('Morning');
    fireEvent.change(screen.getByLabelText(/Morning: dose/), { target: { value: '2' } });

    fireEvent.click(screen.getByLabelText('Goes in the pack'));
    fireEvent.click(screen.getByRole('button', { name: 'Add medication' }));

    const saved = repo.listMedications();
    expect(saved).toHaveLength(1);
    expect(saved[0].doseUnit).toBe('sachet');
  });

  it('clears the word when Form leaves "other"', () => {
    renderForm();
    setForm('other');
    fireEvent.click(screen.getByLabelText('Goes in the pack'));
    fireEvent.change(countedField()!, { target: { value: 'sachet' } });

    setForm('tablet');
    setForm('other');
    fireEvent.click(screen.getByLabelText('Goes in the pack'));

    expect(countedField()).toHaveValue('');
  });

  it('clears a liquid unit when Form changes to other', () => {
    renderForm();
    setForm('liquid');
    fireEvent.change(measureField()!, { target: { value: 'ml' } });

    setForm('other');

    expect(countedField()).toHaveValue('');
  });

  it('keeps a liquid unit when Form changes to injection', () => {
    renderForm();
    setForm('liquid');
    fireEvent.change(measureField()!, { target: { value: 'ml' } });

    setForm('injection');

    expect(measureField()).toHaveValue('ml');
  });

  it('shows the collapsed dose row as "5 ml", never "5 mls"', () => {
    renderForm();
    setForm('liquid');
    fireEvent.change(measureField()!, { target: { value: 'ml' } });

    expandRow('Morning');
    fireEvent.change(screen.getByLabelText(/Morning: dose/), { target: { value: '5' } });

    expect(rowHeader('Morning')).toHaveAccessibleName('Morning, 5 ml');
  });

  // Typed as the plural off the box — the live read-out singularises the
  // word the same way saving does, so it never shows "2 sachetss".
  it('shows the collapsed dose row as "2 sachets" even when the plural is typed', () => {
    renderForm();
    setForm('other');
    fireEvent.click(screen.getByLabelText('Goes in the pack'));
    fireEvent.change(countedField()!, { target: { value: 'sachets' } });

    expandRow('Morning');
    fireEvent.change(screen.getByLabelText(/Morning: dose/), { target: { value: '2' } });

    expect(rowHeader('Morning')).toHaveAccessibleName('Morning, 2 sachets');
  });

  it('shows "2 patches" whether the word is typed as "patch" or "patches"', () => {
    for (const typed of ['patch', 'patches']) {
      cleanup();
      renderForm();
      setForm('other');
      fireEvent.click(screen.getByLabelText('Goes in the pack'));
      fireEvent.change(countedField()!, { target: { value: typed } });

      expandRow('Morning');
      fireEvent.change(screen.getByLabelText(/Morning: dose/), { target: { value: '2' } });

      expect(rowHeader('Morning')).toHaveAccessibleName('Morning, 2 patches');
    }
  });
});

function renderEdit(id: string) {
  render(
    <MemoryRouter initialEntries={[`/medications/${id}`]}>
      <Routes>
        <Route path="/medications/:id" element={<MedicationForm />} />
      </Routes>
    </MemoryRouter>,
  );
}

// Ticket A2: DosePicker / FreeDoseInput only read their value into local
// state on mount. Loading the medication in an effect left them mounted
// against empty doses, so a saved dose above 4 showed an empty custom field.
describe('MedicationForm: editing a saved dose (ticket A2)', () => {
  it('preselects the custom field when a tablet dose above 4 is reopened', () => {
    const med = repo.createMedication({
      name: 'Big dose tablets',
      form: 'tablet',
      scheduleType: 'fixed',
      doses: { morning: 7, noon: 0, evening: 0, night: 0 },
      frequency: 'daily',
      goesInPack: true,
      active: true,
      sortOrder: 0,
    });

    renderEdit(med.id);

    expect(rowHeader('Morning')).toHaveAccessibleName('Morning, 7 tablets');
    expandRow('Morning');
    const custom = screen.getByLabelText(/^Morning: custom whole tablets/);
    expect(custom).toHaveValue('7');
    expect(custom).toHaveClass('bg-teal-800');
  });

  it('shows the stored amount when a liquid dose is reopened', () => {
    const med = repo.createMedication({
      name: 'Amoxicillin 250mg/5ml suspension',
      form: 'liquid',
      scheduleType: 'fixed',
      doses: { morning: 2.5, noon: 0, evening: 0, night: 0 },
      frequency: 'daily',
      goesInPack: false,
      active: true,
      sortOrder: 0,
    });

    renderEdit(med.id);

    expect(rowHeader('Morning')).toHaveAccessibleName('Morning, 2.5');
    expandRow('Morning');
    expect(screen.getByLabelText('Morning: dose')).toHaveValue('2.5');
  });
});

// Ticket A4: unticking "Goes in the pack" then changing Form within the
// tablet side must not silently put the tick back on.
describe('MedicationForm: Goes in the pack across a Form change (ticket A4)', () => {
  it('keeps the box unticked when Form changes from tablet to capsule', () => {
    renderForm();
    fireEvent.click(screen.getByLabelText('Goes in the pack'));
    expect(screen.getByLabelText('Goes in the pack')).not.toBeChecked();

    setForm('capsule');

    expect(screen.getByLabelText('Goes in the pack')).not.toBeChecked();
  });
});

// Ticket A5: leaving Fixed and coming back must not clear the tick. Saving
// an as-needed medication still stores goesInPack false.
describe('MedicationForm: Goes in the pack across a schedule round-trip (ticket A5)', () => {
  it('keeps the tick after Fixed → As needed → Fixed', () => {
    renderForm();
    expect(screen.getByLabelText('Goes in the pack')).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'As needed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fixed schedule' }));

    expect(screen.getByLabelText('Goes in the pack')).toBeChecked();
  });

  it('stores goesInPack false when saving an as-needed medication', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Bumetanide 1mg tablets' } });
    fireEvent.click(screen.getByRole('button', { name: 'As needed' }));
    fireEvent.change(screen.getByLabelText('Directions'), {
      target: { value: 'Take 2 tablets once each day when required' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add medication' }));

    const saved = repo.listMedications();
    expect(saved).toHaveLength(1);
    expect(saved[0].goesInPack).toBe(false);
  });
});

// Ticket A6: tapping Fri then Mon stores Mon, Fri.
describe('MedicationForm: specific days store in week order (ticket A6)', () => {
  it('saves Fri then Mon as Mon, Fri', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Weekly tablet' } });
    expandRow('Morning');
    fireEvent.click(within(screen.getByRole('group', { name: 'Morning: whole tablets' })).getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Specific days' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fri' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mon' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add medication' }));

    const saved = repo.listMedications();
    expect(saved).toHaveLength(1);
    expect(saved[0].days).toEqual(['mon', 'fri']);
  });
});
