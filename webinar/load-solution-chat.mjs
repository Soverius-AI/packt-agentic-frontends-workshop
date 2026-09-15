import { readFile, writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import ts from "typescript";

export async function loadSolutionChat() {
  const source = await readFile(
    new URL(
      "./solutions/02/apps/facility-service/src/chat.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const file = new URL(
    `../apps/facility-service/dist/.webinar-chat-${randomUUID()}.js`,
    import.meta.url,
  );
  await writeFile(file, output);
  try {
    return await import(file.href);
  } finally {
    await unlink(file);
  }
}
