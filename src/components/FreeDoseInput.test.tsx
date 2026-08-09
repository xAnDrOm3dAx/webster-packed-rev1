import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { FreeDoseInput } from './FreeDoseInput';

afterEach(cleanup);

function Harness({ initialValue = 0 }: { initialValue?: number }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div>
      <p>Stored: {value}</p>
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

  it('stores a decimal amount as typed', () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: '7.5' } });
    expect(screen.getByText('Stored: 7.5')).toBeInTheDocument();
  });

  it('clearing the field sets the dose back to 0', () => {
    render(<Harness initialValue={5} />);
    fireEvent.change(input(), { target: { value: '' } });
    expect(input()).toHaveValue('');
    expect(screen.getByText('Stored: 0')).toBeInTheDocument();
  });

  it('ignores non-numeric text, leaving the stored dose unchanged', () => {
    render(<Harness initialValue={2} />);
    fireEvent.change(input(), { target: { value: '2 puffs' } });
    expect(screen.getByText('Stored: 2')).toBeInTheDocument();
  });
});
