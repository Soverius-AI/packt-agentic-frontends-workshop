import { Component, input } from '@angular/core';
import type { HistorianEntry } from '@packt-workshop/contracts';
import { timeLabel, readingValue } from '../model/presentation';
@Component({
  selector: 'app-reading-table',
  template: `
    <div class="table-shell" tabindex="0" aria-label="Historical readings table">
      <table class="reading-entries-table">
        <caption>
          {{
            historian()
              ? 'Results of the reviewed historian query'
              : 'Persisted metric readings matching the historical filters'
          }}
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
          @if (loading() && !historian()) {
            <tr>
              <td class="empty-table" colspan="6">Loading persisted readings…</td>
            </tr>
          } @else {
            @for (entry of entries(); track entry) {
              <tr class="condition-{{ entry.condition }}">
                <td>
                  @if (entry.recordedAt) {
                    <time [attr.datetime]="entry.recordedAt">{{
                      timeLabel(entry.recordedAt)
                    }}</time>
                  }
                </td>
                <td class="shift-manager">{{ entry.shiftManagerName }}</td>
                <td class="room-cell">
                  <strong>{{ entry.roomName }}</strong>
                </td>
                <th class="metric-cell" scope="row">
                  {{ entry.metricName }}
                </th>
                <td class="reading-entry-value">{{ readingValue(entry) }}</td>
                <td>
                  @if (entry.condition) {
                    <span class="condition-badge">{{ entry.condition }}</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td class="empty-table" colspan="6">No persisted readings match these filters.</td>
              </tr>
            }
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

    .reading-entries-table {
      min-width: 900px;
    }

    .empty-table {
      padding: 30px;
      color: #655d56;
      text-align: center;
    }

    .reading-entry-value {
      font-weight: 800;
      white-space: nowrap;
    }
  `,
})
export class ReadingTable {
  readonly entries = input.required<readonly HistorianEntry[]>();
  readonly loading = input(false);
  readonly historian = input(false);
  protected readonly timeLabel = timeLabel;
  protected readonly readingValue = readingValue;
}
