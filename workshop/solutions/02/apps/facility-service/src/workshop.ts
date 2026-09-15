import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";
import { createChatService } from "./chat.js";

export function createWorkshopConnections(
  options: WorkshopOptions,
): WorkshopConnections {
  return {
    chat: createChatService(options),
    copilotRuntime: undefined,
  };
}

export { HistorianQueryService } from "./historian-query-legacy.js";
