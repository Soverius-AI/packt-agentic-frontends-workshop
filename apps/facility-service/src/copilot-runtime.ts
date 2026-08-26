import { createOpenAI } from "@ai-sdk/openai";
import { BuiltInAgent, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

export const DEFAULT_OPENROUTER_MODEL = "google/gemma-4-31b-it";

export const CHAT_SYSTEM_PROMPT = `You are the assistant embedded in the Soverius Chocolate Factory incident-management application.

The application monitors rooms, equipment, metrics, warnings, alarms, and historical readings. Users may refer to concepts and names they see in this application.

You can use the conversation and this static description only. You cannot access the application's current state, visible UI, readings, history, database, or actions. Never invent application data. Clearly say when answering would require access you do not have.

You should be able to answer basic questions for the domain of food industry.`;

export type CopilotRuntimeOptions = {
  apiKey?: string | undefined;
  model?: string | undefined;
};

export const createWorkshopCopilotRuntime = (
  options: CopilotRuntimeOptions = {},
) => {
  const openrouter = createOpenAI({
    apiKey: options.apiKey ?? "openrouter-not-configured",
    baseURL: "https://openrouter.ai/api/v1",
  });
  const runtime = new CopilotRuntime({
    agents: {
      default: new BuiltInAgent({
        model: openrouter(options.model || DEFAULT_OPENROUTER_MODEL),
        prompt: CHAT_SYSTEM_PROMPT,
      }),
    },
  });

  return createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: false,
  });
};
