import { useEffect, useRef, useState } from "react";
import type {
  ComplianceAssessment,
  MachineIncident,
} from "@packt-workshop/contracts";
import {
  mountComplianceMcpApp,
  requestComplianceAssessment,
  submitOperatorDecision,
  type MountedMcpApp,
} from "@packt-workshop/workshop-client";
import "./App.css";

const INCIDENT: MachineIncident = {
  incidentId: "INC-HVAC-03",
  machineId: "ROOM-3-HVAC",
  occurredAt: "2026-08-17T08:00:00.000Z",
  severity: "medium",
  summary:
    "The room temperature has risen continuously for 30 minutes and now matches the outside temperature.",
  telemetry: {
    temperatureCelsius: 29,
    outsideTemperatureCelsius: 29,
    trendDurationMinutes: 30,
    doorState: "unknown",
    vibrationMillimetersPerSecond: 0,
    pressureBar: 0,
  },
};

export default function App() {
  const [assessment, setAssessment] = useState<ComplianceAssessment>();
  const [status, setStatus] = useState(
    "Ready to assess the simulated incident.",
  );
  const [busy, setBusy] = useState(false);
  const [showResearch, setShowResearch] = useState(false);
  const [correlationId, setCorrelationId] = useState<string>();
  const [machineState, setMachineState] = useState<
    "running" | "at-risk" | "isolated"
  >("running");
  const researchContainer = useRef<HTMLDivElement>(null);
  const mountedApp = useRef<MountedMcpApp | undefined>(undefined);

  useEffect(() => {
    if (!showResearch || !assessment || !researchContainer.current) return;
    let active = true;
    mountComplianceMcpApp(
      researchContainer.current,
      assessment.caseId,
      correlationId,
    )
      .then((mounted) => {
        if (active) mountedApp.current = mounted;
        else void mounted.destroy();
      })
      .catch((error: unknown) => {
        if (active)
          setStatus(
            error instanceof Error
              ? error.message
              : "Unable to open specialist guidance.",
          );
      });
    return () => {
      active = false;
      if (mountedApp.current) void mountedApp.current.destroy();
      mountedApp.current = undefined;
    };
  }, [assessment, correlationId, showResearch]);

  async function assessIncident() {
    setBusy(true);
    setShowResearch(false);
    setStatus(
      "The primary application is delegating to the A2A facilities specialist…",
    );
    try {
      const nextCorrelationId = crypto.randomUUID();
      setCorrelationId(nextCorrelationId);
      const workflow = await requestComplianceAssessment({
        incident: INCIDENT,
        jurisdiction: "Workshop Jurisdiction",
        correlationId: nextCorrelationId,
      });
      setAssessment(workflow.assessment);
      setMachineState(workflow.machineState);
      setStatus(
        `Assessment complete. The A2A agent returned ${workflow.assessment.caseId}.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Assessment failed.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(actionId: string, decision: "approve" | "reject") {
    if (!correlationId) return;
    setBusy(true);
    setStatus(
      `${decision === "approve" ? "Approving" : "Rejecting"} ${actionId}…`,
    );
    try {
      const result = await submitOperatorDecision({
        correlationId,
        actionId,
        decision,
        operatorId: "workshop-operator",
      });
      setMachineState(result.machineState);
      setStatus(
        `Human decision recorded: ${result.decision}. Asset is ${result.machineState}.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Decision failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="eyebrow">React host · same protocol contracts</p>
          <h1>Northstar facility operations</h1>
          <p className="subtitle">
            A portable agentic frontend workshop reference system.
          </p>
        </div>
        <span className={`live state-${machineState}`}>
          Asset: {machineState}
        </span>
      </header>

      <section className="incident" aria-labelledby="incident-title">
        <div>
          <p className="eyebrow">Facilities anomaly</p>
          <h2 id="incident-title">{INCIDENT.machineId}</h2>
          <p>{INCIDENT.summary}</p>
        </div>
        <dl>
          <div>
            <dt>Room temperature</dt>
            <dd>{INCIDENT.telemetry.temperatureCelsius} °C</dd>
          </div>
          <div>
            <dt>Outside temperature</dt>
            <dd>{INCIDENT.telemetry.outsideTemperatureCelsius} °C</dd>
          </div>
          <div>
            <dt>Rising for</dt>
            <dd>{INCIDENT.telemetry.trendDurationMinutes} minutes</dd>
          </div>
          <div>
            <dt>Door</dt>
            <dd>{INCIDENT.telemetry.doorState}</dd>
          </div>
        </dl>
      </section>

      <div className="actions">
        <button onClick={assessIncident} disabled={busy}>
          {busy ? "Assessing…" : "Ask facilities specialist"}
        </button>
        {assessment && (
          <button className="secondary" onClick={() => setShowResearch(true)}>
            Open specialist guidance
          </button>
        )}
      </div>
      <p className="status" role="status">
        {status}
      </p>

      {assessment && (
        <section className="decision" aria-labelledby="decision-title">
          <p className="eyebrow">A2UI-style bounded decision surface</p>
          <h2 id="decision-title">{assessment.caseId}</h2>
          <p>{assessment.recommendation}</p>
          <ul>
            {assessment.requiredActions.map((action) => (
              <li key={action.actionId} className="decision-row">
                <div>
                  <strong>{action.label}</strong>
                  <span>
                    {action.consequential ? "Approval required" : "Advisory"}
                  </span>
                </div>
                {action.consequential && (
                  <div className="approval-controls">
                    <button
                      onClick={() => decide(action.actionId, "approve")}
                      disabled={busy}
                    >
                      Approve
                    </button>
                    <button
                      className="danger"
                      onClick={() => decide(action.actionId, "reject")}
                      disabled={busy}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <aside>{assessment.uncertainties.join(" ")}</aside>
        </section>
      )}

      {showResearch && (
        <section
          className="research"
          ref={researchContainer}
          aria-label="MCP specialist guidance app"
        />
      )}
    </main>
  );
}
