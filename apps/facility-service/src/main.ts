import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { LiveTelemetry } from "./live-telemetry.js";
import { createFacilityServer } from "./server.js";
import { FacilityRepository } from "./repository.js";
import { createWorkshopConnections } from "./workshop.js";
import { HistorianQueryService } from "./historian-query.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const environmentPath = resolve(packageRoot, "../../.env");
if (existsSync(environmentPath)) process.loadEnvFile(environmentPath);

const port = Number(process.env["FACILITY_PORT"] ?? "3101");
const databasePath = resolve(
  process.env["FACILITY_DB_PATH"] ??
    resolve(packageRoot, "data/facility.sqlite"),
);
const repository = new FacilityRepository(databasePath);
repository.initialize();
const telemetry = new LiveTelemetry(repository);
const { chat, copilotRuntime } = createWorkshopConnections({
  apiKey: process.env["OPENROUTER_API_KEY"] ?? "",
  model: process.env["OPENROUTER_MODEL"] || "google/gemma-4-31b-it",
  mastraBaseUrl: process.env["MASTRA_BASE_URL"] || "http://127.0.0.1:4211",
});
const historian = new HistorianQueryService(databasePath);
const server = createFacilityServer(
  repository,
  telemetry,
  copilotRuntime,
  historian,
  chat,
);

server.listen(port, "127.0.0.1", () => {
  telemetry.start();
  console.log(`Facility service listening on http://127.0.0.1:${port}`);
  console.log(`SQLite database: ${databasePath}`);
});

const close = (): void => {
  telemetry.stop();
  server.close(() => {
    repository.close();
    process.exit(0);
  });
};

process.on("SIGINT", close);
process.on("SIGTERM", close);
