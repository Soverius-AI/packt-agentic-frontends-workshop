import { historianValidationResultSchema } from "@packt-workshop/contracts";

export function createSqlCheckFunction(facilityBaseUrl: string) {
  const request = globalThis.fetch;
  return async (sql: string, abortSignal?: AbortSignal) => {
    const response = await request(
      `${facilityBaseUrl}/api/historian/validate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sql }),
        ...(abortSignal ? { signal: abortSignal } : {}),
      },
    );
    if (!response.ok)
      throw new Error(
        `Historian SQL check failed with HTTP ${response.status}.`,
      );
    return historianValidationResultSchema.parse(await response.json());
  };
}
