import { Component, input, model, output } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import type { ReadingFilters as ReadingFiltersModel } from '../model/facility';

@Component({
  selector: 'app-reading-filters',
  template: `
    <section class="filter-panel" aria-label="Filter persisted readings">
      <div class="filter-heading">
        <div>
          <p class="eyebrow">Historical reading filters</p>
          <strong> Showing {{ start() }}–{{ end() }} of {{ total() }} readings </strong>
        </div>
        <button class="secondary-button" type="button" (click)="clear.emit()">Clear filters</button>
      </div>
      <div class="filter-grid">
        <label>
          <span>Updated from</span>
          <span class="date-filter-control">
            <input type="datetime-local" [formField]="filterForm.from" />
            <button
              class="date-clear-button"
              type="button"
              [disabled]="!filters().from"
              aria-label="Clear updated from"
              (click)="clearDate.emit('from')"
            >
              Clear
            </button>
          </span>
        </label>
        <label>
          <span>Updated to</span>
          <span class="date-filter-control">
            <input type="datetime-local" [formField]="filterForm.to" />
            <button
              class="date-clear-button"
              type="button"
              [disabled]="!filters().to"
              aria-label="Clear updated to"
              (click)="clearDate.emit('to')"
            >
              Clear
            </button>
          </span>
        </label>
        <label>
          <span>Shift manager</span>
          <select [formField]="filterForm.shiftManager">
            <option value="">All shift managers</option>
            @for (manager of shiftManagers(); track manager) {
              <option [value]="manager">
                {{ manager }}
              </option>
            }
          </select>
        </label>
        <label>
          <span>Room</span>
          <select [formField]="filterForm.roomId">
            <option value="">All rooms</option>
            @for (room of rooms(); track room.id) {
              <option [value]="room.id">
                {{ room.name }}
              </option>
            }
          </select>
        </label>
        <label>
          <span>Metric</span>
          <select [formField]="filterForm.metricId">
            <option value="">All metrics</option>
            @for (metric of metrics(); track metric.id) {
              <option [value]="metric.id">
                {{ metric.label }}
              </option>
            }
          </select>
        </label>
        <label>
          <span>Condition</span>
          <select [formField]="filterForm.condition">
            <option value="">All conditions</option>
            <option value="normal">Normal</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
      </div>
    </section>
  `,
  styles: `
    @use './surface';
    :host {
      display: block;
      min-width: 0;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(170px, 1fr));
      gap: 14px;
    }

    .filter-grid label {
      display: grid;
      gap: 6px;
      color: #655d56;
      font-size: 0.74rem;
      font-weight: 750;
    }

    .filter-grid input,
    .filter-grid select {
      width: 100%;
      min-height: 40px;
      padding: 8px 10px;
      border: 1px solid #b9aa9c;
      border-radius: 8px;
      background: #fff;
      color: #211c18;
      font: inherit;
    }

    .date-filter-control {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 7px;
    }

    .date-clear-button {
      min-width: 54px;
      padding: 8px 9px;
      border: 1px solid #b9aa9c;
      background: #fff;
      color: #5c4535;
      font-size: 0.72rem;
    }

    .filter-grid input:focus-visible,
    .filter-grid select:focus-visible {
      outline: 3px solid #d38a2e;
      outline-offset: 2px;
    }

    @media (max-width: 780px) {
      .filter-grid {
        grid-template-columns: 1fr;
      }
      .filter-heading {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `,
  imports: [FormField],
})
export class ReadingFilters {
  readonly filters = model.required<ReadingFiltersModel>();
  readonly filterForm = form(this.filters);
  readonly rooms = input.required<readonly { id: string; name: string }[]>();
  readonly metrics = input.required<readonly { id: string; label: string }[]>();
  readonly shiftManagers = input.required<readonly string[]>();
  readonly start = input.required<number>();
  readonly end = input.required<number>();
  readonly total = input.required<number>();
  readonly clear = output<void>();
  readonly clearDate = output<'from' | 'to'>();
}
