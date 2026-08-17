import type { LegalSource } from "@packt-workshop/contracts";

export const LEGAL_SOURCES: readonly LegalSource[] = [
  {
    sourceId: "FAC-RUNBOOK-3",
    title: "Northstar Climate Anomaly Runbook",
    jurisdiction: "Workshop Jurisdiction",
    section: "Step 3 — Room temperature matches outside temperature",
    effectiveFrom: "2026-06-01",
    excerpt:
      "First check whether the room door is open. If it is open, close it and observe the temperature. If it is closed, contact the maintenance electrician.",
    uri: "runbook://northstar-facilities/climate-anomaly/step-3",
  },
  {
    sourceId: "FAC-ALARM-2",
    title: "Northstar Facilities Alarm Policy",
    jurisdiction: "Workshop Jurisdiction",
    section: "Policy 2 — Human escalation decision",
    effectiveFrom: "2026-06-01",
    excerpt:
      "A persistent climate anomaly may be escalated as a facilities alarm after the door check. The person on duty records the decision; immediate safety risks follow the emergency procedure.",
    uri: "policy://northstar-facilities/alarm-policy/2026/policy-2",
  },
  {
    sourceId: "WJ-SAFETY-12",
    title: "Workshop Industrial Safety Code",
    jurisdiction: "Workshop Jurisdiction",
    section: "Section 12 — Critical equipment anomalies",
    effectiveFrom: "2026-01-01",
    excerpt:
      "A critical equipment anomaly requires immediate isolation, a documented risk assessment, and review by the responsible operator.",
    uri: "law://workshop-jurisdiction/safety-code/2026/section-12",
  },
  {
    sourceId: "WJ-NOTIFY-7",
    title: "Workshop Emergency Notification Regulation",
    jurisdiction: "Workshop Jurisdiction",
    section: "Section 7 — Escalation threshold",
    effectiveFrom: "2026-03-01",
    excerpt:
      "Where abnormal heat and vibration indicate a credible risk to personnel, the shift manager and on-site safety lead must be notified.",
    uri: "law://workshop-jurisdiction/emergency-notification/2026/section-7",
  },
  {
    sourceId: "PLANT-POLICY-4",
    title: "Northstar Plant Incident Policy",
    jurisdiction: "Workshop Jurisdiction",
    section: "Policy 4 — Alarm activation",
    effectiveFrom: "2026-06-01",
    excerpt:
      "Alarm activation is a consequential action and requires explicit confirmation by an authenticated plant operator.",
    uri: "policy://northstar-plant/incident-policy/2026/policy-4",
  },
];

export const FACILITIES_SOURCES = LEGAL_SOURCES.filter((source) =>
  source.sourceId.startsWith("FAC-"),
);

export const INDUSTRIAL_SOURCES = LEGAL_SOURCES.filter(
  (source) => !source.sourceId.startsWith("FAC-"),
);

export function findLegalSource(sourceId: string): LegalSource | undefined {
  return LEGAL_SOURCES.find((source) => source.sourceId === sourceId);
}

export function searchLegalSources(query: string): LegalSource[] {
  const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    return [...LEGAL_SOURCES];
  }

  return LEGAL_SOURCES.filter((source) => {
    const haystack =
      `${source.title} ${source.section} ${source.excerpt}`.toLocaleLowerCase();
    return terms.some((term) => haystack.includes(term));
  });
}
