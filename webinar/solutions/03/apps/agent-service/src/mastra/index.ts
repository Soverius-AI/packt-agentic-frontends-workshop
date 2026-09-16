import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { MastraStorageExporter, Observability } from "@mastra/observability";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const packageRoot = process.cwd();
const environmentPath = resolve(packageRoot, "../../.env");
if (existsSync(environmentPath)) process.loadEnvFile(environmentPath);

const storagePath = resolve(
  process.env["MASTRA_STORAGE_PATH"] ??
    resolve(packageRoot, "data/mastra.sqlite"),
);
mkdirSync(dirname(storagePath), { recursive: true });

export const mastra = new Mastra({
  server: {
    port: 4211,
    cors: {
      origin: "http://localhost:4212",
      credentials: true,
    },
  },
  agents: {},
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
