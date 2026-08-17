import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  assessmentRequestSchema,
  operatorDecisionResultSchema,
  workflowResultSchema,
  type AssessmentRequest,
  type OperatorDecision,
  type OperatorDecisionResult,
  type WorkflowResult,
} from "@packt-workshop/contracts";

export type WorkshopEndpoints = {
  coordinatorBaseUrl: string;
  complianceBaseUrl: string;
  mcpUrl: string;
};

export const DEFAULT_ENDPOINTS: WorkshopEndpoints = {
  coordinatorBaseUrl: "http://localhost:4000",
  complianceBaseUrl: "http://localhost:4100",
  mcpUrl: "http://localhost:4100/mcp",
};

export async function requestComplianceAssessment(
  requestValue: AssessmentRequest,
  endpoints = DEFAULT_ENDPOINTS,
): Promise<WorkflowResult> {
  const request = assessmentRequestSchema.parse(requestValue);
  const response = await fetch(
    `${endpoints.coordinatorBaseUrl}/api/workflow/assess`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": request.correlationId,
      },
      body: JSON.stringify(request),
    },
  );
  if (!response.ok) {
    const problem = (await response.json().catch(() => undefined)) as
      { error?: string } | undefined;
    throw new Error(
      problem?.error ?? `Coordinator failed with ${response.status}.`,
    );
  }
  return workflowResultSchema.parse(await response.json());
}

export async function submitOperatorDecision(
  decision: OperatorDecision,
  endpoints = DEFAULT_ENDPOINTS,
): Promise<OperatorDecisionResult> {
  const response = await fetch(
    `${endpoints.coordinatorBaseUrl}/api/workflow/decision`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": decision.correlationId,
      },
      body: JSON.stringify(decision),
    },
  );
  if (!response.ok) {
    const problem = (await response.json().catch(() => undefined)) as
      { error?: string } | undefined;
    throw new Error(
      problem?.error ?? `Decision failed with ${response.status}.`,
    );
  }
  return operatorDecisionResultSchema.parse(await response.json());
}

export type MountedMcpApp = {
  destroy(): Promise<void>;
};

export async function mountComplianceMcpApp(
  container: HTMLElement,
  caseId: string,
  correlationId?: string,
  endpoints = DEFAULT_ENDPOINTS,
): Promise<MountedMcpApp> {
  container.replaceChildren();
  const status = document.createElement("p");
  status.textContent = `Loading specialist guidance for ${caseId}…`;
  container.append(status);

  if (correlationId) {
    const auditResponse = await fetch(
      `${endpoints.coordinatorBaseUrl}/api/workflow/specialist-guidance-opened`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-correlation-id": correlationId,
        },
        body: JSON.stringify({ correlationId, caseId }),
      },
    );
    if (!auditResponse.ok) {
      throw new Error(
        "The specialist-guidance audit event could not be recorded.",
      );
    }
  }

  const [appBridgeModule, clientModule, transportModule, typesModule] =
    await Promise.all([
      import("@modelcontextprotocol/ext-apps/app-bridge"),
      import("@modelcontextprotocol/sdk/client/index.js"),
      import("@modelcontextprotocol/sdk/client/streamableHttp.js"),
      import("@modelcontextprotocol/sdk/types.js"),
    ]);
  const { AppBridge, PostMessageTransport } = appBridgeModule;
  const { Client } = clientModule;
  const { StreamableHTTPClientTransport } = transportModule;
  const { CallToolResultSchema } = typesModule;

  const client = new Client({ name: "packt-workshop-host", version: "0.1.0" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(endpoints.mcpUrl)),
  );

  const tools = await client.listTools();
  const tool = tools.tools.find(
    (candidate) => candidate.name === "get_case_analysis",
  );
  const resourceUri = tool?._meta?.["ui/resourceUri"];
  if (typeof resourceUri !== "string") {
    await client.close();
    throw new Error(
      "The compliance tool does not advertise an MCP App resource.",
    );
  }

  const resource = await client.readResource({ uri: resourceUri });
  const html = resource.contents.find(
    (content): content is typeof content & { text: string } =>
      "text" in content,
  )?.text;
  if (!html) {
    await client.close();
    throw new Error("The MCP App resource did not contain HTML.");
  }

  const iframe = document.createElement("iframe");
  iframe.title = `Specialist guidance for ${caseId}`;
  iframe.sandbox.add("allow-scripts");
  iframe.style.width = "100%";
  iframe.style.minHeight = "420px";
  iframe.style.border = "0";
  container.replaceChildren(iframe);

  if (!iframe.contentWindow) {
    await client.close();
    throw new Error("The MCP App iframe is unavailable.");
  }

  const bridge = new AppBridge(
    client,
    { name: "packt-workshop-host", version: "0.1.0" },
    { serverTools: {}, logging: {} },
    { hostContext: { theme: "light", displayMode: "inline" } },
  );
  bridge.onsizechange = ({ height }) => {
    if (height) {
      iframe.style.height = `${height}px`;
    }
  };
  bridge.oninitialized = async () => {
    await bridge.sendToolInput({ arguments: { caseId } });
    const result = await client.callTool(
      {
        name: "get_case_analysis",
        arguments: { caseId },
      },
      CallToolResultSchema,
    );
    if (!("content" in result)) {
      throw new Error("The MCP tool returned an unsupported task result.");
    }
    await bridge.sendToolResult(result as CallToolResult);
  };

  await bridge.connect(
    new PostMessageTransport(iframe.contentWindow, iframe.contentWindow),
  );
  iframe.srcdoc = html;

  return {
    async destroy() {
      try {
        await bridge.teardownResource({});
      } finally {
        await bridge.close();
        await client.close();
        iframe.remove();
      }
    },
  };
}
