import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { connectAgentContext, registerFrontendTool } from '@copilotkit/angular';
import type {
  ConfigureFacilityView,
  FacilityDashboard,
  FacilityReadingEntry,
  FacilityReadingPage,
  FacilityViewState,
  MetricHistory,
  MetricReading,
  MetricSummary,
  MetricUpdateEvent,
  ShowHistorianReadingsToolInput,
} from '@packt-workshop/contracts';
import {
  applyFacilityViewCommand,
  clearFiltersToolSchema,
  getUserTimeZone,
  listConditionsToolSchema,
  listMetricsToolSchema,
  listRoomsToolSchema,
  listShiftManagersToolSchema,
  metricConditionSchema,
  resolveFacilityViewDates,
  resolveFacilityViewAvailableOptions,
  setViewToolSchema,
  showHistorianReadingsToolSchema,
  updateFiltersToolSchema,
} from '@packt-workshop/contracts';
import { ChatComponent } from './chat/chat.component';
import { FacilityApi } from './facility-api';

type DisplayMode = 'snapshot' | 'reading-log' | 'historian-result';
const READING_PAGE_SIZE = 50;

@Component({
  selector: 'app-root',
  imports: [ChatComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly #api = inject(FacilityApi);
  readonly #destroyRef = inject(DestroyRef);
  #stopMetricUpdates: (() => void) | undefined;

  protected readonly dashboard = signal<FacilityDashboard | undefined>(undefined);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly busyMetricId = signal<string | undefined>(undefined);
  protected readonly historyLoading = signal(false);
  protected readonly selectedHistory = signal<MetricHistory | undefined>(undefined);
  protected readonly selectedMetricId = signal<string | undefined>(undefined);
  protected readonly continuousUpdates = signal(false);
  protected readonly displayMode = signal<DisplayMode>('snapshot');
  protected readonly latestUpdatedMetricId = signal<string | undefined>(undefined);
  protected readonly status = signal('Connecting to the facility database…');
  protected readonly readingPage = signal<FacilityReadingPage | undefined>(undefined);
  protected readonly readingsLoading = signal(false);
  protected readonly readingPageIndex = signal(0);
  protected readonly updatedFrom = signal('');
  protected readonly updatedTo = signal('');
  protected readonly shiftManagerFilter = signal('');
  protected readonly roomFilter = signal('');
  protected readonly metricFilter = signal('');
  protected readonly conditionFilter = signal('');
  protected readonly historianResult = signal<ShowHistorianReadingsToolInput | undefined>(
    undefined,
  );
  protected readonly rooms = computed(() => this.dashboard()?.rooms ?? []);
  protected readonly activeAlarmCount = computed(() => this.dashboard()?.activeAlarmCount ?? 0);
  protected readonly shiftManagerOptions = computed(() => this.dashboard()?.shiftManagers ?? []);
  protected readonly metricOptions = computed(() =>
    this.rooms().flatMap((room) =>
      room.metrics.map((metric) => ({
        id: metric.id,
        label: `${room.name} · ${metric.name}`,
      })),
    ),
  );
  protected readonly facilityViewState = computed<FacilityViewState>(() => ({
    view: this.displayMode() === 'snapshot' ? ('snapshot' as const) : ('reading-log' as const),
    filters: {
      from: this.updatedFrom() || null,
      to: this.updatedTo() || null,
      shiftManager: this.shiftManagerFilter() || null,
      roomId: this.roomFilter() || null,
      metricId: this.metricFilter() || null,
      condition: metricConditionSchema.safeParse(this.conditionFilter()).data ?? null,
    },
  }));
  protected readonly currentRows = computed(() =>
    this.rooms().flatMap((room) => room.metrics.map((metric) => ({ room, metric }))),
  );
  protected readonly displayedReadingPage = computed<FacilityReadingPage | undefined>(() => {
    const result = this.historianResult();
    if (this.displayMode() !== 'historian-result' || !result) return this.readingPage();
    return {
      entries: result.entries,
      total: result.entries.length,
      limit: Math.max(1, result.entries.length),
      offset: 0,
    };
  });
  protected readonly readingPageCount = computed(() =>
    Math.max(1, Math.ceil((this.displayedReadingPage()?.total ?? 0) / READING_PAGE_SIZE)),
  );
  protected readonly readingPageStart = computed(() => {
    const page = this.displayedReadingPage();
    return page && page.total > 0 ? page.offset + 1 : 0;
  });
  protected readonly readingPageEnd = computed(() => {
    const page = this.displayedReadingPage();
    return page ? page.offset + page.entries.length : 0;
  });

  constructor() {
    connectAgentContext(() => ({
      description:
        'Current facility view, active filters, and user timezone. This context contains no option catalogs, readings, alarm records, or historian results.',
      value: JSON.stringify({
        ...this.facilityViewState(),
        userTimeZone: getUserTimeZone(),
      }),
    }));
    registerFrontendTool({
      name: 'list_rooms',
      description:
        'List the rooms currently supported by the facility application. Use this tool when the user asks which rooms exist or before selecting a room filter.',
      parameters: listRoomsToolSchema,
      agentId: 'default',
      followUp: true,
      handler: async (input) => {
        const validation = listRoomsToolSchema.safeParse(input);
        if (!validation.success)
          return this.#invalidToolPayload(validation.error.issues[0]?.message);
        return { rooms: this.rooms().map(({ id, name }) => ({ id, name })) };
      },
    });
    registerFrontendTool({
      name: 'list_metrics',
      description:
        'List supported facility metrics. Optionally provide a room ID returned by list_rooms to restrict the result to that room.',
      parameters: listMetricsToolSchema,
      agentId: 'default',
      followUp: true,
      handler: async (input) => this.#listMetrics(input),
    });
    registerFrontendTool({
      name: 'list_shift_managers',
      description: 'List the shift managers currently available for reading-log filtering.',
      parameters: listShiftManagersToolSchema,
      agentId: 'default',
      followUp: true,
      handler: async (input) => {
        const validation = listShiftManagersToolSchema.safeParse(input);
        if (!validation.success)
          return this.#invalidToolPayload(validation.error.issues[0]?.message);
        return { shiftManagers: this.shiftManagerOptions() };
      },
    });
    registerFrontendTool({
      name: 'list_conditions',
      description: 'List the reading conditions supported by the reading-log filter.',
      parameters: listConditionsToolSchema,
      agentId: 'default',
      followUp: true,
      handler: async (input) => {
        const validation = listConditionsToolSchema.safeParse(input);
        if (!validation.success)
          return this.#invalidToolPayload(validation.error.issues[0]?.message);
        return { conditions: ['normal', 'warning', 'critical', 'unavailable'] };
      },
    });
    registerFrontendTool({
      name: 'show_historian_readings',
      description:
        'Display complete reading records returned by query_historian in the dedicated Historian result view. Copy question, entries, and truncated exactly from the successful backend tool result.',
      parameters: showHistorianReadingsToolSchema,
      agentId: 'default',
      followUp: true,
      handler: async (input) => {
        const validation = showHistorianReadingsToolSchema.safeParse(input);
        if (!validation.success)
          return this.#invalidToolPayload(validation.error.issues[0]?.message);
        this.historianResult.set(validation.data);
        this.displayMode.set('historian-result');
        this.closeHistory();
        this.#stopContinuousUpdates();
        this.status.set(
          `Showing ${validation.data.entries.length} readings selected by the reviewed historian query.`,
        );
        return { ok: true, displayedRows: validation.data.entries.length };
      },
    });
    registerFrontendTool({
      name: 'set_view',
      description:
        'Switch the visible facility view between snapshot and reading-log. Existing filters are preserved.',
      parameters: setViewToolSchema,
      agentId: 'default',
      followUp: true,
      handler: async (input) => {
        const validation = setViewToolSchema.safeParse(input);
        if (!validation.success)
          return this.#invalidToolPayload(validation.error.issues[0]?.message);
        return this.#configureFacilityView({ action: 'set_view', ...validation.data });
      },
    });
    registerFrontendTool({
      name: 'update_filters',
      description:
        'Patch only the supplied reading-log filters and preserve all omitted filters. Use IDs returned by the list tools and the condition field returned by list_conditions. The literal "now" means the browser current time.',
      parameters: updateFiltersToolSchema,
      agentId: 'default',
      followUp: true,
      handler: async (input) => {
        const validation = updateFiltersToolSchema.safeParse(input);
        if (!validation.success)
          return this.#invalidToolPayload(validation.error.issues[0]?.message);
        return this.#configureFacilityView({ action: 'update_filters', ...validation.data });
      },
    });
    registerFrontendTool({
      name: 'clear_filters',
      description:
        'Clear the selected reading-log filters. Omit the filters list to clear every filter. The current view is preserved.',
      parameters: clearFiltersToolSchema,
      agentId: 'default',
      followUp: true,
      handler: async (input) => {
        const validation = clearFiltersToolSchema.safeParse(input);
        if (!validation.success)
          return this.#invalidToolPayload(validation.error.issues[0]?.message);
        return this.#configureFacilityView({ action: 'clear_filters', ...validation.data });
      },
    });
    this.#destroyRef.onDestroy(() => this.#stopMetricUpdates?.());
    this.#startContinuousUpdates();
    void this.loadDashboard();
  }

  async #listMetrics(input: unknown): Promise<unknown> {
    const validation = listMetricsToolSchema.safeParse(input);
    if (!validation.success) return this.#invalidToolPayload(validation.error.issues[0]?.message);

    let roomId = validation.data.roomId;
    if (roomId) {
      try {
        const resolved = resolveFacilityViewAvailableOptions(
          { action: 'update_filters', filters: { roomId } },
          this.#availableFilterOptions(),
        );
        roomId =
          resolved.action === 'update_filters' ? (resolved.filters.roomId ?? undefined) : roomId;
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Invalid room option.',
        };
      }
    }

    return {
      metrics: this.rooms()
        .filter((room) => !roomId || room.id === roomId)
        .flatMap((room) =>
          room.metrics.map((metric) => ({
            id: metric.id,
            name: metric.name,
            roomId: room.id,
            roomName: room.name,
            kind: metric.kind,
            unit: metric.unit,
          })),
        ),
    };
  }

  async #configureFacilityView(command: ConfigureFacilityView): Promise<unknown> {
    let validatedCommand = command;
    try {
      validatedCommand = resolveFacilityViewAvailableOptions(
        validatedCommand,
        this.#availableFilterOptions(),
      );
    } catch (error) {
      return {
        ok: false,
        state: this.facilityViewState(),
        error: error instanceof Error ? error.message : 'Invalid facility filter option.',
      };
    }
    const next = resolveFacilityViewDates(
      applyFacilityViewCommand(this.facilityViewState(), validatedCommand),
    );
    const nextDisplayMode: DisplayMode = next.view === 'snapshot' ? 'snapshot' : 'reading-log';
    const viewChanged = nextDisplayMode !== this.displayMode();

    this.updatedFrom.set(next.filters.from ?? '');
    this.updatedTo.set(next.filters.to ?? '');
    this.shiftManagerFilter.set(next.filters.shiftManager ?? '');
    this.roomFilter.set(next.filters.roomId ?? '');
    this.metricFilter.set(next.filters.metricId ?? '');
    this.conditionFilter.set(next.filters.condition ?? '');
    this.readingPageIndex.set(0);

    if (viewChanged) {
      this.displayMode.set(nextDisplayMode);
      this.closeHistory();
      if (nextDisplayMode === 'snapshot') this.#startContinuousUpdates();
      else this.#stopContinuousUpdates();
    }
    if (nextDisplayMode === 'reading-log') await this.loadReadingEntries();

    this.status.set('The assistant updated the facility view.');
    return {
      ok: true,
      state: next,
      message: 'Facility view updated. Unspecified values were preserved.',
    };
  }

  #invalidToolPayload(message?: string): unknown {
    return {
      ok: false,
      state: this.facilityViewState(),
      error: message ?? 'Invalid frontend tool payload.',
    };
  }

  #availableFilterOptions() {
    return {
      rooms: this.rooms().map((room) => ({ id: room.id, name: room.name })),
      metrics: this.metricOptions(),
      shiftManagers: this.shiftManagerOptions(),
    };
  }

  protected setDisplayMode(mode: DisplayMode): void {
    if (mode === 'historian-result' && !this.historianResult()) return;
    if (this.displayMode() === mode) return;
    this.displayMode.set(mode);
    this.closeHistory();
    if (mode === 'snapshot') {
      this.#startContinuousUpdates();
      return;
    }
    this.#stopContinuousUpdates();
    if (mode === 'historian-result') {
      this.status.set(
        `Showing ${this.historianResult()?.entries.length ?? 0} readings selected by the reviewed historian query.`,
      );
      return;
    }
    void this.loadReadingEntries();
  }

  protected async loadDashboard(showLoading = true): Promise<void> {
    if (showLoading) {
      this.loading.set(true);
    }
    this.error.set(undefined);
    try {
      this.dashboard.set(await this.#api.getDashboard());
      if (this.displayMode() === 'reading-log') await this.loadReadingEntries();
      this.status.set('Live values and alarm states loaded from the facility database.');
    } catch (error) {
      this.error.set(this.#errorMessage(error));
      this.status.set('The conventional facility backend is unavailable.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async handleAlarm(metric: MetricSummary): Promise<void> {
    this.busyMetricId.set(metric.id);
    try {
      if (!metric.activeAlarm) {
        await this.#api.raiseAlarm(metric.id);
        this.status.set(`Alarm raised for ${metric.name}. It is now waiting for acknowledgement.`);
      } else if (metric.activeAlarm.state === 'raised') {
        await this.#api.updateAlarm(metric.activeAlarm.id, 'acknowledged');
        this.status.set(`Alarm acknowledged for ${metric.name}.`);
      } else {
        await this.#api.updateAlarm(metric.activeAlarm.id, 'resolved');
        this.status.set(`Alarm resolved for ${metric.name}. The complete record remains stored.`);
      }
      await this.loadDashboard(false);
    } catch (error) {
      this.status.set(this.#errorMessage(error));
    } finally {
      this.busyMetricId.set(undefined);
    }
  }

  protected async showHistory(metric: MetricSummary): Promise<void> {
    this.selectedMetricId.set(metric.id);
    this.selectedHistory.set(undefined);
    this.historyLoading.set(true);
    try {
      this.selectedHistory.set(await this.#api.getHistory(metric.id));
      this.status.set(`Showing the last seven days for ${metric.name}.`);
    } catch (error) {
      this.status.set(this.#errorMessage(error));
    } finally {
      this.historyLoading.set(false);
    }
  }

  protected closeHistory(): void {
    this.selectedMetricId.set(undefined);
    this.selectedHistory.set(undefined);
  }

  protected async loadReadingEntries(showLoading = true): Promise<void> {
    if (showLoading) this.readingsLoading.set(true);
    try {
      this.readingPage.set(
        await this.#api.getReadingEntries({
          from: this.#isoFilterDate(this.updatedFrom()),
          to: this.#isoFilterDate(this.updatedTo()),
          shiftManager: this.shiftManagerFilter() || undefined,
          roomId: this.roomFilter() || undefined,
          metricId: this.metricFilter() || undefined,
          condition: this.conditionFilter() || undefined,
          limit: READING_PAGE_SIZE,
          offset: this.readingPageIndex() * READING_PAGE_SIZE,
        }),
      );
    } catch (error) {
      this.status.set(this.#errorMessage(error));
    } finally {
      this.readingsLoading.set(false);
    }
  }

  protected setFilter(
    filter: 'from' | 'to' | 'shiftManager' | 'room' | 'metric' | 'condition',
    event: Event,
  ): void {
    const value = (event.target as HTMLInputElement).value;
    const filters = {
      from: this.updatedFrom,
      to: this.updatedTo,
      shiftManager: this.shiftManagerFilter,
      room: this.roomFilter,
      metric: this.metricFilter,
      condition: this.conditionFilter,
    };
    filters[filter].set(value);
    this.readingPageIndex.set(0);
    void this.loadReadingEntries();
  }

  protected clearFilters(): void {
    this.updatedFrom.set('');
    this.updatedTo.set('');
    this.shiftManagerFilter.set('');
    this.roomFilter.set('');
    this.metricFilter.set('');
    this.conditionFilter.set('');
    this.readingPageIndex.set(0);
    void this.loadReadingEntries();
  }

  protected clearDateFilter(filter: 'from' | 'to'): void {
    if (filter === 'from') {
      this.updatedFrom.set('');
      this.readingPageIndex.set(0);
      void this.loadReadingEntries();
      return;
    }
    this.updatedTo.set('');
    this.readingPageIndex.set(0);
    void this.loadReadingEntries();
  }

  protected goToReadingPage(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= this.readingPageCount()) return;
    this.readingPageIndex.set(pageIndex);
    void this.loadReadingEntries();
  }

  protected metricValue(metric: MetricSummary): string {
    if (metric.currentNumericValue !== null) {
      return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(
        metric.currentNumericValue,
      );
    }
    return metric.currentTextValue ?? '—';
  }

  protected readingValue(reading: FacilityReadingEntry): string {
    const value =
      reading.numericValue === null
        ? (reading.textValue ?? '—')
        : new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(reading.numericValue);
    return reading.unit ? `${value} ${reading.unit}` : value;
  }

  protected alarmLabel(metric: MetricSummary): string {
    if (!metric.activeAlarm) return 'Raise alarm';
    if (metric.activeAlarm.state === 'raised') return 'Acknowledge';
    return 'Resolve';
  }

  protected alarmState(metric: MetricSummary): string {
    return metric.activeAlarm?.state ?? 'not raised';
  }

  protected chartPoints(history: MetricHistory): string {
    const values = history.readings
      .map((reading, index) => ({ index, value: reading.numericValue }))
      .filter((reading): reading is { index: number; value: number } => reading.value !== null);
    if (values.length < 2) return '';
    const min = Math.min(...values.map((reading) => reading.value));
    const max = Math.max(...values.map((reading) => reading.value));
    const range = max - min || 1;
    return values
      .map((reading, position) => {
        const x = 72 + (position / (values.length - 1)) * 672;
        const y = 168 - ((reading.value - min) / range) * 144;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  protected chartTicks(
    history: MetricHistory,
  ): readonly { label: string; value: number; y: number }[] {
    const values = history.readings
      .map((reading) => reading.numericValue)
      .filter((value): value is number => value !== null);
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const midpoint = min + (max - min) / 2;
    const format = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });
    return [
      { label: `${format.format(max)} ${history.metric.unit}`, value: max, y: 24 },
      { label: `${format.format(midpoint)} ${history.metric.unit}`, value: midpoint, y: 96 },
      { label: `${format.format(min)} ${history.metric.unit}`, value: min, y: 168 },
    ];
  }

  protected historyRange(history: MetricHistory): string {
    const values = history.readings
      .map((reading) => reading.numericValue)
      .filter((value): value is number => value !== null);
    if (values.length === 0) return 'No numeric readings';
    const format = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });
    return `${format.format(Math.min(...values))}–${format.format(Math.max(...values))} ${history.metric.unit}`;
  }

  protected shiftManagers(history: MetricHistory): string {
    return [...new Set(history.readings.map((reading) => reading.shiftManagerName))].join(', ');
  }

  protected stateChanges(history: MetricHistory): readonly MetricReading[] {
    const changes: MetricReading[] = [];
    let previous: string | null | undefined;
    for (const reading of history.readings) {
      if (reading.textValue !== previous) {
        changes.push(reading);
        previous = reading.textValue;
      }
    }
    return changes.slice(-8).reverse();
  }

  protected timeLabel(timestamp: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    }).format(new Date(timestamp));
  }

  #applyMetricUpdate(event: MetricUpdateEvent): void {
    this.dashboard.update((dashboard) => {
      if (!dashboard) return dashboard;
      return {
        ...dashboard,
        generatedAt: event.metric.updatedAt,
        rooms: dashboard.rooms.map((room) => ({
          ...room,
          metrics: room.metrics.map((metric) =>
            metric.id === event.metric.id ? event.metric : metric,
          ),
        })),
      };
    });
    this.selectedHistory.update((history) => {
      if (!history || history.metric.id !== event.metric.id) return history;
      const { activeAlarm: _activeAlarm, ...metric } = event.metric;
      return {
        metric,
        readings: [
          ...history.readings,
          {
            recordedAt: event.metric.updatedAt,
            numericValue: event.metric.currentNumericValue,
            textValue: event.metric.currentTextValue,
            shiftManagerName: event.metric.shiftManagerName,
          },
        ],
      };
    });
    this.latestUpdatedMetricId.set(event.metric.id);
    this.status.set(`New device reading received for ${event.metric.name}.`);
  }

  #startContinuousUpdates(): void {
    if (this.#stopMetricUpdates) return;
    this.#stopMetricUpdates = this.#api.subscribeToMetricUpdates(
      (event) => this.#applyMetricUpdate(event),
      () => this.status.set('The live update stream is reconnecting…'),
    );
    this.continuousUpdates.set(true);
    this.status.set('Snapshot mode is live. Waiting for the next device reading…');
  }

  #stopContinuousUpdates(): void {
    this.#stopMetricUpdates?.();
    this.#stopMetricUpdates = undefined;
    this.continuousUpdates.set(false);
    this.latestUpdatedMetricId.set(undefined);
    this.status.set('Reading log mode. Live snapshot updates are paused.');
  }

  #errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unexpected facility application error.';
  }

  #isoFilterDate(value: string): string | undefined {
    if (!value) return undefined;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
  }

  protected closeHistorianResult(): void {
    this.setDisplayMode('reading-log');
  }
}
