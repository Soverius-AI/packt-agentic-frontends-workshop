import { Component, computed, DestroyRef, inject, linkedSignal, signal } from '@angular/core';
import {
  CopilotA2UIActivityRenderer,
  type injectAgentStore,
} from '@copilotkit/angular';
import type {
  AlarmApprovalAuditEntry,
  FacilityDashboard,
  FacilityReadingEntry,
  FacilityReadingPage,
  MetricHistory,
  MetricReading,
  MetricSummary,
  MetricUpdateEvent,
} from '@packt-workshop/contracts';
import { historianToolResultSchema } from '@packt-workshop/contracts';
import { AlarmApprovalEvents } from './alarm-approval-events';
import { FacilityApi } from './facility-api';
import { ChatComponent } from './chat/chat.component';
import { BasicChatComponent } from './basic-chat/basic-chat.component';

type DisplayMode = 'snapshot' | 'reading-log' | 'historian-result' | 'a2ui-result';
const READING_PAGE_SIZE = 50;

@Component({
  selector: 'app-root',
  imports: [ChatComponent, CopilotA2UIActivityRenderer, BasicChatComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly #api = inject(FacilityApi);
  readonly #approvalEvents = inject(AlarmApprovalEvents);
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
  protected readonly resultStore = signal<ReturnType<typeof injectAgentStore> | undefined>(
    undefined,
  );
  protected readonly resultAgent = computed(() => this.resultStore()?.().agent);
  private readonly resultMessages = computed(() => this.resultStore()?.().messages() ?? []);
  protected readonly a2uiActivities = computed(() => {
    const messages = this.resultMessages();
    const activities = messages
      .filter((message) => message.role === 'activity')
      .filter(
        (message) =>
          message.activityType === 'a2ui-surface' &&
          Array.isArray(message.content['a2ui_operations']) &&
          message.content['a2ui_operations'].length > 0,
      );
    const latest = activities.at(-1);
    if (!latest) return [];
    const turnStart = messages
      .slice(0, messages.indexOf(latest))
      .reduce((last, message, index) => (message.role === 'user' ? index : last), -1);
    return activities.filter((activity) => messages.indexOf(activity) > turnStart);
  });
  protected readonly a2uiActivity = computed(() => this.a2uiActivities().at(-1));
  private readonly a2uiActivityId = computed(() => this.a2uiActivity()?.id);
  private readonly historianResultId = computed(() => this.historianResult()?.id);
  protected readonly displayMode = linkedSignal<DisplayMode>(() =>
    this.a2uiActivityId()
      ? 'a2ui-result'
      : this.historianResultId()
        ? 'historian-result'
        : 'snapshot',
  );
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
  protected readonly historianResult = computed(() => {
    const messages = this.resultMessages();
    const queryIds = new Set(
      messages.flatMap((message) =>
        message.role === 'assistant'
          ? (message.toolCalls ?? [])
              .filter((call) => call.function.name === 'query_historian')
              .map((call) => call.id)
          : [],
      ),
    );
    for (const message of [...messages].reverse()) {
      if (message.role !== 'tool' || !queryIds.has(message.toolCallId)) continue;
      try {
        const result = historianToolResultSchema.safeParse(JSON.parse(message.content));
        if (result.success && result.data.status === 'executed')
          return { ...result.data, id: message.id };
      } catch {
        /* Incomplete messages have no result to display. */
      }
    }
    return undefined;
  });
  protected readonly alarmApprovals = signal<readonly AlarmApprovalAuditEntry[]>([]);
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
  protected readonly facilityViewState = computed(() => ({
    view: this.displayMode(),
    filters: {
      from: this.updatedFrom() || null,
      to: this.updatedTo() || null,
      shiftManager: this.shiftManagerFilter() || null,
      roomId: this.roomFilter() || null,
      metricId: this.metricFilter() || null,
      condition: this.conditionFilter() || null,
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
    const approvalSubscription = this.#approvalEvents.recorded$.subscribe((record) => {
      this.alarmApprovals.update((entries) => [
        record,
        ...entries.filter((entry) => entry.correlationId !== record.correlationId),
      ]);
      this.status.set(this.#alarmApprovalStatus(record));
      void this.loadDashboard(false);
    });
    this.#destroyRef.onDestroy(() => {
      approvalSubscription.unsubscribe();
      this.#stopMetricUpdates?.();
    });
    this.#startContinuousUpdates();
    void this.loadDashboard();
    void this.loadAlarmApprovalAudit();
  }

  protected setDisplayMode(mode: DisplayMode): void {
    if (mode === 'historian-result' && !this.historianResult()) return;
    if (mode === 'a2ui-result' && !this.a2uiActivity()) return;
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

  protected async loadAlarmApprovalAudit(): Promise<void> {
    try {
      this.alarmApprovals.set((await this.#api.getAlarmApprovalAudit()).entries);
    } catch (error) {
      this.status.set(this.#errorMessage(error));
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

  // Shared by the template controls and the update_filters tool.
  protected async updateFilters(filters: {
    from?: string | null;
    to?: string | null;
    roomId?: string | null;
    metricId?: string | null;
    shiftManager?: string | null;
    condition?: string | null;
  }) {
    if (filters.roomId && !this.rooms().some((room) => room.id === filters.roomId))
      return { ok: false, error: 'Unknown room ID. Use an available room from context.' };
    if (filters.metricId && !this.metricOptions().some((metric) => metric.id === filters.metricId))
      return { ok: false, error: 'Unknown metric ID. Use an available metric from context.' };
    if (filters.shiftManager && !this.shiftManagerOptions().includes(filters.shiftManager))
      return { ok: false, error: 'Unknown shift manager. Use an available name from context.' };
    if (
      filters.condition &&
      !['normal', 'warning', 'critical', 'unavailable'].includes(filters.condition)
    )
      return { ok: false, error: 'Unknown reading condition.' };

    // Resolve both dates before changing any state, so invalid input changes nothing.
    let from = this.updatedFrom();
    let to = this.updatedTo();
    try {
      if (filters.from !== undefined) from = this.#localFilterDate(filters.from);
      if (filters.to !== undefined) to = this.#localFilterDate(filters.to);
    } catch {
      return { ok: false, error: 'Invalid date. Use "now", an ISO date-time or YYYY-MM-DDTHH:mm.' };
    }
    this.updatedFrom.set(from);
    this.updatedTo.set(to);
    if (filters.roomId !== undefined) this.roomFilter.set(filters.roomId ?? '');
    if (filters.metricId !== undefined) this.metricFilter.set(filters.metricId ?? '');
    if (filters.shiftManager !== undefined) this.shiftManagerFilter.set(filters.shiftManager ?? '');
    if (filters.condition !== undefined) this.conditionFilter.set(filters.condition ?? '');
    this.readingPageIndex.set(0);
    await this.loadReadingEntries();
    return { ok: true, state: this.facilityViewState() };
  }

  protected clearFilters(): void {
    void this.updateFilters({
      from: null,
      to: null,
      roomId: null,
      metricId: null,
      shiftManager: null,
      condition: null,
    });
  }

  #localFilterDate(value: string | null): string {
    if (!value) return '';
    const date = value === 'now' ? new Date() : new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error('Invalid date');
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

  protected alarmApprovalOutcome(entry: AlarmApprovalAuditEntry): string {
    if (entry.outcome === 'executed') return 'Alarm raised';
    if (entry.outcome === 'failed') return `Execution failed: ${entry.error}`;
    return 'No alarm raised';
  }

  #alarmApprovalStatus(entry: AlarmApprovalAuditEntry): string {
    if (entry.outcome === 'executed') {
      return `Operator approved the proposal. Alarm raised for ${entry.metricName}.`;
    }
    if (entry.outcome === 'failed') {
      return `Operator approved the proposal, but execution failed: ${entry.error}`;
    }
    return `Operator rejected the proposal for ${entry.metricName}. No alarm was raised.`;
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
