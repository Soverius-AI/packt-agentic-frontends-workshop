import type { ExecutedData, UiResult, ErrorResult } from "../schemas";
import {
  composeResult,
  type createResultComposerAgent,
} from "../agents/result-composer-agent";

export function createA2uiGenerationFunction(
  composer: ReturnType<typeof createResultComposerAgent>,
) {
  return async (input: ExecutedData): Promise<UiResult | ErrorResult> => {
    const { data, ...result } = input;
    try {
      return {
        ...result,
        kind: "ui",
        a2ui_operations: await composeResult(composer, data),
      };
    } catch (error) {
      return {
        ...result,
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not generate the A2UI result.",
      };
    }
  };
}
