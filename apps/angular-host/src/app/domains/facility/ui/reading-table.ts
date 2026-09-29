import { Component, input } from '@angular/core';
import type { FacilityReadingEntry } from '@packt-workshop/contracts';
import { timeLabel, readingValue } from '../model/presentation';
@Component({
  selector: 'app-reading-table',
  template: `
    <div class="table-shell" tabindex="0" aria-label="Historical readings table">
      <table class="reading-entries-table">
        <caption>
          {{
            historian()
              ? 'Stored readings selected by the reviewed historian query'
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
            @for (entry of entries(); track entry.id) {
              <tr class="condition-{{ entry.condition }}">
                <td>
                  <time [attr.datetime]="entry.recordedAt">{{ timeLabel(entry.recordedAt) }}</time>
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
                  <span class="condition-badge">{{ entry.condition }}</span>
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
  readonly entries = input.required<readonly FacilityReadingEntry[]>();
  readonly loading = input(false);
  readonly historian = input(false);
  protected readonly timeLabel = timeLabel;
  protected readonly readingValue = readingValue;
}
