import { useState } from "react";
import { ROOM_HVAC_INCIDENT, type AlarmState } from "@packt-workshop/contracts";
import "./App.css";

export default function App() {
  const [alarmState, setAlarmState] = useState<AlarmState>("not-raised");
  const [status, setStatus] = useState(
    "The anomaly is visible. A person on duty must decide what to do.",
  );

  function raiseAlarm(): void {
    setAlarmState("raised");
    setStatus(
      "The facilities alarm was raised manually by the person on duty.",
    );
  }

  const incident = ROOM_HVAC_INCIDENT;

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="eyebrow">Stage 1 · React host</p>
          <h1>Northstar facility operations</h1>
          <p className="subtitle">
            A conventional, deterministic application. No AI is involved.
          </p>
        </div>
        <span className={`live alarm-${alarmState}`}>
          Alarm: {alarmState === "raised" ? "raised" : "not raised"}
        </span>
      </header>

      <section className="incident" aria-labelledby="incident-title">
        <div>
          <p className="eyebrow">Facilities anomaly</p>
          <h2 id="incident-title">{incident.assetId}</h2>
          <p>{incident.summary}</p>
        </div>
        <dl>
          <div>
            <dt>Room temperature</dt>
            <dd>{incident.telemetry.roomTemperatureCelsius} °C</dd>
          </div>
          <div>
            <dt>Outside temperature</dt>
            <dd>{incident.telemetry.outsideTemperatureCelsius} °C</dd>
          </div>
          <div>
            <dt>Rising for</dt>
            <dd>{incident.telemetry.trendDurationMinutes} minutes</dd>
          </div>
          <div>
            <dt>Door</dt>
            <dd>{incident.telemetry.doorState}</dd>
          </div>
        </dl>
      </section>

      <div className="actions">
        <button
          type="button"
          onClick={raiseAlarm}
          disabled={alarmState === "raised"}
        >
          {alarmState === "raised"
            ? "Facilities alarm raised"
            : "Raise facilities alarm"}
        </button>
      </div>
      <p className="status" role="status">
        {status}
      </p>

      <aside className="limitation" aria-labelledby="limitation-title">
        <h2 id="limitation-title">What is missing?</h2>
        <p>
          This screen can display a known anomaly and expose a predefined
          action. It cannot tell the person on duty whether checking the door
          should come before raising the alarm.
        </p>
      </aside>
    </main>
  );
}
