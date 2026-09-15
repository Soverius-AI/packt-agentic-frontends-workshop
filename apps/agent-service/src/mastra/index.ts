import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { MastraStorageExporter, Observability } from "@mastra/observability";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  createMainAgent,
  historianEnabled,
  createHistorianQueryWorkflow,
} from "./agents/main/agent";

const packageRoot = process.cwd();
const environmentPath = resolve(packageRoot, "../../.env");
if (existsSync(environmentPath)) process.loadEnvFile(environmentPath);

const storagePath = resolve(
  process.env["MASTRA_STORAGE_PATH"] ??
    resolve(packageRoot, "data/mastra.sqlite"),
);
mkdirSync(dirname(storagePath), { recursive: true });

const apiKey = process.env["OPENROUTER_API_KEY"];
if (!apiKey) throw new Error("OPENROUTER_API_KEY is required.");

const model = process.env["OPENROUTER_MODEL"] || "google/gemma-4-31b-it";
const facilityBaseUrl =
  process.env["FACILITY_BASE_URL"] || "http://127.0.0.1:3101";

export const historianQueryWorkflow = createHistorianQueryWorkflow(
  apiKey,
  model,
  facilityBaseUrl,
);

export const mainAgent = createMainAgent(apiKey, model, historianQueryWorkflow);

export const mastra = new Mastra({
  server: {
    port: 4211,
    cors: {
      origin: "http://localhost:4212",
      credentials: true,
    },
  },
  agents: { default: mainAgent },
  workflows: historianEnabled ? { historianQueryWorkflow } : {},
  storage: new LibSQLStore({
    id: "packt-workshop-storage",
    url: `file:${storagePath}`,
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "packt-workshop-agent",
        exporters: [new MastraStorageExporter()],
      },
    },
  }),
});
