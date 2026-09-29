import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';
import type {
  ConfigureFacilityView,
  FacilityDashboard,
  FacilityReadingPage,
  FacilityViewState,
  MetricHistory,
  MetricSummary,
  MetricUpdateEvent,
} from '@packt-workshop/contracts';
import {
  applyFacilityViewCommand,
  metricConditionSchema,
  resolveFacilityViewDates,
  resolveFacilityViewAvailableOptions,
} from '@packt-workshop/contracts';
import { FacilityClient } from './facility-client';
import {
  READING_PAGE_SIZE,
  type DisplayMode,
  type HistorianSelection,
  type ReadingFilters,
} from '../model/facility';

export const FacilityStore = signalStore(
  { providedIn: 'root' },
  withState({
    dashboard: undefined as FacilityDashboard | undefined,
    loading: true,
    error: undefined as string | undefined,
    busyMetricId: undefined as string | undefined,
    historyLoading: false,
    selectedHistory: undefined as MetricHistory | undefined,
    selectedMetricId: undefined as string | undefined,
    continuousUpdates: false,
    displayMode: 'snapshot' as DisplayMode,
    latestUpdatedMetricId: undefined as string | undefined,
    status: 'Connecting to the facility database…',
    readingPage: undefined as FacilityReadingPage | undefined,
    readingsLoading: false,
    readingPageIndex: 0,
    updatedFrom: '',
    updatedTo: '',
    shiftManagerFilter: '',
    roomFilter: '',
    metricFilter: '',
    conditionFilter: '',
    historianResult: undefined as HistorianSelection | undefined,
  }),
  withComputed((store) => {
    const rooms = computed(() => store.dashboard()?.rooms ?? []);
    const activeAlarmCount = computed(() => store.dashboard()?.activeAlarmCount ?? 0);
    const shiftManagerOptions = computed(() => store.dashboard()?.shiftManagers ?? []);
    const metricOptions = computed(() =>
      rooms().flatMap((room) =>
        room.metrics.map((metric) => ({
          id: metric.id,
          label: `${room.name} · ${metric.name}`,
        })),
      ),
    );
    const facilityViewState = computed<FacilityViewState>(() => ({
      view: store.displayMode() === 'snapshot' ? ('snapshot' as const) : ('reading-log' as const),
      filters: {
        from: store.updatedFrom() || null,
        to: store.updatedTo() || null,
        shiftManager: store.shiftManagerFilter() || null,
        roomId: store.roomFilter() || null,
        metricId: store.metricFilter() || null,
        condition: metricConditionSchema.safeParse(store.conditionFilter()).data ?? null,
      },
    }));
    const currentRows = computed(() =>
      rooms().flatMap((room) => room.metrics.map((metric) => ({ room, metric }))),
    );
    const displayedReadingPage = computed<FacilityReadingPage | undefined>(() => {
      const result = store.historianResult();
      if (store.displayMode() !== 'historian-result' || !result) return store.readingPage();
      return {
        entries: result.entries,
        total: result.entries.length,
        limit: Math.max(1, result.entries.length),
        offset: 0,
      };
    });
    const readingPageCount = computed(() =>
      Math.max(1, Math.ceil((displayedReadingPage()?.total ?? 0) / READING_PAGE_SIZE)),
    );
    const readingPageStart = computed(() => {
      const page = displayedReadingPage();
      return page && page.total > 0 ? page.offset + 1 : 0;
    });
    const readingPageEnd = computed(() => {
      const page = displayedReadingPage();
      return page ? page.offset + page.entries.length : 0;
    });

    const readingFilters = computed<ReadingFilters>(() => ({
      from: store.updatedFrom(),
      to: store.updatedTo(),
      shiftManager: store.shiftManagerFilter(),
      roomId: store.roomFilter(),
      metricId: store.metricFilter(),
      condition: store.conditionFilter(),
    }));
    const availableFilterOptions = computed(() => ({
      rooms: rooms().map(({ id, name }) => ({ id, name })),
      metrics: metricOptions(),
      shiftManagers: shiftManagerOptions(),
    }));
    return {
      rooms,
      activeAlarmCount,
      shiftManagerOptions,
      metricOptions,
      facilityViewState,
      currentRows,
      displayedReadingPage,
      readingPageCount,
      readingPageStart,
      readingPageEnd,
      readingFilters,
      availableFilterOptions,
    };
  }),
  withMethods((store, client = inject(FacilityClient)) => {
    let stopMetricUpdates: (() => void) | undefined;
    const actions = {
      async configureFacilityView(command: ConfigureFacilityView): Promise<unknown> {
        let validatedCommand = command;
        try {
          validatedCommand = resolveFacilityViewAvailableOptions(
            validatedCommand,
            store.availableFilterOptions(),
          );
        } catch (error) {
          return {
            ok: false,
            state: store.facilityViewState(),
            error: error instanceof Error ? error.message : 'Invalid facility filter option.',
          };
        }
        const next = resolveFacilityViewDates(
          applyFacilityViewCommand(store.facilityViewState(), validatedCommand),
        );
        const nextDisplayMode: DisplayMode = next.view === 'snapshot' ? 'snapshot' : 'reading-log';
        const viewChanged = nextDisplayMode !== store.displayMode();

        patchState(store, { updatedFrom: next.filters.from ?? '' });
        patchState(store, { updatedTo: next.filters.to ?? '' });
        patchState(store, { shiftManagerFilter: next.filters.shiftManager ?? '' });
        patchState(store, { roomFilter: next.filters.roomId ?? '' });
        patchState(store, { metricFilter: next.filters.metricId ?? '' });
        patchState(store, { conditionFilter: next.filters.condition ?? '' });
        patchState(store, { readingPageIndex: 0 });

        if (viewChanged) {
          patchState(store, { displayMode: nextDisplayMode });
          actions.closeHistory();
          if (nextDisplayMode === 'snapshot') actions._startContinuousUpdates();
          else actions._stopContinuousUpdates();
        }
        if (nextDisplayMode === 'reading-log') await actions.loadReadingEntries();

        patchState(store, { status: 'Facility view updated.' });
        return {
          ok: true,
          state: next,
          message: 'Facility view updated. Unspecified values were preserved.',
        };
      },

      setDisplayMode(mode: DisplayMode): void {
        if (mode === 'historian-result' && !store.historianResult()) return;
        if (store.displayMode() === mode) return;
        patchState(store, { displayMode: mode });
        actions.closeHistory();
        if (mode === 'snapshot') {
          actions._startContinuousUpdates();
          return;
        }
        actions._stopContinuousUpdates();
        if (mode === 'historian-result') {
          patchState(store, {
            status: `Showing ${store.historianResult()?.entries.length ?? 0} readings selected by the reviewed historian query.`,
          });
          return;
        }
        void actions.loadReadingEntries();
      },

      async loadDashboard(showLoading = true): Promise<void> {
        if (showLoading) {
          patchState(store, { loading: true });
        }
        patchState(store, { error: undefined });
        try {
          patchState(store, { dashboard: await client.getDashboard() });
          if (store.displayMode() === 'reading-log') await actions.loadReadingEntries();
          patchState(store, {
            status: 'Live values and alarm states loaded from the facility database.',
          });
        } catch (error) {
          patchState(store, { error: actions._errorMessage(error) });
          patchState(store, { status: 'The conventional facility backend is unavailable.' });
        } finally {
          patchState(store, { loading: false });
        }
      },

      async handleAlarm(metric: MetricSummary): Promise<void> {
        patchState(store, { busyMetricId: metric.id });
        try {
          if (!metric.activeAlarm) {
            await client.raiseAlarm(metric.id);
            patchState(store, {
              status: `Alarm raised for ${metric.name}. It is now waiting for acknowledgement.`,
            });
          } else if (metric.activeAlarm.state === 'raised') {
            await client.updateAlarm(metric.activeAlarm.id, 'acknowledged');
            patchState(store, { status: `Alarm acknowledged for ${metric.name}.` });
          } else {
            await client.updateAlarm(metric.activeAlarm.id, 'resolved');
            patchState(store, {
              status: `Alarm resolved for ${metric.name}. The complete record remains stored.`,
            });
          }
          await actions.loadDashboard(false);
        } catch (error) {
          patchState(store, { status: actions._errorMessage(error) });
        } finally {
          patchState(store, { busyMetricId: undefined });
        }
      },

      async showHistory(metric: MetricSummary): Promise<void> {
        patchState(store, { selectedMetricId: metric.id });
        patchState(store, { selectedHistory: undefined });
        patchState(store, { historyLoading: true });
        try {
          const history = await client.getHistory(metric.id);
          patchState(store, { selectedHistory: history });
          patchState(store, { status: `Showing the last seven days for ${metric.name}.` });
        } catch (error) {
          patchState(store, { status: actions._errorMessage(error) });
        } finally {
          patchState(store, { historyLoading: false });
        }
      },

      closeHistory(): void {
        patchState(store, { selectedMetricId: undefined });
        patchState(store, { selectedHistory: undefined });
      },

      async loadReadingEntries(showLoading = true): Promise<void> {
        if (showLoading) patchState(store, { readingsLoading: true });
        try {
          patchState(store, {
            readingPage: await client.getReadingEntries({
              from: actions._isoFilterDate(store.updatedFrom()),
              to: actions._isoFilterDate(store.updatedTo()),
              shiftManager: store.shiftManagerFilter() || undefined,
              roomId: store.roomFilter() || undefined,
              metricId: store.metricFilter() || undefined,
              condition: store.conditionFilter() || undefined,
              limit: READING_PAGE_SIZE,
              offset: store.readingPageIndex() * READING_PAGE_SIZE,
            }),
          });
        } catch (error) {
          patchState(store, { status: actions._errorMessage(error) });
        } finally {
          patchState(store, { readingsLoading: false });
        }
      },

      goToReadingPage(pageIndex: number): void {
        if (pageIndex < 0 || pageIndex >= store.readingPageCount()) return;
        patchState(store, { readingPageIndex: pageIndex });
        void actions.loadReadingEntries();
      },

      _applyMetricUpdate(event: MetricUpdateEvent): void {
        patchState(store, {
          dashboard: ((dashboard) => {
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
          })(store.dashboard()),
        });
        patchState(store, {
          selectedHistory: ((history) => {
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
          })(store.selectedHistory()),
        });
        patchState(store, { latestUpdatedMetricId: event.metric.id });
        patchState(store, { status: `New device reading received for ${event.metric.name}.` });
      },

      _startContinuousUpdates(): void {
        if (stopMetricUpdates) return;
        stopMetricUpdates = client.subscribeToMetricUpdates(
          (event) => actions._applyMetricUpdate(event),
          () => patchState(store, { status: 'The live update stream is reconnecting…' }),
        );
        patchState(store, { continuousUpdates: true });
        patchState(store, {
          status: 'Snapshot mode is live. Waiting for the next device reading…',
        });
      },

      _stopContinuousUpdates(): void {
        stopMetricUpdates?.();
        stopMetricUpdates = undefined;
        patchState(store, { continuousUpdates: false });
        patchState(store, { latestUpdatedMetricId: undefined });
        patchState(store, { status: 'Reading log mode. Live snapshot updates are paused.' });
      },

      _errorMessage(error: unknown): string {
        return error instanceof Error ? error.message : 'Unexpected facility application error.';
      },

      _isoFilterDate(value: string): string | undefined {
        if (!value) return undefined;
        const timestamp = Date.parse(value);
        return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
      },

      closeHistorianResult(): void {
        actions.setDisplayMode('reading-log');
      },
      showHistorianResult(result: HistorianSelection) {
        if (store.historianResult()?.id === result.id) return;
        patchState(store, { historianResult: result });
        actions.setDisplayMode('historian-result');
      },
      updateReadingFilters(filters: ReadingFilters) {
        return actions.configureFacilityView({
          action: 'update_filters',
          filters: {
            from: filters.from || null,
            to: filters.to || null,
            shiftManager: filters.shiftManager || null,
            roomId: filters.roomId || null,
            metricId: filters.metricId || null,
            condition: filters.condition ? metricConditionSchema.parse(filters.condition) : null,
          },
        });
      },
      clearFilters() {
        return actions.configureFacilityView({ action: 'clear_filters' });
      },
      clearDateFilter(filter: 'from' | 'to') {
        return actions.configureFacilityView({ action: 'clear_filters', filters: [filter] });
      },
    };
    return actions;
  }),
  withHooks((store) => ({
    onInit() {
      store._startContinuousUpdates();
      void store.loadDashboard();
    },
    onDestroy() {
      store._stopContinuousUpdates();
    },
  })),
);
