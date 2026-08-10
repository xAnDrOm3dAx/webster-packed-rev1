import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { CUSTOM_WHOLE_MAX, formatDoseText } from '../lib/quantity';
import { DosePicker } from './DosePicker';

afterEach(cleanup);

// A real controlled parent, the way MedicationForm/DoseTimeList use
// DosePicker: `value` is state, and onChange is its setter, so the
// picker's own onChange calls flow back in as new props exactly as they
// would in the app. A mock onChange with a fixed `value` prop can't catch
// bugs where the component disagrees with its own committed dose (DOSE
// ENTRY REVISION 2, FIX 4).
function Harness({ initialValue = 0 }: { initialValue?: number }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div>
      <p>{formatDoseText(value)}</p>
      <DosePicker value={value} onChange={setValue} ariaLabel="Morning" />
    </div>
  );
}

function wholeGroup() {
  return screen.getByRole('group', { name: 'Morning: whole tablets' });
}

function partGroup() {
  return screen.getByRole('group', { name: 'Morning: part tablet' });
}

function customInput() {
  return within(wholeGroup()).getByRole('textbox');
}

describe('DosePicker custom whole-tablets input', () => {
  it('shows a "Custom" placeholder when the current whole count is 0-4', () => {
    render(<Harness initialValue={1} />);

    expect(customInput()).toHaveValue('');
    expect(customInput()).toHaveAttribute('placeholder', 'Custom');
    expect(within(wholeGroup()).getByRole('button', { name: '1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('preselects the custom field when the stored whole count is above 4', () => {
    render(<Harness initialValue={7} />);

    expect(customInput()).toHaveValue('7');
    expect(screen.getByText('7 tablets')).toBeInTheDocument();
  });

  it('strips non-digit characters, accepting whole numbers only', () => {
    render(<Harness />);

    fireEvent.change(customInput(), { target: { value: 'a6b' } });

    expect(customInput()).toHaveValue('6');
    expect(screen.getByText('6 tablets')).toBeInTheDocument();
  });

  it('rejects a value above the cap of 10, leaving the field unchanged', () => {
    render(<Harness />);

    fireEvent.change(customInput(), { target: { value: '15' } });

    expect(customInput()).toHaveValue('');
    expect(screen.getByText('Not given')).toBeInTheDocument();
  });

  it('accepts exactly the cap value of 10', () => {
    render(<Harness />);

    fireEvent.change(customInput(), { target: { value: String(CUSTOM_WHOLE_MAX) } });

    expect(customInput()).toHaveValue('10');
    expect(screen.getByText('10 tablets')).toBeInTheDocument();
  });

  // FIX 1: the custom field and a fixed button must never both show as
  // selected, regardless of the value typed.
  it('typing "3" in the custom field sets the dose to 3 without pressing the fixed "3" button', () => {
    render(<Harness />);

    fireEvent.change(customInput(), { target: { value: '3' } });

    expect(screen.getByText('3 tablets')).toBeInTheDocument();
    expect(within(wholeGroup()).getByRole('button', { name: '3' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('typing "0" in the custom field sets the dose to 0 without pressing the fixed "0" button', () => {
    render(<Harness initialValue={2} />);

    fireEvent.change(customInput(), { target: { value: '0' } });

    expect(screen.getByText('Not given')).toBeInTheDocument();
    expect(within(wholeGroup()).getByRole('button', { name: '0' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  // FIX 2: emptying the custom field must clear the whole-tablets count,
  // so the field and the stored dose never disagree.
  it('typing "7" then emptying the field clears the dose to "Not given"', () => {
    render(<Harness />);

    fireEvent.change(customInput(), { target: { value: '7' } });
    expect(screen.getByText('7 tablets')).toBeInTheDocument();

    fireEvent.change(customInput(), { target: { value: '' } });

    expect(customInput()).toHaveValue('');
    expect(screen.getByText('Not given')).toBeInTheDocument();
  });

  it('typing "7", setting part to ½, then emptying the field leaves just the part tablet', () => {
    render(<Harness />);

    fireEvent.change(customInput(), { target: { value: '7' } });
    fireEvent.click(within(partGroup()).getByRole('button', { name: '½' }));
    expect(screen.getByText('7½ tablets')).toBeInTheDocument();

    fireEvent.change(customInput(), { target: { value: '' } });

    expect(customInput()).toHaveValue('');
    expect(screen.getByText('½ a tablet')).toBeInTheDocument();
  });

  it('clears the custom field when a fixed whole-tablets button is pressed', () => {
    render(<Harness />);

    fireEvent.change(customInput(), { target: { value: '7' } });
    expect(customInput()).toHaveValue('7');

    fireEvent.click(within(wholeGroup()).getByRole('button', { name: '2' }));

    expect(customInput()).toHaveValue('');
    expect(screen.getByText('2 tablets')).toBeInTheDocument();
    expect(within(wholeGroup()).getByRole('button', { name: '2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('clears the custom field when Clear is pressed', () => {
    render(<Harness initialValue={7.5} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(customInput()).toHaveValue('');
    expect(screen.getByText('Not given')).toBeInTheDocument();
  });

  // FIX 3: only the part-tablet row's zero option reads "None"; the
  // whole-tablets row keeps "0", so the two rows are never ambiguous.
  it('has exactly one button labelled "None" in the whole picker', () => {
    render(<Harness />);

    expect(screen.getAllByRole('button', { name: 'None' })).toHaveLength(1);
    expect(within(partGroup()).getByRole('button', { name: 'None' })).toBeInTheDocument();
  });

  // POLISH 1: an empty custom field must not read as selected, even though
  // wholeSource is still 'custom' at that point (FIX 2).
  it('drops the selected styling from the custom field once it is emptied', () => {
    render(<Harness />);

    fireEvent.change(customInput(), { target: { value: '7' } });
    expect(customInput()).toHaveClass('bg-teal-800');

    fireEvent.change(customInput(), { target: { value: '' } });

    expect(customInput()).not.toHaveClass('bg-teal-800');
    expect(customInput()).toHaveClass('border-slate-400');
  });

  // POLISH 2: pasting a value over the cap must reject the entry outright,
  // not silently truncate it to something that looks valid.
  it('rejects pasting "100" into an empty custom field, leaving it empty and the dose at 0', () => {
    render(<Harness />);

    fireEvent.change(customInput(), { target: { value: '100' } });

    expect(customInput()).toHaveValue('');
    expect(screen.getByText('Not given')).toBeInTheDocument();
  });

  it('rejects pasting "100" over an existing "3", leaving it at "3" and the dose at 3', () => {
    render(<Harness />);

    fireEvent.change(customInput(), { target: { value: '3' } });
    fireEvent.change(customInput(), { target: { value: '100' } });

    expect(customInput()).toHaveValue('3');
    expect(screen.getByText('3 tablets')).toBeInTheDocument();
  });
});

// The old additive picker toggled a tapped value off when it was already
// part of the dose: at 1½, tapping "1" removed the whole tablet and left
// 0.5. That silent halving is the reason this picker sets rather than
// toggles (SPEC.md §7, "Why the dose picker works this way"). This test
// exists to keep the spec's account of it true.
describe('DosePicker regression: tapping sets, never toggles', () => {
  it('leaves a 1½ dose unchanged when the already-selected whole-tablet "1" is tapped', () => {
    render(<Harness initialValue={1.5} />);

    const wholeOne = within(wholeGroup()).getByRole('button', { name: '1' });
    expect(screen.getByText('1½ tablets')).toBeInTheDocument();
    expect(wholeOne).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(wholeOne);

    expect(screen.getByText('1½ tablets')).toBeInTheDocument();
    expect(screen.queryByText('½ a tablet')).not.toBeInTheDocument();
    expect(within(wholeGroup()).getByRole('button', { name: '1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
