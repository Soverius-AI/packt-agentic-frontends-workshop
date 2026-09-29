import { ChatComponent } from './agent/chat.component';
import { connectFacilityAgent } from './agent/connect-facility-agent';
import { AlarmAudit } from '../ui/alarm-audit';
import { Component, inject } from '@angular/core';
import { FacilityStore } from '../data/facility-store';
import { FacilityHeader } from '../ui/facility-header';
import { ReadingFilters } from '../ui/reading-filters';
import { ReadingTable } from '../ui/reading-table';
import { SnapshotTable } from '../ui/snapshot-table';
import { MetricHistory } from '../ui/metric-history';
@Component({
  selector: 'app-facility-dashboard',
  imports: [
    ChatComponent,
    AlarmAudit,
    FacilityHeader,
    ReadingFilters,
    ReadingTable,
    SnapshotTable,
    MetricHistory,
  ],
  template: `
    <main>
      <app-facility-header
        [mode]="store.displayMode()"
        [activeAlarmCount]="store.activeAlarmCount()"
        (refresh)="store.loadDashboard()"
      />

      @if (store.loading()) {
        <section class="message-card" aria-live="polite">
          <h2>Loading facility data</h2>
          <p>Reading rooms, metrics, alarms, and the latest measurements from SQLite…</p>
        </section>
      } @else if (store.error() && !store.dashboard()) {
        <section class="message-card error-card" role="alert">
          <h2>Facility backend unavailable</h2>
          <p>{{ store.error() }}</p>
          <button type="button" (click)="store.loadDashboard()">Try again</button>
        </section>
      } @else {
        <div class="workspace-grid">
          <section class="site-overview" aria-labelledby="rooms-title">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Factory floor</p>
                <h2 id="rooms-title">Rooms and production metrics</h2>
              </div>
              <p>Every reading and alarm is served by the conventional facility backend.</p>
            </div>

            <div
              class="mode-switch"
              [class.has-historian-result]="store.historianResult()"
              role="tablist"
              aria-label="Reading display mode"
            >
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="store.displayMode() === 'snapshot'"
                [class.active]="store.displayMode() === 'snapshot'"
                (click)="store.setDisplayMode('snapshot')"
              >
                Snapshot
                <small>Latest value per metric · live</small>
              </button>
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="store.displayMode() === 'reading-log'"
                [class.active]="store.displayMode() === 'reading-log'"
                (click)="store.setDisplayMode('reading-log')"
              >
                Reading log
                <small>Historical readings · filterable</small>
              </button>
              @if (store.historianResult()) {
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="store.displayMode() === 'historian-result'"
                  [class.active]="store.displayMode() === 'historian-result'"
                  (click)="store.setDisplayMode('historian-result')"
                >
                  Historian result
                  <small>Reviewed SQL selection</small>
                </button>
              }
            </div>

            <section class="room" aria-labelledby="rooms-title">
              @if (store.displayMode() !== 'snapshot') {
                @if (
                  store.displayMode() === 'historian-result' && store.historianResult();
                  as result
                ) {
                  <section class="filter-panel" aria-label="Historian query result">
                    <div class="filter-heading">
                      <div>
                        <p class="eyebrow">Historian query result</p>
                        <strong>{{ result.question }}</strong>
                      </div>
                      <button
                        class="secondary-button"
                        type="button"
                        (click)="store.closeHistorianResult()"
                      >
                        Return to reading log
                      </button>
                    </div>
                    <small>
                      {{ result.entries.length }} complete reading
                      {{ result.entries.length === 1 ? 'record' : 'records' }} selected by the
                      reviewed SQL{{ result.truncated ? ' (result truncated)' : '' }}.
                    </small>
                  </section>
                } @else {
                  <app-reading-filters
                    [filters]="store.readingFilters()"
                    (filtersChange)="store.updateReadingFilters($event)"
                    [rooms]="store.rooms()"
                    [metrics]="store.metricOptions()"
                    [shiftManagers]="store.shiftManagerOptions()"
                    [start]="store.readingPageStart()"
                    [end]="store.readingPageEnd()"
                    [total]="store.displayedReadingPage()?.total ?? 0"
                    (clear)="store.clearFilters()"
                    (clearDate)="store.clearDateFilter($event)"
                  />
                }
                <app-reading-table
                  [entries]="store.displayedReadingPage()?.entries ?? []"
                  [loading]="store.readingsLoading()"
                  [historian]="store.displayMode() === 'historian-result'"
                />
                @if (store.displayMode() === 'reading-log') {
                  <nav class="pagination" aria-label="Reading log pagination">
                    <button
                      class="secondary-button"
                      type="button"
                      [disabled]="store.readingPageIndex() === 0 || store.readingsLoading()"
                      (click)="store.goToReadingPage(store.readingPageIndex() - 1)"
                    >
                      Previous
                    </button>
                    <span>
                      Page <strong>{{ store.readingPageIndex() + 1 }}</strong> of
                      <strong>{{ store.readingPageCount() }}</strong>
                    </span>
                    <button
                      class="secondary-button"
                      type="button"
                      [disabled]="
                        store.readingPageIndex() + 1 >= store.readingPageCount() ||
                        store.readingsLoading()
                      "
                      (click)="store.goToReadingPage(store.readingPageIndex() + 1)"
                    >
                      Next
                    </button>
                  </nav>
                }
              } @else {
                <app-snapshot-table
                  [rows]="store.currentRows()"
                  [busyMetricId]="store.busyMetricId()"
                  [latestUpdatedMetricId]="store.latestUpdatedMetricId()"
                  (historyRequested)="store.showHistory($event)"
                  (alarmRequested)="store.handleAlarm($event)"
                />
              }
            </section>
          </section>

          <app-chat />
        </div>
      }

      <p class="status" role="status">{{ store.status() }}</p>
      <app-alarm-audit
        [entries]="store.alarmApprovals()"
        (refresh)="store.loadAlarmApprovalAudit()"
      />

      @if (store.selectedMetricId()) {
        <app-metric-history
          [history]="store.selectedHistory()"
          [loading]="store.historyLoading()"
          (closed)="store.closeHistory()"
        />
      }
    </main>
  `,
  styles: `
    @use '../ui/surface';
    :host {
      display: block;
      min-width: 320px;
      min-height: 100%;
      color: #211c18;
      background: #f4f1eb;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    }

    main {
      max-width: 1600px;
      margin: 0 auto;
      padding: 38px 24px 72px;
    }

    .workspace-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 420px;
      gap: 22px;
      align-items: stretch;
      padding: 22px;
      overflow: hidden;
      border: 1px solid #d9d0c5;
      border-radius: 20px;
      background: #fff;
      box-shadow: 0 16px 48px #3b2c2112;
    }

    .site-overview {
      min-width: 0;
    }

    .section-heading {
      align-items: flex-end;
      margin-bottom: 18px;
    }

    .section-heading > p {
      margin-bottom: 8px;
      font-size: 0.9rem;
    }

    .mode-switch {
      display: inline-grid;
      grid-template-columns: repeat(2, minmax(190px, 1fr));
      padding: 4px;
      margin-bottom: 14px;
      border: 1px solid #d9d0c5;
      border-radius: 13px;
      background: #e9e3dc;
    }

    .mode-switch.has-historian-result {
      grid-template-columns: repeat(3, minmax(160px, 1fr));
    }

    .mode-switch button {
      display: grid;
      padding: 10px 15px;
      background: transparent;
      color: #655d56;
      text-align: left;
    }

    .workspace-grid .mode-switch {
      margin-left: 0;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 14px;
      padding: 16px 22px;
      border-top: 1px solid #e7e0d8;
      color: #655d56;
      font-size: 0.8rem;
    }

    .status {
      min-height: 1.6em;
      margin: 2px 2px 20px;
    }

    .error-card {
      border-left: 5px solid #b53b2d;
    }

    @media (max-width: 1100px) {
      .workspace-grid {
        grid-template-columns: 1fr;
      }
      .workspace-grid {
        padding: 18px;
      }
    }

    @media (max-width: 780px) {
      .page-header,
      .section-heading,
      .room-heading,
      .history-heading {
        align-items: flex-start;
        flex-direction: column;
      }
      .filter-heading {
        align-items: flex-start;
        flex-direction: column;
      }
      .mode-switch {
        display: grid;
        grid-template-columns: 1fr;
        width: 100%;
      }
      .mode-switch.has-historian-result {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .pagination {
        justify-content: space-between;
      }
    }
  `,
})
export class FacilityDashboardPage {
  protected readonly store = inject(FacilityStore);
  constructor() {
    connectFacilityAgent();
  }
}
