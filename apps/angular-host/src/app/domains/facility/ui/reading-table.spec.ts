import { TestBed } from '@angular/core/testing';
import { expect, it } from 'vitest';
import { ReadingTable } from './reading-table';

it('renders aggregate rows in the existing columns without fabricated metadata', async () => {
  const fixture = TestBed.createComponent(ReadingTable);
  fixture.componentRef.setInput('historian', true);
  fixture.componentRef.setInput('entries', [
    { shiftManagerName: 'Pat', numericValue: 24, unit: '°C' },
    { shiftManagerName: 'Alex', numericValue: 26, unit: '°C' },
  ]);
  await fixture.whenStable();
  const host: HTMLElement = fixture.nativeElement;
  const rows = host.querySelectorAll('tbody tr');
  expect(rows.length).toBe(2);
  expect(rows[0].textContent).toContain('24 °C');
  expect(rows[1].textContent).toContain('26 °C');
  expect(host.querySelector('time')).toBeNull();
  expect(host.querySelector('.condition-badge')).toBeNull();
  expect(host.textContent).not.toMatch(/NaN|undefined|Invalid Date/);
});
