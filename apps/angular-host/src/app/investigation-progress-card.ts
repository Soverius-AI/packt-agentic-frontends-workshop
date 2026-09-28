import { Component, input } from '@angular/core';
import type { ActivityRenderer } from '@copilotkit/angular';
import type { InvestigationProgress } from '@packt-workshop/contracts';

@Component({
  selector: 'app-investigation-progress-card',
  template: `
    <section role="status" aria-live="polite" [attr.aria-busy]="content().status === 'running'">
      <span aria-hidden="true" class="indicator" [class.running]="content().status === 'running'">
        {{ content().status === 'completed' ? '✓' : content().status === 'running' ? '◌' : '!' }}
      </span>
      <span>{{ content().message }}</span>
    </section>
  `,
  styles: `
    section {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 12px 0;
      padding: 14px;
      color: #284553;
      background: #edf3f5;
      border: 1px solid #bdcdd4;
      border-radius: 10px;
      font-size: 0.82rem;
      line-height: 1.5;
      box-shadow: 0 3px 10px #2038430a;
    }
    .indicator {
      font-size: 1.3rem;
      font-weight: bold;
    }
    .running {
      animation: turn 1.4s linear infinite;
    }
    @keyframes turn {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .running {
        animation: none;
      }
    }
  `,
})
export class InvestigationProgressCard implements ActivityRenderer<InvestigationProgress> {
  readonly activityType = input.required<string>();
  readonly content = input.required<InvestigationProgress>();
  readonly message = input.required<ReturnType<ActivityRenderer['message']>>();
  readonly agent = input.required<ReturnType<ActivityRenderer['agent']>>();
}
