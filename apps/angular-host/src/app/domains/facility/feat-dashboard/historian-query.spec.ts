import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi } from 'vitest';
import type { HistorianToolResult } from '@packt-workshop/contracts';
import { HistorianQuery } from './historian-query';
import { FacilityClient } from '../data/facility-client';
import { FacilityStore } from '../data/facility-store';

const base = {
  question: 'Latest readings',
  sql: 'SELECT * FROM historian_readings',
  explanation: 'Select complete readings',
  policyVersion: 'test',
  review: { approved: true, summary: 'Reviewed', concerns: [] },
};

describe('Backend-only historian form', () => {
  it.each<HistorianToolResult>([
    { ...base, status: 'executed', entries: [], rowCount: 0, truncated: false, durationMs: 1 },
    {
      ...base,
      status: 'rejected',
      stage: 'reviewer',
      code: 'unsupported',
      message: 'Unsupported query',
    },
  ])('hands off only executed results: $status', async (result) => {
    const investigate = vi.fn().mockResolvedValue(result);
    const showHistorianResult = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: FacilityClient, useValue: { investigate } },
        { provide: FacilityStore, useValue: { showHistorianResult } },
      ],
    });
    const fixture = TestBed.createComponent(HistorianQuery);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const field = host.querySelector('textarea')!;
    expect(host.querySelector('button')!.disabled).toBe(true);
    field.value = ' Latest readings ';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    host
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(investigate).toHaveBeenCalledExactlyOnceWith('Latest readings');
    if (result.status === 'executed') {
      expect(showHistorianResult).toHaveBeenCalledWith({ ...result, id: expect.any(String) });
      expect(host.textContent).toContain('0 readings found');
    } else {
      expect(showHistorianResult).not.toHaveBeenCalled();
      expect(host.querySelector('[role="alert"]')?.textContent).toContain('Unsupported query');
    }
  });
});
