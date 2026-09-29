import { Component, input, output } from '@angular/core';
import type { AlarmApprovalAuditEntry } from '@packt-workshop/contracts';
import { timeLabel, alarmApprovalOutcome } from '../model/presentation';
@Component({
  selector: 'app-alarm-audit',
  template: `
    <section class="audit-panel" aria-labelledby="alarm-audit-title">
      <div class="history-heading">
        <div>
          <p class="eyebrow">Accountability record</p>
          <h2 id="alarm-audit-title">Alarm decision audit</h2>
        </div>
        <button class="secondary-button" type="button" (click)="refresh.emit()">
          Refresh audit
        </button>
      </div>
      @if (entries().length) {
        <div class="table-shell" tabindex="0" aria-label="Alarm approval audit table">
          <table class="audit-table">
            <caption>
              Human decisions on alarm proposals and their actual execution outcomes
            </caption>
            <thead>
              <tr>
                <th scope="col">Decision time</th>
                <th scope="col">Metric</th>
                <th scope="col">Operator</th>
                <th scope="col">Decision</th>
                <th scope="col">Outcome</th>
                <th scope="col">Correlation ID</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of entries(); track entry.correlationId) {
                <tr>
                  <td>
                    <time [attr.datetime]="entry.decidedAt">{{ timeLabel(entry.decidedAt) }}</time>
                  </td>
                  <th scope="row">{{ entry.metricName }}</th>
                  <td>{{ entry.operatorId }}</td>
                  <td>
                    <span class="audit-decision">{{ entry.decision }}</span>
                  </td>
                  <td>{{ alarmApprovalOutcome(entry) }}</td>
                  <td>
                    <code>{{ entry.correlationId }}</code>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p>No agent-proposed alarm decision has been recorded yet.</p>
      }
    </section>
  `,
  styles: `
    @use './surface';
    :host {
      display: block;
      min-width: 0;
    }

    .audit-panel {
      margin-bottom: 20px;
      padding: 22px;
      border: 1px solid #ded4ca;
      border-radius: 16px;
      background: #fff;
    }

    .audit-table code {
      font-size: 0.72rem;
      overflow-wrap: anywhere;
      white-space: nowrap;
    }

    .audit-decision {
      font-weight: 800;
      text-transform: capitalize;
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
export class AlarmAudit {
  readonly entries = input.required<readonly AlarmApprovalAuditEntry[]>();
  readonly refresh = output<void>();
  protected readonly timeLabel = timeLabel;
  protected readonly alarmApprovalOutcome = alarmApprovalOutcome;
}
