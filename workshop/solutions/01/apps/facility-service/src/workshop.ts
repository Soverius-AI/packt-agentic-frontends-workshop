import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";

export function createWorkshopConnections(
  _options: WorkshopOptions,
): WorkshopConnections {
  return {
    chat: undefined,
    copilotRuntime: undefined,
  };
}

export { HistorianQueryService } from "./historian-query-legacy.js";
