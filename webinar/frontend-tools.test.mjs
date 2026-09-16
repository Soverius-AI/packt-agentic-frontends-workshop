import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const angularRequire = createRequire(
  new URL("../apps/angular-host/package.json", import.meta.url),
);
const { z } = angularRequire("zod");
const source = readFileSync(
  new URL("./solutions/05/apps/angular-host/src/app/app.ts", import.meta.url),
  "utf8",
);
const parsed = ts.createSourceFile(
  "app.ts",
  source,
  ts.ScriptTarget.Latest,
  true,
);
const app = parsed.statements.find(
  (node) => ts.isClassDeclaration(node) && node.name?.text === "App",
);
const setup = app.members.find(
  (node) =>
    ts.isMethodDeclaration(node) && node.name.getText(parsed) === "setupTools",
);
assert.ok(setup?.body, "App must expose its actual tool-registration method");
const schemas = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    readFileSync(
      new URL(
        "../apps/angular-host/src/app/frontend-tool-schemas.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
  { exports: schemas.exports, require: angularRequire },
);

// Execute the actual registration body with an injected registration boundary.
// This checks what CopilotKit receives without a browser or an external model call.
function registeredTools(host) {
  const tools = new Map();
  const context = vm.createContext({
    z,
    ...schemas.exports,
    registerFrontendTool: (tool) => tools.set(tool.name, tool),
  });
  const compiled = ts.transpileModule(
    `(function () ${setup.body.getText(parsed)})`,
    {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    },
  ).outputText;
  vm.runInContext(compiled, context).call(host);
  return tools;
}

test("discovery handlers return the current Angular options", async () => {
  let managers = ["Presenter test manager"];
  const tools = registeredTools({
    shiftManagerOptions: () => managers,
    rooms: () => [{ id: "test-room", name: "Test room", internal: "omit" }],
  });
  assert.deepEqual(
    [...tools.keys()],
    ["list_shift_managers", "list_rooms", "set_view", "set_filter_values"],
  );
  assert.deepEqual(
    await tools.get("list_shift_managers").handler({}),
    managers,
  );
  managers = ["Changed manager"];
  assert.deepEqual(
    await tools.get("list_shift_managers").handler({}),
    managers,
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(await tools.get("list_rooms").handler({}))),
    [{ id: "test-room", name: "Test room" }],
  );
});

test("view handler delegates to the existing UI method and returns its selection", async () => {
  let view = "snapshot";
  const tools = registeredTools({
    setDisplayMode: (value) => {
      view = value;
    },
    displayMode: () => view,
  });
  const result = await tools.get("set_view").handler({ view: "reading-log" });
  assert.equal(view, "reading-log");
  assert.equal(result.view, view);
});

test("filter handler waits for completion and forwards errors without changing patch arguments", async () => {
  let finish;
  let received;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  const tools = registeredTools({
    updateFilters: (input) => {
      received = input;
      return pending;
    },
  });
  const patch = { from: null };
  let settled = false;
  const call = tools.get("set_filter_values").handler(patch);
  Promise.resolve(call).then(() => {
    settled = true;
  });
  await Promise.resolve();
  assert.equal(settled, false, "must not finish before updateFilters resolves");
  assert.equal(received, patch);
  const validationFailure = { ok: false, error: "Unknown room ID" };
  finish(validationFailure);
  assert.equal(
    await call,
    validationFailure,
    "the model must receive validation failures",
  );
  const success = {
    ok: true,
    state: { view: "reading-log", filters: { from: null } },
  };
  const successTools = registeredTools({ updateFilters: async () => success });
  assert.equal(
    await successTools.get("set_filter_values").handler(patch),
    success,
  );
});
