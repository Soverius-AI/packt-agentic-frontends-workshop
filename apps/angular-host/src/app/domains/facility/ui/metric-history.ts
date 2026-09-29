import { Component, input, output } from '@angular/core';
import type { MetricHistory as History } from '@packt-workshop/contracts';
import {
  timeLabel,
  chartPoints,
  chartTicks,
  historyRange,
  shiftManagers,
  stateChanges,
} from '../model/presentation';
@Component({
  selector: 'app-metric-history',
  template: `
    <section class="history-panel" aria-labelledby="history-title">
      <div class="history-heading">
        <div>
          <p class="eyebrow">Database history · last seven days</p>
          <h2 id="history-title">{{ history()?.metric?.name ?? 'Loading history…' }}</h2>
        </div>
        <button class="secondary-button" type="button" (click)="closed.emit()">Close</button>
      </div>

      @if (loading()) {
        <p>Loading historical readings…</p>
      } @else if (history(); as selected) {
        @if (selected.metric.kind === 'numeric') {
          <div class="chart-summary">
            <strong>{{ historyRange(selected) }}</strong>
            <span>{{ selected.readings.length }} persisted readings</span>
            <span>Shift managers: {{ shiftManagers(selected) }}</span>
          </div>
          <svg
            class="history-chart"
            viewBox="0 0 760 188"
            role="img"
            [attr.aria-label]="'Seven-day history for ' + selected.metric.name"
          >
            @for (tick of chartTicks(selected); track tick.y) {
              <line
                class="chart-grid-line"
                x1="72"
                [attr.y1]="tick.y"
                x2="744"
                [attr.y2]="tick.y"
              />
              <text
                class="y-axis-label"
                x="64"
                [attr.y]="tick.y"
                text-anchor="end"
                dominant-baseline="middle"
              >
                {{ tick.label }}
              </text>
            }
            <line class="chart-axis" x1="72" y1="24" x2="72" y2="168" />
            <polyline [attr.points]="chartPoints(selected)" />
          </svg>
        } @else {
          <ol class="state-timeline">
            @for (reading of stateChanges(selected); track reading.recordedAt) {
              <li>
                <time [attr.datetime]="reading.recordedAt">{{
                  timeLabel(reading.recordedAt)
                }}</time>
                <strong>{{ reading.textValue }}</strong>
                <span>{{ reading.shiftManagerName }}</span>
              </li>
            }
          </ol>
        }
      }
    </section>
  `,
  styles: `
    @use './surface';
    :host {
      display: block;
      min-width: 0;
    }

    .chart-summary {
      margin-bottom: 10px;
      color: #655d56;
      font-size: 0.82rem;
    }

    .chart-summary span {
      display: block;
      margin-top: 3px;
    }

    .history-chart {
      display: block;
      width: 100%;
      max-height: 250px;
      border-radius: 12px;
      background: #f7f4ef;
    }

    .history-chart .chart-grid-line {
      stroke: #c9bdb1;
      stroke-width: 1;
    }

    .history-chart .chart-axis {
      stroke: #8f8175;
      stroke-width: 1.5;
    }

    .history-chart .y-axis-label {
      fill: #655d56;
      font-size: 11px;
      font-weight: 650;
    }

    .history-chart polyline {
      fill: none;
      stroke: #b46b00;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 4;
    }

    .state-timeline {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .state-timeline li {
      display: flex;
      justify-content: space-between;
      padding: 12px 14px;
      border-radius: 10px;
      background: #f7f4ef;
    }

    .state-timeline time {
      color: #6d655e;
    }

    @media (max-width: 780px) {
      .page-header,
      .section-heading,
      .room-heading,
      .history-heading {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `,
})
export class MetricHistory {
  readonly history = input<History>();
  readonly loading = input(false);
  readonly closed = output<void>();
  protected readonly timeLabel = timeLabel;
  protected readonly chartPoints = chartPoints;
  protected readonly chartTicks = chartTicks;
  protected readonly historyRange = historyRange;
  protected readonly shiftManagers = shiftManagers;
  protected readonly stateChanges = stateChanges;
}
