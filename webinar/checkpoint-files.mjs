import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readOptional(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export function readCheckpoint(root, manifest, phase, path) {
  if (manifest.absent[phase].includes(path)) return Promise.resolve(null);
  // Missing files are errors unless explicitly absent in this checkpoint.
  return readFile(join(root, "webinar/solutions", phase, path), "utf8");
}
