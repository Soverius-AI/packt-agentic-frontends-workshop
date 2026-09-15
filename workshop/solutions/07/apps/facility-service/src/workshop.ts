import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";
import { createWorkshopCopilotRuntime } from "./copilot-runtime.js";

export function createWorkshopConnections(
  options: WorkshopOptions,
): WorkshopConnections {
  return {
    chat: undefined,
    copilotRuntime: createWorkshopCopilotRuntime(options),
  };
}

export { HistorianQueryService } from "./historian-query-legacy.js";
