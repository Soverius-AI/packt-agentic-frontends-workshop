import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ReadingFilters } from './reading-filters';

describe('ReadingFilters', () => {
  it('emits user changes through Signal Forms and reflects later agent updates', async () => {
    const fixture = TestBed.createComponent(ReadingFilters);
    const filters = { from: '', to: '', roomId: '', metricId: '', shiftManager: '', condition: '' };
    for (const [name, value] of Object.entries({
      filters,
      rooms: [{ id: 'cooling', name: 'Cooling room' }],
      metrics: [],
      shiftManagers: [],
      start: 0,
      end: 0,
      total: 0,
    }))
      fixture.componentRef.setInput(name, value);
    const changed = vi.fn();
    fixture.componentInstance.filters.subscribe(changed);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const room = [...host.querySelectorAll('label')]
      .find((label) => label.textContent?.trim().startsWith('Room'))
      ?.querySelector('select');
    if (!room) throw new Error('Room filter not rendered');
    room.value = 'cooling';
    room.dispatchEvent(new Event('input', { bubbles: true }));
    room.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(changed).toHaveBeenLastCalledWith({ ...filters, roomId: 'cooling' });
    changed.mockClear();
    fixture.componentRef.setInput('filters', { ...filters, condition: 'critical' });
    await fixture.whenStable();
    expect(room.value).toBe('');
    const condition = [...host.querySelectorAll('label')]
      .find((label) => label.textContent?.trim().startsWith('Condition'))
      ?.querySelector('select');
    expect(condition?.value).toBe('critical');
    expect(changed).not.toHaveBeenCalled();
  });
});
