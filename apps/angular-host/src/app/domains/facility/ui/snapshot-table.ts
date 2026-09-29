import { Component, input, output } from '@angular/core';
import type { MetricSummary } from '@packt-workshop/contracts';
import type { SnapshotRow } from '../model/facility';
import { timeLabel, metricValue, alarmLabel, alarmState } from '../model/presentation';
@Component({
  selector: 'app-snapshot-table',
  template: `
    <div class="current-table-heading">
      <div>
        <p class="eyebrow">Live overview</p>
        <h3>Current reading per metric</h3>
      </div>
      <span>{{ rows().length }} metrics</span>
    </div>
    <div class="table-shell" tabindex="0" aria-label="Factory metrics table">
      <table class="metrics-table">
        <caption>
          Current readings, configured targets, history, and alarms for all factory rooms
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
            <th scope="col">Alarm workflow</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.metric.id) {
            <tr
              class="condition-{{ row.metric.condition }}"
              [class.alarm-active]="row.metric.activeAlarm"
              [class.live-updated]="latestUpdatedMetricId() === row.metric.id"
              [attr.data-metric-id]="row.metric.id"
            >
              <td class="room-cell">
                <strong>{{ row.room.name }}</strong>
              </td>
              <th class="metric-cell" scope="row">
                {{ row.metric.name }}
              </th>
              <td class="reading">
                <strong>{{ metricValue(row.metric) }}</strong>
                @if (row.metric.unit) {
                  <span>{{ row.metric.unit }}</span>
                }
                <small>{{ timeLabel(row.metric.updatedAt) }}</small>
              </td>
              <td class="shift-manager">{{ row.metric.shiftManagerName }}</td>
              <td class="trend">{{ row.metric.trend }}</td>
              <td>
                <span class="condition-badge">{{ row.metric.condition }}</span>
              </td>
              <td class="target">{{ row.metric.target }}</td>
              <td>
                <button
                  class="history-button"
                  type="button"
                  (click)="historyRequested.emit(row.metric)"
                >
                  View 7d
                </button>
              </td>
              <td>
                <div class="alarm-action">
                  <span>{{ alarmState(row.metric) }}</span>
                  <button
                    type="button"
                    (click)="alarmRequested.emit(row.metric)"
                    [disabled]="busyMetricId() === row.metric.id"
                    [attr.aria-label]="alarmLabel(row.metric) + ' for ' + row.metric.name"
                  >
                    {{ busyMetricId() === row.metric.id ? 'Saving…' : alarmLabel(row.metric) }}
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    @use './surface';
    :host {
      display: block;
      min-width: 0;
    }

    .metrics-table {
      min-width: 820px;
    }

    .metrics-table th,
    .metrics-table td {
      padding: 12px 7px;
      font-size: 0.72rem;
    }

    .metrics-table .alarm-action {
      gap: 5px;
    }

    tbody tr.alarm-active {
      background: #fff7f4;
    }

    tbody tr.live-updated {
      animation: live-update 1.5s ease-out;
    }

    @keyframes live-update {
      0% {
        background: #dff2e1;
        box-shadow: inset 0 0 0 2px #4f7a64;
      }
      100% {
        background: transparent;
        box-shadow: inset 0 0 0 0 transparent;
      }
    }

    tbody tr.condition-critical > :first-child,
    tbody tr.alarm-active > :first-child {
      border-left-color: #b53b2d;
    }

    .current-table-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 22px 22px 14px;
      border-top: 1px solid #d9d0c5;
    }

    .current-table-heading h3 {
      margin: 3px 0 0;
    }

    .current-table-heading > span {
      color: #655d56;
      font-size: 0.78rem;
      font-weight: 750;
    }

    .trend {
      min-width: 120px;
      color: #655d56;
      font-size: 0.8rem;
      font-weight: 750;
    }

    .alarm-action {
      min-width: 205px;
    }

    .alarm-action > span {
      max-width: 80px;
      text-transform: capitalize;
    }

    .history-button {
      white-space: nowrap;
    }
  `,
})
export class SnapshotTable {
  readonly rows = input.required<readonly SnapshotRow[]>();
  readonly busyMetricId = input<string>();
  readonly latestUpdatedMetricId = input<string>();
  readonly historyRequested = output<MetricSummary>();
  readonly alarmRequested = output<MetricSummary>();
  protected readonly timeLabel = timeLabel;
  protected readonly metricValue = metricValue;
  protected readonly alarmLabel = alarmLabel;
  protected readonly alarmState = alarmState;
}
