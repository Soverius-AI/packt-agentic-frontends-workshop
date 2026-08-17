import cors from "cors";
import express from "express";
import { createA2AHandlers } from "./a2a.js";
import { AssessmentStore } from "./assessment-store.js";
import { createMcpHandler } from "./mcp.js";

export function createApp(store = new AssessmentStore()) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  const a2a = createA2AHandlers(store);
  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });
  app.use("/.well-known/agent-card.json", a2a.agentCard);
  app.use("/a2a", a2a.jsonRpc);
  app.post("/mcp", createMcpHandler(store));
  app.get("/mcp", (_request, response) => response.status(405).end());
  app.delete("/mcp", (_request, response) => response.status(405).end());

  return app;
}
