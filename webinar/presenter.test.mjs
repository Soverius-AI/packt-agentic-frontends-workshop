import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readFile,
  writeFile,
  mkdir,
  cp,
  mkdtemp,
  rm,
  readdir,
  unlink,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { readOptional, readCheckpoint } from "./checkpoint-files.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(
  await readFile(new URL("./manifest.json", import.meta.url), "utf8"),
);
const chapterTwoFiles = [
  "apps/angular-host/src/app/app.html",
  "apps/facility-service/src/chat.ts",
  "apps/facility-service/src/main.ts",
];

test("checkpoint recovery handles additions, deletions and backups without changing support files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "webinar-selector-"));
  try {
    await mkdir(join(dir, "webinar"));
    for (const name of [
      "manifest.json",
      "select.mjs",
      "checkpoint-files.mjs",
      "solutions",
    ]) {
      await cp(join(root, "webinar", name), join(dir, "webinar", name), {
        recursive: true,
      });
    }
    const select = (phase) =>
      spawnSync(process.execPath, [join(dir, "webinar/select.mjs"), phase], {
        encoding: "utf8",
      });
    const matches = async (phase) => {
      assert.match(select("status").stdout, new RegExp(`^${phase}:`));
      for (const path of manifest.files)
        assert.equal(
          await readOptional(join(dir, path)),
          await readCheckpoint(dir, manifest, phase, path),
          path,
        );
    };
    const sentinel = join(dir, "apps/angular-host/src/app/app.scss");
    await mkdir(join(sentinel, ".."), { recursive: true });
    await writeFile(sentinel, "Prepared chat-container styles");
    for (const phase of [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "05",
      "06",
      "04",
      "03",
      "02",
      "01",
      "05",
      "03",
    ]) {
      assert.equal(select(phase).status, 0);
      await matches(phase);
    }
    assert.equal(
      await readFile(sentinel, "utf8"),
      "Prepared chat-container styles",
    );
    const oldBackups = new Set(await readdir(join(dir, ".webinar-backups")));
    assert.equal(select("02").status, 0);
    const backupName = (await readdir(join(dir, ".webinar-backups"))).find(
      (n) => !oldBackups.has(n),
    );
    const backup = join(dir, ".webinar-backups", backupName);
    assert.deepEqual(
      JSON.parse(await readFile(join(backup, "absent.json"), "utf8")),
      manifest.absent["03"],
    );
    for (const path of manifest.files.filter(
      (p) => !manifest.absent["03"].includes(p),
    )) {
      assert.equal(
        await readFile(join(backup, path), "utf8"),
        await readCheckpoint(dir, manifest, "03", path),
      );
    }
    const html = join(dir, chapterTwoFiles[0]);
    await writeFile(html, "Presenter live edit");
    assert.match(select("status").stdout, /Custom presenter edits/);
    assert.equal(select("07").status, 1);
    assert.equal(await readFile(html, "utf8"), "Presenter live edit");
    const missing = "apps/facility-service/src/create-copilot-runtime.ts";
    await unlink(join(dir, "webinar/solutions/03", missing));
    assert.notEqual(select("03").status, 0);
    assert.equal(await readFile(html, "utf8"), "Presenter live edit");
    // Validation must fail before deleting the chapter-2 file.
    assert.notEqual(
      await readOptional(join(dir, "apps/facility-service/src/chat.ts")),
      null,
    );
    assert.equal(select("01").status, 0);
    await matches("01");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("presenter shows chapters 03 through 06 with exact code and required demonstrations", async () => {
  const context = { window: {} };
  vm.runInNewContext(
    await readFile(new URL("./presenter-data.js", import.meta.url), "utf8"),
    context,
  );
  const data = JSON.parse(JSON.stringify(context.window.workshopPresenter));
  assert.deepEqual(
    data.milestones.map((m) => m.id),
    ["01", "02", "03", "04", "05", "06"],
  );
  assert.equal(data.milestones[0].files.length, 0);
  assert.deepEqual(
    data.milestones[1].files.map((f) => f.path),
    chapterTwoFiles,
  );
  assert.deepEqual(
    data.milestones[2].files.map((f) => f.path),
    manifest.files.slice(0, 9),
  );
  for (const milestone of data.milestones.slice(1)) {
    for (const file of milestone.files) {
      const expected = await readCheckpoint(
        root,
        manifest,
        milestone.id,
        file.path,
      );
      assert.equal(file.after, expected ?? "");
      assert.equal(file.deleted, expected === null);
      assert.match(file.diff, /@@/);
    }
    assert.equal(
      milestone.prompts.length,
      milestone.id === "05" ? 5 : milestone.id === "06" ? 3 : 2,
    );
  }
  assert.deepEqual(
    data.milestones[2].files.filter((f) => f.deleted).map((f) => f.path),
    manifest.absent["03"].filter(
      (path) => !path.endsWith("prompts/webinar-06.ts"),
    ),
  );
  assert.deepEqual(
    data.milestones[3].files.map((f) => f.path),
    [
      "apps/facility-service/src/create-copilot-runtime.ts",
      "apps/facility-service/src/main.ts",
      "apps/agent-service/src/mastra/agents/main/agent.ts",
      "apps/agent-service/src/mastra/index.ts",
    ],
  );
  assert.match(
    JSON.stringify(data.milestones[2].actions),
    /Show the AG-UI Chrome extension again/,
  );
  assert.match(
    JSON.stringify(data.milestones[3].actions),
    /Show Mastra Studio now/,
  );
  assert.match(
    JSON.stringify(data.milestones[3].actions),
    /trace for that Angular request/,
  );
  assert.deepEqual(
    data.milestones[4].files.map((f) => f.path),
    [
      "apps/angular-host/src/app/app.html",
      "apps/angular-host/src/app/app.ts",
      "apps/agent-service/src/mastra/agents/main/agent.ts",
    ],
  );
  const chapterFiveActions = JSON.stringify(data.milestones[4].actions);
  for (const name of [
    "list_rooms",
    "list_shift_managers",
    "set_view",
    "set_filter_values",
  ])
    assert.ok(chapterFiveActions.includes(name));
  assert.match(chapterFiveActions, /Show the AG-UI Chrome extension again/);
  assert.match(chapterFiveActions, /Show Mastra Studio/);
  assert.match(chapterFiveActions, /does not receive.*reactive context/s);
  const chapterSix = data.milestones[5];
  assert.deepEqual(
    chapterSix.files.map((file) => file.path),
    [
      "apps/angular-host/src/app/app.ts",
      "apps/agent-service/src/mastra/agents/main/agent.ts",
      "apps/agent-service/src/mastra/prompts/webinar-06.ts",
    ],
  );
  assert.deepEqual(chapterSix.flow, [
    "Alarm proposal",
    "Operator decision",
    "Facility transaction",
    "Alarm + audit",
  ]);
  const chapterSixActions = JSON.stringify(chapterSix.actions);
  for (const term of [
    "list_metrics",
    "raise_alarm",
    "registerHumanInTheLoop",
    "Reject",
    "Approve and raise alarm",
    "Show the AG-UI Chrome extension again",
    "Show Mastra Studio",
    "webinar-06",
    "webinar 07",
  ])
    assert.ok(chapterSixActions.includes(term), term);
  assert.match(chapterSix.prompts[1].expected, /rejected and not-executed/);
  assert.match(chapterSix.prompts[2].expected, /approved, executed/);
  const html = await readFile(
    new URL("./presenter.html", import.meta.url),
    "utf8",
  );
  assert.deepEqual(manifest.branches, {
    "01": "webinar-01",
    "02": "webinar-02",
    "03": "webinar-03",
    "04": "webinar-04",
    "05": "webinar-05",
    "06": "webinar-06",
  });
  for (const branch of Object.values(manifest.branches))
    assert.ok(html.includes(branch));
  assert.match(html, /pnpm webinar:select/);
  for (const match of html.matchAll(
    /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g,
  ))
    new vm.Script(match[1]);
});
