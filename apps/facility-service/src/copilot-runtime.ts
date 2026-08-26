import type { AbstractAgent } from "@ag-ui/client";
import { createOpenAI } from "@ai-sdk/openai";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { Agent } from "@mastra/core/agent";
import { createRequire } from "node:module";

// The bridge's ESM bundle imports named exports from a CommonJS dependency.
// Loading its supported CommonJS export avoids that Node-only interop failure.
const nodeRequire = createRequire(import.meta.url);
const { MastraAgent } = nodeRequire(
  "@ag-ui/mastra",
) as typeof import("@ag-ui/mastra");

export const DEFAULT_OPENROUTER_MODEL = "google/gemma-4-31b-it";

export const CHAT_SYSTEM_PROMPT = `You are the assistant embedded in the Soverius Chocolate Factory incident-management application.

The application monitors rooms, equipment, metrics, warnings, alarms, and historical readings. Users may refer to concepts and names they see in this application.

You can use the conversation and this static description only. You cannot access the application's current state, visible UI, readings, history, database, or actions. Never invent application data. Clearly say when answering would require access you do not have.

You should be able to answer basic questions for the domain of food industry.`;

export type CopilotRuntimeOptions = {
  apiKey?: string | undefined;
  model?: string | undefined;
  agent?: Agent | undefined;
};

export const createWorkshopMastraAgent = (
  options: Omit<CopilotRuntimeOptions, "agent"> = {},
) => {
  const openrouter = createOpenAI({
    apiKey: options.apiKey ?? "openrouter-not-configured",
    baseURL: "https://openrouter.ai/api/v1",
  });

  return new Agent({
    id: "default",
    name: "Soverius Chocolate Factory Assistant",
    description: "A chat-only assistant with no access to facility data.",
    instructions: CHAT_SYSTEM_PROMPT,
    model: openrouter(options.model || DEFAULT_OPENROUTER_MODEL),
  });
};

export const createWorkshopAgUiAgent = (agent: Agent): AbstractAgent =>
  new MastraAgent({
    agent,
    resourceId: "workshop-chat",
  }) as unknown as AbstractAgent;

export const createWorkshopCopilotRuntime = (
  options: CopilotRuntimeOptions = {},
) => {
  const agent =
    options.agent ??
    createWorkshopMastraAgent({
      apiKey: options.apiKey,
      model: options.model,
    });
  const runtime = new CopilotRuntime({
    agents: {
      // The bridge and runtime share AG-UI 0.0.57 at runtime, but pnpm's
      // peer-isolated declarations give AbstractAgent's private fields
      // separate TypeScript identities.
      default: createWorkshopAgUiAgent(agent),
    },
  });

  return createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: false,
  });
};
