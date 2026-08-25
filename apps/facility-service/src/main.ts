import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { LiveTelemetry } from "./live-telemetry.js";
import { createFacilityServer } from "./server.js";
import { FacilityRepository } from "./repository.js";

const port = Number(process.env["FACILITY_PORT"] ?? "3001");
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = resolve(
  process.env["FACILITY_DB_PATH"] ??
    resolve(packageRoot, "data/facility.sqlite"),
);
const repository = new FacilityRepository(databasePath);
repository.initialize();
const telemetry = new LiveTelemetry(repository);
const server = createFacilityServer(repository, telemetry);

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
