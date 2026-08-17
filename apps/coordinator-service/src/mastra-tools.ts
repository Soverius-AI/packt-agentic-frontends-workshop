import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { WorkshopCoordinator } from "./coordinator.js";

export function createWorkshopTools(coordinator: WorkshopCoordinator) {
  const inspectMachine = createTool({
    id: "inspect-machine",
    description: "Read the current state of a simulated plant machine.",
    inputSchema: z.object({ machineId: z.string().min(1) }),
    outputSchema: z.object({
      state: z.enum(["running", "at-risk", "isolated"]),
    }),
    execute: async ({ machineId }) => ({
      state: coordinator.plant.get(machineId),
    }),
  });

  const isolateMachine = createTool({
    id: "isolate-machine",
    description:
      "Isolate a simulated machine. This consequential tool always requires human approval.",
    inputSchema: z.object({
      correlationId: z.string().min(1),
      operatorId: z.string().min(1),
    }),
    outputSchema: z.object({
      decision: z.enum(["approved", "rejected", "already-decided"]),
      state: z.enum(["running", "at-risk", "isolated"]),
    }),
    requireApproval: true,
    execute: async ({ correlationId, operatorId }) => {
      const result = coordinator.decide({
        correlationId,
        actionId: "isolate-machine",
        decision: "approve",
        operatorId,
      });
      return { decision: result.decision, state: result.machineState };
    },
  });

  return { inspectMachine, isolateMachine };
}
