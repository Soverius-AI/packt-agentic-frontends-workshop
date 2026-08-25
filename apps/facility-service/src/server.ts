import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import {
  alarmActionRequestSchema,
  metricConditionSchema,
  raiseAlarmRequestSchema,
} from "@packt-workshop/contracts";
import type { LiveTelemetry } from "./live-telemetry.js";
import {
  FacilityRepository,
  FacilityRepositoryError,
  type ReadingEntryFilters,
} from "./repository.js";

const sendJson = (
  response: ServerResponse,
  statusCode: number,
  value: unknown,
): void => {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(value));
};

const readBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > 64 * 1024) {
      throw new FacilityRepositoryError("Request body is too large.", 413);
    }
    chunks.push(buffer);
  }
  if (chunks.length === 0) {
    return {};
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new FacilityRepositoryError("Request body must be valid JSON.", 400);
  }
};

export const createFacilityServer = (
  repository: FacilityRepository,
  telemetry: LiveTelemetry,
) =>
  createServer(async (request, response) => {
    try {
      const method = request.method ?? "GET";
      const url = new URL(request.url ?? "/", "http://localhost");

      if (method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, { status: "ok", database: "sqlite" });
        return;
      }

      if (method === "GET" && url.pathname === "/api/dashboard") {
        sendJson(response, 200, repository.getDashboard());
        return;
      }

      if (method === "GET" && url.pathname === "/api/readings") {
        const condition = url.searchParams.get("condition") || undefined;
        const filters: ReadingEntryFilters = {
          limit: Number(url.searchParams.get("limit") ?? "200"),
          offset: Number(url.searchParams.get("offset") ?? "0"),
        };
        const addFilter = <Key extends keyof ReadingEntryFilters>(
          key: Key,
          value: ReadingEntryFilters[Key] | undefined,
        ): void => {
          if (value !== undefined) filters[key] = value;
        };
        addFilter("from", url.searchParams.get("from") || undefined);
        addFilter("to", url.searchParams.get("to") || undefined);
        addFilter(
          "shiftManager",
          url.searchParams.get("shiftManager") || undefined,
        );
        addFilter("roomId", url.searchParams.get("roomId") || undefined);
        addFilter("metricId", url.searchParams.get("metricId") || undefined);
        addFilter(
          "condition",
          condition ? metricConditionSchema.parse(condition) : undefined,
        );
        sendJson(response, 200, repository.getReadingEntries(filters));
        return;
      }

      if (method === "GET" && url.pathname === "/api/metric-updates") {
        response.writeHead(200, {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive",
          "x-accel-buffering": "no",
        });
        response.write(": connected\n\n");
        const unsubscribe = telemetry.subscribe((event) => {
          if (!response.destroyed) {
            response.write(`data: ${JSON.stringify(event)}\n\n`);
          }
        });
        request.once("close", unsubscribe);
        return;
      }

      const historyMatch = url.pathname.match(
        /^\/api\/metrics\/([^/]+)\/history$/,
      );
      if (method === "GET" && historyMatch?.[1]) {
        const hours = Number(url.searchParams.get("hours") ?? "168");
        sendJson(
          response,
          200,
          repository.getHistory(decodeURIComponent(historyMatch[1]), hours),
        );
        return;
      }

      const raiseMatch = url.pathname.match(
        /^\/api\/metrics\/([^/]+)\/alarms$/,
      );
      if (method === "POST" && raiseMatch?.[1]) {
        const body = raiseAlarmRequestSchema.parse(await readBody(request));
        sendJson(
          response,
          201,
          repository.raiseAlarm(
            decodeURIComponent(raiseMatch[1]),
            body.operatorId,
          ),
        );
        return;
      }

      const alarmMatch = url.pathname.match(/^\/api\/alarms\/([^/]+)$/);
      if (method === "PATCH" && alarmMatch?.[1]) {
        const body = alarmActionRequestSchema.parse(await readBody(request));
        sendJson(
          response,
          200,
          repository.transitionAlarm(
            decodeURIComponent(alarmMatch[1]),
            body.state,
            body.operatorId,
          ),
        );
        return;
      }

      sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      if (error instanceof FacilityRepositoryError) {
        sendJson(response, error.statusCode, { error: error.message });
        return;
      }
      if (error instanceof Error && error.name === "ZodError") {
        sendJson(response, 400, {
          error: "The request does not match the API contract.",
        });
        return;
      }
      console.error(error);
      sendJson(response, 500, { error: "Internal facility service error" });
    }
  });
