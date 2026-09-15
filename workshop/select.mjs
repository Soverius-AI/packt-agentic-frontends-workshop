import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(join(root, "workshop/manifest.json"), "utf8"),
);
const argument = process.argv[2] ?? "status";
const current = await Promise.all(
  manifest.files.map(async (path) => [
    path,
    await readFile(join(root, path), "utf8"),
  ]),
);
if (argument === "status") {
  for (const [phase, name] of Object.entries(manifest.milestones)) {
    const matches = await Promise.all(
      current.map(
        async ([path, text]) =>
          text ===
          (await readFile(
            join(root, "workshop/solutions", phase, path),
            "utf8",
          )),
      ),
    );
    if (matches.every(Boolean)) {
      console.log(`${phase}: ${name}`);
      process.exit(0);
    }
  }
  console.log(
    "Custom presenter edits. Compare with workshop/solutions; nothing was overwritten.",
  );
  process.exit(0);
}
const phase = argument.padStart(2, "0");
if (!Object.hasOwn(manifest.milestones, phase)) {
  console.error("Usage: pnpm workshop:select <01–08> | pnpm workshop:status");
  process.exit(1);
}
// Read and validate every solution before touching the active files.
const selected = await Promise.all(
  manifest.files.map(async (path) => [
    path,
    await readFile(join(root, "workshop/solutions", phase, path), "utf8"),
  ]),
);
const backup = join(root, ".workshop-backups", `${Date.now()}-${process.pid}`);
for (const [path, text] of current) {
  const target = join(backup, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, text);
}
for (const [path, text] of selected) await writeFile(join(root, path), text);
console.log(`${phase}: ${manifest.milestones[phase]}`);
console.log(`Previous presenter files saved to ${backup}`);
console.log(
  "After backend edits, restart its launcher (pnpm dev:backend, pnpm dev or pnpm dev:all). For 04–08 run pnpm dev:mastra and pnpm dev:studio, or use pnpm dev:all. Mastra reloads source edits automatically; wait until ready, then refresh Studio and reload the app for a fresh conversation.",
);
