import { createApp } from "./app.js";

const port = Number(process.env["PORT"] ?? 4100);

const server = createApp().listen(port, (error?: Error) => {
  if (error) {
    console.error(`Unable to start compliance service: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Compliance A2A and MCP service listening on http://localhost:${port}`,
  );
});
server.ref();

process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
