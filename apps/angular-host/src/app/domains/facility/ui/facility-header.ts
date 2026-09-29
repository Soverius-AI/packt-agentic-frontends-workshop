import { Component, input, output } from '@angular/core';
import type { DisplayMode } from '../model/facility';
@Component({
  selector: 'app-facility-header',
  template: `
    <header class="page-header">
      <div class="brand-lockup">
        <a
          class="corporate-logo-link"
          href="https://soverius.ai/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit the Soverius AI website"
        >
          <img class="corporate-logo" src="/soverius-ai-original.png" alt="Soverius AI" />
        </a>
        <div class="brand-copy">
          <p class="eyebrow">Soverius Chocolate operations</p>
          <h1 class="product-title">Incident Management</h1>
          <p class="subtitle">
            Persistent factory telemetry, historical readings, operator-managed alarms, and reviewed
            SQL investigations.
          </p>
          <p class="stage-label">AI DevCraft · Backend Agents · Mastra</p>
        </div>
      </div>
      <div class="header-actions">
        <span class="database-state">SQLite connected</span>
        <span class="mode-state" [class.mode-state-live]="mode() === 'snapshot'">
          <span aria-hidden="true"></span>
          @switch (mode()) {
            @case ('snapshot') {
              Snapshot live
            }
            @case ('reading-log') {
              Reading log
            }
            @case ('historian-result') {
              Historian result
            }
          }
        </span>
        <span class="alarm-summary" [class.has-alarms]="activeAlarmCount() > 0">
          {{ activeAlarmCount() }} active {{ activeAlarmCount() === 1 ? 'alarm' : 'alarms' }}
        </span>
        <button class="secondary-button" type="button" (click)="refresh.emit()">Refresh</button>
      </div>
    </header>
  `,
  styles: `
    @use './surface';
    :host {
      display: block;
      min-width: 0;
    }

    .page-header {
      align-items: flex-start;
      margin-bottom: 36px;
    }

    .brand-lockup {
      min-width: 0;
    }

    .brand-copy {
      min-width: 0;
    }

    .corporate-logo-link {
      display: inline-block;
      border-radius: 6px;
    }

    .corporate-logo-link:focus-visible {
      outline: 3px solid #315fa8;
      outline-offset: 4px;
    }

    .corporate-logo {
      display: block;
      width: 200px;
      max-width: 55vw;
      height: auto;
      margin-bottom: 16px;
    }

    .product-title {
      margin: 3px 0 8px;
      color: #211c18;
      font-size: clamp(2.2rem, 5vw, 3.6rem);
      font-weight: 800;
      letter-spacing: -0.045em;
    }

    .stage-label {
      margin: 10px 0 0;
      color: #76573f;
      font-size: 0.72rem;
      font-weight: 750;
      letter-spacing: 0.04em;
    }

    .header-actions {
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    .database-state {
      background: #dcebdc;
      color: #26532d;
    }

    .alarm-summary,
    .room-heading > span {
      background: #ece3d8;
      color: #5c4535;
    }

    .alarm-summary.has-alarms {
      background: #f7d7d1;
      color: #71291f;
    }

    .mode-state {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 11px;
      border-radius: 999px;
      background: #ece3d8;
      color: #655d56;
      font-size: 0.76rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .mode-state > span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #8d8176;
    }

    .mode-state-live {
      background: #dcebdc;
      color: #26532d;
    }

    .mode-state-live > span {
      background: #3f7550;
      box-shadow: 0 0 0 4px #3f755020;
    }

    @media (max-width: 780px) {
      .page-header,
      .section-heading,
      .room-heading,
      .history-heading {
        align-items: flex-start;
        flex-direction: column;
      }
      .header-actions {
        justify-content: flex-start;
      }
      .corporate-logo {
        width: 175px;
      }
    }
  `,
})
export class FacilityHeader {
  readonly mode = input.required<DisplayMode>();
  readonly activeAlarmCount = input.required<number>();
  readonly refresh = output<void>();
}
