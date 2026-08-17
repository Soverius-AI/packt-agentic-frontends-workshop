import { randomUUID } from "node:crypto";
import { Role, TaskState, type AgentCard, type Message } from "@a2a-js/sdk";
import {
  AgentEvent,
  DefaultRequestHandler,
  InMemoryTaskStore,
  type AgentExecutor,
  type ExecutionEventBus,
  type RequestContext,
} from "@a2a-js/sdk/server";
import {
  UserBuilder,
  agentCardHandler,
  jsonRpcHandler,
} from "@a2a-js/sdk/server/express";
import { assessmentRequestSchema } from "@packt-workshop/contracts";
import { AssessmentStore } from "./assessment-store.js";
import { assessIncident } from "./compliance-domain.js";

export const COMPLIANCE_AGENT_CARD: AgentCard = {
  name: "Workshop Facilities and Compliance Agent",
  description:
    "Assesses fictional plant and building incidents against traceable runbooks, policies, and legal sources.",
  supportedInterfaces: [
    {
      url: "http://localhost:4100/a2a",
      protocolBinding: "JSONRPC",
      protocolVersion: "1.0",
      tenant: "",
    },
  ],
  provider: {
    organization: "Packt workshop reference system",
    url: "http://localhost:4100",
  },
  version: "0.1.0",
  capabilities: {
    streaming: true,
    pushNotifications: false,
    extensions: [],
    extendedAgentCard: false,
  },
  securitySchemes: {},
  securityRequirements: [],
  defaultInputModes: ["application/json"],
  defaultOutputModes: ["application/json"],
  skills: [
    {
      id: "assess-plant-incident",
      name: "Assess facilities or plant incident",
      description:
        "Returns a sourced operational recommendation, escalation decision point, and stable case identifier.",
      tags: ["facilities", "compliance", "safety", "runbook"],
      examples: [
        "Assess this critical machine incident for Workshop Jurisdiction.",
        "A room temperature has risen for 30 minutes and now matches the outside temperature. Should the receptionist raise an alarm?",
      ],
      inputModes: ["application/json"],
      outputModes: ["application/json"],
      securityRequirements: [],
    },
  ],
  signatures: [],
};

const message = (
  context: RequestContext,
  text: string,
  metadata?: Record<string, unknown>,
): Message => ({
  messageId: randomUUID(),
  contextId: context.contextId,
  taskId: context.taskId,
  role: Role.ROLE_AGENT,
  parts: [
    {
      content: { $case: "text", value: text },
      metadata: undefined,
      filename: "",
      mediaType: "text/plain",
    },
  ],
  metadata,
  extensions: [],
  referenceTaskIds: [],
});

class ComplianceAgentExecutor implements AgentExecutor {
  readonly #active = new Map<
    string,
    { contextId: string; eventBus: ExecutionEventBus; canceled: boolean }
  >();

  constructor(private readonly store: AssessmentStore) {}

  async execute(
    context: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const active = { contextId: context.contextId, eventBus, canceled: false };
    this.#active.set(context.taskId, active);

    eventBus.publish(
      AgentEvent.task({
        id: context.taskId,
        contextId: context.contextId,
        status: {
          state: TaskState.TASK_STATE_SUBMITTED,
          message: message(context, "Compliance assessment accepted."),
          timestamp: new Date().toISOString(),
        },
        artifacts: [],
        history: [context.userMessage],
        metadata: undefined,
      }),
    );

    try {
      eventBus.publish(
        AgentEvent.statusUpdate({
          taskId: context.taskId,
          contextId: context.contextId,
          status: {
            state: TaskState.TASK_STATE_WORKING,
            message: message(
              context,
              "Checking the fictional runbook and policy corpus.",
            ),
            timestamp: new Date().toISOString(),
          },
          metadata: undefined,
        }),
      );

      const requestPart = context.userMessage.parts.find(
        (part) => part.content?.$case === "data",
      );
      const request = assessmentRequestSchema.parse(
        requestPart?.content?.$case === "data"
          ? requestPart.content.value
          : undefined,
      );
      const assessment = assessIncident(request);
      this.store.save(assessment);

      if (active.canceled) {
        return;
      }

      eventBus.publish(
        AgentEvent.artifactUpdate({
          taskId: context.taskId,
          contextId: context.contextId,
          artifact: {
            artifactId: `assessment-${assessment.caseId}`,
            name: "Compliance assessment",
            description:
              "Traceable compliance assessment with fictional sources.",
            parts: [
              {
                content: { $case: "data", value: assessment },
                metadata: { caseId: assessment.caseId },
                filename: "assessment.json",
                mediaType: "application/json",
              },
            ],
            metadata: { caseId: assessment.caseId },
            extensions: [],
          },
          append: false,
          lastChunk: true,
          metadata: { correlationId: request.correlationId },
        }),
      );
      eventBus.publish(
        AgentEvent.statusUpdate({
          taskId: context.taskId,
          contextId: context.contextId,
          status: {
            state: TaskState.TASK_STATE_COMPLETED,
            message: message(
              context,
              `Assessment complete. Open specialist guidance for ${assessment.caseId}.`,
              { caseId: assessment.caseId },
            ),
            timestamp: new Date().toISOString(),
          },
          metadata: {
            caseId: assessment.caseId,
            correlationId: request.correlationId,
          },
        }),
      );
    } catch (error) {
      eventBus.publish(
        AgentEvent.statusUpdate({
          taskId: context.taskId,
          contextId: context.contextId,
          status: {
            state: TaskState.TASK_STATE_FAILED,
            message: message(
              context,
              error instanceof Error
                ? error.message
                : "Compliance assessment failed.",
            ),
            timestamp: new Date().toISOString(),
          },
          metadata: undefined,
        }),
      );
    } finally {
      this.#active.delete(context.taskId);
      eventBus.finished();
    }
  }

  async cancelTask(taskId: string, eventBus: ExecutionEventBus): Promise<void> {
    const active = this.#active.get(taskId);
    if (!active) {
      eventBus.finished();
      return;
    }
    active.canceled = true;
    eventBus.publish(
      AgentEvent.statusUpdate({
        taskId,
        contextId: active.contextId,
        status: {
          state: TaskState.TASK_STATE_CANCELED,
          message: undefined,
          timestamp: new Date().toISOString(),
        },
        metadata: undefined,
      }),
    );
    eventBus.finished();
  }
}

export function createA2AHandlers(store: AssessmentStore) {
  const requestHandler = new DefaultRequestHandler(
    COMPLIANCE_AGENT_CARD,
    new InMemoryTaskStore(),
    new ComplianceAgentExecutor(store),
  );

  return {
    agentCard: agentCardHandler({ agentCardProvider: requestHandler }),
    jsonRpc: jsonRpcHandler({
      requestHandler,
      userBuilder: UserBuilder.noAuthentication,
    }),
  };
}
