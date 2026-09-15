import { readFile, writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Exercise the actual completed presenter factory, independent of the current
// selection. A temporary sibling preserves its normal dependency resolution.
export async function loadSolutionAgent(milestone) {
  if (!["07", "08"].includes(milestone))
    throw new Error("Unsupported test selection");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const path = "apps/agent-service/src/mastra/agents/main";
  const source = await readFile(
    resolve(root, "workshop/solutions", milestone, path, "agent.ts"),
    "utf8",
  );
  const temporary = resolve(
    root,
    path,
    `.workshop-test-agent-${randomUUID()}.ts`,
  );
  await writeFile(temporary, source, { flag: "wx" });
  try {
    return await import(pathToFileURL(temporary).href);
  } finally {
    await unlink(temporary);
  }
}
