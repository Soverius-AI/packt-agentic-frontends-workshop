import { test } from "node:test";
import assert from "node:assert/strict";
import { EventType } from "@ag-ui/core";
import {
  workflowActivity,
  withWorkflowActivities,
} from "../dist/investigation-progress.js";
import { FacilityRepository } from "../dist/repository.js";

const progress = (id, message, status = "running") => ({
  type: "data-historian-progress",
  data: {
    id,
    content: { status, message, progress: status === "completed" ? 100 : 50 },
  },
});

test("workflow activities preserve their messages and replace the same card", () => {
  const generating = workflowActivity(progress("run-1", "Generating SQL…"));
  const reviewing = workflowActivity(
    progress("run-1", "Reviewing SQL with Jev…"),
  );
  const rejected = workflowActivity(
    progress("run-1", "Query rejected by Jev", "rejected"),
  );
  assert.equal(generating.type, EventType.ACTIVITY_SNAPSHOT);
  assert.equal(generating.messageId, reviewing.messageId);
  assert.equal(reviewing.content.message, "Reviewing SQL with Jev…");
  assert.equal(rejected.content.status, "rejected");
  assert.equal(rejected.content.progress, 50);
  assert.equal(generating.replace, true);
  assert.equal(
    workflowActivity({ type: "tool-output", payload: {} }),
    undefined,
  );
  assert.equal(
    workflowActivity({
      type: "data-historian-progress",
      data: { sql: "private" },
    }),
    undefined,
  );
});

test("remote stream forwards workflow activities and retains normal chunks without crossing runs", async () => {
  const remote = {
    async stream(id) {
      return {
        async processDataStream({ onChunk }) {
          await onChunk({ type: "text-delta", payload: { text: "hello" } });
          await onChunk(progress(id, "Checking SQL deterministically…"));
          await onChunk(progress(id, "Complete", "completed"));
        },
      };
    },
  };
  const first = [],
    second = [],
    received = [];
  const consume = async (id, activities) => {
    const response = await withWorkflowActivities(remote, (event) =>
      activities.push(event),
    ).stream(id);
    await response.processDataStream({
      onChunk: async (chunk) => received.push(chunk),
    });
  };
  await Promise.all([consume("one", first), consume("two", second)]);
  assert.equal(first.length, 2);
  assert.equal(second.length, 2);
  assert.equal(first[0].messageId, "historian-one");
  assert.equal(second[0].messageId, "historian-two");
  assert.equal(received.length, 6);
  assert.equal(received.filter((c) => c.type === "text-delta").length, 2);
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
