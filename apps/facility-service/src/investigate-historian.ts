import { MastraClient } from "@mastra/client-js";
import {
  historianToolResultSchema,
  type HistorianToolResult,
} from "@packt-workshop/contracts";

export type InvestigateHistorian = (
  question: string,
) => Promise<HistorianToolResult>;

export function createHistorianInvestigator(
  baseUrl: string,
): InvestigateHistorian {
  const client = new MastraClient({ baseUrl });
  return async (question) => {
    const run = await client.getWorkflow("historianQueryWorkflow").createRun();
    const result = await run.startAsync({ inputData: { question } });
    if (result.status !== "success") {
      throw new Error(`Historian workflow stopped with ${result.status}.`);
    }
    return historianToolResultSchema.parse(result.result);
  };
}
