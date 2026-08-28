import { TestBed } from '@angular/core/testing';
import { CopilotKit, provideCopilotKit } from '@copilotkit/angular';
import type {
  FacilityDashboard,
  FacilityReadingPage,
  MetricAlarm,
  MetricHistory,
  MetricSummary,
  MetricUpdateEvent,
} from '@packt-workshop/contracts';
import { vi } from 'vitest';
import { App } from './app';
import { ChatComponent } from './chat/chat.component';
import { FacilityApi } from './facility-api';

const metric = (
  id: string,
  roomId: string,
  name: string,
  condition: MetricSummary['condition'],
): MetricSummary => ({
  id,
  roomId,
  equipmentName: null,
  name,
  kind: 'numeric',
  unit: '°C',
  currentNumericValue: 21.4,
  currentTextValue: null,
  shiftManagerName: 'Denise Weber',
  condition,
  trend: condition === 'warning' ? 'Rising for 30 min' : 'Stable',
  target: '16–18 °C',
  detail: 'Persisted facility measurement.',
  updatedAt: '2026-08-24T20:00:00.000Z',
  activeAlarm: null,
});

const dashboard: FacilityDashboard = {
  siteName: 'Soverius Chocolate Bar',
  generatedAt: '2026-08-24T20:00:00.000Z',
  activeAlarmCount: 0,
  shiftManagers: ['Charles Bond', 'Denise Weber', 'Martin Thompson'],
  rooms: [
    {
      id: 'cooling-room',
      name: 'Cooling room',
      areaType: 'Chocolate conditioning and storage',
      description: 'Chocolate rests before packaging.',
      metrics: [metric('cooling-air-temperature', 'cooling-room', 'Air temperature', 'warning')],
    },
    {
      id: 'packaging-hall',
      name: 'Packaging hall',
      areaType: 'Primary packaging',
      description: 'Chocolate is wrapped and checked.',
      metrics: [metric('packaging-air-temperature', 'packaging-hall', 'Air temperature', 'normal')],
    },
  ],
};

const { activeAlarm: _activeAlarm, ...historyMetric } = dashboard.rooms[0]!.metrics[0]!;

const history: MetricHistory = {
  metric: historyMetric,
  readings: [
    {
      recordedAt: '2026-08-24T19:55:00.000Z',
      numericValue: 17.2,
      textValue: null,
      shiftManagerName: 'Denise Weber',
    },
    {
      recordedAt: '2026-08-24T20:00:00.000Z',
      numericValue: 21.4,
      textValue: null,
      shiftManagerName: 'Denise Weber',
    },
  ],
};

const readingPage: FacilityReadingPage = {
  total: 2,
  limit: 50,
  offset: 0,
  entries: [
    {
      id: 1,
      recordedAt: '2026-08-24T20:00:00.000Z',
      roomId: 'cooling-room',
      roomName: 'Cooling room',
      metricId: 'cooling-air-temperature',
      metricName: 'Air temperature',
      unit: '°C',
      numericValue: 21.4,
      textValue: null,
      shiftManagerName: 'Denise Weber',
      condition: 'warning',
    },
    {
      id: 2,
      recordedAt: '2026-08-24T19:55:00.000Z',
      roomId: 'packaging-hall',
      roomName: 'Packaging hall',
      metricId: 'packaging-air-temperature',
      metricName: 'Air temperature',
      unit: '°C',
      numericValue: 22.4,
      textValue: null,
      shiftManagerName: 'Denise Weber',
      condition: 'normal',
    },
  ],
};

describe('App', () => {
  let liveUpdateListener: ((event: MetricUpdateEvent) => void) | undefined;
  const stopUpdates = vi.fn();
  const raisedAlarm: MetricAlarm = {
    id: 'ALARM-1',
    metricId: 'cooling-air-temperature',
    state: 'raised',
    raisedAt: '2026-08-24T20:00:00.000Z',
    updatedAt: '2026-08-24T20:00:00.000Z',
    operatorId: 'night-reception',
  };
  const api = {
    getDashboard: vi.fn(async () => dashboard),
    getReadingEntries: vi.fn(
      async (filters: { condition?: string; limit?: number; offset?: number }) => {
        const entries = filters.condition
          ? readingPage.entries.filter((entry) => entry.condition === filters.condition)
          : readingPage.entries;
        return {
          ...readingPage,
          limit: filters.limit ?? 50,
          offset: filters.offset ?? 0,
          entries,
          total: entries.length,
        };
      },
    ),
    getHistory: vi.fn(async () => history),
    raiseAlarm: vi.fn(async () => raisedAlarm),
    updateAlarm: vi.fn(async () => raisedAlarm),
    subscribeToMetricUpdates: vi.fn((listener: (event: MetricUpdateEvent) => void) => {
      liveUpdateListener = listener;
      return stopUpdates;
    }),
  };
  beforeEach(async () => {
    vi.clearAllMocks();
    liveUpdateListener = undefined;
    TestBed.overrideComponent(ChatComponent, {
      set: {
        imports: [],
        template: '<div data-testid="copilot-chat">CopilotKit chat</div>',
      },
    });
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideCopilotKit({ runtimeUrl: '/api/copilotkit' }),
        { provide: FacilityApi, useValue: api },
      ],
    }).compileComponents();
  });

  it('renders all metrics in one table with a room column', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.room')).toHaveLength(1);
    expect(compiled.querySelectorAll('.metrics-table')).toHaveLength(1);
    expect(compiled.querySelectorAll('.metrics-table .room-cell')).toHaveLength(2);
    expect(compiled.querySelectorAll('.metrics-table tbody tr')).toHaveLength(2);
    expect(compiled.querySelector('.mode-state')?.textContent).toContain('Snapshot live');
    expect(api.getReadingEntries).not.toHaveBeenCalled();
    expect(compiled.querySelector('h1')?.textContent).toContain('Incident Management');
    expect(compiled.querySelector<HTMLImageElement>('.corporate-logo')?.src).toContain(
      '/soverius-ai-original.png',
    );
    expect(compiled.querySelector<HTMLAnchorElement>('.corporate-logo-link')?.href).toBe(
      'https://soverius.ai/',
    );
    expect(compiled.querySelector<HTMLAnchorElement>('.corporate-logo-link')?.target).toBe(
      '_blank',
    );
    expect(compiled.textContent).toContain('Cooling room');
    expect(compiled.textContent).toContain('Packaging hall');
    expect(compiled.textContent).toContain('Denise Weber');
  });

  it('filters persisted reading entries by condition and clears the filter', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    Array.from(compiled.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      .find((button) => button.textContent?.includes('Reading log'))
      ?.click();
    await fixture.whenStable();
    const conditionSelect = Array.from(compiled.querySelectorAll('label'))
      .find((label) => label.textContent?.includes('Condition'))
      ?.querySelector('select');

    expect(conditionSelect).toBeTruthy();
    conditionSelect!.value = 'warning';
    conditionSelect!.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(compiled.querySelectorAll('.reading-entries-table tbody tr')).toHaveLength(1);
    expect(compiled.querySelector('.reading-entries-table tbody tr')?.textContent).toContain(
      'Cooling room',
    );
    expect(compiled.querySelector('.filter-heading')?.textContent).toContain(
      'Showing 1–1 of 1 readings',
    );

    compiled.querySelector<HTMLButtonElement>('.filter-heading button')?.click();
    await fixture.whenStable();
    expect(compiled.querySelectorAll('.reading-entries-table tbody tr')).toHaveLength(2);
  });

  it('clears each date boundary independently', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    Array.from(compiled.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      .find((button) => button.textContent?.includes('Reading log'))
      ?.click();
    await fixture.whenStable();
    const inputs = compiled.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');

    inputs[0]!.value = '2026-08-24T08:00';
    inputs[0]!.dispatchEvent(new Event('input'));
    inputs[1]!.value = '2026-08-24T16:00';
    inputs[1]!.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    compiled.querySelector<HTMLButtonElement>('[aria-label="Clear updated from"]')?.click();
    await fixture.whenStable();

    expect(inputs[0]!.value).toBe('');
    expect(inputs[1]!.value).toBe('2026-08-24T16:00');
  });

  it('raises an alarm for the selected metric through the backend', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector<HTMLButtonElement>(
      '[data-metric-id="cooling-air-temperature"] .alarm-action button',
    );

    button?.click();
    await fixture.whenStable();

    expect(api.raiseAlarm).toHaveBeenCalledWith('cooling-air-temperature');
    expect(compiled.querySelector('[role="status"]')?.textContent).toContain('facility database');
  });

  it('loads and renders historical readings for a metric', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector<HTMLButtonElement>(
      '[data-metric-id="cooling-air-temperature"] .history-button',
    );

    button?.click();
    await fixture.whenStable();

    expect(api.getHistory).toHaveBeenCalledWith('cooling-air-temperature');
    expect(compiled.querySelector('.history-panel')?.textContent).toContain('2 persisted readings');
    expect(
      Array.from(compiled.querySelectorAll('.y-axis-label')).map((label) =>
        label.textContent?.trim(),
      ),
    ).toEqual(['21.4 °C', '19.3 °C', '17.2 °C']);
  });

  it('runs live updates in snapshot mode and stops them in reading log mode', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(api.subscribeToMetricUpdates).toHaveBeenCalledOnce();

    const updatedMetric = {
      ...dashboard.rooms[0]!.metrics[0]!,
      currentNumericValue: 22.1,
      updatedAt: '2026-08-24T20:00:02.000Z',
    };
    liveUpdateListener?.({ type: 'metric.updated', metric: updatedMetric });
    await fixture.whenStable();

    const row = compiled.querySelector('[data-metric-id="cooling-air-temperature"]');
    expect(row?.classList.contains('live-updated')).toBe(true);
    expect(row?.textContent).toContain('22.1');

    Array.from(compiled.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      .find((button) => button.textContent?.includes('Reading log'))
      ?.click();
    await fixture.whenStable();
    expect(stopUpdates).toHaveBeenCalledOnce();
    expect(compiled.querySelector('.reading-entries-table')).toBeTruthy();
    expect(compiled.querySelector('.metrics-table')).toBeNull();
  });

  it('requests 50 readings per page and advances with the next button', async () => {
    api.getReadingEntries.mockImplementation(
      async (filters: { condition?: string; limit?: number; offset?: number }) => {
        const offset = filters.offset ?? 0;
        const count = offset === 0 ? 50 : 25;
        return {
          ...readingPage,
          total: 75,
          limit: 50,
          offset,
          entries: Array.from({ length: count }, (_, index) => ({
            ...readingPage.entries[0]!,
            id: offset + index + 1,
            recordedAt: new Date(
              Date.parse('2026-08-24T20:00:00.000Z') - index * 1000,
            ).toISOString(),
          })),
        };
      },
    );
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    Array.from(compiled.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      .find((button) => button.textContent?.includes('Reading log'))
      ?.click();
    await fixture.whenStable();

    expect(compiled.querySelectorAll('.reading-entries-table tbody tr')).toHaveLength(50);
    expect(api.getReadingEntries).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 50, offset: 0 }),
    );

    Array.from(compiled.querySelectorAll<HTMLButtonElement>('.pagination button'))
      .find((button) => button.textContent?.includes('Next'))
      ?.click();
    await fixture.whenStable();

    expect(compiled.querySelectorAll('.reading-entries-table tbody tr')).toHaveLength(25);
    expect(compiled.querySelector('.pagination')?.textContent).toContain('Page 2 of 2');
    expect(api.getReadingEntries).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 50, offset: 50 }),
    );
  });

  it('patches the facility view through the frontend tool without resetting other filters', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const copilotKit = TestBed.inject(CopilotKit);
    const setView = copilotKit.core.getTool({
      toolName: 'set_view',
      agentId: 'default',
    })?.handler as ((args: unknown) => Promise<unknown>) | undefined;
    const updateFilters = copilotKit.core.getTool({
      toolName: 'update_filters',
      agentId: 'default',
    })?.handler as ((args: unknown) => Promise<unknown>) | undefined;

    expect(setView).toBeTruthy();
    expect(updateFilters).toBeTruthy();
    await setView!({ view: 'reading-log' });
    await updateFilters!({
      filters: { roomId: 'cooling-room', condition: 'warning', from: '2026-08-25T08:00' },
    });
    await updateFilters!({ filters: { from: 'now' } });
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const inputs = compiled.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
    const selects = compiled.querySelectorAll<HTMLSelectElement>('.filter-grid select');
    expect(inputs[0]!.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(Array.from(selects, (select) => select.value)).toEqual([
      '',
      'cooling-room',
      '',
      'warning',
    ]);
    expect(compiled.querySelector('.reading-entries-table')).toBeTruthy();
  });

  it('lists rooms, metrics, shift managers, and conditions through read-only tools', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const copilotKit = TestBed.inject(CopilotKit);
    const handler = (toolName: string) =>
      copilotKit.core.getTool({ toolName, agentId: 'default' })?.handler as
        ((args: unknown) => Promise<unknown>) | undefined;

    await expect(handler('list_rooms')!({})).resolves.toEqual({
      rooms: [
        { id: 'cooling-room', name: 'Cooling room' },
        { id: 'packaging-hall', name: 'Packaging hall' },
      ],
    });
    await expect(handler('list_metrics')!({ roomId: 'Cooling room' })).resolves.toMatchObject({
      metrics: [
        expect.objectContaining({
          id: 'cooling-air-temperature',
          name: 'Air temperature',
          roomId: 'cooling-room',
        }),
      ],
    });
    await expect(handler('list_shift_managers')!({})).resolves.toEqual({
      shiftManagers: dashboard.shiftManagers,
    });
    await expect(handler('list_conditions')!({})).resolves.toEqual({
      conditions: ['normal', 'warning', 'critical', 'unavailable'],
    });
  });

  it('rejects malformed frontend tool payloads instead of reporting a false update', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const runTool = TestBed.inject(CopilotKit).core.getTool({
      toolName: 'update_filters',
      agentId: 'default',
    })?.handler as ((args: unknown) => Promise<unknown>) | undefined;

    await expect(
      runTool!({
        filters: { condition: 'warning', roomId: 'Cooling room' },
        view: 'reading-log',
      }),
    ).resolves.toMatchObject({ ok: false });
    await expect(runTool!({ filters: { roomId: 'room-cooling-01' } })).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/Unknown roomId/),
    });
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain(
      'Snapshot',
    );
    expect(compiled.querySelector('.reading-entries-table')).toBeNull();
  });

  it('presents the Step 5 frontend-tool milestone without historian access', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Stage 5 · Frontend tools');
    expect(compiled.textContent).toMatch(/CopilotKit chat|Loading the streaming chat/);
    expect(api.getDashboard).toHaveBeenCalledOnce();
  });
});
