import { Component, computed, inject, input, signal } from '@angular/core';
import type { HumanInTheLoopToolCall, HumanInTheLoopToolRenderer } from '@copilotkit/angular';
import {
  alarmApprovalAuditEntrySchema,
  alarmApprovalToolSchema,
  type AlarmApprovalAuditEntry,
  type AlarmApprovalDecision,
  type AlarmApprovalToolInput,
} from '@packt-workshop/contracts';
import { AlarmApprovalEvents } from './alarm-approval-events';
import { FacilityApi } from './facility-api';

@Component({
  selector: 'app-alarm-approval-card',
  template: `
    <section class="approval-card" [attr.aria-labelledby]="headingId">
      <p class="eyebrow">Human approval required</p>
      <h3 [id]="headingId">Raise an alarm?</h3>

      @if (proposal(); as proposal) {
        <dl>
          <div>
            <dt>Metric</dt>
            <dd>{{ proposal.metricName }}</dd>
          </div>
          <div>
            <dt>Reason</dt>
            <dd>{{ proposal.reason }}</dd>
          </div>
          <div>
            <dt>Operator</dt>
            <dd>night-reception</dd>
          </div>
        </dl>

        @if (record(); as record) {
          <p class="decision" role="status" [class.executed]="record.outcome === 'executed'">
            {{ outcomeLabel(record) }}
          </p>
          <small>Correlation ID: {{ record.correlationId }}</small>
        } @else if (toolCall().status === 'executing') {
          <p>This operation changes facility data and will be written to the decision audit.</p>
          <div class="actions">
            <button type="button" class="reject" [disabled]="busy()" (click)="decide('rejected')">
              Reject
            </button>
            <button type="button" [disabled]="busy()" (click)="decide('approved')">
              {{ busy() ? 'Recording…' : 'Approve and raise alarm' }}
            </button>
          </div>
          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }
        } @else {
          <p role="status">Preparing the approval request…</p>
        }
      } @else {
        <p role="alert">The alarm proposal is incomplete.</p>
      }
    </section>
  `,
  styles: `
    .approval-card {
      margin: 10px 0;
      padding: 16px;
      border: 1px solid #cfbca8;
      border-left: 5px solid #b46b00;
      border-radius: 12px;
      background: #fffaf2;
      color: #3f352e;
    }
    .eyebrow {
      margin: 0 0 4px;
      color: #7d4c08;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h3 {
      margin: 0 0 12px;
    }
    dl {
      display: grid;
      gap: 8px;
      margin: 0 0 12px;
    }
    dl div {
      display: grid;
      grid-template-columns: 80px 1fr;
      gap: 8px;
    }
    dt {
      color: #655d56;
      font-size: 0.75rem;
      font-weight: 800;
    }
    dd {
      margin: 0;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    button {
      padding: 9px 12px;
      border: 0;
      border-radius: 9px;
      background: #684529;
      color: #fff;
      font: inherit;
      font-size: 0.78rem;
      font-weight: 800;
      cursor: pointer;
    }
    button.reject {
      border: 1px solid #9f8f80;
      background: #fff;
      color: #5c4535;
    }
    button:disabled {
      cursor: progress;
      opacity: 0.58;
    }
    button:focus-visible {
      outline: 3px solid #d38a2e;
      outline-offset: 3px;
    }
    .decision {
      padding: 10px;
      border-radius: 8px;
      background: #eee9e2;
      font-weight: 800;
    }
    .decision.executed {
      background: #dcebdc;
      color: #26532d;
    }
    .error {
      color: #8f2f24;
    }
    small {
      overflow-wrap: anywhere;
      color: #655d56;
    }
  `,
})
export class AlarmApprovalCard implements HumanInTheLoopToolRenderer<AlarmApprovalToolInput> {
  readonly toolCall = input.required<HumanInTheLoopToolCall<AlarmApprovalToolInput>>();
  readonly #api = inject(FacilityApi);
  readonly #events = inject(AlarmApprovalEvents);
  readonly #correlationId = crypto.randomUUID();
  protected readonly headingId = `alarm-approval-${this.#correlationId}`;
  protected readonly busy = signal(false);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly recorded = signal<AlarmApprovalAuditEntry | undefined>(undefined);
  protected readonly proposal = computed(
    () => alarmApprovalToolSchema.safeParse(this.toolCall().args).data,
  );
  protected readonly record = computed(() => {
    const recorded = this.recorded();
    if (recorded) return recorded;
    const result = this.toolCall().result;
    if (!result) return undefined;
    try {
      return alarmApprovalAuditEntrySchema.safeParse(JSON.parse(result) as unknown).data;
    } catch {
      return undefined;
    }
  });

  protected async decide(decision: AlarmApprovalDecision): Promise<void> {
    const toolCall = this.toolCall();
    const proposal = this.proposal();
    if (toolCall.status !== 'executing' || !proposal || this.busy()) return;

    this.busy.set(true);
    this.error.set(undefined);
    try {
      const record = await this.#api.decideAlarmApproval({
        correlationId: this.#correlationId,
        proposal,
        decision,
        operatorId: 'night-reception',
      });
      this.recorded.set(record);
      this.#events.notify(record);
      toolCall.respond(record);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'The decision could not be recorded.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected outcomeLabel(record: AlarmApprovalAuditEntry): string {
    if (record.outcome === 'executed') return 'Approved · alarm raised';
    if (record.outcome === 'failed') return `Approved · execution failed: ${record.error}`;
    return 'Rejected · no alarm was raised';
  }
}
