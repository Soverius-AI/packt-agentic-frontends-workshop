import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createFacilityServer } from "../apps/facility-service/dist/server.js";
import { FacilityRepository } from "../apps/facility-service/dist/repository.js";
import { LiveTelemetry } from "../apps/facility-service/dist/live-telemetry.js";
import { HistorianQueryService } from "../apps/facility-service/dist/historian-query-legacy.js";
import { applyFacilityViewCommand } from "../packages/contracts/dist/index.js";

test("prepared server preserves facility data, Copilot routing and approval behavior", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "packt-presenter-test-"));
  const db = join(directory, "facility.sqlite");
  const repository = new FacilityRepository(db);
  repository.initialize();
  const telemetry = new LiveTelemetry(repository);
  const historian = new HistorianQueryService(db);
  const servers = [];
  async function start(
    copilot = async (_request, response) => {
      response.writeHead(404);
      response.end();
    },
  ) {
    const server = createFacilityServer({
      repository,
      telemetry,
      copilotRuntime: copilot,
      historian,
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    return `http://127.0.0.1:${server.address().port}`;
  }
  const post = (base, path, body) =>
    fetch(base + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  try {
    const base = await start();
    await t.test("server exposes conventional facility data", async () => {
      assert.equal((await fetch(base + "/api/health")).status, 200);
      const dashboard = await (await fetch(base + "/api/dashboard")).json();
      assert.ok(dashboard.rooms.length > 0);

      assert.equal((await fetch(base + "/api/copilotkit/info")).status, 404);
    });
    await t.test(
      "server forwards requests to the connected Copilot listener",
      async () => {
        let called = false;
        const copilot = await start(async (_request, response) => {
          called = true;
          response.writeHead(200, { "content-type": "application/json" });
          response.end('{"agents":{"default":{}}}');
        });
        assert.equal(
          (await fetch(copilot + "/api/copilotkit/info")).status,
          200,
        );
        assert.equal(called, true);
      },
    );
    await t.test(
      "05 patching a room preserves dates and unrelated filters",
      () => {
        const state = {
          view: "reading-log",
          filters: {
            from: "2026-01-01T12:00",
            to: null,
            shiftManager: "Charles Bond",
            roomId: null,
            metricId: null,
            condition: "warning",
          },
        };
        const result = applyFacilityViewCommand(state, {
          action: "update_filters",
          filters: { roomId: "cooling-room" },
        });
        assert.equal(result.filters.from, state.filters.from);
        assert.equal(result.filters.shiftManager, "Charles Bond");
        assert.equal(result.filters.condition, "warning");
        assert.equal(result.filters.roomId, "cooling-room");
        assert.equal(state.filters.roomId, null);
      },
    );
    await t.test(
      "06 accepts complete readings and rejects writes and aggregate shape",
      async () => {
        const request = {
          question: "Test query",
          explanation: "Deterministic test",
          review: { approved: true, summary: "Test review", concerns: [] },
        };
        const complete = await historian.execute({
          ...request,
          sql: "SELECT reading_id, recorded_at, room_id, room_name, metric_id, metric_name, unit, numeric_value, text_value, shift_manager_name, condition FROM historian_readings LIMIT 2",
        });
        assert.equal(complete.status, "executed", JSON.stringify(complete));
        assert.equal(complete.entries.length, 2);
        const write = await historian.execute({
          ...request,
          sql: "DELETE FROM historian_readings",
        });
        assert.equal(write.status, "rejected");
        const aggregate = await historian.execute({
          ...request,
          sql: "SELECT AVG(numeric_value) AS average FROM historian_readings",
        });
        assert.equal(aggregate.status, "rejected");
      },
    );
    await t.test(
      "07 rejection, approval and replay preserve actual alarm/audit outcomes",
      async () => {
        const metric = repository
          .getDashboard()
          .rooms.flatMap((room) => room.metrics)
          .find((metric) => !metric.activeAlarm);
        assert.ok(metric);
        const initial = repository.getDashboard().activeAlarmCount;
        const request = {
          correlationId: randomUUID(),
          proposal: {
            metricId: metric.id,
            metricName: metric.name,
            reason: "Presenter regression",
          },
          decision: "rejected",
          operatorId: "night-reception",
        };
        const rejected = await (
          await post(base, "/api/alarm-approvals", request)
        ).json();
        assert.equal(rejected.outcome, "not-executed");
        assert.equal(repository.getDashboard().activeAlarmCount, initial);
        const approvedRequest = {
          ...request,
          correlationId: randomUUID(),
          decision: "approved",
        };
        const approved = await (
          await post(base, "/api/alarm-approvals", approvedRequest)
        ).json();
        assert.equal(approved.outcome, "executed");
        assert.equal(repository.getDashboard().activeAlarmCount, initial + 1);
        const replay = await (
          await post(base, "/api/alarm-approvals", approvedRequest)
        ).json();
        assert.deepEqual(replay, approved);
        assert.equal(repository.getDashboard().activeAlarmCount, initial + 1);
        const audit = await (await fetch(base + "/api/alarm-approvals")).json();
        assert.equal(audit.entries.length, 2);
      },
    );
  } finally {
    for (const server of servers) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    telemetry.stop();
    repository.close();
    await rm(directory, { recursive: true, force: true });
  }
});
