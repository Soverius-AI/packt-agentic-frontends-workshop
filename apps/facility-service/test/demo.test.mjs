import { test } from "node:test";
import assert from "node:assert/strict";
import { EventType } from "@ag-ui/core";
import { investigationProgressEvents } from "../dist/investigation-progress.js";
import { FacilityRepository } from "../dist/repository.js";

const start = (id = "q1", toolCallName = "query_historian") => ({
  type: EventType.TOOL_CALL_START,
  toolCallId: id,
  toolCallName,
});
const result = (id, content) => ({
  type: EventType.TOOL_CALL_RESULT,
  messageId: `result-${id}`,
  toolCallId: id,
  content: JSON.stringify(content),
  role: "tool",
});
const base = {
  question: "Readings",
  sql: "SELECT * FROM historian_readings",
  explanation: "Reading rows",
  review: { approved: true, concerns: [] },
  policyVersion: "test",
};

test("progress follows real SQL results and ignores unrelated tools", () => {
  const track = investigationProgressEvents();
  assert.deepEqual(track(start("catalog", "list_metrics")), []);
  const running = track(start())[0];
  assert.equal(running.content.status, "running");
  const completed = track(
    result("q1", {
      ...base,
      status: "executed",
      entries: [],
      rowCount: 0,
      truncated: false,
      durationMs: 1,
    }),
  )[0];
  assert.equal(completed.messageId, running.messageId);
  assert.equal(completed.content.status, "completed");
  assert.deepEqual(track({ type: EventType.RUN_FINISHED }), []);
});

test("rejection, malformed results and interrupted runs never show success", () => {
  const track = investigationProgressEvents();
  track(start("rejected"));
  assert.equal(
    track(
      result("rejected", {
        ...base,
        status: "rejected",
        stage: "reviewer",
        code: "UNSUPPORTED",
        message: "Unsupported shape",
      }),
    )[0].content.status,
    "rejected",
  );
  track(start("malformed"));
  assert.equal(
    track(result("malformed", { ok: true }))[0].content.status,
    "failed",
  );
  track(start("interrupted"));
  assert.equal(
    track({ type: EventType.RUN_ERROR, message: "Disconnected" })[0].content
      .status,
    "failed",
  );
  assert.deepEqual(track({ type: EventType.RUN_FINISHED }), []);
});

test("human rejection creates no alarm; approval is audited and idempotent", () => {
  const repository = new FacilityRepository(":memory:");
  repository.initialize();
  try {
    const metric = repository
      .getDashboard()
      .rooms.flatMap((room) => room.metrics)
      .find((metric) => !metric.activeAlarm);
    assert.ok(metric);
    const request = {
      correlationId: crypto.randomUUID(),
      proposal: {
        metricId: metric.id,
        metricName: metric.name,
        reason: "Demo approval test",
      },
      operatorId: "test-operator",
      decision: "rejected",
    };
    const rejected = repository.decideAlarmApproval(request);
    assert.equal(rejected.outcome, "not-executed");
    assert.equal(rejected.alarmId, null);
    const approvedRequest = {
      ...request,
      correlationId: crypto.randomUUID(),
      decision: "approved",
    };
    const approved = repository.decideAlarmApproval(approvedRequest);
    assert.equal(approved.outcome, "executed");
    assert.deepEqual(repository.decideAlarmApproval(approvedRequest), approved);
    assert.equal(repository.getAlarmApprovalAudit().entries.length, 2);
    assert.throws(
      () =>
        repository.decideAlarmApproval({
          ...approvedRequest,
          decision: "rejected",
        }),
      /different alarm decision/,
    );
  } finally {
    repository.close();
  }
});

test("HTTP approval boundary validates, audits, and recovers the same decision", async () => {
  const { createFacilityServer } = await import("../dist/server.js");
  const { LiveTelemetry } = await import("../dist/live-telemetry.js");
  const repository = new FacilityRepository(":memory:");
  repository.initialize();
  const server = createFacilityServer(
    repository,
    new LiveTelemetry(repository),
    async () => {
      throw new Error("Historian is not part of this approval test");
    },
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/alarm-approvals`;
  const post = (body) =>
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const metric = repository
    .getDashboard()
    .rooms.flatMap((room) => room.metrics)
    .find((metric) => !metric.activeAlarm);
  const request = {
    correlationId: '["thread-1","message-1","tool-call-1"]',
    proposal: {
      metricId: metric.id,
      metricName: metric.name,
      reason: "Operator requests investigation",
    },
    operatorId: "test-operator",
    decision: "rejected",
  };
  const active = () =>
    repository
      .getDashboard()
      .rooms.flatMap((room) => room.metrics)
      .find((row) => row.id === metric.id).activeAlarm;
  try {
    assert.equal(active(), null);
    assert.equal((await post({ ...request, decision: "maybe" })).status, 400);
    assert.equal(
      (
        await post({
          ...request,
          proposal: { ...request.proposal, metricName: "Invented" },
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await post({
          ...request,
          proposal: { ...request.proposal, metricId: "absent" },
        })
      ).status,
      404,
    );
    assert.equal(repository.getAlarmApprovalAudit().entries.length, 0);
    assert.equal((await (await post(request)).json()).outcome, "not-executed");
    assert.equal(active(), null);
    const approved = {
      ...request,
      correlationId: '["thread-1","message-2","tool-call-2"]',
      decision: "approved",
    };
    const first = await (await post(approved)).json();
    assert.equal(first.outcome, "executed");
    assert.equal(active().id, first.alarmId);
    assert.deepEqual(await (await post(approved)).json(), first);
    assert.equal(
      (await post({ ...approved, decision: "rejected" })).status,
      409,
    );
    const duplicate = await (
      await post({ ...approved, correlationId: "another-proposal" })
    ).json();
    assert.equal(duplicate.outcome, "failed");
    assert.equal(duplicate.alarmId, null);
    repository.transitionAlarm(first.alarmId, "acknowledged", "test-operator");
    repository.transitionAlarm(first.alarmId, "resolved", "test-operator");
    assert.equal(active(), null);
    assert.deepEqual(await (await post(approved)).json(), first);
    assert.equal(
      active(),
      null,
      "retrying a resolved decision must not create another alarm",
    );
    const audit = await (await fetch(url)).json();
    assert.equal(audit.entries.length, 3);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    repository.close();
  }
});
