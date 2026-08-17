import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNodeExpressEndpoint,
} from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import {
  assessmentRequestSchema,
  operatorDecisionSchema,
} from "@packt-workshop/contracts";
import { createAgUiHandler } from "./ag-ui.js";
import {
  A2AComplianceProvider,
  type ComplianceProvider,
} from "./compliance-client.js";
import { WorkshopCoordinator } from "./coordinator.js";
import { createWorkshopTools } from "./mastra-tools.js";

export function createApp(
  compliance: ComplianceProvider = new A2AComplianceProvider(),
) {
  const app = express();
  const coordinator = new WorkshopCoordinator(compliance);
  const tools = createWorkshopTools(coordinator);
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    const startedAt = performance.now();
    const correlationId =
      request.header("x-correlation-id") ??
      (typeof request.body?.correlationId === "string"
        ? request.body.correlationId
        : randomUUID());
    response.setHeader("x-correlation-id", correlationId);
    response.on("finish", () => {
      console.log(
        JSON.stringify({
          level: "info",
          kind: "http-request",
          correlationId,
          method: request.method,
          path: request.path,
          status: response.statusCode,
          durationMs: Math.round(performance.now() - startedAt),
        }),
      );
    });
    next();
  });

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
      protocols: ["AG-UI", "A2A", "MCP Apps"],
      frameworks: ["CopilotKit Runtime", "Mastra tools"],
    });
  });
  app.post("/api/workflow/assess", async (request, response, next) => {
    try {
      response.json(
        await coordinator.assess(assessmentRequestSchema.parse(request.body)),
      );
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/workflow/decision", (request, response, next) => {
    try {
      response.json(
        coordinator.decide(operatorDecisionSchema.parse(request.body)),
      );
    } catch (error) {
      next(error);
    }
  });
  app.post(
    "/api/workflow/specialist-guidance-opened",
    (request, response, next) => {
      try {
        const correlationId = String(request.body?.correlationId ?? "");
        const caseId = String(request.body?.caseId ?? "");
        coordinator.recordSpecialistGuidanceOpened(correlationId, caseId);
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    },
  );
  app.get("/api/audit/:correlationId", (request, response) => {
    response.json(coordinator.audit.list(request.params.correlationId));
  });
  app.get("/api/plant/:machineId", (request, response) => {
    response.json({
      machineId: request.params.machineId,
      state: coordinator.plant.get(request.params.machineId),
    });
  });
  app.post("/ag-ui", createAgUiHandler(coordinator));

  const runtime = new CopilotRuntime({
    agents: {
      default: new BuiltInAgent({
        model: "openai/gpt-4o-mini",
        prompt:
          "You are the workshop plant coordinator. Never execute a consequential action without explicit operator approval.",
      }),
    },
    actions: [
      {
        name: "inspectMachine",
        description: "Inspect the current simulated machine state.",
        parameters: [
          {
            name: "machineId",
            type: "string",
            description: "Machine identifier",
            required: true,
          },
        ],
        handler: async ({ machineId }) =>
          tools.inspectMachine.execute?.(
            { machineId: String(machineId) },
            {} as never,
          ),
      },
    ],
  });
  const copilotHandler = copilotRuntimeNodeExpressEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/copilotkit",
  });
  app.use("/copilotkit", (request, response, next) => {
    Promise.resolve(copilotHandler(request, response)).catch(next);
  });

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction,
    ) => {
      response.status(400).json({
        error: error instanceof Error ? error.message : "Request failed.",
      });
    },
  );

  return { app, coordinator, tools };
}
