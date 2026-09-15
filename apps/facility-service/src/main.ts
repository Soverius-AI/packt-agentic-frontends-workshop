import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createChatClient } from "./create-copilot-runtime.js";
import { LiveTelemetry } from "./live-telemetry.js";
import { FacilityRepository } from "./repository.js";
import { createFacilityServer } from "./server.js";
import { HistorianQueryService } from "./workshop.js";
import { getOrThrow } from "@packt-workshop/common/assert-defined";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: resolve(packageRoot, "../../.env") });

const port = Number(process.env["FACILITY_PORT"] ?? "3101");
const databasePath = resolve(
  process.env["FACILITY_DB_PATH"] ??
  resolve(packageRoot, "data/facility.sqlite"),
);
const repository = new FacilityRepository(databasePath);
repository.initialize();
if (process.argv.includes("--reset-demo")) {
  repository.resetDemoData();
  repository.close();
  console.log(
    "Demo readings reset to the last seven days; alarms and approval records cleared.",
  );
  process.exit(0);
}
const telemetry = new LiveTelemetry(repository);
const historian = new HistorianQueryService(databasePath);
const server = createFacilityServer({
  repository,
  telemetry,
  historian,
  copilotRuntime: createChatClient()
});

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
