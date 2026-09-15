import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import {
  aggregateRows,
  groupRows,
  resultTablePropsSchema,
  historianDatasetSchema,
  validateTableFields,
  type DatasetRow,
  type HistorianDataset,
  type ResultColumn,
  type ResultGroup,
  type ResultTableProps,
} from '@packt-workshop/contracts';
import { resultStyles } from './styles';

const PAGE_SIZE = 20;
export class FacilityResultTable extends LitElement {
  static override properties = {
    config: { attribute: false },
    data: { attribute: false },
    error: { state: true },
  };
  static override styles = resultStyles;
  declare config: ResultTableProps;
  declare data: unknown;
  private resultData?: HistorianDataset;
  declare private error?: string;
  private appliedConfig = '';
  private pages = new Map<string, number>();
  private opened = new Map<string, boolean>();

  private get view(): ResultTableProps {
    return this.config;
  }
  private get rows(): DatasetRow[] {
    return this.resultData?.rows ?? [];
  }
  private get columns(): ResultColumn[] {
    if (this.view.columns) return this.view.columns;
    const preferred = [
      'recorded_at',
      'room_name',
      'metric_name',
      'numeric_value',
      'shift_manager_name',
      'condition',
    ];
    const columns = this.resultData?.columns ?? [];
    const defaults = preferred.filter((key) => columns.some((column) => column.key === key));
    return (
      defaults.length > 0 && columns.some((column) => column.key === 'reading_id')
        ? defaults
        : columns.map((column) => column.key)
    ).map((field) => ({ field }));
  }
  protected override willUpdate() {
    // The renderer also supplies binding setters; only read layout properties.
    const parsed = resultTablePropsSchema.strip().safeParse(this.config);
    const data = historianDatasetSchema.safeParse(this.data);
    this.error = !parsed.success
      ? 'The table description is invalid.'
      : !data.success
        ? 'The query data is unavailable.'
        : undefined;
    if (!parsed.success || !data.success) return;
    this.resultData = data.data;
    const serialized = JSON.stringify(parsed.data);
    if (serialized !== this.appliedConfig) {
      this.appliedConfig = serialized;
      this.pages.clear();
      this.opened.clear();
    }
  }

  private label(column: ResultColumn): string {
    return (
      column.label ??
      this.resultData?.columns.find((candidate) => candidate.key === column.field)?.label ??
      column.field
    );
  }
  private format(row: DatasetRow, column: ResultColumn): string {
    const value = row[column.field];
    if (value === null || value === undefined) return '—';
    const descriptor = this.resultData?.columns.find((candidate) => candidate.key === column.field);
    if (descriptor?.type === 'datetime' && typeof value === 'string') {
      const date = new Date(value);
      if (!Number.isNaN(date.valueOf()))
        return new Intl.DateTimeFormat('en-GB', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(date);
    }
    if (typeof value === 'number') {
      const text = new Intl.NumberFormat('en-GB', {
        maximumFractionDigits: column.digits ?? 2,
      }).format(value);
      return column.field === 'numeric_value' && row['unit'] ? `${text} ${row['unit']}` : text;
    }
    return String(value);
  }
  private pager(key: string, count: number, noun = 'rows') {
    const page = Math.min(this.pages.get(key) ?? 0, Math.max(0, Math.ceil(count / PAGE_SIZE) - 1));
    this.pages.set(key, page);
    return html`<nav class="pager" aria-label=${`${noun} pagination`}>
      <button
        ?disabled=${page === 0}
        @click=${() => {
          this.pages.set(key, page - 1);
          this.requestUpdate();
        }}
      >
        Previous
      </button>
      <span
        >${count ? page * PAGE_SIZE + 1 : 0}–${Math.min((page + 1) * PAGE_SIZE, count)} of
        ${count.toLocaleString()} ${noun}</span
      >
      <button
        ?disabled=${(page + 1) * PAGE_SIZE >= count}
        @click=${() => {
          this.pages.set(key, page + 1);
          this.requestUpdate();
        }}
      >
        Next
      </button>
    </nav>`;
  }
  private detailTable(rows: DatasetRow[], key: string): TemplateResult {
    const pager = this.pager(key, rows.length);
    const start = (this.pages.get(key) ?? 0) * PAGE_SIZE;
    return html`<div class="scroll" role="region" aria-label="Result readings" tabindex="0">
        <table>
          <caption>
            Individual result rows
          </caption>
          <thead>
            <tr>
              ${this.columns.map((column) => html`<th scope="col">${this.label(column)}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${rows.slice(start, start + PAGE_SIZE).map(
              (row) =>
                html`<tr>
                  ${this.columns.map((column) => html`<td>${this.format(row, column)}</td>`)}
                </tr>`,
            )}
            ${
              !rows.length
                ? html`<tr>
                    <td colspan=${this.columns.length}>No readings match this query.</td>
                  </tr>`
                : nothing
            }
          </tbody>
        </table>
      </div>
      ${pager}`;
  }
  private aggregateValue(rows: DatasetRow[], index: number) {
    const aggregate = this.view.aggregates![index]!;
    const value = aggregateRows(rows, aggregate);
    if (value === null) return '—';
    const unit =
      aggregate.operation !== 'count' && aggregate.field === 'numeric_value'
        ? rows[0]?.['unit']
        : null;
    return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ''}`;
  }
  private groupTable(groups: ResultGroup[], depth = 0, parent = 'groups'): TemplateResult {
    const pager = this.pager(parent, groups.length, 'groups');
    const start = (this.pages.get(parent) ?? 0) * PAGE_SIZE;
    const aggregates = this.view.aggregates ?? [];
    return html`<div class="scroll" role="region" aria-label="Grouped result" tabindex="0">
        <table>
          <caption>
            Grouped by ${this.label({ field: this.view.groupBy![depth]! })}
          </caption>
          <thead>
            <tr>
              <th scope="col">${this.label({ field: this.view.groupBy![depth]! })}</th>
              <th scope="col">Rows</th>
              ${aggregates.map((aggregate) => html`<th scope="col">${aggregate.label}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${repeat(
              groups.slice(start, start + PAGE_SIZE),
              (group) => group.key,
              (group) => this.groupRow(group, depth),
            )}
          </tbody>
        </table>
      </div>
      ${groups.length > PAGE_SIZE ? pager : nothing}`;
  }
  private groupRow(group: ResultGroup, depth: number): TemplateResult {
    const aggregates = this.view.aggregates ?? [];
    const canOpen = group.children.length > 0 || this.view.showDetails !== false;
    const open = this.opened.get(group.key) ?? this.view.expanded ?? false;
    const toggle = () => {
      this.opened.set(group.key, !open);
      this.requestUpdate();
    };
    const heading = canOpen
      ? html`<button class="toggle" aria-expanded=${open} @click=${toggle}>
          ${open ? '▾' : '▸'} ${group.label}
        </button>`
      : group.label;
    const details =
      canOpen && open
        ? html`<tr>
            <td colspan=${aggregates.length + 2}>
              <div class="nested">
                ${group.children.length ? this.groupTable(group.children, depth + 1, group.key) : this.detailTable(group.rows, group.key)}
              </div>
            </td>
          </tr>`
        : nothing;
    return html`<tr>
        <th scope="row">${heading}</th>
        <td>${group.rows.length}</td>
        ${aggregates.map((_, index) => html`<td>${this.aggregateValue(group.rows, index)}</td>`)}
      </tr>
      ${details}`;
  }
  private renderContents() {
    if (this.error) return html`<p class="error" role="alert">${this.error}</p>`;
    if (!this.resultData) return html`<p role="status">Loading result data…</p>`;
    try {
      validateTableFields(this.resultData, this.view);
      const groups = groupRows(this.rows, this.view.groupBy ?? [], this.view.groupOrder);
      const grouped = (this.view.groupBy?.length ?? 0) > 0;
      return html`
        ${this.view.title ? html`<h3>${this.view.title}</h3>` : nothing}
        ${
          (this.view.aggregates?.length ?? 0) > 0 && !grouped
            ? html`<div class="scroll">
                <table>
                  <caption>
                    Full-result summary
                  </caption>
                  <thead>
                    <tr>
                      ${this.view.aggregates!.map((aggregate) => html`<th scope="col">${aggregate.label}</th>`)}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      ${this.view.aggregates!.map((_, index) => html`<td>${this.aggregateValue(this.rows, index)}</td>`)}
                    </tr>
                  </tbody>
                </table>
              </div>`
            : nothing
        }
        ${grouped ? this.groupTable(groups) : this.view.showDetails !== false || !this.view.aggregates?.length ? this.detailTable(this.rows, 'all') : nothing}
      `;
    } catch (error) {
      return html`<p class="error" role="alert">
        ${error instanceof Error ? error.message : 'Invalid result view.'}
      </p>`;
    }
  }
  protected override render() {
    return this.renderContents();
  }
}
if (!customElements.get('facility-result-table'))
  customElements.define('facility-result-table', FacilityResultTable);
