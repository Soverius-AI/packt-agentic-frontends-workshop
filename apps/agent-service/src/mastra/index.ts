import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { MastraStorageExporter, Observability } from "@mastra/observability";
import { createHistorianQueryWorkflow } from "./historian-workflow";
import { createWorkshopAgent } from "./workshop-agent";
import {
  createSqlReviewerAgent,
  createSqlReviewFunction,
} from "./sql-reviewer";
import {
  createSqlGenerationFunction,
  createSqlGeneratorAgent,
} from "./sql-generator";
import { createQueryHistorianTool } from "./query-historian-tool";

const packageRoot = process.cwd();
const environmentPath = resolve(packageRoot, "../../.env");
if (existsSync(environmentPath)) process.loadEnvFile(environmentPath);

const storagePath = resolve(
  process.env["MASTRA_STORAGE_PATH"] ??
    resolve(packageRoot, "data/mastra.sqlite"),
);
mkdirSync(dirname(storagePath), { recursive: true });

export const sqlGenerator = createSqlGeneratorAgent({
  apiKey: process.env["OPENROUTER_API_KEY"],
  model: process.env["OPENROUTER_MODEL"],
});
export const sqlReviewer = createSqlReviewerAgent({
  apiKey: process.env["OPENROUTER_API_KEY"],
  model: process.env["OPENROUTER_MODEL"],
});
export const historianQueryWorkflow = createHistorianQueryWorkflow({
  generateSql: createSqlGenerationFunction(sqlGenerator),
  reviewSql: createSqlReviewFunction(sqlReviewer),
  facilityBaseUrl: process.env["FACILITY_BASE_URL"],
});
export const queryHistorianTool = createQueryHistorianTool({
  workflow: historianQueryWorkflow,
});
export const workshopAgent = createWorkshopAgent({
  apiKey: process.env["OPENROUTER_API_KEY"],
  model: process.env["OPENROUTER_MODEL"],
  queryHistorianTool,
});

export const mastra = new Mastra({
  agents: { default: workshopAgent, sqlGenerator, sqlReviewer },
  workflows: { historianQueryWorkflow },
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
