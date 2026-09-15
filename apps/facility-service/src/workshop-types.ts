import type { NodeCopilotListener } from "@copilotkit/runtime/v2/node";
import type { ChatService } from "./create-copilot-runtime.js";
export type WorkshopOptions = {
  apiKey: string;
  model: string;
  mastraBaseUrl: string;
};
export type WorkshopConnections = {
  chat: ChatService | undefined;
  copilotRuntime: NodeCopilotListener | undefined;
};
