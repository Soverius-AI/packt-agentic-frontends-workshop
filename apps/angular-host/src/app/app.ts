import { Component, ElementRef, effect, signal, viewChild } from '@angular/core';
import type { ComplianceAssessment, MachineIncident } from '@packt-workshop/contracts';
import {
  mountComplianceMcpApp,
  requestComplianceAssessment,
  submitOperatorDecision,
  type MountedMcpApp,
} from '@packt-workshop/workshop-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly incident: MachineIncident = {
    incidentId: 'INC-HVAC-03',
    machineId: 'ROOM-3-HVAC',
    occurredAt: '2026-08-17T08:00:00.000Z',
    severity: 'medium',
    summary:
      'The room temperature has risen continuously for 30 minutes and now matches the outside temperature.',
    telemetry: {
      temperatureCelsius: 29,
      outsideTemperatureCelsius: 29,
      trendDurationMinutes: 30,
      doorState: 'unknown',
      vibrationMillimetersPerSecond: 0,
      pressureBar: 0,
    },
  };
  protected readonly assessment = signal<ComplianceAssessment | undefined>(undefined);
  protected readonly status = signal('Ready to assess the simulated incident.');
  protected readonly busy = signal(false);
  protected readonly showResearch = signal(false);
  protected readonly correlationId = signal<string | undefined>(undefined);
  protected readonly machineState = signal<'running' | 'at-risk' | 'isolated'>('running');
  protected readonly researchContainer = viewChild<ElementRef<HTMLElement>>('researchContainer');

  readonly #mountResearchApp = effect((onCleanup) => {
    const container = this.researchContainer()?.nativeElement;
    const assessment = this.assessment();
    if (!container || !assessment || !this.showResearch()) {
      return;
    }

    let active = true;
    let mounted: MountedMcpApp | undefined;
    void mountComplianceMcpApp(container, assessment.caseId, this.correlationId())
      .then((app) => {
        if (active) {
          mounted = app;
        } else {
          void app.destroy();
        }
      })
      .catch((error: unknown) => {
        if (active) {
          this.status.set(
            error instanceof Error ? error.message : 'Unable to open specialist guidance.',
          );
        }
      });

    onCleanup(() => {
      active = false;
      if (mounted) {
        void mounted.destroy();
      }
    });
  });

  protected async assessIncident(): Promise<void> {
    this.busy.set(true);
    this.showResearch.set(false);
    this.status.set('The primary application is delegating to the A2A facilities specialist…');
    try {
      const nextCorrelationId = crypto.randomUUID();
      this.correlationId.set(nextCorrelationId);
      const workflow = await requestComplianceAssessment({
        incident: this.incident,
        jurisdiction: 'Workshop Jurisdiction',
        correlationId: nextCorrelationId,
      });
      this.assessment.set(workflow.assessment);
      this.machineState.set(workflow.machineState);
      this.status.set(`Assessment complete. The A2A agent returned ${workflow.assessment.caseId}.`);
    } catch (error) {
      this.status.set(error instanceof Error ? error.message : 'Assessment failed.');
    } finally {
      this.busy.set(false);
    }
  }

  protected openLegalAnalysis(): void {
    this.showResearch.set(true);
  }

  protected async decide(actionId: string, decision: 'approve' | 'reject'): Promise<void> {
    const correlationId = this.correlationId();
    if (!correlationId) return;
    this.busy.set(true);
    this.status.set(`${decision === 'approve' ? 'Approving' : 'Rejecting'} ${actionId}…`);
    try {
      const result = await submitOperatorDecision({
        correlationId,
        actionId,
        decision,
        operatorId: 'workshop-operator',
      });
      this.machineState.set(result.machineState);
      this.status.set(
        `Human decision recorded: ${result.decision}. Asset is ${result.machineState}.`,
      );
    } catch (error) {
      this.status.set(error instanceof Error ? error.message : 'Decision failed.');
    } finally {
      this.busy.set(false);
    }
  }
}
