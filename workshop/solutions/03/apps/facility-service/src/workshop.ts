import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";
import { createEmbeddedCopilotRuntime } from "./embedded-copilot-runtime.js";

export function createWorkshopConnections(
  options: WorkshopOptions,
): WorkshopConnections {
  return {
    chat: undefined,
    copilotRuntime: createEmbeddedCopilotRuntime(options),
  };
}
