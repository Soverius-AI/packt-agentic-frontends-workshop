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

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(
  await readFile(new URL("./manifest.json", import.meta.url), "utf8"),
);
const expectedFiles = [
  "apps/angular-host/src/app/app.html",
  "apps/facility-service/src/chat.ts",
  "apps/facility-service/src/main.ts",
];

test("webinar selector restores exactly the three live files and keeps backups", async () => {
  assert.deepEqual(manifest.files, expectedFiles);
  const dir = await mkdtemp(join(tmpdir(), "webinar-selector-"));
  try {
    await mkdir(join(dir, "webinar"));
    for (const name of ["manifest.json", "select.mjs", "solutions"]) {
      await cp(join(root, "webinar", name), join(dir, "webinar", name), {
        recursive: true,
      });
    }
    for (const file of expectedFiles) {
      await mkdir(join(dir, file, ".."), { recursive: true });
      await cp(join(dir, "webinar/solutions/00", file), join(dir, file));
    }
    const sentinel = join(dir, "apps/angular-host/src/app/app.ts");
    await writeFile(sentinel, "Prepared imports must stay unchanged.");
    const select = (state) =>
      spawnSync(process.execPath, [join(dir, "webinar/select.mjs"), state], {
        encoding: "utf8",
      });
    assert.match(select("status").stdout, /^00:/);
    assert.equal(select("02").status, 0);
    assert.match(select("status").stdout, /^02:/);
    for (const file of expectedFiles) {
      assert.equal(
        await readFile(join(dir, file), "utf8"),
        await readFile(join(dir, "webinar/solutions/02", file), "utf8"),
      );
    }
    assert.equal(
      await readFile(sentinel, "utf8"),
      "Prepared imports must stay unchanged.",
    );
    const [backup] = await readdir(join(dir, ".webinar-backups"));
    for (const file of expectedFiles) {
      assert.equal(
        await readFile(join(dir, ".webinar-backups", backup, file), "utf8"),
        await readFile(join(dir, "webinar/solutions/00", file), "utf8"),
      );
    }
    const html = join(dir, expectedFiles[0]);
    await writeFile(html, "Presenter live edit");
    assert.match(select("status").stdout, /Custom presenter edits/);
    assert.equal(select("03").status, 1);
    assert.equal(await readFile(html, "utf8"), "Presenter live edit");
    // A missing solution file must fail before any live file is overwritten.
    await unlink(join(dir, "webinar/solutions/02", expectedFiles[2]));
    assert.notEqual(select("02").status, 0);
    assert.equal(await readFile(html, "utf8"), "Presenter live edit");
    assert.equal(select("00").status, 0);
    assert.match(select("status").stdout, /^00:/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("presenter data shows the new branch sequence and exact completed code", async () => {
  const context = { window: {} };
  vm.runInNewContext(
    await readFile(new URL("./presenter-data.js", import.meta.url), "utf8"),
    context,
  );
  const data = JSON.parse(JSON.stringify(context.window.workshopPresenter));
  assert.deepEqual(
    data.milestones.map((m) => m.id),
    ["00", "02"],
  );
  assert.equal(data.milestones[0].files.length, 0);
  assert.deepEqual(
    data.milestones[1].files.map((f) => f.path),
    expectedFiles,
  );
  for (const file of data.milestones[1].files) {
    assert.equal(
      file.after,
      await readFile(join(root, "webinar/solutions/02", file.path), "utf8"),
    );
    assert.match(file.diff, /@@/);
  }
  assert.equal(data.milestones[1].prompts.length, 2);
  const html = await readFile(
    new URL("./presenter.html", import.meta.url),
    "utf8",
  );
  assert.deepEqual(manifest.branches, {
    "00": "webinar-00",
    "02": "webinar-02",
  });
  assert.match(html, /webinar-00 · Prepared starting state/);
  assert.match(html, /webinar-02 · End of chapter 2/);
  assert.match(html, /pnpm webinar:select/);
  for (const match of html.matchAll(
    /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g,
  )) {
    new vm.Script(match[1]);
  }
});
