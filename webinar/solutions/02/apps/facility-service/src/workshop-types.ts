import type { NodeCopilotListener } from "@copilotkit/runtime/v2/node";
import type { ChatService } from "./chat.js";
export type WorkshopOptions = {
  apiKey: string;
  model: string;
  mastraBaseUrl: string;
};
export type WorkshopConnections = {
  chat: ChatService | undefined;
  copilotRuntime: NodeCopilotListener | undefined;
};
