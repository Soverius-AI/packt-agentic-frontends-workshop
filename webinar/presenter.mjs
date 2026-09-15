import { readFile, writeFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { format, resolveConfig } from "prettier";
import { createServer } from "node:http";

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, "..");
const manifest = JSON.parse(
  await readFile(join(directory, "manifest.json"), "utf8"),
);
const promptCatalog = JSON.parse(
  await readFile(join(directory, "demo-prompts.json"), "utf8"),
);
const noteFiles = await readdir(join(directory, "speaker-notes"));
const milestones = [];
const flows = {
  "01": ["Angular controls", "Facility API", "SQLite"],
  "02": ["Native chat", "Facility /api/chat", "Model"],
  "03": ["CopilotChat", "Copilot runtime", "BuiltInAgent", "Model"],
  "04": ["CopilotChat", "Copilot runtime", "Mastra agent", "Model"],
  "05": ["Agent tool call", "AG-UI", "Angular handler", "View state"],
  "06": [
    "Historian tool",
    "Generate → review",
    "Validate + execute",
    "Result view",
  ],
  "08": [
    "Reviewed query",
    "Format decision",
    "Table / Card / Text",
    "Generated view",
  ],
  "07": [
    "Alarm proposal",
    "Operator decision",
    "Facility transaction",
    "Alarm + audit",
  ],
};

function actionsFrom(title, body) {
  const matches = [...body.matchAll(/^(?:\d+\.|-)\s+/gm)];
  const label =
    title === "Say"
      ? "EXPLAIN"
      : title === "Transition"
        ? "TRANSITION"
        : /demonstrate/i.test(title)
          ? "DEMONSTRATE"
          : title === "Open"
            ? "OPEN"
            : "DO";
  if (!matches.length) return [{ label, title, body }];
  const actions = [];
  const prefix = body.slice(0, matches[0].index).trim();
  if (prefix) actions.push({ label, title, body: prefix });
  for (let i = 0; i < matches.length; i++) {
    actions.push({
      label,
      title: `${title} · ${i + 1}`,
      body: body
        .slice(
          matches[i].index + matches[i][0].length,
          matches[i + 1]?.index ?? body.length,
        )
        .trim(),
    });
  }
  return actions;
}

for (const [id, name] of Object.entries(manifest.milestones)) {
  const filename = noteFiles.find(
    (file) => file.startsWith(`${id}-`) && file.endsWith(".md"),
  );
  if (!filename) throw new Error(`Speaker notes missing for milestone ${id}`);
  const markdown = await readFile(
    join(directory, "speaker-notes", filename),
    "utf8",
  );
  const parts = markdown.split(/^## /m);
  const intro = parts
    .shift()
    .replace(/^# .+\n/, "")
    .trim();
  const sections = parts.map((part) => ({
    title: part.slice(0, part.indexOf("\n")).trim(),
    body: part.slice(part.indexOf("\n") + 1).trim(),
  }));
  const actions = [
    { label: "PREPARE", title: "Before you begin", body: intro },
  ];
  let recovery = "";
  for (const section of sections) {
    if (section.title === "Recovery") recovery = section.body;
    else actions.push(...actionsFrom(section.title, section.body));
  }
  const prompts = promptCatalog[id];
  if (!Array.isArray(prompts))
    throw new Error(`Demo prompts missing for milestone ${id}`);
  for (const prompt of prompts) {
    for (const field of ["title", "prompt", "before", "expected", "inspect"]) {
      if (typeof prompt[field] !== "string" || !prompt[field].trim())
        throw new Error(`Missing ${field} in milestone ${id} demo prompt`);
    }
    if (typeof prompt.optional !== "boolean")
      throw new Error(`Missing optional flag in milestone ${id} demo prompt`);
  }
  const ids = Object.keys(manifest.milestones);
  const previous = ids[ids.indexOf(id) - 1];
  const files = [];
  for (const path of manifest.files) {
    const destination = join(directory, "solutions", id, path);
    const after = await readFile(destination, "utf8");
    const before =
      previous === undefined
        ? after
        : await readFile(join(directory, "solutions", previous, path), "utf8");
    if (before === after) continue;
    const result = spawnSync(
      "git",
      [
        "diff",
        "--no-index",
        "--",
        join(directory, "solutions", previous, path),
        destination,
      ],
      { encoding: "utf8", cwd: root },
    );
    if (result.status !== 1)
      throw new Error(`Cannot compare ${path}: ${result.stderr}`);
    const diff = result.stdout.slice(result.stdout.indexOf("@@"));
    files.push({ path, after, diff });
  }
  milestones.push({
    id,
    name,
    source: `webinar/speaker-notes/${filename}`,
    intro,
    actions,
    prompts,
    recovery,
    files,
    flow: flows[id],
  });
}
const data = JSON.stringify({ milestones }, null, 2).replaceAll("<", "\\u003c");
const dataPath = join(directory, "presenter-data.js");
const source = `// Generated from speaker-notes, demo-prompts.json and solutions. Run pnpm webinar:notes to refresh.\nwindow.workshopPresenter = ${data};\n`;
await writeFile(
  dataPath,
  await format(source, {
    ...(await resolveConfig(dataPath)),
    filepath: dataPath,
  }),
);
const promptGuide =
  [
    "# Demo prompts for the presenter",
    "<!-- Generated from demo-prompts.json. Edit that file, then run pnpm webinar:notes:build. -->",
    "Type these questions into the application chat after completing the named milestone. These are demo inputs; the agent instruction prompts live in the source files listed in the presenter guide.",
    "Follow the numbered order within each milestone; optional entries can be skipped. Before changing milestones, restart affected services, reload the app and start a fresh conversation. Selecting a checkpoint changes code only, not conversations, stored readings or alarms.",
    "Rehearse against your configured model before the workshop. The expected results below are acceptance criteria checked against the code, not a record of successful live model runs. If a request fails, inspect the tool call or trace rather than treating a confident chat reply as evidence.",
    ...milestones.flatMap((milestone) => [
      `## ${milestone.id} — ${milestone.name}`,
      `[Speaker notes](speaker-notes/${milestone.source.split("/").at(-1)})`,
      ...(milestone.prompts.length
        ? milestone.prompts.flatMap((prompt, index) => [
            `### ${index + 1}. ${prompt.title}${prompt.optional ? " (optional)" : ""}`,
            `**Before:** ${prompt.before}`,
            `> ${prompt.prompt}`,
            `**Expected:** ${prompt.expected}`,
            `**Show and explain:** ${prompt.inspect}`,
          ])
        : [
            "There is no chat in this milestone. Tour the snapshot, reading log, filters and conventional alarm controls. Establish which state the application already owns before connecting an assistant.",
          ]),
    ]),
    "## Later milestones",
    "A2UI is included in milestone 08. A2A and MCP demos will be added when their implementations are ready.",
  ].join("\n\n") + "\n";
const promptGuidePath = join(directory, "demo-prompts.md");
await writeFile(
  promptGuidePath,
  await format(promptGuide, {
    ...(await resolveConfig(promptGuidePath)),
    filepath: promptGuidePath,
  }),
);
console.log(
  `Presenter notes refreshed: ${milestones.length} milestones, ${milestones.reduce((sum, milestone) => sum + milestone.actions.length, 0)} action cards.`,
);

if (process.argv.includes("--build")) process.exit(0);
const port = Number(process.env["WORKSHOP_NOTES_PORT"] ?? "4400");
// Expose only the presenter artifacts, never the repository or its .env.
const routes = new Map([
  ["/", "presenter.html"],
  ["/presenter.html", "presenter.html"],
  ["/presenter-data.js", "presenter-data.js"],
  ["/favicon.png", "favicon.png"],
]);
const server = createServer(async (request, response) => {
  const path = routes.get(
    new URL(request.url ?? "/", "http://localhost").pathname,
  );
  if (!path || request.method !== "GET") {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  try {
    const contents = await readFile(join(directory, path));
    response.writeHead(200, {
      "content-type": path.endsWith(".png")
        ? "image/png"
        : path.endsWith(".js")
          ? "text/javascript; charset=utf-8"
          : "text/html; charset=utf-8",
      "cache-control": "no-store",
    });
    response.end(contents);
  } catch {
    response.writeHead(500);
    response.end("Presenter file unavailable.");
  }
});
server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `Presenter view: http://localhost:${port}\nThe app and Mastra are not needed to read these notes. Ctrl+C stops this notes server.`,
  ),
);
