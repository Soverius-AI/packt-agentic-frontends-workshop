import { readFile } from "node:fs/promises";
import type { RequestHandler } from "express";
import {
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { AssessmentStore } from "./assessment-store.js";
import {
  LEGAL_SOURCES,
  findLegalSource,
  searchLegalSources,
} from "./legal-corpus.js";

export const SPECIALIST_GUIDANCE_APP_URI =
  "ui://workshop-compliance/specialist-guidance.html";

function createComplianceMcpServer(store: AssessmentStore): McpServer {
  const server = new McpServer({
    name: "workshop-compliance-mcp",
    version: "0.1.0",
  });

  registerAppTool(
    server,
    "get_case_analysis",
    {
      title: "Open specialist guidance",
      description:
        "Returns the sourced operational and compliance assessment for a stable A2A case identifier.",
      inputSchema: { caseId: z.string().min(1) },
      annotations: {
        title: "Open specialist guidance",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        ui: {
          resourceUri: SPECIALIST_GUIDANCE_APP_URI,
          visibility: ["model", "app"],
        },
      },
    },
    async ({ caseId }) => {
      const assessment = store.get(caseId);
      if (!assessment) {
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown case: ${caseId}` }],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Specialist guidance for ${assessment.caseId}. ${assessment.disclaimer}`,
          },
        ],
        structuredContent: assessment,
      };
    },
  );

  server.registerTool(
    "search_legal_sources",
    {
      title: "Search fictional legal sources",
      description: "Searches the workshop-only legal corpus by keyword.",
      inputSchema: { query: z.string() },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(searchLegalSources(query), null, 2),
        },
      ],
      structuredContent: { sources: searchLegalSources(query) },
    }),
  );

  for (const source of LEGAL_SOURCES) {
    server.registerResource(
      source.title,
      source.uri,
      {
        description: `${source.section} (fictional workshop source)`,
        mimeType: "application/json",
      },
      async () => ({
        contents: [
          {
            uri: source.uri,
            mimeType: "application/json",
            text: JSON.stringify(findLegalSource(source.sourceId), null, 2),
          },
        ],
      }),
    );
  }

  registerAppResource(
    server,
    "Workshop specialist guidance view",
    SPECIALIST_GUIDANCE_APP_URI,
    {
      description:
        "Interactive, read-only operational and compliance guidance for an A2A case.",
      _meta: {
        ui: {
          csp: { connectDomains: [], resourceDomains: [] },
          prefersBorder: true,
        },
      },
    },
    async () => {
      const html = await readFile(
        new URL("../../compliance-mcp-app/dist/index.html", import.meta.url),
        "utf8",
      );
      return {
        contents: [
          {
            uri: SPECIALIST_GUIDANCE_APP_URI,
            mimeType: "text/html;profile=mcp-app",
            text: html,
            _meta: {
              ui: {
                csp: { connectDomains: [], resourceDomains: [] },
                prefersBorder: true,
              },
            },
          },
        ],
      };
    },
  );

  return server;
}

export function createMcpHandler(store: AssessmentStore): RequestHandler {
  return async (request, response) => {
    const server = createComplianceMcpServer(store);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    response.on("close", () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } catch (error) {
      if (!response.headersSent) {
        response.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message:
              error instanceof Error ? error.message : "MCP request failed",
          },
          id: null,
        });
      }
    }
  };
}
