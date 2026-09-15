import { writeFile, mkdir, rm, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { readOptional, readCheckpoint } from "./checkpoint-files.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(join(root, "webinar/manifest.json"), "utf8"),
);
const argument = process.argv[2] ?? "status";
const current = await Promise.all(
  manifest.files.map(async (path) => [
    path,
    await readOptional(join(root, path)),
  ]),
);
if (argument === "status") {
  for (const [phase, name] of Object.entries(manifest.milestones)) {
    const matches = await Promise.all(
      current.map(
        async ([path, text]) =>
          text === (await readCheckpoint(root, manifest, phase, path)),
      ),
    );
    if (matches.every(Boolean)) {
      console.log(`${phase}: ${name}`);
      process.exit(0);
    }
  }
  console.log(
    "Custom presenter edits. Compare with webinar/solutions; nothing was overwritten.",
  );
  process.exit(0);
}
const phase = argument.padStart(2, "0");
if (!Object.hasOwn(manifest.milestones, phase)) {
  console.error("Usage: pnpm webinar:select <01|02|03> | pnpm webinar:status");
  process.exit(1);
}
// Validate the entire checkpoint before changing any active files.
const selected = await Promise.all(
  manifest.files.map(async (path) => [
    path,
    await readCheckpoint(root, manifest, phase, path),
  ]),
);
const backup = join(root, ".webinar-backups", `${Date.now()}-${process.pid}`);
await mkdir(backup, { recursive: true });
await writeFile(
  join(backup, "absent.json"),
  JSON.stringify(
    current.filter(([, text]) => text === null).map(([path]) => path),
    null,
    2,
  ),
);
for (const [path, text] of current) {
  if (text === null) continue;
  const target = join(backup, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, text);
}
for (const [path, text] of selected) {
  const target = join(root, path);
  if (text === null) await rm(target, { force: true });
  else {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, text);
  }
}
console.log(`${phase}: ${manifest.milestones[phase]}`);
console.log(
  `Previous presenter files and their absence list saved to ${backup}`,
);
console.log(
  "Restart your backend launcher and reload the app. Only the nine checkpoint files were restored or removed; Git branches and the database were not changed.",
);
