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
