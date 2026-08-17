import type { ComplianceAssessment } from "@packt-workshop/contracts";

export class AssessmentStore {
  readonly #assessments = new Map<string, ComplianceAssessment>();

  save(assessment: ComplianceAssessment): void {
    this.#assessments.set(assessment.caseId, structuredClone(assessment));
  }

  get(caseId: string): ComplianceAssessment | undefined {
    const assessment = this.#assessments.get(caseId);
    return assessment ? structuredClone(assessment) : undefined;
  }

  list(): ComplianceAssessment[] {
    return [...this.#assessments.values()].map((assessment) =>
      structuredClone(assessment),
    );
  }
}
