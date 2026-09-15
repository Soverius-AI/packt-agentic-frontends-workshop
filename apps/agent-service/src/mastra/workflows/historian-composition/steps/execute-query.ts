import { historianExecutionResultSchema } from "@packt-workshop/contracts";
import type { ReviewedSql } from "../schemas";

export function createHistorianExecutionFunction(facilityBaseUrl: string) {
  const request = globalThis.fetch;
  return async (inputData: ReviewedSql, abortSignal?: AbortSignal) => {
    const response = await request(`${facilityBaseUrl}/api/historian/query`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(inputData),
      ...(abortSignal ? { signal: abortSignal } : {}),
    });
    if (!response.ok)
      throw new Error(
        `Historian service rejected the request with HTTP ${response.status}.`,
      );
    return historianExecutionResultSchema.parse(await response.json());
  };
}
