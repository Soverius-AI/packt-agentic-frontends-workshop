import { createOpenAI } from "@ai-sdk/openai";
import { BuiltInAgent, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

export const DEFAULT_OPENROUTER_MODEL = "google/gemma-4-31b-it";

import { CHAT_SYSTEM_PROMPT } from "./prompts/basic-chat.js";

export type CopilotRuntimeOptions = {
  apiKey?: string | undefined;
  model?: string | undefined;
};

export const createEmbeddedCopilotRuntime = (
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
