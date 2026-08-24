import { Component, signal } from '@angular/core';
import { ROOM_HVAC_INCIDENT, type AlarmState } from '@packt-workshop/contracts';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly incident = ROOM_HVAC_INCIDENT;
  protected readonly alarmState = signal<AlarmState>('not-raised');
  protected readonly status = signal(
    'The anomaly is visible. A person on duty must decide what to do.',
  );

  protected raiseAlarm(): void {
    this.alarmState.set('raised');
    this.status.set('The facilities alarm was raised manually by the person on duty.');
  }
}
