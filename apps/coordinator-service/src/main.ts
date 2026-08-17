const port = Number(process.env["PORT"] ?? 4000);
process.env["COPILOTKIT_TELEMETRY_DISABLED"] ??= "true";
const { createApp } = await import("./app.js");
const { app } = createApp();
const server = app.listen(port, (error?: Error) => {
  if (error) {
    console.error(`Unable to start coordinator service: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Coordinator service listening on http://localhost:${port}`);
});
server.ref();
process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
