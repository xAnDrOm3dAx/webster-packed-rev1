import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { emptyDoses } from '../lib/medicationForm';
import type { Slot } from '../types';
import { DoseTimeList } from './DoseTimeList';

afterEach(cleanup);

// Lifts state the way MedicationForm does, so DoseTimeList is exercised
// against the real dose logic (splitQuantity/combineDose/formatDoseText),
// not a copy or a mock.
function Harness({ variant }: { variant?: 'tablet' | 'freeText' } = {}) {
  const [doses, setDoses] = useState(emptyDoses());
  return (
    <DoseTimeList
      doses={doses}
      onChange={(slot: Slot, value: number) => setDoses((d) => ({ ...d, [slot]: value }))}
      variant={variant}
    />
  );
}

describe('DoseTimeList', () => {
  it('renders all four rows collapsed on initial render', () => {
    render(<Harness />);

    const rows = screen.getAllByRole('button', { expanded: false });
    expect(rows).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Morning.*Not given/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Noon.*Not given/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Evening.*Not given/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Night.*Not given/ })).toBeInTheDocument();
  });

  it('expanding a second row collapses the first', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: /Morning/ }));
    expect(screen.getByRole('button', { name: /Morning/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Morning: whole tablets' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Noon/ }));
    expect(screen.getByRole('button', { name: /Morning/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /Noon/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('group', { name: 'Morning: whole tablets' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Noon: whole tablets' })).toBeInTheDocument();
  });

  it('tapping the header of an expanded row collapses it', () => {
    render(<Harness />);

    const morningHeader = screen.getByRole('button', { name: /Morning/ });
    fireEvent.click(morningHeader);
    expect(morningHeader).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(morningHeader);
    expect(morningHeader).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group', { name: 'Morning: whole tablets' })).not.toBeInTheDocument();
  });

  it('setting whole=2 with part unchanged at None produces 2 / "2 tablets"', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: /Morning/ }));
    const wholeGroup = screen.getByRole('group', { name: 'Morning: whole tablets' });
    fireEvent.click(within(wholeGroup).getByRole('button', { name: '2' }));

    expect(screen.getByRole('button', { name: /Morning.*2 tablets/ })).toBeInTheDocument();
    const partGroup = screen.getByRole('group', { name: 'Morning: part tablet' });
    expect(within(partGroup).getByRole('button', { name: 'None' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('clear returns whole=0, part=None, "Not given"', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: /Morning/ }));
    const wholeGroup = screen.getByRole('group', { name: 'Morning: whole tablets' });
    const partGroup = screen.getByRole('group', { name: 'Morning: part tablet' });
    fireEvent.click(within(wholeGroup).getByRole('button', { name: '2' }));
    fireEvent.click(within(partGroup).getByRole('button', { name: '½' }));
    expect(screen.getByRole('button', { name: /Morning.*2½ tablets/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByRole('button', { name: /Morning.*Not given/ })).toBeInTheDocument();
    expect(within(wholeGroup).getByRole('button', { name: '0' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(partGroup).getByRole('button', { name: 'None' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  // POLISH 3: wholeSource/customText must survive the picker being
  // collapsed and re-expanded, so a dose entered via the custom field
  // doesn't reappear looking like it was entered via a fixed button.
  it('preserves the custom field across a row collapsing and re-expanding', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: /Morning/ }));
    const wholeGroup = () => screen.getByRole('group', { name: 'Morning: whole tablets' });
    fireEvent.change(within(wholeGroup()).getByRole('textbox'), { target: { value: '3' } });
    expect(screen.getByRole('button', { name: /Morning.*3 tablets/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Morning/ }));
    fireEvent.click(screen.getByRole('button', { name: /Morning/ }));

    expect(within(wholeGroup()).getByRole('textbox')).toHaveValue('3');
    expect(within(wholeGroup()).getByRole('button', { name: '3' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});

// The medication's Form field (tablet/capsule vs injection/inhaler/liquid/
// other) decides which dose control shows up, not just whether it goes in
// the pack — see the note added to SPEC.md section 5.
describe('DoseTimeList freeText variant (non-tablet forms)', () => {
  it('shows a plain amount field instead of the whole/part-tablet picker', () => {
    render(<Harness variant="freeText" />);

    fireEvent.click(screen.getByRole('button', { name: /Morning/ }));

    expect(screen.queryByRole('group', { name: 'Morning: whole tablets' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Morning: dose' })).toBeInTheDocument();
  });

  it('stores a typed amount and displays it without tablet wording', () => {
    render(<Harness variant="freeText" />);

    fireEvent.click(screen.getByRole('button', { name: /Morning/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Morning: dose' }), {
      target: { value: '5' },
    });

    expect(screen.getByRole('button', { name: 'Morning, 5' })).toBeInTheDocument();
  });

  it('shows "Not given" for a zero dose, same as the tablet variant', () => {
    render(<Harness variant="freeText" />);

    expect(screen.getByRole('button', { name: /Morning.*Not given/ })).toBeInTheDocument();
  });
});
