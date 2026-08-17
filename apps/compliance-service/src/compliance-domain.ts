import {
  complianceAssessmentSchema,
  type AssessmentRequest,
  type ComplianceAssessment,
  WORKSHOP_EVIDENCE_DISCLAIMER,
  WORKSHOP_LEGAL_DISCLAIMER,
} from "@packt-workshop/contracts";
import { FACILITIES_SOURCES, INDUSTRIAL_SOURCES } from "./legal-corpus.js";

export function assessIncident(
  request: AssessmentRequest,
): ComplianceAssessment {
  const generatedAt = new Date(
    new Date(request.incident.occurredAt).getTime() + 10_000,
  ).toISOString();
  const suffix = request.incident.incidentId.replace(/[^A-Za-z0-9-]/g, "-");

  if (
    request.incident.telemetry.outsideTemperatureCelsius !== undefined &&
    request.incident.telemetry.trendDurationMinutes !== undefined
  ) {
    return complianceAssessmentSchema.parse({
      assessmentId: `ASSESS-${suffix}`,
      caseId: `CASE-${suffix}`,
      incidentId: request.incident.incidentId,
      jurisdiction: request.jurisdiction,
      recommendation:
        "Do not raise the facilities alarm yet. First check whether the room door is open. If it is open, close it and observe the temperature. If it is already closed, call the maintenance electrician and let the person on duty decide whether to raise the facilities alarm.",
      requiredActions: [
        {
          actionId: "check-room-door",
          label: "Check whether the room door is open",
          rationale:
            "An open door is the simplest plausible explanation for the room temperature converging with the outside temperature.",
          consequential: false,
          sourceIds: ["FAC-RUNBOOK-3"],
        },
        {
          actionId: "close-room-door",
          label: "If open, close the door and observe the temperature",
          rationale:
            "This is a safe first-line action that a receptionist or other person on night duty can perform without specialist training.",
          consequential: false,
          sourceIds: ["FAC-RUNBOOK-3"],
        },
        {
          actionId: "call-maintenance-electrician",
          label: "If closed, call the maintenance electrician",
          rationale:
            "A closed door makes a technical air-conditioning fault more likely and requires a qualified specialist.",
          consequential: false,
          sourceIds: ["FAC-RUNBOOK-3"],
        },
        {
          actionId: "review-alarm",
          label: "Decide whether to raise the facilities alarm",
          rationale:
            "Alarm escalation remains an explicit human decision after the door check; an immediate safety risk follows the emergency procedure instead.",
          consequential: true,
          sourceIds: ["FAC-ALARM-2"],
        },
      ],
      sources: FACILITIES_SOURCES,
      uncertainties: [
        "The external specialist has not observed the door, so it returns a conditional runbook rather than claiming to know whether the door is open.",
      ],
      status: "needs-human-review",
      generatedAt,
      disclaimer: WORKSHOP_EVIDENCE_DISCLAIMER,
    });
  }

  return complianceAssessmentSchema.parse({
    assessmentId: `ASSESS-${suffix}`,
    caseId: `CASE-${suffix}`,
    incidentId: request.incident.incidentId,
    jurisdiction: request.jurisdiction,
    recommendation:
      "Isolate the machine, notify the shift manager and safety lead, and require an authenticated operator to decide whether to activate the alarm workflow.",
    requiredActions: [
      {
        actionId: "isolate-machine",
        label: `Isolate ${request.incident.machineId}`,
        rationale:
          "The combined heat and vibration anomaly meets the critical-isolation threshold.",
        consequential: true,
        sourceIds: ["WJ-SAFETY-12"],
      },
      {
        actionId: "notify-safety-lead",
        label: "Notify the shift manager and safety lead",
        rationale: "The incident presents a credible risk to personnel.",
        consequential: false,
        sourceIds: ["WJ-NOTIFY-7"],
      },
      {
        actionId: "review-alarm",
        label: "Review alarm activation",
        rationale:
          "Plant policy reserves the final decision for an authenticated operator.",
        consequential: true,
        sourceIds: ["PLANT-POLICY-4"],
      },
    ],
    sources: INDUSTRIAL_SOURCES,
    uncertainties: [
      "The fictional corpus does not determine whether personnel are currently inside the affected safety zone.",
    ],
    status: "needs-human-review",
    generatedAt,
    disclaimer: WORKSHOP_LEGAL_DISCLAIMER,
  });
}
