import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DosePicker } from './DosePicker';

afterEach(cleanup);

describe('DosePicker custom whole-tablets input', () => {
  it('shows a "Custom" placeholder when the current whole count is 0-4', () => {
    render(<DosePicker value={1} onChange={() => {}} ariaLabel="Morning" />);

    const wholeGroup = screen.getByRole('group', { name: 'Morning: whole tablets' });
    const customInput = within(wholeGroup).getByRole('textbox');
    expect(customInput).toHaveValue('');
    expect(customInput).toHaveAttribute('placeholder', 'Custom');
    expect(within(wholeGroup).getByRole('button', { name: '1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('preselects the custom field when the stored whole count is above 4', () => {
    render(<DosePicker value={7} onChange={() => {}} ariaLabel="Morning" />);

    const wholeGroup = screen.getByRole('group', { name: 'Morning: whole tablets' });
    expect(within(wholeGroup).getByRole('textbox')).toHaveValue('7');
  });

  it('typing a whole number sets the dose through the custom field', () => {
    const onChange = vi.fn();
    render(<DosePicker value={0} onChange={onChange} ariaLabel="Morning" />);

    const wholeGroup = screen.getByRole('group', { name: 'Morning: whole tablets' });
    const customInput = within(wholeGroup).getByRole('textbox');
    fireEvent.change(customInput, { target: { value: '7' } });

    expect(onChange).toHaveBeenLastCalledWith(7);
    expect(customInput).toHaveValue('7');
  });

  it('strips non-digit characters, accepting whole numbers only', () => {
    const onChange = vi.fn();
    render(<DosePicker value={0} onChange={onChange} ariaLabel="Morning" />);

    const customInput = within(
      screen.getByRole('group', { name: 'Morning: whole tablets' }),
    ).getByRole('textbox');
    fireEvent.change(customInput, { target: { value: 'a6b' } });

    expect(onChange).toHaveBeenLastCalledWith(6);
    expect(customInput).toHaveValue('6');
  });

  it('rejects a value above the cap of 10, leaving the field unchanged', () => {
    const onChange = vi.fn();
    render(<DosePicker value={0} onChange={onChange} ariaLabel="Morning" />);

    const customInput = within(
      screen.getByRole('group', { name: 'Morning: whole tablets' }),
    ).getByRole('textbox');
    fireEvent.change(customInput, { target: { value: '15' } });

    expect(onChange).not.toHaveBeenCalled();
    expect(customInput).toHaveValue('');
  });

  it('accepts exactly the cap value of 10', () => {
    const onChange = vi.fn();
    render(<DosePicker value={0} onChange={onChange} ariaLabel="Morning" />);

    const customInput = within(
      screen.getByRole('group', { name: 'Morning: whole tablets' }),
    ).getByRole('textbox');
    fireEvent.change(customInput, { target: { value: '10' } });

    expect(onChange).toHaveBeenLastCalledWith(10);
    expect(customInput).toHaveValue('10');
  });

  it('clears the custom field when a fixed whole-tablets button is pressed', () => {
    const onChange = vi.fn();
    render(<DosePicker value={7} onChange={onChange} ariaLabel="Morning" />);

    const wholeGroup = screen.getByRole('group', { name: 'Morning: whole tablets' });
    expect(within(wholeGroup).getByRole('textbox')).toHaveValue('7');

    fireEvent.click(within(wholeGroup).getByRole('button', { name: '2' }));

    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(within(wholeGroup).getByRole('textbox')).toHaveValue('');
  });

  it('clears the custom field when Clear is pressed', () => {
    const onChange = vi.fn();
    render(<DosePicker value={7.5} onChange={onChange} ariaLabel="Morning" />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onChange).toHaveBeenLastCalledWith(0);
    const wholeGroup = screen.getByRole('group', { name: 'Morning: whole tablets' });
    expect(within(wholeGroup).getByRole('textbox')).toHaveValue('');
  });
});
