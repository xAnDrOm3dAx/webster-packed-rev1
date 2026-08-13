import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { formatFreeDoseText } from '../lib/quantity';
import { FreeDoseInput } from './FreeDoseInput';

afterEach(cleanup);

// A real controlled parent, the way DoseTimeList uses FreeDoseInput: `value`
// is state, and onChange is its setter, so the field's own onChange calls
// flow back in as new props exactly as they would in the app.
function Harness({ initialValue = 0 }: { initialValue?: number }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div>
      <p>Stored: {value}</p>
      <p>{formatFreeDoseText(value)}</p>
      <FreeDoseInput value={value} onChange={setValue} ariaLabel="Morning" />
    </div>
  );
}

function input() {
  return screen.getByRole('textbox', { name: 'Morning: dose' });
}

describe('FreeDoseInput', () => {
  it('starts empty when the dose is 0', () => {
    render(<Harness />);
    expect(input()).toHaveValue('');
  });

  it('preselects the typed amount when the dose is already set', () => {
    render(<Harness initialValue={5} />);
    expect(input()).toHaveValue('5');
  });

  // FIX 1: the field and the stored dose must never disagree — typing
  // "abc" over a dose of 5 must not leave "abc" in the field with 5 still
  // stored.
  it('typing "abc" over a stored dose of 5 clears both the field and the dose', () => {
    render(<Harness initialValue={5} />);

    fireEvent.change(input(), { target: { value: 'abc' } });

    expect(input()).toHaveValue('');
    expect(screen.getByText('Stored: 0')).toBeInTheDocument();
  });

  it('strips a minus sign: "-3" becomes 3', () => {
    render(<Harness />);

    fireEvent.change(input(), { target: { value: '-3' } });

    expect(input()).toHaveValue('3');
    expect(screen.getByText('Stored: 3')).toBeInTheDocument();
  });

  it('stores a decimal amount as typed', () => {
    render(<Harness />);

    fireEvent.change(input(), { target: { value: '2.5' } });

    expect(input()).toHaveValue('2.5');
    expect(screen.getByText('Stored: 2.5')).toBeInTheDocument();
  });

  it('keeps a trailing decimal point in the field and commits the whole number', () => {
    render(<Harness />);

    fireEvent.change(input(), { target: { value: '2.' } });

    expect(input()).toHaveValue('2.');
    expect(screen.getByText('Stored: 2')).toBeInTheDocument();
  });

  // Stripping "e" at entry also removes the scientific-notation path.
  it('strips the letter "e": "1e5" becomes 15, not 100000', () => {
    render(<Harness />);

    fireEvent.change(input(), { target: { value: '1e5' } });

    expect(input()).toHaveValue('15');
    expect(screen.getByText('Stored: 15')).toBeInTheDocument();
  });

  // FIX 2: entries above the cap are rejected outright, not truncated.
  it('rejects an amount above the cap, leaving the field and dose unchanged', () => {
    render(<Harness />);

    fireEvent.change(input(), { target: { value: '1000' } });

    expect(input()).toHaveValue('');
    expect(screen.getByText('Stored: 0')).toBeInTheDocument();
  });

  it('rejects an over-cap entry over an existing value, leaving it as it was', () => {
    render(<Harness initialValue={5} />);

    fireEvent.change(input(), { target: { value: '1000' } });

    expect(input()).toHaveValue('5');
    expect(screen.getByText('Stored: 5')).toBeInTheDocument();
  });

  it('clearing the field sets the dose back to 0, and the row reads "Not given"', () => {
    render(<Harness initialValue={5} />);

    fireEvent.change(input(), { target: { value: '' } });

    expect(input()).toHaveValue('');
    expect(screen.getByText('Stored: 0')).toBeInTheDocument();
    expect(screen.getByText('Not given')).toBeInTheDocument();
  });

  it('shows the unit after the field and folds it into the aria-label', () => {
    function UnitHarness() {
      const [value, setValue] = useState(0);
      return <FreeDoseInput value={value} onChange={setValue} ariaLabel="Morning" unit="ml" />;
    }
    render(<UnitHarness />);

    expect(screen.getByRole('textbox', { name: 'Morning: dose in ml' })).toBeInTheDocument();
    expect(screen.getByText('ml')).toBeInTheDocument();
  });
});
