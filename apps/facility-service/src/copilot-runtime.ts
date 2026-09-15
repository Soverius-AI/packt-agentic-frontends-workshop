import type { AbstractAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { MastraClient } from "@mastra/client-js";
import { createRequire } from "node:module";

// The bridge's ESM bundle imports named exports from a CommonJS dependency.
// Loading its supported CommonJS export avoids that Node-only interop failure.
const nodeRequire = createRequire(import.meta.url);
const { MastraAgent } = nodeRequire(
  "@ag-ui/mastra",
) as typeof import("@ag-ui/mastra");

export type CopilotRuntimeOptions = {
  mastraBaseUrl?: string | undefined;
};

export const createWorkshopCopilotRuntime = (
  options: CopilotRuntimeOptions = {},
) => {
  const mastraClient = new MastraClient({
    baseUrl: options.mastraBaseUrl ?? "http://127.0.0.1:4211",
  });
  const remoteAgent = mastraClient.getAgent("default");
  const runtime = new CopilotRuntime({
    agents: {
      // The bridge and runtime share AG-UI 0.0.57 at runtime, but pnpm's
      // peer-isolated declarations give AbstractAgent's private fields
      // separate TypeScript identities.
      default: new MastraAgent({
        agent: remoteAgent,
        resourceId: "workshop-chat",
      }) as unknown as AbstractAgent,
    },
  });

  return createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: false,
  });
};
