import { randomUUID } from "node:crypto";
import { Role, type Task } from "@a2a-js/sdk";
import { ClientFactory } from "@a2a-js/sdk/client";
import {
  complianceAssessmentSchema,
  type AssessmentRequest,
  type ComplianceAssessment,
} from "@packt-workshop/contracts";

export interface ComplianceProvider {
  assess(request: AssessmentRequest): Promise<ComplianceAssessment>;
}

export class A2AComplianceProvider implements ComplianceProvider {
  constructor(
    private readonly baseUrl = "http://localhost:4100",
    private readonly timeoutMs = 4_000,
  ) {}

  async assess(request: AssessmentRequest): Promise<ComplianceAssessment> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        return await this.#send(request);
      } catch (error) {
        lastError = error;
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 75));
        }
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("The compliance agent is unavailable.");
  }

  async #send(request: AssessmentRequest): Promise<ComplianceAssessment> {
    const client = await new ClientFactory().createFromUrl(this.baseUrl);
    const result = await client.sendMessage(
      {
        tenant: "",
        message: {
          messageId: randomUUID(),
          contextId: "",
          taskId: "",
          role: Role.ROLE_USER,
          parts: [
            {
              content: { $case: "data", value: request },
              metadata: undefined,
              filename: "assessment-request.json",
              mediaType: "application/json",
            },
          ],
          metadata: { correlationId: request.correlationId },
          extensions: [],
          referenceTaskIds: [],
        },
        configuration: undefined,
        metadata: undefined,
      },
      { signal: AbortSignal.timeout(this.timeoutMs) },
    );
    if (!("artifacts" in result)) {
      throw new Error("The compliance agent returned no task artifact.");
    }
    return assessmentFromTask(result);
  }
}

function assessmentFromTask(task: Task): ComplianceAssessment {
  for (const artifact of task.artifacts) {
    for (const part of artifact.parts) {
      if (part.content?.$case === "data") {
        const parsed = complianceAssessmentSchema.safeParse(part.content.value);
        if (parsed.success) return parsed.data;
      }
    }
  }
  throw new Error("The compliance task did not contain a valid assessment.");
}
