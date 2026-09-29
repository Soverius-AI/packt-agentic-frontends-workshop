import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import type {
  AlarmApprovalAuditEntry,
  AlarmApprovalRequest,
  AlarmApprovalToolInput,
} from '@packt-workshop/contracts';
import { RenderToolCalls, type HumanInTheLoopToolCall } from '@copilotkit/angular';
import { FacilityStore } from '../../data/facility-store';
import { AlarmApprovalCard } from './alarm-approval-card';

const proposal: AlarmApprovalToolInput = {
  metricId: 'cooling-air-temperature',
  metricName: 'Air temperature',
  reason: 'Operator requested investigation',
};
function recorded(request: AlarmApprovalRequest): AlarmApprovalAuditEntry {
  return {
    correlationId: request.correlationId,
    action: 'raise-alarm',
    metricId: proposal.metricId,
    metricName: proposal.metricName,
    reason: proposal.reason,
    decision: request.decision,
    operatorId: request.operatorId,
    decidedAt: '2026-09-29T12:00:00Z',
    outcome: request.decision === 'approved' ? 'executed' : 'not-executed',
    alarmId: request.decision === 'approved' ? 'alarm-1' : null,
    error: null,
  };
}
async function setup(
  decideAlarmApproval = vi.fn(async (request: AlarmApprovalRequest) => recorded(request)),
) {
  const respond = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: RenderToolCalls,
        useValue: {
          message: signal({
            id: 'message-1',
            role: 'assistant',
            toolCalls: [
              {
                id: 'alarm-call-1',
                function: { name: 'review_alarm', arguments: JSON.stringify(proposal) },
              },
            ],
          }),
        },
      },
      {
        provide: FacilityStore,
        useValue: {
          decideAlarmApproval,
          rooms: signal([
            {
              name: 'Cooling room',
              metrics: [{ id: proposal.metricId, name: proposal.metricName }],
            },
          ]),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(AlarmApprovalCard);
  const call: HumanInTheLoopToolCall<AlarmApprovalToolInput> = {
    name: 'review_alarm',
    status: 'executing',
    args: proposal,
    result: undefined,
    respond,
  };
  fixture.componentRef.setInput('toolCall', call);
  await fixture.whenStable();
  const host: HTMLElement = fixture.nativeElement;
  const button = (label: string) =>
    Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.trim() === label)!;
  return { fixture, host, button, respond, decideAlarmApproval, call };
}

describe('Alarm human approval', () => {
  it.each(['approved', 'rejected'] as const)(
    'waits for the human, records %s, and resumes with the facility result',
    async (decision) => {
      const app = await setup();
      expect(app.host.textContent).toContain('Cooling room');
      expect(app.decideAlarmApproval).not.toHaveBeenCalled();
      expect(app.respond).not.toHaveBeenCalled();
      const button = app.button(decision === 'approved' ? 'Approve and raise alarm' : 'Reject');
      button.focus();
      button.click();
      await app.fixture.whenStable();
      expect(app.decideAlarmApproval).toHaveBeenCalledOnce();
      const request = app.decideAlarmApproval.mock.calls[0]![0];
      expect(request).toMatchObject({ proposal, decision, operatorId: 'night-reception' });
      expect(app.respond).toHaveBeenCalledExactlyOnceWith(recorded(request));
      expect(app.host.textContent).toContain(
        decision === 'approved' ? 'Approved · alarm raised' : 'Rejected · no alarm was raised',
      );
      expect(document.activeElement).toBe(app.host.querySelector('section'));
    },
  );

  it('does not submit twice while a decision is pending', async () => {
    let finish!: (value: AlarmApprovalAuditEntry) => void;
    const decide = vi.fn(
      (_request: AlarmApprovalRequest) =>
        new Promise<AlarmApprovalAuditEntry>((resolve) => {
          finish = resolve;
        }),
    );
    const app = await setup(decide);
    const button = app.button('Approve and raise alarm');
    button.click();
    button.click();
    await app.fixture.whenStable();
    expect(decide).toHaveBeenCalledOnce();
    expect(app.respond).not.toHaveBeenCalled();
    expect(button.disabled).toBe(true);
    finish(recorded(decide.mock.calls[0]![0]));
    await app.fixture.whenStable();
    expect(app.respond).toHaveBeenCalledOnce();
  });

  it('keeps a failed HTTP decision retryable with the same correlation ID', async () => {
    const decide = vi.fn(async (request: AlarmApprovalRequest) => recorded(request));
    decide.mockRejectedValueOnce(new Error('Connection interrupted'));
    const app = await setup(decide);
    app.button('Approve and raise alarm').click();
    await app.fixture.whenStable();
    expect(app.host.querySelector('[role="alert"]')?.textContent).toContain(
      'Connection interrupted',
    );
    expect(app.respond).not.toHaveBeenCalled();
    app.button('Approve and raise alarm').click();
    await app.fixture.whenStable();
    expect(decide.mock.calls[0]![0].correlationId).toBe(decide.mock.calls[1]![0].correlationId);
    expect(app.respond).toHaveBeenCalledOnce();
  });

  it('reports approved-but-failed execution without claiming an alarm was raised', async () => {
    const app = await setup(
      vi.fn(async (request: AlarmApprovalRequest) => ({
        ...recorded(request),
        outcome: 'failed' as const,
        alarmId: null,
        error: 'This metric already has an active alarm.',
      })),
    );
    app.button('Approve and raise alarm').click();
    await app.fixture.whenStable();
    expect(app.host.textContent).toContain('Approved · execution failed');
    expect(app.host.textContent).not.toContain('Approved · alarm raised');
    expect(app.respond).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'failed' }));
  });

  it('never offers a decision while the proposal is still streaming', async () => {
    const app = await setup();
    app.fixture.componentRef.setInput('toolCall', { ...app.call, status: 'in-progress', args: {} });
    await app.fixture.whenStable();
    expect(app.host.querySelectorAll('button')).toHaveLength(0);
    expect(app.decideAlarmApproval).not.toHaveBeenCalled();
  });
  it.each([
    {},
    { ...proposal, metricId: 'invented-metric' },
    { ...proposal, metricName: 'Wrong name' },
  ])('dismisses an invalid proposal and resumes without a backend mutation', async (args) => {
    const app = await setup();
    app.fixture.componentRef.setInput('toolCall', { ...app.call, args });
    await app.fixture.whenStable();
    expect(app.host.textContent).toContain('No alarm was raised');
    expect(app.button('Approve and raise alarm')).toBeUndefined();
    app.button('Dismiss proposal').click();
    await app.fixture.whenStable();
    expect(app.decideAlarmApproval).not.toHaveBeenCalled();
    expect(app.respond).toHaveBeenCalledExactlyOnceWith({
      decision: 'rejected',
      outcome: 'not-executed',
      error: expect.any(String),
    });
    expect(app.host.querySelectorAll('button')).toHaveLength(0);
  });
  it('recovers the same decision after the pending card is recreated', async () => {
    const app = await setup();
    app.button('Approve and raise alarm').click();
    await app.fixture.whenStable();
    const firstId = app.decideAlarmApproval.mock.calls[0]![0].correlationId;
    app.fixture.destroy();
    const remounted = TestBed.createComponent(AlarmApprovalCard);
    remounted.componentRef.setInput('toolCall', app.call);
    await remounted.whenStable();
    const host: HTMLElement = remounted.nativeElement;
    Array.from(host.querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Approve and raise'))!
      .click();
    await remounted.whenStable();
    expect(app.decideAlarmApproval.mock.calls[1]![0].correlationId).toBe(firstId);
    expect(firstId).toBe(JSON.stringify(['message-1', 'alarm-call-1']));
  });
});
