import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  applyFacilityViewCommand,
  type ConfigureFacilityView,
  facilityDashboardSchema,
  facilityReadingPageSchema,
  metricAlarmSchema,
  metricConditionSchema,
  metricHistorySchema,
  metricUpdateEventSchema,
  type FacilityDashboard,
  type FacilityReadingEntry,
  type FacilityReadingPage,
  type FacilityViewState,
  type HistorianToolResult,
  type MetricHistory,
  type MetricSummary,
  resolveFacilityViewDates,
  resolveFacilityViewAvailableOptions,
} from "@packt-workshop/contracts";
import type { HistorianRun } from "./CopilotChatPanel";
import "./App.css";

const CopilotChatPanel = lazy(() => import("./CopilotChatPanel"));
const FACILITY_CONDITIONS = [
  "normal",
  "warning",
  "critical",
  "unavailable",
] as const;

async function jsonRequest(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = (await response.json()) as unknown;
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Facility request failed.";
    throw new Error(message);
  }
  return body;
}

export default function App() {
  const readingPageSize = 50;
  const [dashboard, setDashboard] = useState<FacilityDashboard>();
  const [history, setHistory] = useState<MetricHistory>();
  const [status, setStatus] = useState("Connecting to the facility database…");
  const [busyMetricId, setBusyMetricId] = useState<string>();
  const [, setContinuousUpdates] = useState(false);
  const [displayMode, setDisplayMode] = useState<"snapshot" | "list">(
    "snapshot",
  );
  const [latestUpdatedMetricId, setLatestUpdatedMetricId] = useState<string>();
  const [readingPage, setReadingPage] = useState<FacilityReadingPage>();
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [readingPageIndex, setReadingPageIndex] = useState(0);
  const [updatedFrom, setUpdatedFrom] = useState("");
  const [updatedTo, setUpdatedTo] = useState("");
  const [shiftManagerFilter, setShiftManagerFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [metricFilter, setMetricFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [historianRun, setHistorianRun] = useState<HistorianRun>();
  const [dismissedHistorianToolCallId, setDismissedHistorianToolCallId] =
    useState<string>();
  const updateSource = useRef<EventSource | undefined>(undefined);
  const allRows = useMemo(
    () =>
      dashboard?.rooms.flatMap((room) =>
        room.metrics.map((metric) => ({ room, metric })),
      ) ?? [],
    [dashboard],
  );
  const historianResult:
    Extract<HistorianToolResult, { status: "executed" }> | undefined =
    historianRun &&
    historianRun.toolCallId !== dismissedHistorianToolCallId &&
    historianRun.result.status === "executed"
      ? historianRun.result
      : undefined;
  const effectiveDisplayMode = historianResult ? "list" : displayMode;
  const facilityViewState = useMemo<FacilityViewState>(
    () => ({
      view:
        effectiveDisplayMode === "snapshot"
          ? ("snapshot" as const)
          : ("reading-log" as const),
      filters: {
        from: updatedFrom || null,
        to: updatedTo || null,
        shiftManager: shiftManagerFilter || null,
        roomId: roomFilter || null,
        metricId: metricFilter || null,
        condition:
          metricConditionSchema.safeParse(conditionFilter).data ?? null,
      },
    }),
    [
      conditionFilter,
      effectiveDisplayMode,
      metricFilter,
      roomFilter,
      shiftManagerFilter,
      updatedFrom,
      updatedTo,
    ],
  );
  const facilityViewStateRef = useRef(facilityViewState);
  facilityViewStateRef.current = facilityViewState;
  const facilityOptions = useMemo(
    () => ({
      rooms: dashboard?.rooms.map(({ id, name }) => ({ id, name })) ?? [],
      metrics: allRows.map(({ room, metric }) => ({
        id: metric.id,
        name: metric.name,
        label: `${room.name} · ${metric.name}`,
        roomId: room.id,
        roomName: room.name,
        kind: metric.kind,
        unit: metric.unit,
      })),
      shiftManagers: dashboard?.shiftManagers ?? [],
      conditions: FACILITY_CONDITIONS,
    }),
    [allRows, dashboard],
  );
  const facilityViewAvailableOptionsRef = useRef({
    rooms: facilityOptions.rooms,
    metrics: facilityOptions.metrics,
    shiftManagers: facilityOptions.shiftManagers,
  });
  facilityViewAvailableOptionsRef.current = {
    rooms: facilityOptions.rooms,
    metrics: facilityOptions.metrics,
    shiftManagers: facilityOptions.shiftManagers,
  };

  async function loadReadingEntries(): Promise<void> {
    setReadingsLoading(true);
    const parameters = new URLSearchParams({
      limit: String(readingPageSize),
      offset: String(readingPageIndex * readingPageSize),
    });
    const add = (name: string, value: string): void => {
      if (value) parameters.set(name, value);
    };
    add("from", updatedFrom ? new Date(updatedFrom).toISOString() : "");
    add("to", updatedTo ? new Date(updatedTo).toISOString() : "");
    add("shiftManager", shiftManagerFilter);
    add("roomId", roomFilter);
    add("metricId", metricFilter);
    add("condition", conditionFilter);
    try {
      setReadingPage(
        facilityReadingPageSchema.parse(
          await jsonRequest(`/api/readings?${parameters.toString()}`),
        ),
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Reading query failed.",
      );
    } finally {
      setReadingsLoading(false);
    }
  }

  async function loadDashboard(): Promise<void> {
    try {
      setDashboard(
        facilityDashboardSchema.parse(await jsonRequest("/api/dashboard")),
      );
      setStatus("Live values and alarms loaded from the facility database.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Facility backend unavailable.",
      );
    }
  }

  useEffect(() => {
    void loadDashboard();
    startContinuousUpdates();
    return () => updateSource.current?.close();
  }, []);

  useEffect(() => {
    if (displayMode === "list") void loadReadingEntries();
  }, [
    displayMode,
    updatedFrom,
    updatedTo,
    shiftManagerFilter,
    roomFilter,
    metricFilter,
    conditionFilter,
    readingPageIndex,
  ]);

  function startContinuousUpdates(): void {
    if (updateSource.current) return;
    const source = new EventSource("/api/metric-updates");
    source.onmessage = (message) => {
      try {
        const event = metricUpdateEventSchema.parse(
          JSON.parse(message.data) as unknown,
        );
        setDashboard((current) =>
          current
            ? {
                ...current,
                generatedAt: event.metric.updatedAt,
                rooms: current.rooms.map((room) => ({
                  ...room,
                  metrics: room.metrics.map((metric) =>
                    metric.id === event.metric.id ? event.metric : metric,
                  ),
                })),
              }
            : current,
        );
        setLatestUpdatedMetricId(event.metric.id);
        setStatus(`New device reading received for ${event.metric.name}.`);
      } catch {
        setStatus("A live update did not match the facility contract.");
      }
    };
    source.onerror = () => setStatus("The live update stream is reconnecting…");
    updateSource.current = source;
    setContinuousUpdates(true);
    setStatus("Snapshot mode is live. Waiting for the next device reading…");
  }

  function stopContinuousUpdates(): void {
    updateSource.current?.close();
    updateSource.current = undefined;
    setContinuousUpdates(false);
    setLatestUpdatedMetricId(undefined);
    setStatus("Reading log mode. Live snapshot updates are paused.");
  }

  function changeDisplayMode(mode: "snapshot" | "list"): void {
    const hadHistorianResult = Boolean(historianResult);
    if (historianRun) setDismissedHistorianToolCallId(historianRun.toolCallId);
    if (mode === displayMode && !hadHistorianResult) return;
    setDisplayMode(mode);
    setHistory(undefined);
    if (mode === "snapshot") startContinuousUpdates();
    else stopContinuousUpdates();
  }

  async function handleAlarm(metric: MetricSummary): Promise<void> {
    setBusyMetricId(metric.id);
    try {
      if (!metric.activeAlarm) {
        metricAlarmSchema.parse(
          await jsonRequest(
            `/api/metrics/${encodeURIComponent(metric.id)}/alarms`,
            {
              method: "POST",
              body: JSON.stringify({ operatorId: "night-reception" }),
            },
          ),
        );
        setStatus(`Alarm raised for ${metric.name}.`);
      } else {
        const state =
          metric.activeAlarm.state === "raised" ? "acknowledged" : "resolved";
        metricAlarmSchema.parse(
          await jsonRequest(
            `/api/alarms/${encodeURIComponent(metric.activeAlarm.id)}`,
            {
              method: "PATCH",
              body: JSON.stringify({ state, operatorId: "night-reception" }),
            },
          ),
        );
        setStatus(`Alarm ${state} for ${metric.name}.`);
      }
      await loadDashboard();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Alarm update failed.",
      );
    } finally {
      setBusyMetricId(undefined);
    }
  }

  async function showHistory(metric: MetricSummary): Promise<void> {
    setHistory(undefined);
    setStatus(`Loading history for ${metric.name}…`);
    try {
      setHistory(
        metricHistorySchema.parse(
          await jsonRequest(
            `/api/metrics/${encodeURIComponent(metric.id)}/history?hours=168`,
          ),
        ),
      );
      setStatus(`Showing the last seven days for ${metric.name}.`);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "History request failed.",
      );
    }
  }

  function metricValue(metric: MetricSummary): string {
    if (metric.currentNumericValue !== null) {
      return new Intl.NumberFormat("en-GB", {
        maximumFractionDigits: 2,
      }).format(metric.currentNumericValue);
    }
    return metric.currentTextValue ?? "—";
  }

  function readingValue(reading: FacilityReadingEntry): string {
    const value =
      reading.numericValue === null
        ? (reading.textValue ?? "—")
        : new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(
            reading.numericValue,
          );
    return reading.unit ? `${value} ${reading.unit}` : value;
  }

  function alarmLabel(metric: MetricSummary): string {
    if (!metric.activeAlarm) return "Raise alarm";
    return metric.activeAlarm.state === "raised" ? "Acknowledge" : "Resolve";
  }

  function clearFilters(): void {
    if (historianRun) setDismissedHistorianToolCallId(historianRun.toolCallId);
    setUpdatedFrom("");
    setUpdatedTo("");
    setShiftManagerFilter("");
    setRoomFilter("");
    setMetricFilter("");
    setConditionFilter("");
    setReadingPageIndex(0);
  }

  const configureFacilityView = useCallback(
    async (command: ConfigureFacilityView): Promise<unknown> => {
      if (historianRun)
        setDismissedHistorianToolCallId(historianRun.toolCallId);
      let validatedCommand = command;
      try {
        validatedCommand = resolveFacilityViewAvailableOptions(
          validatedCommand,
          facilityViewAvailableOptionsRef.current,
        );
      } catch (error) {
        return {
          ok: false,
          state: facilityViewStateRef.current,
          error:
            error instanceof Error
              ? error.message
              : "Invalid facility filter option.",
        };
      }
      const current = facilityViewStateRef.current;
      const next = resolveFacilityViewDates(
        applyFacilityViewCommand(current, validatedCommand),
      );
      facilityViewStateRef.current = next;

      setUpdatedFrom(next.filters.from ?? "");
      setUpdatedTo(next.filters.to ?? "");
      setShiftManagerFilter(next.filters.shiftManager ?? "");
      setRoomFilter(next.filters.roomId ?? "");
      setMetricFilter(next.filters.metricId ?? "");
      setConditionFilter(next.filters.condition ?? "");
      setReadingPageIndex(0);
      if (next.view !== current.view) {
        setDisplayMode(next.view === "snapshot" ? "snapshot" : "list");
        setHistory(undefined);
        if (next.view === "snapshot") startContinuousUpdates();
        else stopContinuousUpdates();
      }
      setStatus("The assistant updated the facility view.");

      return {
        ok: true,
        state: next,
        message: "Facility view updated. Unspecified values were preserved.",
      };
    },
    [historianRun],
  );

  const receiveHistorianRun = useCallback((run: HistorianRun): void => {
    setHistorianRun((current) =>
      current?.toolCallId === run.toolCallId ? current : run,
    );
  }, []);

  const closeHistorianResult = useCallback((): void => {
    if (historianRun) setDismissedHistorianToolCallId(historianRun.toolCallId);
    setDisplayMode("list");
    setHistory(undefined);
    stopContinuousUpdates();
  }, [historianRun]);

  const displayedReadingPage: FacilityReadingPage | undefined = historianResult
    ? {
        entries: historianResult.entries,
        total: historianResult.rowCount,
        limit: Math.max(1, historianResult.rowCount),
        offset: 0,
      }
    : readingPage;

  const readingPageCount = Math.max(
    1,
    Math.ceil((displayedReadingPage?.total ?? 0) / readingPageSize),
  );
  const readingPageStart =
    displayedReadingPage && displayedReadingPage.total > 0
      ? displayedReadingPage.offset + 1
      : 0;
  const readingPageEnd = displayedReadingPage
    ? displayedReadingPage.offset + displayedReadingPage.entries.length
    : 0;

  return (
    <main>
      <header className="page-header">
        <div className="brand-lockup">
          <a
            className="corporate-logo-link"
            href="https://soverius.ai/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit the Soverius AI website"
          >
            <img
              className="corporate-logo"
              src="/soverius-ai-original.png"
              alt="Soverius AI"
            />
          </a>
          <div className="brand-copy">
            <p className="eyebrow">Soverius Chocolate operations</p>
            <h1 className="product-title">Incident Management</h1>
            <p className="subtitle">
              Persistent factory telemetry, historical readings, operator
              alarms, and standardized streaming agent chat.
            </p>
            <p className="stage-label">
              Stage 6 · Reviewed SQL · Read-only historian access
            </p>
          </div>
        </div>
        <div className="summary">
          <span className="database">SQLite connected</span>
          <span
            className={`mode-state${effectiveDisplayMode === "snapshot" ? " mode-state-live" : ""}`}
          >
            <span aria-hidden="true" />
            {effectiveDisplayMode === "snapshot"
              ? "Snapshot live"
              : "Reading log"}
          </span>
          <span
            className={dashboard?.activeAlarmCount ? "alarms active" : "alarms"}
          >
            {dashboard?.activeAlarmCount ?? 0} active alarms
          </span>
          <button
            className="secondary"
            type="button"
            onClick={() => void loadDashboard()}
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="workspace-grid">
        <div className="facility-workspace">
          {dashboard ? (
            <section className="room" aria-labelledby="metrics-title">
              <div
                className="mode-switch"
                role="tablist"
                aria-label="Reading display mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={effectiveDisplayMode === "snapshot"}
                  className={
                    effectiveDisplayMode === "snapshot" ? "active" : ""
                  }
                  onClick={() => changeDisplayMode("snapshot")}
                >
                  Snapshot
                  <small>Latest value per metric · live</small>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={effectiveDisplayMode === "list"}
                  className={effectiveDisplayMode === "list" ? "active" : ""}
                  onClick={() => changeDisplayMode("list")}
                >
                  Reading log
                  <small>Historical readings · filterable</small>
                </button>
              </div>
              {effectiveDisplayMode === "list" ? (
                <>
                  {historianResult ? (
                    <section
                      className="filter-panel"
                      aria-label="Historian query result"
                    >
                      <div className="filter-heading">
                        <div>
                          <p className="eyebrow">Historian query result</p>
                          <strong>{historianResult.question}</strong>
                        </div>
                        <button
                          className="secondary"
                          type="button"
                          onClick={closeHistorianResult}
                        >
                          Return to reading log
                        </button>
                      </div>
                      <small>
                        {historianResult.rowCount} complete reading{" "}
                        {historianResult.rowCount === 1 ? "record" : "records"}{" "}
                        selected by the reviewed SQL.
                      </small>
                    </section>
                  ) : (
                    <section
                      className="filter-panel"
                      aria-label="Filter persisted readings"
                    >
                      <div className="filter-heading">
                        <div>
                          <p className="eyebrow">Historical reading filters</p>
                          <strong>
                            Showing {readingPageStart}–{readingPageEnd} of{" "}
                            {displayedReadingPage?.total ?? 0} readings
                          </strong>
                        </div>
                        <button
                          className="secondary"
                          type="button"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </button>
                      </div>
                      <div className="filter-grid">
                        <label>
                          <span>Updated from</span>
                          <span className="date-filter-control">
                            <input
                              type="datetime-local"
                              value={updatedFrom}
                              onChange={(event) => {
                                setUpdatedFrom(event.target.value);
                                setReadingPageIndex(0);
                              }}
                            />
                            <button
                              className="date-clear-button"
                              type="button"
                              disabled={!updatedFrom}
                              aria-label="Clear updated from"
                              onClick={() => {
                                setUpdatedFrom("");
                                setReadingPageIndex(0);
                              }}
                            >
                              Clear
                            </button>
                          </span>
                        </label>
                        <label>
                          <span>Updated to</span>
                          <span className="date-filter-control">
                            <input
                              type="datetime-local"
                              value={updatedTo}
                              onChange={(event) => {
                                setUpdatedTo(event.target.value);
                                setReadingPageIndex(0);
                              }}
                            />
                            <button
                              className="date-clear-button"
                              type="button"
                              disabled={!updatedTo}
                              aria-label="Clear updated to"
                              onClick={() => {
                                setUpdatedTo("");
                                setReadingPageIndex(0);
                              }}
                            >
                              Clear
                            </button>
                          </span>
                        </label>
                        <label>
                          <span>Shift manager</span>
                          <select
                            value={shiftManagerFilter}
                            onChange={(event) => {
                              setShiftManagerFilter(event.target.value);
                              setReadingPageIndex(0);
                            }}
                          >
                            <option value="">All shift managers</option>
                            {dashboard.shiftManagers.map((manager) => (
                              <option key={manager} value={manager}>
                                {manager}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Room</span>
                          <select
                            value={roomFilter}
                            onChange={(event) => {
                              setRoomFilter(event.target.value);
                              setReadingPageIndex(0);
                            }}
                          >
                            <option value="">All rooms</option>
                            {dashboard.rooms.map((room) => (
                              <option key={room.id} value={room.id}>
                                {room.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Metric</span>
                          <select
                            value={metricFilter}
                            onChange={(event) => {
                              setMetricFilter(event.target.value);
                              setReadingPageIndex(0);
                            }}
                          >
                            <option value="">All metrics</option>
                            {allRows.map(({ room, metric }) => (
                              <option key={metric.id} value={metric.id}>
                                {room.name} · {metric.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Condition</span>
                          <select
                            value={conditionFilter}
                            onChange={(event) => {
                              setConditionFilter(event.target.value);
                              setReadingPageIndex(0);
                            }}
                          >
                            <option value="">All conditions</option>
                            <option value="normal">Normal</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                        </label>
                      </div>
                    </section>
                  )}
                  <div
                    className="table-shell"
                    tabIndex={0}
                    aria-label="Historical readings table"
                  >
                    <table className="reading-entries-table">
                      <caption>
                        {historianResult
                          ? "Stored readings selected by the reviewed historian query"
                          : "Persisted metric readings matching the historical filters"}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Date and time</th>
                          <th scope="col">Shift manager</th>
                          <th scope="col">Room</th>
                          <th scope="col">Metric</th>
                          <th scope="col">Value</th>
                          <th scope="col">Condition</th>
                        </tr>
                      </thead>
                      <tbody>
                        {readingsLoading && !historianResult ? (
                          <tr>
                            <td className="empty-table" colSpan={6}>
                              Loading persisted readings…
                            </td>
                          </tr>
                        ) : displayedReadingPage?.entries.length ? (
                          displayedReadingPage.entries.map((entry) => (
                            <tr
                              key={entry.id}
                              className={`condition-${entry.condition}`}
                            >
                              <td>
                                <time dateTime={entry.recordedAt}>
                                  {new Date(entry.recordedAt).toLocaleString(
                                    "en-GB",
                                  )}
                                </time>
                              </td>
                              <td className="shift-manager">
                                {entry.shiftManagerName}
                              </td>
                              <td className="room-cell">
                                <strong>{entry.roomName}</strong>
                              </td>
                              <th className="metric-cell" scope="row">
                                {entry.metricName}
                              </th>
                              <td className="reading-entry-value">
                                {readingValue(entry)}
                              </td>
                              <td>
                                <span className="condition">
                                  {entry.condition}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="empty-table" colSpan={6}>
                              No persisted readings match these filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {!historianResult && (
                    <nav
                      className="pagination"
                      aria-label="Reading log pagination"
                    >
                      <button
                        className="secondary"
                        type="button"
                        disabled={readingPageIndex === 0 || readingsLoading}
                        onClick={() => setReadingPageIndex((page) => page - 1)}
                      >
                        Previous
                      </button>
                      <span>
                        Page <strong>{readingPageIndex + 1}</strong> of{" "}
                        <strong>{readingPageCount}</strong>
                      </span>
                      <button
                        className="secondary"
                        type="button"
                        disabled={
                          readingPageIndex + 1 >= readingPageCount ||
                          readingsLoading
                        }
                        onClick={() => setReadingPageIndex((page) => page + 1)}
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </>
              ) : (
                <>
                  <div className="current-table-heading">
                    <div>
                      <p className="eyebrow">Live overview</p>
                      <h2>Current reading per metric</h2>
                    </div>
                    <span>{allRows.length} metrics</span>
                  </div>
                  <div
                    className="table-shell"
                    tabIndex={0}
                    aria-label="Factory metrics table"
                  >
                    <table className="metrics-table">
                      <caption id="metrics-title">
                        Factory rooms and production metrics
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Room</th>
                          <th scope="col">Metric</th>
                          <th scope="col">Current</th>
                          <th scope="col">Shift manager</th>
                          <th scope="col">Trend</th>
                          <th scope="col">Condition</th>
                          <th scope="col">Normal range</th>
                          <th scope="col">History</th>
                          <th scope="col">Alarm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allRows.map(({ room, metric }) => (
                          <tr
                            key={metric.id}
                            className={`condition-${metric.condition}${latestUpdatedMetricId === metric.id ? " live-updated" : ""}`}
                          >
                            <td className="room-cell">
                              <strong>{room.name}</strong>
                            </td>
                            <th className="metric-cell" scope="row">
                              {metric.name}
                            </th>
                            <td className="reading">
                              <strong>{metricValue(metric)}</strong>{" "}
                              {metric.unit}
                            </td>
                            <td className="shift-manager">
                              {metric.shiftManagerName}
                            </td>
                            <td>{metric.trend}</td>
                            <td>
                              <span className="condition">
                                {metric.condition}
                              </span>
                            </td>
                            <td>{metric.target}</td>
                            <td>
                              <button
                                className="secondary"
                                onClick={() => void showHistory(metric)}
                              >
                                View 7d
                              </button>
                            </td>
                            <td>
                              <button
                                onClick={() => void handleAlarm(metric)}
                                disabled={busyMetricId === metric.id}
                              >
                                {busyMetricId === metric.id
                                  ? "Saving…"
                                  : alarmLabel(metric)}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          ) : (
            <section className="message">
              <h2>Loading facility data</h2>
              <p>
                Reading rooms, metrics, alarms, and measurements from SQLite…
              </p>
            </section>
          )}

          <p className="status" role="status">
            {status}
          </p>

          {history && (
            <section className="history" aria-labelledby="history-title">
              <div className="room-heading">
                <div>
                  <p className="eyebrow">Database history · last seven days</p>
                  <h2 id="history-title">{history.metric.name}</h2>
                </div>
                <button
                  className="secondary"
                  onClick={() => setHistory(undefined)}
                >
                  Close
                </button>
              </div>
              <div className="history-values">
                {history.readings.slice(-12).map((reading) => (
                  <span key={reading.recordedAt}>
                    <time dateTime={reading.recordedAt}>
                      {new Date(reading.recordedAt).toLocaleTimeString(
                        "en-GB",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </time>
                    <strong>
                      {reading.numericValue ?? reading.textValue}{" "}
                      {history.metric.unit}
                    </strong>
                    <small>{reading.shiftManagerName}</small>
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="chat-panel" aria-labelledby="chat-title">
          <div className="chat-heading">
            <div>
              <p className="eyebrow">CopilotKit · AG-UI streaming</p>
              <h2 id="chat-title">Factory assistant</h2>
            </div>
            <span>Frontend + SQL</span>
          </div>
          <p className="chat-boundary">
            The assistant can adjust this view and query the historian through
            reviewer and deterministic safety gates. It cannot perform
            operational actions.
          </p>
          <div className="copilot-chat-shell">
            <Suspense
              fallback={
                <p className="chat-loading">Loading the streaming chat…</p>
              }
            >
              <CopilotChatPanel
                viewContext={facilityViewState}
                options={facilityOptions}
                onConfigureView={configureFacilityView}
                onHistorianRun={receiveHistorianRun}
              />
            </Suspense>
          </div>
        </aside>
      </div>
    </main>
  );
}
