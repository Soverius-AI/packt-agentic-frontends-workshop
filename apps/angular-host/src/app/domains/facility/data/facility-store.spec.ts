import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  FacilityDashboard,
  FacilityReadingPage,
  MetricSummary,
  AlarmApprovalAuditEntry,
  AlarmApprovalRequest,
} from '@packt-workshop/contracts';
import { FacilityClient } from './facility-client';
import { FacilityStore } from './facility-store';
import type { HistorianSelection } from '../model/facility';

const metric: MetricSummary = {
  id: 'temperature',
  roomId: 'cooling',
  equipmentName: null,
  name: 'Air temperature',
  kind: 'numeric',
  unit: '°C',
  currentNumericValue: 17,
  currentTextValue: null,
  shiftManagerName: 'Pat',
  condition: 'normal',
  trend: 'Stable',
  target: '16–18',
  detail: 'Cooling',
  updatedAt: '2026-09-29T00:00:00Z',
  activeAlarm: null,
};
const dashboard: FacilityDashboard = {
  siteName: 'Demo',
  generatedAt: metric.updatedAt,
  activeAlarmCount: 0,
  shiftManagers: ['Pat'],
  rooms: [
    {
      id: 'cooling',
      name: 'Cooling room',
      areaType: 'cold',
      description: 'Demo',
      metrics: [metric],
    },
  ],
};
const page: FacilityReadingPage = { entries: [], total: 101, limit: 50, offset: 0 };
const result: HistorianSelection = {
  id: 'query-1',
  status: 'executed',
  question: 'Latest readings',
  sql: 'SELECT * FROM historian_readings',
  explanation: 'All readings',
  review: { approved: true, concerns: [] },
  policyVersion: 'test',
  entries: [],
  rowCount: 0,
  durationMs: 1,
  truncated: false,
};

function setup() {
  const stop = vi.fn();
  const client = {
    getAlarmApprovalAudit: vi.fn().mockResolvedValue({ entries: [] }),
    decideAlarmApproval: vi.fn(),
    getDashboard: vi.fn().mockResolvedValue(dashboard),
    getReadingEntries: vi.fn().mockResolvedValue(page),
    subscribeToMetricUpdates: vi.fn().mockReturnValue(stop),
  };
  TestBed.configureTestingModule({ providers: [{ provide: FacilityClient, useValue: client }] });
  const store = TestBed.inject(FacilityStore);
  return { store, client, stop };
}

beforeEach(() => TestBed.resetTestingModule());

describe('FacilityStore shared user and agent operations', () => {
  it('preserves omitted filters, resets pagination, and rejects unknown options without changing state', async () => {
    const { store, client, stop } = setup();
    await store.loadDashboard();
    await store.configureFacilityView({ action: 'set_view', view: 'reading-log' });
    store.goToReadingPage(1);
    await store.configureFacilityView({
      action: 'update_filters',
      filters: { roomId: 'cooling', shiftManager: 'Pat' },
    });
    expect(store.readingPageIndex()).toBe(0);
    await store.configureFacilityView({
      action: 'update_filters',
      filters: { condition: 'critical' },
    });
    expect(store.readingFilters()).toMatchObject({
      roomId: 'cooling',
      shiftManager: 'Pat',
      condition: 'critical',
    });
    const before = store.facilityViewState();
    const calls = client.getReadingEntries.mock.calls.length;
    expect(
      await store.configureFacilityView({
        action: 'update_filters',
        filters: { roomId: 'unknown' },
      }),
    ).toMatchObject({ ok: false });
    expect(store.facilityViewState()).toEqual(before);
    expect(client.getReadingEntries).toHaveBeenCalledTimes(calls);
    expect(stop).toHaveBeenCalledOnce();
  });

  it('accepts a query result once, stops live updates, and does not steal the view on repeated chat events', async () => {
    const { store, stop } = setup();
    await store.loadDashboard();
    store.showHistorianResult(result);
    expect(store.displayMode()).toBe('historian-result');
    expect(store.displayedReadingPage()?.entries).toEqual(result.entries);
    expect(stop).toHaveBeenCalledOnce();
    store.setDisplayMode('snapshot');
    store.showHistorianResult(result);
    expect(store.displayMode()).toBe('snapshot');
  });

  it('records a rejected approval and returns the authoritative execution result', async () => {
    const { store, client } = setup();
    await store.loadDashboard();
    const request: AlarmApprovalRequest = {
      correlationId: crypto.randomUUID(),
      proposal: { metricId: metric.id, metricName: metric.name, reason: 'Investigate' },
      decision: 'rejected',
      operatorId: 'demo',
    };
    const record: AlarmApprovalAuditEntry = {
      correlationId: request.correlationId,
      action: 'raise-alarm',
      ...request.proposal,
      decision: request.decision,
      operatorId: request.operatorId,
      decidedAt: metric.updatedAt,
      outcome: 'not-executed',
      alarmId: null,
      error: null,
    };
    client.decideAlarmApproval.mockResolvedValue(record);
    expect(await store.decideAlarmApproval(request)).toEqual(record);
    expect(client.decideAlarmApproval).toHaveBeenCalledWith(request);
    expect(store.alarmApprovals()).toEqual([record]);
  });

  it('closes the event stream on injector teardown', () => {
    const { stop } = setup();
    TestBed.resetTestingModule();
    expect(stop).toHaveBeenCalledOnce();
  });
});
