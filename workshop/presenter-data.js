// Generated from speaker-notes, demo-prompts.json and solutions. Run pnpm workshop:notes to refresh.
window.workshopPresenter = {
  milestones: [
    {
      id: "01",
      name: "Conventional application",
      source: "workshop/speaker-notes/01-conventional-app.md",
      intro:
        "**Start:** `pnpm workshop:select 01`, then `pnpm dev`. Open http://localhost:4200.\nBackend: http://localhost:3101. Mastra API: http://localhost:4211/api.\nMastra Studio: http://localhost:4212 (separate Studio process).\nStartup commands: `pnpm dev:angular`, `pnpm dev:backend`, `pnpm dev:mastra`,\n`pnpm dev:studio`; or `pnpm dev:all` for all four. Mastra needs a configured key.\nMastra starts from milestone 04; it need not be running here. No model key is required.\n\n**Demo inputs:** Follow the numbered prompts for milestone 01 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** `pnpm workshop:select 01`, then `pnpm dev`. Open http://localhost:4200.\nBackend: http://localhost:3101. Mastra API: http://localhost:4211/api.\nMastra Studio: http://localhost:4212 (separate Studio process).\nStartup commands: `pnpm dev:angular`, `pnpm dev:backend`, `pnpm dev:mastra`,\n`pnpm dev:studio`; or `pnpm dev:all` for all four. Mastra needs a configured key.\nMastra starts from milestone 04; it need not be running here. No model key is required.\n\n**Demo inputs:** Follow the numbered prompts for milestone 01 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“This application already works. It owns the readings, filters, history, and alarm\nactions. We are going to connect an assistant to selected capabilities.”\n\nExplain that Snapshot shows the latest reading per metric; Reading log filters\npersisted records. A model response and a database reading have different origins.",
        },
        {
          label: "OPEN",
          title: "Open · 1",
          body: "The application first; keep the editor closed for the initial tour.",
        },
        {
          label: "OPEN",
          title: "Open · 2",
          body: "`apps/angular-host/src/app/facility-api.ts`: point at the ordinary HTTP calls.",
        },
        {
          label: "OPEN",
          title: "Open · 3",
          body: "`packages/contracts/src/index.ts`: show a single dashboard schema and its\n  inferred TypeScript type. The same contract is used in Angular and the server.",
        },
        {
          label: "DEMONSTRATE",
          title: "Do and demonstrate · 1",
          body: "Show the latest readings and the continuous-update behavior in Snapshot.",
        },
        {
          label: "DEMONSTRATE",
          title: "Do and demonstrate · 2",
          body: "Open Reading log. Choose Cooling room and Warning; show that filters and\n   pagination already work without an assistant.",
        },
        {
          label: "DEMONSTRATE",
          title: "Do and demonstrate · 3",
          body: "Open seven-day history from a metric. Explain that readings are stored in SQLite.",
        },
        {
          label: "DEMONSTRATE",
          title: "Do and demonstrate · 4",
          body: "If demonstrating a manual alarm, raise, acknowledge, and resolve it using the\n   conventional controls. Leave the intended approval-demo metric without an active\n   alarm. The empty decision-audit panel is prepared infrastructure for milestone 07.",
        },
        {
          label: "DEMONSTRATE",
          title: "Do and demonstrate · 5",
          body: "Point to the prepared assistant area: nothing is connected yet.",
        },
        {
          label: "TRANSITION",
          title: "Transition",
          body: "“The interface can do these operations, but it cannot answer an ordinary question.\nLet's connect a conversation first.”\n\n**No live code in this milestone.** Avoid explaining telemetry generation or table\nmarkup line by line. They are the prepared application on which the talk builds.",
        },
      ],
      prompts: [],
      recovery:
        "Check the facility terminal and http://localhost:3101/api/health if readings fail.\nThis is an API/proxy issue, not an AI issue. Never reset the database to fix a chat\nproblem. Reload the browser after selecting checkpoint 01.",
      files: [],
      flow: ["Angular controls", "Facility API", "SQLite"],
    },
    {
      id: "02",
      name: "Basic chat",
      source: "workshop/speaker-notes/02-basic-chat.md",
      intro:
        "**Start:** completed 01. Configure `.env` privately before this section.\n**Completed code:** [solution 02](../solutions/02/).\n\n**Demo inputs:** Follow the numbered prompts for milestone 02 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 01. Configure `.env` privately before this section.\n**Completed code:** [solution 02](../solutions/02/).\n\n**Demo inputs:** Follow the numbered prompts for milestone 02 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“The first connection carries messages to a model. It supplies a static application\ndescription, but no live readings, current filters, database tools, or actions.”",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 1",
          body: "Open `apps/angular-host/src/app/basic-chat/basic-chat.component.ts`: this is the\n   prepared `BasicChatComponent`. Its template, styles, message list, form and\n   loading/error states are already part of Angular. Show `send()` calling\n   `ChatApi.send(messages)`; do not copy or rewrite the component.",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 2",
          body: "Activate it directly in `apps/angular-host/src/app/app.html`: replace\n   `\u003capp-chat />` with `\u003capp-basic-chat />`. In `app.ts`, replace the `ChatComponent`\n   import with `BasicChatComponent` from `./basic-chat/basic-chat.component`,\n   and replace `ChatComponent` in the component's `imports` array. The prepared\n   basic chat occupies the same app slot, with its own styles.\n   [Completed app template](../solutions/02/apps/angular-host/src/app/app.html) ·\n   [Completed app import](../solutions/02/apps/angular-host/src/app/app.ts).",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 3",
          body: "Open `apps/facility-service/src/prompts/basic-chat.ts`: read the static context\n   and the limitation on access to live data. The prompt is prepared.",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 4",
          body: "**Write the OpenAI connection live** in\n   `apps/facility-service/src/basic-chat-model.ts`. Import `OpenAI` from `openai`,\n   remove the leading underscores from the three parameters, and replace the\n   placeholder body. Create `new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' })`,\n   await `client.chat.completions.create({ model, messages: [...messages] })`,\n   and return `completion.choices[0]?.message.content?.trim() ?? ''`.\n   [Completed connection](../solutions/02/apps/facility-service/src/basic-chat-model.ts).\n   Explain that this is the OpenAI SDK using OpenRouter's compatible endpoint;\n   the configured model and key stay on the backend. Do not show the key.",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 5",
          body: "Open `apps/facility-service/src/chat.ts`: show how the prepared service prepends\n   the system prompt to the conversation, calls `completeBasicChat`, and returns\n   an assistant message. Request validation and provider-error handling are prepared.",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 6",
          body: "Enable the endpoint in `apps/facility-service/src/workshop.ts`: import\n   `createChatService` and replace `chat: undefined` with\n   `chat: createChatService(options)`. Leave the Copilot runtime disconnected.\n   [Exact file](../solutions/02/apps/facility-service/src/workshop.ts).",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 7",
          body: "Open `apps/angular-host/src/app/basic-chat/chat-api.ts`: point to `POST /api/chat`.\n   Trace the whole request: BasicChatComponent → ChatApi → backend chat service\n   → the OpenAI SDK call you just wrote → assistant response.",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 8",
          body: "Restart the backend launcher (`pnpm dev:backend`, `pnpm dev`, or `pnpm dev:all`,\n   whichever you started) to compile your edits, then reload the browser.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate",
          body: "Type: **Why does temperature control matter when making chocolate?**\n\nExpected: an ordinary general-knowledge answer. Show the `/api/chat` request in\nthe browser Network panel; this response is not streamed.\n\nThen type: **What is the current air temperature in our Cooling room?**\n\nExpected: the assistant acknowledges that it cannot inspect current facility data.\nIf it invents a value, use that as a prompt-boundary failure and compare it with\nthe actual dashboard. Never describe a correct guess as data access.",
        },
        {
          label: "TRANSITION",
          title: "Transition",
          body: "“Before connecting tools, we need a standardized way to represent an agent run.”",
        },
      ],
      prompts: [
        {
          title: "General knowledge",
          prompt: "Why does temperature control matter when making chocolate?",
          before:
            "Complete milestone 02: activate the prepared BasicChatComponent, implement basic-chat-model.ts and enable the backend chat service. Restart the backend launcher, reload the app and start a fresh conversation.",
          expected:
            "An ordinary explanation based on general knowledge, without claiming to have inspected this factory.",
          inspect:
            "Trace POST /api/chat to the OpenAI client and completion call written live in basic-chat-model.ts. Explain that conversation works before facility access exists.",
          optional: false,
        },
        {
          title: "Expose the missing data connection",
          prompt: "What is the current air temperature in our Cooling room?",
          before:
            "Keep the same conversation. Do not paste readings into the chat.",
          expected:
            "The assistant should explain that it cannot access current facility readings. Any invented temperature is a failed demonstration, not evidence of access.",
          inspect:
            "Compare with the real snapshot. The backend route supplies no facility tools or live readings.",
          optional: false,
        },
      ],
      recovery:
        "`pnpm workshop:select 02`, restart `pnpm dev` (or your `pnpm dev:backend` / `pnpm dev:all` launcher), reload the browser. On a provider\nerror, inspect the backend terminal and key configuration off screen. Successful\ndashboard loading does not prove that a model request can succeed.",
      files: [
        {
          path: "apps/facility-service/src/workshop.ts",
          after:
            'import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\nimport { createChatService } from "./chat.js";\n\nexport function createWorkshopConnections(\n  options: WorkshopOptions,\n): WorkshopConnections {\n  return {\n    chat: createChatService(options),\n    copilotRuntime: undefined,\n  };\n}\n\nexport { HistorianQueryService } from "./historian-query-legacy.js";\n',
          diff: '@@ -1,10 +1,11 @@\n import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\n+import { createChatService } from "./chat.js";\n \n export function createWorkshopConnections(\n-  _options: WorkshopOptions,\n+  options: WorkshopOptions,\n ): WorkshopConnections {\n   return {\n-    chat: undefined,\n+    chat: createChatService(options),\n     copilotRuntime: undefined,\n   };\n }\n',
        },
        {
          path: "apps/facility-service/src/basic-chat-model.ts",
          after:
            'import OpenAI from "openai";\nimport type { ChatMessage } from "@packt-workshop/contracts";\n\nexport type ModelMessage = ChatMessage | { role: "system"; content: string };\n\nexport async function completeBasicChat(\n  messages: readonly ModelMessage[],\n  model: string,\n  apiKey: string,\n): Promise\u003cstring> {\n  const client = new OpenAI({\n    apiKey,\n    baseURL: "https://openrouter.ai/api/v1",\n  });\n  const completion = await client.chat.completions.create({\n    model,\n    messages: [...messages],\n  });\n  return completion.choices[0]?.message.content?.trim() ?? "";\n}\n',
          diff: '@@ -1,12 +1,20 @@\n+import OpenAI from "openai";\n import type { ChatMessage } from "@packt-workshop/contracts";\n \n export type ModelMessage = ChatMessage | { role: "system"; content: string };\n \n export async function completeBasicChat(\n-  _messages: readonly ModelMessage[],\n-  _model: string,\n-  _apiKey: string,\n+  messages: readonly ModelMessage[],\n+  model: string,\n+  apiKey: string,\n ): Promise\u003cstring> {\n-  // Milestone 02: create the OpenAI client and request a completion here.\n-  throw new Error("The basic chat model connection is not implemented yet.");\n+  const client = new OpenAI({\n+    apiKey,\n+    baseURL: "https://openrouter.ai/api/v1",\n+  });\n+  const completion = await client.chat.completions.create({\n+    model,\n+    messages: [...messages],\n+  });\n+  return completion.choices[0]?.message.content?.trim() ?? "";\n }\n',
        },
        {
          path: "apps/angular-host/src/app/app.ts",
          after:
            "import { CopilotA2UIActivityRenderer, type injectAgentStore } from '@copilotkit/angular';\nimport { Component, computed, DestroyRef, inject, linkedSignal, signal } from '@angular/core';\nimport type {\n  AlarmApprovalAuditEntry,\n  ConfigureFacilityView,\n  FacilityDashboard,\n  FacilityReadingEntry,\n  FacilityReadingPage,\n  FacilityViewState,\n  MetricHistory,\n  MetricReading,\n  MetricSummary,\n  MetricUpdateEvent,\n} from '@packt-workshop/contracts';\nimport {\n  applyFacilityViewCommand,\n  historianToolResultSchema,\n  listMetricsToolSchema,\n  metricConditionSchema,\n  resolveFacilityViewDates,\n  resolveFacilityViewAvailableOptions,\n} from '@packt-workshop/contracts';\nimport { connectWorkshop } from './workshop/connect';\nimport { AlarmApprovalEvents } from './alarm-approval-events';\nimport { BasicChatComponent } from './basic-chat/basic-chat.component';\nimport { FacilityApi } from './facility-api';\n\ntype DisplayMode = 'snapshot' | 'reading-log' | 'historian-result' | 'a2ui-result';\nconst READING_PAGE_SIZE = 50;\n\n@Component({\n  selector: 'app-root',\n  imports: [BasicChatComponent, CopilotA2UIActivityRenderer],\n  templateUrl: './app.html',\n  styleUrl: './app.scss',\n})\nexport class App {\n  readonly #api = inject(FacilityApi);\n  readonly #approvalEvents = inject(AlarmApprovalEvents);\n  readonly #destroyRef = inject(DestroyRef);\n  #stopMetricUpdates: (() => void) | undefined;\n\n  protected readonly dashboard = signal\u003cFacilityDashboard | undefined>(undefined);\n  protected readonly loading = signal(true);\n  protected readonly error = signal\u003cstring | undefined>(undefined);\n  protected readonly busyMetricId = signal\u003cstring | undefined>(undefined);\n  protected readonly historyLoading = signal(false);\n  protected readonly selectedHistory = signal\u003cMetricHistory | undefined>(undefined);\n  protected readonly selectedMetricId = signal\u003cstring | undefined>(undefined);\n  protected readonly continuousUpdates = signal(false);\n  protected readonly resultStore = signal\u003cReturnType\u003ctypeof injectAgentStore> | undefined>(\n    undefined,\n  );\n  protected readonly resultAgent = computed(() => this.resultStore()?.().agent);\n  private readonly resultMessages = computed(() => this.resultStore()?.().messages() ?? []);\n  protected readonly a2uiActivities = computed(() => {\n    const messages = this.resultMessages();\n    const activities = messages\n      .filter((message) => message.role === 'activity')\n      .filter(\n        (message) =>\n          message.activityType === 'a2ui-surface' &&\n          Array.isArray(message.content['a2ui_operations']) &&\n          message.content['a2ui_operations'].length > 0,\n      );\n    const latest = activities.at(-1);\n    if (!latest) return [];\n    const turnStart = messages\n      .slice(0, messages.indexOf(latest))\n      .reduce((last, message, index) => (message.role === 'user' ? index : last), -1);\n    return activities.filter((activity) => messages.indexOf(activity) > turnStart);\n  });\n  protected readonly a2uiActivity = computed(() => this.a2uiActivities().at(-1));\n  private readonly a2uiActivityId = computed(() => this.a2uiActivity()?.id);\n  private readonly historianResultId = computed(() => this.historianResult()?.id);\n  protected readonly displayMode = linkedSignal\u003cDisplayMode>(() =>\n    this.a2uiActivityId()\n      ? 'a2ui-result'\n      : this.historianResultId()\n        ? 'historian-result'\n        : 'snapshot',\n  );\n  protected readonly latestUpdatedMetricId = signal\u003cstring | undefined>(undefined);\n  protected readonly status = signal('Connecting to the facility database…');\n  protected readonly readingPage = signal\u003cFacilityReadingPage | undefined>(undefined);\n  protected readonly readingsLoading = signal(false);\n  protected readonly readingPageIndex = signal(0);\n  protected readonly updatedFrom = signal('');\n  protected readonly updatedTo = signal('');\n  protected readonly shiftManagerFilter = signal('');\n  protected readonly roomFilter = signal('');\n  protected readonly metricFilter = signal('');\n  protected readonly conditionFilter = signal('');\n  protected readonly historianResult = computed(() => {\n    const messages = this.resultMessages();\n    const queryIds = new Set(\n      messages.flatMap((message) =>\n        message.role === 'assistant'\n          ? (message.toolCalls ?? [])\n              .filter((call) => call.function.name === 'query_historian')\n              .map((call) => call.id)\n          : [],\n      ),\n    );\n    for (const message of [...messages].reverse()) {\n      if (message.role !== 'tool' || !queryIds.has(message.toolCallId)) continue;\n      try {\n        const result = historianToolResultSchema.safeParse(JSON.parse(message.content));\n        if (result.success && result.data.status === 'executed')\n          return { ...result.data, id: message.id };\n      } catch {\n        /* Incomplete messages have no result to display. */\n      }\n    }\n    return undefined;\n  });\n  protected readonly alarmApprovals = signal\u003creadonly AlarmApprovalAuditEntry[]>([]);\n  protected readonly rooms = computed(() => this.dashboard()?.rooms ?? []);\n  protected readonly activeAlarmCount = computed(() => this.dashboard()?.activeAlarmCount ?? 0);\n  protected readonly shiftManagerOptions = computed(() => this.dashboard()?.shiftManagers ?? []);\n  protected readonly metricOptions = computed(() =>\n    this.rooms().flatMap((room) =>\n      room.metrics.map((metric) => ({\n        id: metric.id,\n        label: `${room.name} · ${metric.name}`,\n      })),\n    ),\n  );\n  protected readonly facilityViewState = computed\u003cFacilityViewState>(() => ({\n    view: this.displayMode() === 'snapshot' ? ('snapshot' as const) : ('reading-log' as const),\n    filters: {\n      from: this.updatedFrom() || null,\n      to: this.updatedTo() || null,\n      shiftManager: this.shiftManagerFilter() || null,\n      roomId: this.roomFilter() || null,\n      metricId: this.metricFilter() || null,\n      condition: metricConditionSchema.safeParse(this.conditionFilter()).data ?? null,\n    },\n  }));\n  protected readonly currentRows = computed(() =>\n    this.rooms().flatMap((room) => room.metrics.map((metric) => ({ room, metric }))),\n  );\n  protected readonly displayedReadingPage = computed\u003cFacilityReadingPage | undefined>(() => {\n    const result = this.historianResult();\n    if (this.displayMode() !== 'historian-result' || !result) return this.readingPage();\n    return {\n      entries: result.entries,\n      total: result.entries.length,\n      limit: Math.max(1, result.entries.length),\n      offset: 0,\n    };\n  });\n  protected readonly readingPageCount = computed(() =>\n    Math.max(1, Math.ceil((this.displayedReadingPage()?.total ?? 0) / READING_PAGE_SIZE)),\n  );\n  protected readonly readingPageStart = computed(() => {\n    const page = this.displayedReadingPage();\n    return page && page.total > 0 ? page.offset + 1 : 0;\n  });\n  protected readonly readingPageEnd = computed(() => {\n    const page = this.displayedReadingPage();\n    return page ? page.offset + page.entries.length : 0;\n  });\n\n  constructor() {\n    connectWorkshop({\n      facilityViewState: this.facilityViewState,\n      rooms: this.rooms,\n      shiftManagerOptions: this.shiftManagerOptions,\n      listMetrics: (input) => this.#listMetrics(input),\n      configureFacilityView: (command) => this.#configureFacilityView(command),\n      invalidToolPayload: (message) => this.#invalidToolPayload(message),\n      connectResultStore: (store) => this.resultStore.set(store),\n    });\n    const approvalSubscription = this.#approvalEvents.recorded$.subscribe((record) => {\n      this.alarmApprovals.update((entries) => [\n        record,\n        ...entries.filter((entry) => entry.correlationId !== record.correlationId),\n      ]);\n      this.status.set(this.#alarmApprovalStatus(record));\n      void this.loadDashboard(false);\n    });\n    this.#destroyRef.onDestroy(() => {\n      approvalSubscription.unsubscribe();\n      this.#stopMetricUpdates?.();\n    });\n    this.#startContinuousUpdates();\n    void this.loadDashboard();\n    void this.loadAlarmApprovalAudit();\n  }\n\n  async #listMetrics(input: unknown): Promise\u003cunknown> {\n    const validation = listMetricsToolSchema.safeParse(input);\n    if (!validation.success) return this.#invalidToolPayload(validation.error.issues[0]?.message);\n\n    let roomId = validation.data.roomId;\n    if (roomId) {\n      try {\n        const resolved = resolveFacilityViewAvailableOptions(\n          { action: 'update_filters', filters: { roomId } },\n          this.#availableFilterOptions(),\n        );\n        roomId =\n          resolved.action === 'update_filters' ? (resolved.filters.roomId ?? undefined) : roomId;\n      } catch (error) {\n        return {\n          ok: false,\n          error: error instanceof Error ? error.message : 'Invalid room option.',\n        };\n      }\n    }\n\n    return {\n      metrics: this.rooms()\n        .filter((room) => !roomId || room.id === roomId)\n        .flatMap((room) =>\n          room.metrics.map((metric) => ({\n            id: metric.id,\n            name: metric.name,\n            roomId: room.id,\n            roomName: room.name,\n            kind: metric.kind,\n            unit: metric.unit,\n          })),\n        ),\n    };\n  }\n\n  async #configureFacilityView(command: ConfigureFacilityView): Promise\u003cunknown> {\n    let validatedCommand = command;\n    try {\n      validatedCommand = resolveFacilityViewAvailableOptions(\n        validatedCommand,\n        this.#availableFilterOptions(),\n      );\n    } catch (error) {\n      return {\n        ok: false,\n        state: this.facilityViewState(),\n        error: error instanceof Error ? error.message : 'Invalid facility filter option.',\n      };\n    }\n    const next = resolveFacilityViewDates(\n      applyFacilityViewCommand(this.facilityViewState(), validatedCommand),\n    );\n    const nextDisplayMode: DisplayMode = next.view === 'snapshot' ? 'snapshot' : 'reading-log';\n    const viewChanged = nextDisplayMode !== this.displayMode();\n\n    this.updatedFrom.set(next.filters.from ?? '');\n    this.updatedTo.set(next.filters.to ?? '');\n    this.shiftManagerFilter.set(next.filters.shiftManager ?? '');\n    this.roomFilter.set(next.filters.roomId ?? '');\n    this.metricFilter.set(next.filters.metricId ?? '');\n    this.conditionFilter.set(next.filters.condition ?? '');\n    this.readingPageIndex.set(0);\n\n    if (viewChanged) {\n      this.displayMode.set(nextDisplayMode);\n      this.closeHistory();\n      if (nextDisplayMode === 'snapshot') this.#startContinuousUpdates();\n      else this.#stopContinuousUpdates();\n    }\n    if (nextDisplayMode === 'reading-log') await this.loadReadingEntries();\n\n    this.status.set('The assistant updated the facility view.');\n    return {\n      ok: true,\n      state: next,\n      message: 'Facility view updated. Unspecified values were preserved.',\n    };\n  }\n\n  #invalidToolPayload(message?: string): unknown {\n    return {\n      ok: false,\n      state: this.facilityViewState(),\n      error: message ?? 'Invalid frontend tool payload.',\n    };\n  }\n\n  #availableFilterOptions() {\n    return {\n      rooms: this.rooms().map((room) => ({ id: room.id, name: room.name })),\n      metrics: this.metricOptions(),\n      shiftManagers: this.shiftManagerOptions(),\n    };\n  }\n\n  protected setDisplayMode(mode: DisplayMode): void {\n    if (mode === 'historian-result' && !this.historianResult()) return;\n    if (mode === 'a2ui-result' && !this.a2uiActivity()) return;\n    if (this.displayMode() === mode) return;\n    this.displayMode.set(mode);\n    this.closeHistory();\n    if (mode === 'snapshot') {\n      this.#startContinuousUpdates();\n      return;\n    }\n    this.#stopContinuousUpdates();\n    if (mode === 'historian-result') {\n      this.status.set(\n        `Showing ${this.historianResult()?.entries.length ?? 0} readings selected by the reviewed historian query.`,\n      );\n      return;\n    }\n    void this.loadReadingEntries();\n  }\n\n  protected async loadDashboard(showLoading = true): Promise\u003cvoid> {\n    if (showLoading) {\n      this.loading.set(true);\n    }\n    this.error.set(undefined);\n    try {\n      this.dashboard.set(await this.#api.getDashboard());\n      if (this.displayMode() === 'reading-log') await this.loadReadingEntries();\n      this.status.set('Live values and alarm states loaded from the facility database.');\n    } catch (error) {\n      this.error.set(this.#errorMessage(error));\n      this.status.set('The conventional facility backend is unavailable.');\n    } finally {\n      this.loading.set(false);\n    }\n  }\n\n  protected async loadAlarmApprovalAudit(): Promise\u003cvoid> {\n    try {\n      this.alarmApprovals.set((await this.#api.getAlarmApprovalAudit()).entries);\n    } catch (error) {\n      this.status.set(this.#errorMessage(error));\n    }\n  }\n\n  protected async handleAlarm(metric: MetricSummary): Promise\u003cvoid> {\n    this.busyMetricId.set(metric.id);\n    try {\n      if (!metric.activeAlarm) {\n        await this.#api.raiseAlarm(metric.id);\n        this.status.set(`Alarm raised for ${metric.name}. It is now waiting for acknowledgement.`);\n      } else if (metric.activeAlarm.state === 'raised') {\n        await this.#api.updateAlarm(metric.activeAlarm.id, 'acknowledged');\n        this.status.set(`Alarm acknowledged for ${metric.name}.`);\n      } else {\n        await this.#api.updateAlarm(metric.activeAlarm.id, 'resolved');\n        this.status.set(`Alarm resolved for ${metric.name}. The complete record remains stored.`);\n      }\n      await this.loadDashboard(false);\n    } catch (error) {\n      this.status.set(this.#errorMessage(error));\n    } finally {\n      this.busyMetricId.set(undefined);\n    }\n  }\n\n  protected async showHistory(metric: MetricSummary): Promise\u003cvoid> {\n    this.selectedMetricId.set(metric.id);\n    this.selectedHistory.set(undefined);\n    this.historyLoading.set(true);\n    try {\n      this.selectedHistory.set(await this.#api.getHistory(metric.id));\n      this.status.set(`Showing the last seven days for ${metric.name}.`);\n    } catch (error) {\n      this.status.set(this.#errorMessage(error));\n    } finally {\n      this.historyLoading.set(false);\n    }\n  }\n\n  protected closeHistory(): void {\n    this.selectedMetricId.set(undefined);\n    this.selectedHistory.set(undefined);\n  }\n\n  protected async loadReadingEntries(showLoading = true): Promise\u003cvoid> {\n    if (showLoading) this.readingsLoading.set(true);\n    try {\n      this.readingPage.set(\n        await this.#api.getReadingEntries({\n          from: this.#isoFilterDate(this.updatedFrom()),\n          to: this.#isoFilterDate(this.updatedTo()),\n          shiftManager: this.shiftManagerFilter() || undefined,\n          roomId: this.roomFilter() || undefined,\n          metricId: this.metricFilter() || undefined,\n          condition: this.conditionFilter() || undefined,\n          limit: READING_PAGE_SIZE,\n          offset: this.readingPageIndex() * READING_PAGE_SIZE,\n        }),\n      );\n    } catch (error) {\n      this.status.set(this.#errorMessage(error));\n    } finally {\n      this.readingsLoading.set(false);\n    }\n  }\n\n  protected setFilter(\n    filter: 'from' | 'to' | 'shiftManager' | 'room' | 'metric' | 'condition',\n    event: Event,\n  ): void {\n    const value = (event.target as HTMLInputElement).value;\n    const filters = {\n      from: this.updatedFrom,\n      to: this.updatedTo,\n      shiftManager: this.shiftManagerFilter,\n      room: this.roomFilter,\n      metric: this.metricFilter,\n      condition: this.conditionFilter,\n    };\n    filters[filter].set(value);\n    this.readingPageIndex.set(0);\n    void this.loadReadingEntries();\n  }\n\n  protected clearFilters(): void {\n    this.updatedFrom.set('');\n    this.updatedTo.set('');\n    this.shiftManagerFilter.set('');\n    this.roomFilter.set('');\n    this.metricFilter.set('');\n    this.conditionFilter.set('');\n    this.readingPageIndex.set(0);\n    void this.loadReadingEntries();\n  }\n\n  protected clearDateFilter(filter: 'from' | 'to'): void {\n    if (filter === 'from') {\n      this.updatedFrom.set('');\n      this.readingPageIndex.set(0);\n      void this.loadReadingEntries();\n      return;\n    }\n    this.updatedTo.set('');\n    this.readingPageIndex.set(0);\n    void this.loadReadingEntries();\n  }\n\n  protected goToReadingPage(pageIndex: number): void {\n    if (pageIndex \u003c 0 || pageIndex >= this.readingPageCount()) return;\n    this.readingPageIndex.set(pageIndex);\n    void this.loadReadingEntries();\n  }\n\n  protected metricValue(metric: MetricSummary): string {\n    if (metric.currentNumericValue !== null) {\n      return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(\n        metric.currentNumericValue,\n      );\n    }\n    return metric.currentTextValue ?? '—';\n  }\n\n  protected readingValue(reading: FacilityReadingEntry): string {\n    const value =\n      reading.numericValue === null\n        ? (reading.textValue ?? '—')\n        : new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(reading.numericValue);\n    return reading.unit ? `${value} ${reading.unit}` : value;\n  }\n\n  protected alarmLabel(metric: MetricSummary): string {\n    if (!metric.activeAlarm) return 'Raise alarm';\n    if (metric.activeAlarm.state === 'raised') return 'Acknowledge';\n    return 'Resolve';\n  }\n\n  protected alarmState(metric: MetricSummary): string {\n    return metric.activeAlarm?.state ?? 'not raised';\n  }\n\n  protected chartPoints(history: MetricHistory): string {\n    const values = history.readings\n      .map((reading, index) => ({ index, value: reading.numericValue }))\n      .filter((reading): reading is { index: number; value: number } => reading.value !== null);\n    if (values.length \u003c 2) return '';\n    const min = Math.min(...values.map((reading) => reading.value));\n    const max = Math.max(...values.map((reading) => reading.value));\n    const range = max - min || 1;\n    return values\n      .map((reading, position) => {\n        const x = 72 + (position / (values.length - 1)) * 672;\n        const y = 168 - ((reading.value - min) / range) * 144;\n        return `${x.toFixed(1)},${y.toFixed(1)}`;\n      })\n      .join(' ');\n  }\n\n  protected chartTicks(\n    history: MetricHistory,\n  ): readonly { label: string; value: number; y: number }[] {\n    const values = history.readings\n      .map((reading) => reading.numericValue)\n      .filter((value): value is number => value !== null);\n    if (values.length === 0) return [];\n    const min = Math.min(...values);\n    const max = Math.max(...values);\n    const midpoint = min + (max - min) / 2;\n    const format = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });\n    return [\n      { label: `${format.format(max)} ${history.metric.unit}`, value: max, y: 24 },\n      { label: `${format.format(midpoint)} ${history.metric.unit}`, value: midpoint, y: 96 },\n      { label: `${format.format(min)} ${history.metric.unit}`, value: min, y: 168 },\n    ];\n  }\n\n  protected historyRange(history: MetricHistory): string {\n    const values = history.readings\n      .map((reading) => reading.numericValue)\n      .filter((value): value is number => value !== null);\n    if (values.length === 0) return 'No numeric readings';\n    const format = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });\n    return `${format.format(Math.min(...values))}–${format.format(Math.max(...values))} ${history.metric.unit}`;\n  }\n\n  protected shiftManagers(history: MetricHistory): string {\n    return [...new Set(history.readings.map((reading) => reading.shiftManagerName))].join(', ');\n  }\n\n  protected stateChanges(history: MetricHistory): readonly MetricReading[] {\n    const changes: MetricReading[] = [];\n    let previous: string | null | undefined;\n    for (const reading of history.readings) {\n      if (reading.textValue !== previous) {\n        changes.push(reading);\n        previous = reading.textValue;\n      }\n    }\n    return changes.slice(-8).reverse();\n  }\n\n  protected timeLabel(timestamp: string): string {\n    return new Intl.DateTimeFormat('en-GB', {\n      hour: '2-digit',\n      minute: '2-digit',\n      day: '2-digit',\n      month: 'short',\n    }).format(new Date(timestamp));\n  }\n\n  protected alarmApprovalOutcome(entry: AlarmApprovalAuditEntry): string {\n    if (entry.outcome === 'executed') return 'Alarm raised';\n    if (entry.outcome === 'failed') return `Execution failed: ${entry.error}`;\n    return 'No alarm raised';\n  }\n\n  #alarmApprovalStatus(entry: AlarmApprovalAuditEntry): string {\n    if (entry.outcome === 'executed') {\n      return `Operator approved the proposal. Alarm raised for ${entry.metricName}.`;\n    }\n    if (entry.outcome === 'failed') {\n      return `Operator approved the proposal, but execution failed: ${entry.error}`;\n    }\n    return `Operator rejected the proposal for ${entry.metricName}. No alarm was raised.`;\n  }\n\n  #applyMetricUpdate(event: MetricUpdateEvent): void {\n    this.dashboard.update((dashboard) => {\n      if (!dashboard) return dashboard;\n      return {\n        ...dashboard,\n        generatedAt: event.metric.updatedAt,\n        rooms: dashboard.rooms.map((room) => ({\n          ...room,\n          metrics: room.metrics.map((metric) =>\n            metric.id === event.metric.id ? event.metric : metric,\n          ),\n        })),\n      };\n    });\n    this.selectedHistory.update((history) => {\n      if (!history || history.metric.id !== event.metric.id) return history;\n      const { activeAlarm: _activeAlarm, ...metric } = event.metric;\n      return {\n        metric,\n        readings: [\n          ...history.readings,\n          {\n            recordedAt: event.metric.updatedAt,\n            numericValue: event.metric.currentNumericValue,\n            textValue: event.metric.currentTextValue,\n            shiftManagerName: event.metric.shiftManagerName,\n          },\n        ],\n      };\n    });\n    this.latestUpdatedMetricId.set(event.metric.id);\n    this.status.set(`New device reading received for ${event.metric.name}.`);\n  }\n\n  #startContinuousUpdates(): void {\n    if (this.#stopMetricUpdates) return;\n    this.#stopMetricUpdates = this.#api.subscribeToMetricUpdates(\n      (event) => this.#applyMetricUpdate(event),\n      () => this.status.set('The live update stream is reconnecting…'),\n    );\n    this.continuousUpdates.set(true);\n    this.status.set('Snapshot mode is live. Waiting for the next device reading…');\n  }\n\n  #stopContinuousUpdates(): void {\n    this.#stopMetricUpdates?.();\n    this.#stopMetricUpdates = undefined;\n    this.continuousUpdates.set(false);\n    this.latestUpdatedMetricId.set(undefined);\n    this.status.set('Reading log mode. Live snapshot updates are paused.');\n  }\n\n  #errorMessage(error: unknown): string {\n    return error instanceof Error ? error.message : 'Unexpected facility application error.';\n  }\n\n  #isoFilterDate(value: string): string | undefined {\n    if (!value) return undefined;\n    const timestamp = Date.parse(value);\n    return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();\n  }\n\n  protected closeHistorianResult(): void {\n    this.setDisplayMode('reading-log');\n  }\n}\n",
          diff: "@@ -22,7 +22,7 @@ import {\n } from '@packt-workshop/contracts';\n import { connectWorkshop } from './workshop/connect';\n import { AlarmApprovalEvents } from './alarm-approval-events';\n-import { ChatComponent } from './chat/chat.component';\n+import { BasicChatComponent } from './basic-chat/basic-chat.component';\n import { FacilityApi } from './facility-api';\n \n type DisplayMode = 'snapshot' | 'reading-log' | 'historian-result' | 'a2ui-result';\n@@ -30,7 +30,7 @@ const READING_PAGE_SIZE = 50;\n \n @Component({\n   selector: 'app-root',\n-  imports: [ChatComponent, CopilotA2UIActivityRenderer],\n+  imports: [BasicChatComponent, CopilotA2UIActivityRenderer],\n   templateUrl: './app.html',\n   styleUrl: './app.scss',\n })\n",
        },
        {
          path: "apps/angular-host/src/app/app.html",
          after:
            '\u003cmain>\n  \u003cheader class="page-header">\n    \u003cdiv class="brand-lockup">\n      \u003ca\n        class="corporate-logo-link"\n        href="https://soverius.ai/"\n        target="_blank"\n        rel="noopener noreferrer"\n        aria-label="Visit the Soverius AI website"\n      >\n        \u003cimg class="corporate-logo" src="/soverius-ai-original.png" alt="Soverius AI" />\n      \u003c/a>\n      \u003cdiv class="brand-copy">\n        \u003cp class="eyebrow">Soverius Chocolate operations\u003c/p>\n        \u003ch1 class="product-title">Incident Management\u003c/h1>\n        \u003cp class="subtitle">\n          Persistent factory telemetry, historical readings, and operator-managed alarms.\n        \u003c/p>\n        \u003cp class="stage-label">Factory operations\u003c/p>\n      \u003c/div>\n    \u003c/div>\n    \u003cdiv class="header-actions">\n      \u003cspan class="database-state">SQLite connected\u003c/span>\n      \u003cspan class="mode-state" [class.mode-state-live]="displayMode() === \'snapshot\'">\n        \u003cspan aria-hidden="true">\u003c/span>\n        @switch (displayMode()) {\n          @case (\'snapshot\') {\n            Snapshot live\n          }\n          @case (\'reading-log\') {\n            Reading log\n          }\n          @case (\'a2ui-result\') {\n            Generated view\n          }\n          @case (\'historian-result\') {\n            Historian result\n          }\n        }\n      \u003c/span>\n      \u003cspan class="alarm-summary" [class.has-alarms]="activeAlarmCount() > 0">\n        {{ activeAlarmCount() }} active {{ activeAlarmCount() === 1 ? \'alarm\' : \'alarms\' }}\n      \u003c/span>\n      \u003cbutton class="secondary-button" type="button" (click)="loadDashboard()">Refresh\u003c/button>\n    \u003c/div>\n  \u003c/header>\n\n  @if (loading()) {\n    \u003csection class="message-card" aria-live="polite">\n      \u003ch2>Loading facility data\u003c/h2>\n      \u003cp>Reading rooms, metrics, alarms, and the latest measurements from SQLite…\u003c/p>\n    \u003c/section>\n  } @else if (error() && !dashboard()) {\n    \u003csection class="message-card error-card" role="alert">\n      \u003ch2>Facility backend unavailable\u003c/h2>\n      \u003cp>{{ error() }}\u003c/p>\n      \u003cbutton type="button" (click)="loadDashboard()">Try again\u003c/button>\n    \u003c/section>\n  } @else {\n    \u003cdiv class="workspace-grid">\n      \u003csection class="site-overview" aria-labelledby="rooms-title">\n        \u003cdiv class="section-heading">\n          \u003cdiv>\n            \u003cp class="eyebrow">Factory floor\u003c/p>\n            \u003ch2 id="rooms-title">Rooms and production metrics\u003c/h2>\n          \u003c/div>\n          \u003cp>Every reading and alarm is served by the conventional facility backend.\u003c/p>\n        \u003c/div>\n\n        \u003cdiv\n          class="mode-switch"\n          [class.has-historian-result]="historianResult() || a2uiActivity()"\n          role="tablist"\n          aria-label="Reading display mode"\n        >\n          \u003cbutton\n            type="button"\n            role="tab"\n            [attr.aria-selected]="displayMode() === \'snapshot\'"\n            [class.active]="displayMode() === \'snapshot\'"\n            (click)="setDisplayMode(\'snapshot\')"\n          >\n            Snapshot\n            \u003csmall>Latest value per metric · live\u003c/small>\n          \u003c/button>\n          \u003cbutton\n            type="button"\n            role="tab"\n            [attr.aria-selected]="displayMode() === \'reading-log\'"\n            [class.active]="displayMode() === \'reading-log\'"\n            (click)="setDisplayMode(\'reading-log\')"\n          >\n            Reading log\n            \u003csmall>Historical readings · filterable\u003c/small>\n          \u003c/button>\n          @if (a2uiActivity()) {\n            \u003cbutton\n              type="button"\n              role="tab"\n              [attr.aria-selected]="displayMode() === \'a2ui-result\'"\n              [class.active]="displayMode() === \'a2ui-result\'"\n              (click)="setDisplayMode(\'a2ui-result\')"\n            >\n              Generated view \u003csmall>Tables, cards and text\u003c/small>\n            \u003c/button>\n          }\n          @if (historianResult()) {\n            \u003cbutton\n              type="button"\n              role="tab"\n              [attr.aria-selected]="displayMode() === \'historian-result\'"\n              [class.active]="displayMode() === \'historian-result\'"\n              (click)="setDisplayMode(\'historian-result\')"\n            >\n              Historian result\n              \u003csmall>Reviewed SQL selection\u003c/small>\n            \u003c/button>\n          }\n        \u003c/div>\n\n        \u003csection class="room" aria-labelledby="rooms-title">\n          @if (displayMode() === \'a2ui-result\') {\n            \u003cdiv class="generated-results">\n              @if (resultAgent(); as agent) {\n                @for (activity of a2uiActivities(); track activity.id) {\n                  \u003ccopilot-a2ui-activity-renderer\n                    [activityType]="activity.activityType"\n                    [content]="activity.content"\n                    [message]="activity"\n                    [agent]="agent"\n                  />\n                }\n              }\n            \u003c/div>\n          } @else if (displayMode() !== \'snapshot\') {\n            @if (displayMode() === \'historian-result\' && historianResult(); as result) {\n              \u003csection class="filter-panel" aria-label="Historian query result">\n                \u003cdiv class="filter-heading">\n                  \u003cdiv>\n                    \u003cp class="eyebrow">Historian query result\u003c/p>\n                    \u003cstrong>{{ result.question }}\u003c/strong>\n                  \u003c/div>\n                  \u003cbutton class="secondary-button" type="button" (click)="closeHistorianResult()">\n                    Return to reading log\n                  \u003c/button>\n                \u003c/div>\n                \u003csmall>\n                  {{ result.entries.length }} complete reading\n                  {{ result.entries.length === 1 ? \'record\' : \'records\' }} selected by the reviewed\n                  SQL{{ result.truncated ? \' (result truncated)\' : \'\' }}.\n                \u003c/small>\n              \u003c/section>\n            } @else {\n              \u003csection class="filter-panel" aria-label="Filter persisted readings">\n                \u003cdiv class="filter-heading">\n                  \u003cdiv>\n                    \u003cp class="eyebrow">Historical reading filters\u003c/p>\n                    \u003cstrong>\n                      Showing {{ readingPageStart() }}–{{ readingPageEnd() }} of\n                      {{ displayedReadingPage()?.total ?? 0 }} readings\n                    \u003c/strong>\n                  \u003c/div>\n                  \u003cbutton class="secondary-button" type="button" (click)="clearFilters()">\n                    Clear filters\n                  \u003c/button>\n                \u003c/div>\n                \u003cdiv class="filter-grid">\n                  \u003clabel>\n                    \u003cspan>Updated from\u003c/span>\n                    \u003cspan class="date-filter-control">\n                      \u003cinput\n                        type="datetime-local"\n                        [value]="updatedFrom()"\n                        (input)="setFilter(\'from\', $event)"\n                      />\n                      \u003cbutton\n                        class="date-clear-button"\n                        type="button"\n                        [disabled]="!updatedFrom()"\n                        aria-label="Clear updated from"\n                        (click)="clearDateFilter(\'from\')"\n                      >\n                        Clear\n                      \u003c/button>\n                    \u003c/span>\n                  \u003c/label>\n                  \u003clabel>\n                    \u003cspan>Updated to\u003c/span>\n                    \u003cspan class="date-filter-control">\n                      \u003cinput\n                        type="datetime-local"\n                        [value]="updatedTo()"\n                        (input)="setFilter(\'to\', $event)"\n                      />\n                      \u003cbutton\n                        class="date-clear-button"\n                        type="button"\n                        [disabled]="!updatedTo()"\n                        aria-label="Clear updated to"\n                        (click)="clearDateFilter(\'to\')"\n                      >\n                        Clear\n                      \u003c/button>\n                    \u003c/span>\n                  \u003c/label>\n                  \u003clabel>\n                    \u003cspan>Shift manager\u003c/span>\n                    \u003cselect\n                      [value]="shiftManagerFilter()"\n                      (change)="setFilter(\'shiftManager\', $event)"\n                    >\n                      \u003coption value="" [selected]="!shiftManagerFilter()">\n                        All shift managers\n                      \u003c/option>\n                      @for (manager of shiftManagerOptions(); track manager) {\n                        \u003coption [value]="manager" [selected]="shiftManagerFilter() === manager">\n                          {{ manager }}\n                        \u003c/option>\n                      }\n                    \u003c/select>\n                  \u003c/label>\n                  \u003clabel>\n                    \u003cspan>Room\u003c/span>\n                    \u003cselect [value]="roomFilter()" (change)="setFilter(\'room\', $event)">\n                      \u003coption value="" [selected]="!roomFilter()">All rooms\u003c/option>\n                      @for (room of rooms(); track room.id) {\n                        \u003coption [value]="room.id" [selected]="roomFilter() === room.id">\n                          {{ room.name }}\n                        \u003c/option>\n                      }\n                    \u003c/select>\n                  \u003c/label>\n                  \u003clabel>\n                    \u003cspan>Metric\u003c/span>\n                    \u003cselect [value]="metricFilter()" (change)="setFilter(\'metric\', $event)">\n                      \u003coption value="" [selected]="!metricFilter()">All metrics\u003c/option>\n                      @for (metric of metricOptions(); track metric.id) {\n                        \u003coption [value]="metric.id" [selected]="metricFilter() === metric.id">\n                          {{ metric.label }}\n                        \u003c/option>\n                      }\n                    \u003c/select>\n                  \u003c/label>\n                  \u003clabel>\n                    \u003cspan>Condition\u003c/span>\n                    \u003cselect [value]="conditionFilter()" (change)="setFilter(\'condition\', $event)">\n                      \u003coption value="" [selected]="!conditionFilter()">All conditions\u003c/option>\n                      \u003coption value="normal" [selected]="conditionFilter() === \'normal\'">\n                        Normal\n                      \u003c/option>\n                      \u003coption value="warning" [selected]="conditionFilter() === \'warning\'">\n                        Warning\n                      \u003c/option>\n                      \u003coption value="critical" [selected]="conditionFilter() === \'critical\'">\n                        Critical\n                      \u003c/option>\n                      \u003coption value="unavailable" [selected]="conditionFilter() === \'unavailable\'">\n                        Unavailable\n                      \u003c/option>\n                    \u003c/select>\n                  \u003c/label>\n                \u003c/div>\n              \u003c/section>\n            }\n            \u003cdiv class="table-shell" tabindex="0" aria-label="Historical readings table">\n              \u003ctable class="reading-entries-table">\n                \u003ccaption>\n                  {{\n                    displayMode() === \'historian-result\'\n                      ? \'Stored readings selected by the reviewed historian query\'\n                      : \'Persisted metric readings matching the historical filters\'\n                  }}\n                \u003c/caption>\n                \u003cthead>\n                  \u003ctr>\n                    \u003cth scope="col">Date and time\u003c/th>\n                    \u003cth scope="col">Shift manager\u003c/th>\n                    \u003cth scope="col">Room\u003c/th>\n                    \u003cth scope="col">Metric\u003c/th>\n                    \u003cth scope="col">Value\u003c/th>\n                    \u003cth scope="col">Condition\u003c/th>\n                  \u003c/tr>\n                \u003c/thead>\n                \u003ctbody>\n                  @if (readingsLoading() && displayMode() !== \'historian-result\') {\n                    \u003ctr>\n                      \u003ctd class="empty-table" colspan="6">Loading persisted readings…\u003c/td>\n                    \u003c/tr>\n                  } @else {\n                    @for (entry of displayedReadingPage()?.entries ?? []; track entry.id) {\n                      \u003ctr class="condition-{{ entry.condition }}">\n                        \u003ctd>\n                          \u003ctime [attr.datetime]="entry.recordedAt">{{\n                            timeLabel(entry.recordedAt)\n                          }}\u003c/time>\n                        \u003c/td>\n                        \u003ctd class="shift-manager">{{ entry.shiftManagerName }}\u003c/td>\n                        \u003ctd class="room-cell">\n                          \u003cstrong>{{ entry.roomName }}\u003c/strong>\n                        \u003c/td>\n                        \u003cth class="metric-cell" scope="row">\n                          {{ entry.metricName }}\n                        \u003c/th>\n                        \u003ctd class="reading-entry-value">{{ readingValue(entry) }}\u003c/td>\n                        \u003ctd>\n                          \u003cspan class="condition-badge">{{ entry.condition }}\u003c/span>\n                        \u003c/td>\n                      \u003c/tr>\n                    } @empty {\n                      \u003ctr>\n                        \u003ctd class="empty-table" colspan="6">\n                          No persisted readings match these filters.\n                        \u003c/td>\n                      \u003c/tr>\n                    }\n                  }\n                \u003c/tbody>\n              \u003c/table>\n            \u003c/div>\n            @if (displayMode() === \'reading-log\') {\n              \u003cnav class="pagination" aria-label="Reading log pagination">\n                \u003cbutton\n                  class="secondary-button"\n                  type="button"\n                  [disabled]="readingPageIndex() === 0 || readingsLoading()"\n                  (click)="goToReadingPage(readingPageIndex() - 1)"\n                >\n                  Previous\n                \u003c/button>\n                \u003cspan>\n                  Page \u003cstrong>{{ readingPageIndex() + 1 }}\u003c/strong> of\n                  \u003cstrong>{{ readingPageCount() }}\u003c/strong>\n                \u003c/span>\n                \u003cbutton\n                  class="secondary-button"\n                  type="button"\n                  [disabled]="readingPageIndex() + 1 >= readingPageCount() || readingsLoading()"\n                  (click)="goToReadingPage(readingPageIndex() + 1)"\n                >\n                  Next\n                \u003c/button>\n              \u003c/nav>\n            }\n          } @else {\n            \u003cdiv class="current-table-heading">\n              \u003cdiv>\n                \u003cp class="eyebrow">Live overview\u003c/p>\n                \u003ch3>Current reading per metric\u003c/h3>\n              \u003c/div>\n              \u003cspan>{{ currentRows().length }} metrics\u003c/span>\n            \u003c/div>\n            \u003cdiv class="table-shell" tabindex="0" aria-label="Factory metrics table">\n              \u003ctable class="metrics-table">\n                \u003ccaption>\n                  Current readings, configured targets, history, and alarms for all factory rooms\n                \u003c/caption>\n                \u003cthead>\n                  \u003ctr>\n                    \u003cth scope="col">Room\u003c/th>\n                    \u003cth scope="col">Metric\u003c/th>\n                    \u003cth scope="col">Current\u003c/th>\n                    \u003cth scope="col">Shift manager\u003c/th>\n                    \u003cth scope="col">Trend\u003c/th>\n                    \u003cth scope="col">Condition\u003c/th>\n                    \u003cth scope="col">Normal range\u003c/th>\n                    \u003cth scope="col">History\u003c/th>\n                    \u003cth scope="col">Alarm workflow\u003c/th>\n                  \u003c/tr>\n                \u003c/thead>\n                \u003ctbody>\n                  @for (row of currentRows(); track row.metric.id) {\n                    \u003ctr\n                      class="condition-{{ row.metric.condition }}"\n                      [class.alarm-active]="row.metric.activeAlarm"\n                      [class.live-updated]="latestUpdatedMetricId() === row.metric.id"\n                      [attr.data-metric-id]="row.metric.id"\n                    >\n                      \u003ctd class="room-cell">\n                        \u003cstrong>{{ row.room.name }}\u003c/strong>\n                      \u003c/td>\n                      \u003cth class="metric-cell" scope="row">\n                        {{ row.metric.name }}\n                      \u003c/th>\n                      \u003ctd class="reading">\n                        \u003cstrong>{{ metricValue(row.metric) }}\u003c/strong>\n                        @if (row.metric.unit) {\n                          \u003cspan>{{ row.metric.unit }}\u003c/span>\n                        }\n                        \u003csmall>{{ timeLabel(row.metric.updatedAt) }}\u003c/small>\n                      \u003c/td>\n                      \u003ctd class="shift-manager">{{ row.metric.shiftManagerName }}\u003c/td>\n                      \u003ctd class="trend">{{ row.metric.trend }}\u003c/td>\n                      \u003ctd>\n                        \u003cspan class="condition-badge">{{ row.metric.condition }}\u003c/span>\n                      \u003c/td>\n                      \u003ctd class="target">{{ row.metric.target }}\u003c/td>\n                      \u003ctd>\n                        \u003cbutton\n                          class="history-button"\n                          type="button"\n                          (click)="showHistory(row.metric)"\n                        >\n                          View 7d\n                        \u003c/button>\n                      \u003c/td>\n                      \u003ctd>\n                        \u003cdiv class="alarm-action">\n                          \u003cspan>{{ alarmState(row.metric) }}\u003c/span>\n                          \u003cbutton\n                            type="button"\n                            (click)="handleAlarm(row.metric)"\n                            [disabled]="busyMetricId() === row.metric.id"\n                            [attr.aria-label]="alarmLabel(row.metric) + \' for \' + row.metric.name"\n                          >\n                            {{\n                              busyMetricId() === row.metric.id ? \'Saving…\' : alarmLabel(row.metric)\n                            }}\n                          \u003c/button>\n                        \u003c/div>\n                      \u003c/td>\n                    \u003c/tr>\n                  }\n                \u003c/tbody>\n              \u003c/table>\n            \u003c/div>\n          }\n        \u003c/section>\n      \u003c/section>\n\n      \u003capp-basic-chat />\n    \u003c/div>\n  }\n\n  \u003cp class="status" role="status">{{ status() }}\u003c/p>\n\n  \u003csection class="audit-panel" aria-labelledby="alarm-audit-title">\n    \u003cdiv class="history-heading">\n      \u003cdiv>\n        \u003cp class="eyebrow">Accountability record\u003c/p>\n        \u003ch2 id="alarm-audit-title">Alarm decision audit\u003c/h2>\n      \u003c/div>\n      \u003cbutton class="secondary-button" type="button" (click)="loadAlarmApprovalAudit()">\n        Refresh audit\n      \u003c/button>\n    \u003c/div>\n    @if (alarmApprovals().length) {\n      \u003cdiv class="table-shell" tabindex="0" aria-label="Alarm approval audit table">\n        \u003ctable class="audit-table">\n          \u003ccaption>\n            Human decisions on alarm proposals and their actual execution outcomes\n          \u003c/caption>\n          \u003cthead>\n            \u003ctr>\n              \u003cth scope="col">Decision time\u003c/th>\n              \u003cth scope="col">Metric\u003c/th>\n              \u003cth scope="col">Operator\u003c/th>\n              \u003cth scope="col">Decision\u003c/th>\n              \u003cth scope="col">Outcome\u003c/th>\n              \u003cth scope="col">Correlation ID\u003c/th>\n            \u003c/tr>\n          \u003c/thead>\n          \u003ctbody>\n            @for (entry of alarmApprovals(); track entry.correlationId) {\n              \u003ctr>\n                \u003ctd>\n                  \u003ctime [attr.datetime]="entry.decidedAt">{{ timeLabel(entry.decidedAt) }}\u003c/time>\n                \u003c/td>\n                \u003cth scope="row">{{ entry.metricName }}\u003c/th>\n                \u003ctd>{{ entry.operatorId }}\u003c/td>\n                \u003ctd>\n                  \u003cspan class="audit-decision">{{ entry.decision }}\u003c/span>\n                \u003c/td>\n                \u003ctd>{{ alarmApprovalOutcome(entry) }}\u003c/td>\n                \u003ctd>\n                  \u003ccode>{{ entry.correlationId }}\u003c/code>\n                \u003c/td>\n              \u003c/tr>\n            }\n          \u003c/tbody>\n        \u003c/table>\n      \u003c/div>\n    } @else {\n      \u003cp>No agent-proposed alarm decision has been recorded yet.\u003c/p>\n    }\n  \u003c/section>\n\n  @if (selectedMetricId()) {\n    \u003csection class="history-panel" aria-labelledby="history-title">\n      \u003cdiv class="history-heading">\n        \u003cdiv>\n          \u003cp class="eyebrow">Database history · last seven days\u003c/p>\n          \u003ch2 id="history-title">{{ selectedHistory()?.metric?.name ?? \'Loading history…\' }}\u003c/h2>\n        \u003c/div>\n        \u003cbutton class="secondary-button" type="button" (click)="closeHistory()">Close\u003c/button>\n      \u003c/div>\n\n      @if (historyLoading()) {\n        \u003cp>Loading historical readings…\u003c/p>\n      } @else if (selectedHistory(); as history) {\n        @if (history.metric.kind === \'numeric\') {\n          \u003cdiv class="chart-summary">\n            \u003cstrong>{{ historyRange(history) }}\u003c/strong>\n            \u003cspan>{{ history.readings.length }} persisted readings\u003c/span>\n            \u003cspan>Shift managers: {{ shiftManagers(history) }}\u003c/span>\n          \u003c/div>\n          \u003csvg\n            class="history-chart"\n            viewBox="0 0 760 188"\n            role="img"\n            [attr.aria-label]="\'Seven-day history for \' + history.metric.name"\n          >\n            @for (tick of chartTicks(history); track tick.y) {\n              \u003cline\n                class="chart-grid-line"\n                x1="72"\n                [attr.y1]="tick.y"\n                x2="744"\n                [attr.y2]="tick.y"\n              />\n              \u003ctext\n                class="y-axis-label"\n                x="64"\n                [attr.y]="tick.y"\n                text-anchor="end"\n                dominant-baseline="middle"\n              >\n                {{ tick.label }}\n              \u003c/text>\n            }\n            \u003cline class="chart-axis" x1="72" y1="24" x2="72" y2="168" />\n            \u003cpolyline [attr.points]="chartPoints(history)" />\n          \u003c/svg>\n        } @else {\n          \u003col class="state-timeline">\n            @for (reading of stateChanges(history); track reading.recordedAt) {\n              \u003cli>\n                \u003ctime [attr.datetime]="reading.recordedAt">{{\n                  timeLabel(reading.recordedAt)\n                }}\u003c/time>\n                \u003cstrong>{{ reading.textValue }}\u003c/strong>\n                \u003cspan>{{ reading.shiftManagerName }}\u003c/span>\n              \u003c/li>\n            }\n          \u003c/ol>\n        }\n      }\n    \u003c/section>\n  }\n\u003c/main>\n',
          diff: "@@ -427,7 +427,7 @@\n         \u003c/section>\n       \u003c/section>\n \n-      \u003capp-chat />\n+      \u003capp-basic-chat />\n     \u003c/div>\n   }\n \n",
        },
      ],
      flow: ["Native chat", "Facility /api/chat", "Model"],
    },
    {
      id: "03",
      name: "CopilotKit and AG-UI",
      source: "workshop/speaker-notes/03-copilotkit.md",
      intro:
        "**Start:** completed 02. **Completed code:** [solution 03](../solutions/03/).\n\n**Demo inputs:** Follow the numbered prompts for milestone 03 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 02. **Completed code:** [solution 03](../solutions/03/).\n\n**Demo inputs:** Follow the numbered prompts for milestone 03 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“The next change is how we connect and display an agent run. The assistant still\nhas the same data limitation. CopilotKit provides the interaction; AG-UI carries\nthe run lifecycle, streamed text, and later tool activity.”",
        },
        {
          label: "DO",
          title: "Open and change · 1",
          body: "`apps/angular-host/src/app/app.config.ts`: add the `provideCopilotKit` and label\n   providers from [solution 03](../solutions/03/apps/angular-host/src/app/app.config.ts).\n   Point to `runtimeUrl: '/api/copilotkit'` and the Angular development proxy.",
        },
        {
          label: "DO",
          title: "Open and change · 2",
          body: 'Put `\u003capp-chat />` back in `app.html`, and switch the `app.ts` import and\n   component `imports` array back to `ChatComponent` from `./chat/chat.component`.\n   Replace the three `chat.component.*` files with solution 03. Open its template\n   and focus on `\u003ccopilot-chat agentId="default" appStreamingAutoScroll />`.\n   BasicChatComponent stays available in its separate `basic-chat/` folder.\n   The scrolling directive and surrounding layout are prepared support.',
        },
        {
          label: "DO",
          title: "Open and change · 3",
          body: "`apps/facility-service/src/workshop.ts`: connect\n   `createEmbeddedCopilotRuntime(options)` and disconnect native chat.",
        },
        {
          label: "DO",
          title: "Open and change · 4",
          body: "Open `embedded-copilot-runtime.ts`: show the `BuiltInAgent`, model, static prompt,\n   `agents.default`, and listener. No tools are registered.",
        },
        {
          label: "DO",
          title: "Open and change · 5",
          body: "Restart `pnpm dev` (or your `pnpm dev:backend` / `pnpm dev:all` launcher); reload the browser to start a new conversation.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate",
          body: "Ask: **Why does temperature control matter when making chocolate?**\n\nShow text arriving incrementally.\nIn Network, inspect the CopilotKit request and its streaming response; locate\nthe run-start, text-message, and run-finish events where exposed by the transport.\nExplain that streaming chunks are transport observations, not a trace of hidden reasoning.\n\nAsk: **Show only warnings from the Cooling room.**\n\nExpected: no filter changes because no frontend tools have been connected. The\nfrontend still owns the filters and the runtime has no handler to change them.",
        },
        {
          label: "TRANSITION",
          title: "Transition",
          body: "“We have a stable frontend connection. We can now move the agent into Mastra while\nkeeping that interface.”",
        },
      ],
      prompts: [
        {
          title: "Show streaming in CopilotChat",
          prompt: "Why does temperature control matter when making chocolate?",
          before:
            "Complete milestone 03, restart the facility service and reload the app. Use a fresh conversation.",
          expected:
            "A general answer arrives through CopilotChat and the embedded agent runtime. Exact chunk timing depends on the model.",
          inspect:
            "Open the browser network stream. Trace the request through the Copilot runtime and AG-UI lifecycle events.",
          optional: false,
        },
        {
          title: "Introduce the future frontend tool demo",
          prompt: "Show only warnings from the Cooling room.",
          before:
            "Clear filters manually first. There are no frontend tools in this checkpoint.",
          expected:
            "Filters stay unchanged. The assistant should acknowledge that it cannot operate the interface yet.",
          inspect:
            "Point to the unchanged filters. Save this request to repeat after milestone 05.",
          optional: false,
        },
      ],
      recovery:
        "Select 03, restart the facility process and reload. Check\nhttp://localhost:3101/api/copilotkit/info for discovery. Inspect matching\n`default` agent IDs and provider URL if the chat is empty. Mastra is not needed yet.",
      files: [
        {
          path: "apps/angular-host/src/app/chat/chat.component.ts",
          after:
            "import { Component } from '@angular/core';\nimport { CopilotChat } from '@copilotkit/angular';\nimport { StreamingAutoScrollDirective } from './streaming-auto-scroll.directive';\n\n@Component({\n  selector: 'app-chat',\n  imports: [CopilotChat, StreamingAutoScrollDirective],\n  templateUrl: './chat.component.html',\n  styleUrl: './chat.component.scss',\n})\nexport class ChatComponent {}\n",
          diff: "@@ -1,6 +1,10 @@\n import { Component } from '@angular/core';\n+import { CopilotChat } from '@copilotkit/angular';\n+import { StreamingAutoScrollDirective } from './streaming-auto-scroll.directive';\n+\n @Component({\n   selector: 'app-chat',\n+  imports: [CopilotChat, StreamingAutoScrollDirective],\n   templateUrl: './chat.component.html',\n   styleUrl: './chat.component.scss',\n })\n",
        },
        {
          path: "apps/angular-host/src/app/chat/chat.component.html",
          after:
            '\u003caside aria-labelledby="chat-title">\n  \u003cdiv class="chat-heading">\n    \u003cdiv>\n      \u003cp class="eyebrow">CopilotKit · AG-UI streaming\u003c/p>\n      \u003ch2 id="chat-title">Factory assistant\u003c/h2>\n    \u003c/div>\n    \u003cspan>AG-UI\u003c/span>\n  \u003c/div>\n  \u003cp class="chat-boundary">\n    Available capabilities depend on the tools connected to this assistant.\n  \u003c/p>\n\n  \u003cdiv class="copilot-chat-shell">\n    \u003ccopilot-chat agentId="default" appStreamingAutoScroll />\n  \u003c/div>\n\u003c/aside>\n',
          diff: '@@ -1,4 +1,16 @@\n-\u003caside aria-label="Assistant">\n-  \u003ch2>Factory assistant\u003c/h2>\n-  \u003cp>The assistant is not connected yet.\u003c/p>\n+\u003caside aria-labelledby="chat-title">\n+  \u003cdiv class="chat-heading">\n+    \u003cdiv>\n+      \u003cp class="eyebrow">CopilotKit · AG-UI streaming\u003c/p>\n+      \u003ch2 id="chat-title">Factory assistant\u003c/h2>\n+    \u003c/div>\n+    \u003cspan>AG-UI\u003c/span>\n+  \u003c/div>\n+  \u003cp class="chat-boundary">\n+    Available capabilities depend on the tools connected to this assistant.\n+  \u003c/p>\n+\n+  \u003cdiv class="copilot-chat-shell">\n+    \u003ccopilot-chat agentId="default" appStreamingAutoScroll />\n+  \u003c/div>\n \u003c/aside>\n',
        },
        {
          path: "apps/angular-host/src/app/app.config.ts",
          after:
            "import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';\nimport { provideHttpClient } from '@angular/common/http';\nimport { provideRouter } from '@angular/router';\nimport { provideCopilotChatLabels, provideCopilotKit } from '@copilotkit/angular';\n\nimport { routes } from './app.routes';\n\nexport const appConfig: ApplicationConfig = {\n  providers: [\n    provideBrowserGlobalErrorListeners(),\n    provideHttpClient(),\n    provideRouter(routes),\n    provideCopilotKit({ runtimeUrl: '/api/copilotkit' }),\n    provideCopilotChatLabels({\n      chatInputPlaceholder: 'Ask about this view or its history…',\n      welcomeMessageText: 'How can I help?',\n      chatDisclaimerText:\n        'Check answers against facility evidence. Operational actions require operator control.',\n    }),\n  ],\n};\n",
          diff: "@@ -1,9 +1,21 @@\n import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';\n import { provideHttpClient } from '@angular/common/http';\n import { provideRouter } from '@angular/router';\n+import { provideCopilotChatLabels, provideCopilotKit } from '@copilotkit/angular';\n \n import { routes } from './app.routes';\n \n export const appConfig: ApplicationConfig = {\n-  providers: [provideBrowserGlobalErrorListeners(), provideHttpClient(), provideRouter(routes)],\n+  providers: [\n+    provideBrowserGlobalErrorListeners(),\n+    provideHttpClient(),\n+    provideRouter(routes),\n+    provideCopilotKit({ runtimeUrl: '/api/copilotkit' }),\n+    provideCopilotChatLabels({\n+      chatInputPlaceholder: 'Ask about this view or its history…',\n+      welcomeMessageText: 'How can I help?',\n+      chatDisclaimerText:\n+        'Check answers against facility evidence. Operational actions require operator control.',\n+    }),\n+  ],\n };\n",
        },
        {
          path: "apps/facility-service/src/workshop.ts",
          after:
            'import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\nimport { createEmbeddedCopilotRuntime } from "./embedded-copilot-runtime.js";\n\nexport function createWorkshopConnections(\n  options: WorkshopOptions,\n): WorkshopConnections {\n  return {\n    chat: undefined,\n    copilotRuntime: createEmbeddedCopilotRuntime(options),\n  };\n}\n\nexport { HistorianQueryService } from "./historian-query-legacy.js";\n',
          diff: '@@ -1,12 +1,12 @@\n import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\n-import { createChatService } from "./chat.js";\n+import { createEmbeddedCopilotRuntime } from "./embedded-copilot-runtime.js";\n \n export function createWorkshopConnections(\n   options: WorkshopOptions,\n ): WorkshopConnections {\n   return {\n-    chat: createChatService(options),\n-    copilotRuntime: undefined,\n+    chat: undefined,\n+    copilotRuntime: createEmbeddedCopilotRuntime(options),\n   };\n }\n \n',
        },
        {
          path: "apps/angular-host/src/app/app.ts",
          after:
            "import { CopilotA2UIActivityRenderer, type injectAgentStore } from '@copilotkit/angular';\nimport { Component, computed, DestroyRef, inject, linkedSignal, signal } from '@angular/core';\nimport type {\n  AlarmApprovalAuditEntry,\n  ConfigureFacilityView,\n  FacilityDashboard,\n  FacilityReadingEntry,\n  FacilityReadingPage,\n  FacilityViewState,\n  MetricHistory,\n  MetricReading,\n  MetricSummary,\n  MetricUpdateEvent,\n} from '@packt-workshop/contracts';\nimport {\n  applyFacilityViewCommand,\n  historianToolResultSchema,\n  listMetricsToolSchema,\n  metricConditionSchema,\n  resolveFacilityViewDates,\n  resolveFacilityViewAvailableOptions,\n} from '@packt-workshop/contracts';\nimport { connectWorkshop } from './workshop/connect';\nimport { AlarmApprovalEvents } from './alarm-approval-events';\nimport { ChatComponent } from './chat/chat.component';\nimport { FacilityApi } from './facility-api';\n\ntype DisplayMode = 'snapshot' | 'reading-log' | 'historian-result' | 'a2ui-result';\nconst READING_PAGE_SIZE = 50;\n\n@Component({\n  selector: 'app-root',\n  imports: [ChatComponent, CopilotA2UIActivityRenderer],\n  templateUrl: './app.html',\n  styleUrl: './app.scss',\n})\nexport class App {\n  readonly #api = inject(FacilityApi);\n  readonly #approvalEvents = inject(AlarmApprovalEvents);\n  readonly #destroyRef = inject(DestroyRef);\n  #stopMetricUpdates: (() => void) | undefined;\n\n  protected readonly dashboard = signal\u003cFacilityDashboard | undefined>(undefined);\n  protected readonly loading = signal(true);\n  protected readonly error = signal\u003cstring | undefined>(undefined);\n  protected readonly busyMetricId = signal\u003cstring | undefined>(undefined);\n  protected readonly historyLoading = signal(false);\n  protected readonly selectedHistory = signal\u003cMetricHistory | undefined>(undefined);\n  protected readonly selectedMetricId = signal\u003cstring | undefined>(undefined);\n  protected readonly continuousUpdates = signal(false);\n  protected readonly resultStore = signal\u003cReturnType\u003ctypeof injectAgentStore> | undefined>(\n    undefined,\n  );\n  protected readonly resultAgent = computed(() => this.resultStore()?.().agent);\n  private readonly resultMessages = computed(() => this.resultStore()?.().messages() ?? []);\n  protected readonly a2uiActivities = computed(() => {\n    const messages = this.resultMessages();\n    const activities = messages\n      .filter((message) => message.role === 'activity')\n      .filter(\n        (message) =>\n          message.activityType === 'a2ui-surface' &&\n          Array.isArray(message.content['a2ui_operations']) &&\n          message.content['a2ui_operations'].length > 0,\n      );\n    const latest = activities.at(-1);\n    if (!latest) return [];\n    const turnStart = messages\n      .slice(0, messages.indexOf(latest))\n      .reduce((last, message, index) => (message.role === 'user' ? index : last), -1);\n    return activities.filter((activity) => messages.indexOf(activity) > turnStart);\n  });\n  protected readonly a2uiActivity = computed(() => this.a2uiActivities().at(-1));\n  private readonly a2uiActivityId = computed(() => this.a2uiActivity()?.id);\n  private readonly historianResultId = computed(() => this.historianResult()?.id);\n  protected readonly displayMode = linkedSignal\u003cDisplayMode>(() =>\n    this.a2uiActivityId()\n      ? 'a2ui-result'\n      : this.historianResultId()\n        ? 'historian-result'\n        : 'snapshot',\n  );\n  protected readonly latestUpdatedMetricId = signal\u003cstring | undefined>(undefined);\n  protected readonly status = signal('Connecting to the facility database…');\n  protected readonly readingPage = signal\u003cFacilityReadingPage | undefined>(undefined);\n  protected readonly readingsLoading = signal(false);\n  protected readonly readingPageIndex = signal(0);\n  protected readonly updatedFrom = signal('');\n  protected readonly updatedTo = signal('');\n  protected readonly shiftManagerFilter = signal('');\n  protected readonly roomFilter = signal('');\n  protected readonly metricFilter = signal('');\n  protected readonly conditionFilter = signal('');\n  protected readonly historianResult = computed(() => {\n    const messages = this.resultMessages();\n    const queryIds = new Set(\n      messages.flatMap((message) =>\n        message.role === 'assistant'\n          ? (message.toolCalls ?? [])\n              .filter((call) => call.function.name === 'query_historian')\n              .map((call) => call.id)\n          : [],\n      ),\n    );\n    for (const message of [...messages].reverse()) {\n      if (message.role !== 'tool' || !queryIds.has(message.toolCallId)) continue;\n      try {\n        const result = historianToolResultSchema.safeParse(JSON.parse(message.content));\n        if (result.success && result.data.status === 'executed')\n          return { ...result.data, id: message.id };\n      } catch {\n        /* Incomplete messages have no result to display. */\n      }\n    }\n    return undefined;\n  });\n  protected readonly alarmApprovals = signal\u003creadonly AlarmApprovalAuditEntry[]>([]);\n  protected readonly rooms = computed(() => this.dashboard()?.rooms ?? []);\n  protected readonly activeAlarmCount = computed(() => this.dashboard()?.activeAlarmCount ?? 0);\n  protected readonly shiftManagerOptions = computed(() => this.dashboard()?.shiftManagers ?? []);\n  protected readonly metricOptions = computed(() =>\n    this.rooms().flatMap((room) =>\n      room.metrics.map((metric) => ({\n        id: metric.id,\n        label: `${room.name} · ${metric.name}`,\n      })),\n    ),\n  );\n  protected readonly facilityViewState = computed\u003cFacilityViewState>(() => ({\n    view: this.displayMode() === 'snapshot' ? ('snapshot' as const) : ('reading-log' as const),\n    filters: {\n      from: this.updatedFrom() || null,\n      to: this.updatedTo() || null,\n      shiftManager: this.shiftManagerFilter() || null,\n      roomId: this.roomFilter() || null,\n      metricId: this.metricFilter() || null,\n      condition: metricConditionSchema.safeParse(this.conditionFilter()).data ?? null,\n    },\n  }));\n  protected readonly currentRows = computed(() =>\n    this.rooms().flatMap((room) => room.metrics.map((metric) => ({ room, metric }))),\n  );\n  protected readonly displayedReadingPage = computed\u003cFacilityReadingPage | undefined>(() => {\n    const result = this.historianResult();\n    if (this.displayMode() !== 'historian-result' || !result) return this.readingPage();\n    return {\n      entries: result.entries,\n      total: result.entries.length,\n      limit: Math.max(1, result.entries.length),\n      offset: 0,\n    };\n  });\n  protected readonly readingPageCount = computed(() =>\n    Math.max(1, Math.ceil((this.displayedReadingPage()?.total ?? 0) / READING_PAGE_SIZE)),\n  );\n  protected readonly readingPageStart = computed(() => {\n    const page = this.displayedReadingPage();\n    return page && page.total > 0 ? page.offset + 1 : 0;\n  });\n  protected readonly readingPageEnd = computed(() => {\n    const page = this.displayedReadingPage();\n    return page ? page.offset + page.entries.length : 0;\n  });\n\n  constructor() {\n    connectWorkshop({\n      facilityViewState: this.facilityViewState,\n      rooms: this.rooms,\n      shiftManagerOptions: this.shiftManagerOptions,\n      listMetrics: (input) => this.#listMetrics(input),\n      configureFacilityView: (command) => this.#configureFacilityView(command),\n      invalidToolPayload: (message) => this.#invalidToolPayload(message),\n      connectResultStore: (store) => this.resultStore.set(store),\n    });\n    const approvalSubscription = this.#approvalEvents.recorded$.subscribe((record) => {\n      this.alarmApprovals.update((entries) => [\n        record,\n        ...entries.filter((entry) => entry.correlationId !== record.correlationId),\n      ]);\n      this.status.set(this.#alarmApprovalStatus(record));\n      void this.loadDashboard(false);\n    });\n    this.#destroyRef.onDestroy(() => {\n      approvalSubscription.unsubscribe();\n      this.#stopMetricUpdates?.();\n    });\n    this.#startContinuousUpdates();\n    void this.loadDashboard();\n    void this.loadAlarmApprovalAudit();\n  }\n\n  async #listMetrics(input: unknown): Promise\u003cunknown> {\n    const validation = listMetricsToolSchema.safeParse(input);\n    if (!validation.success) return this.#invalidToolPayload(validation.error.issues[0]?.message);\n\n    let roomId = validation.data.roomId;\n    if (roomId) {\n      try {\n        const resolved = resolveFacilityViewAvailableOptions(\n          { action: 'update_filters', filters: { roomId } },\n          this.#availableFilterOptions(),\n        );\n        roomId =\n          resolved.action === 'update_filters' ? (resolved.filters.roomId ?? undefined) : roomId;\n      } catch (error) {\n        return {\n          ok: false,\n          error: error instanceof Error ? error.message : 'Invalid room option.',\n        };\n      }\n    }\n\n    return {\n      metrics: this.rooms()\n        .filter((room) => !roomId || room.id === roomId)\n        .flatMap((room) =>\n          room.metrics.map((metric) => ({\n            id: metric.id,\n            name: metric.name,\n            roomId: room.id,\n            roomName: room.name,\n            kind: metric.kind,\n            unit: metric.unit,\n          })),\n        ),\n    };\n  }\n\n  async #configureFacilityView(command: ConfigureFacilityView): Promise\u003cunknown> {\n    let validatedCommand = command;\n    try {\n      validatedCommand = resolveFacilityViewAvailableOptions(\n        validatedCommand,\n        this.#availableFilterOptions(),\n      );\n    } catch (error) {\n      return {\n        ok: false,\n        state: this.facilityViewState(),\n        error: error instanceof Error ? error.message : 'Invalid facility filter option.',\n      };\n    }\n    const next = resolveFacilityViewDates(\n      applyFacilityViewCommand(this.facilityViewState(), validatedCommand),\n    );\n    const nextDisplayMode: DisplayMode = next.view === 'snapshot' ? 'snapshot' : 'reading-log';\n    const viewChanged = nextDisplayMode !== this.displayMode();\n\n    this.updatedFrom.set(next.filters.from ?? '');\n    this.updatedTo.set(next.filters.to ?? '');\n    this.shiftManagerFilter.set(next.filters.shiftManager ?? '');\n    this.roomFilter.set(next.filters.roomId ?? '');\n    this.metricFilter.set(next.filters.metricId ?? '');\n    this.conditionFilter.set(next.filters.condition ?? '');\n    this.readingPageIndex.set(0);\n\n    if (viewChanged) {\n      this.displayMode.set(nextDisplayMode);\n      this.closeHistory();\n      if (nextDisplayMode === 'snapshot') this.#startContinuousUpdates();\n      else this.#stopContinuousUpdates();\n    }\n    if (nextDisplayMode === 'reading-log') await this.loadReadingEntries();\n\n    this.status.set('The assistant updated the facility view.');\n    return {\n      ok: true,\n      state: next,\n      message: 'Facility view updated. Unspecified values were preserved.',\n    };\n  }\n\n  #invalidToolPayload(message?: string): unknown {\n    return {\n      ok: false,\n      state: this.facilityViewState(),\n      error: message ?? 'Invalid frontend tool payload.',\n    };\n  }\n\n  #availableFilterOptions() {\n    return {\n      rooms: this.rooms().map((room) => ({ id: room.id, name: room.name })),\n      metrics: this.metricOptions(),\n      shiftManagers: this.shiftManagerOptions(),\n    };\n  }\n\n  protected setDisplayMode(mode: DisplayMode): void {\n    if (mode === 'historian-result' && !this.historianResult()) return;\n    if (mode === 'a2ui-result' && !this.a2uiActivity()) return;\n    if (this.displayMode() === mode) return;\n    this.displayMode.set(mode);\n    this.closeHistory();\n    if (mode === 'snapshot') {\n      this.#startContinuousUpdates();\n      return;\n    }\n    this.#stopContinuousUpdates();\n    if (mode === 'historian-result') {\n      this.status.set(\n        `Showing ${this.historianResult()?.entries.length ?? 0} readings selected by the reviewed historian query.`,\n      );\n      return;\n    }\n    void this.loadReadingEntries();\n  }\n\n  protected async loadDashboard(showLoading = true): Promise\u003cvoid> {\n    if (showLoading) {\n      this.loading.set(true);\n    }\n    this.error.set(undefined);\n    try {\n      this.dashboard.set(await this.#api.getDashboard());\n      if (this.displayMode() === 'reading-log') await this.loadReadingEntries();\n      this.status.set('Live values and alarm states loaded from the facility database.');\n    } catch (error) {\n      this.error.set(this.#errorMessage(error));\n      this.status.set('The conventional facility backend is unavailable.');\n    } finally {\n      this.loading.set(false);\n    }\n  }\n\n  protected async loadAlarmApprovalAudit(): Promise\u003cvoid> {\n    try {\n      this.alarmApprovals.set((await this.#api.getAlarmApprovalAudit()).entries);\n    } catch (error) {\n      this.status.set(this.#errorMessage(error));\n    }\n  }\n\n  protected async handleAlarm(metric: MetricSummary): Promise\u003cvoid> {\n    this.busyMetricId.set(metric.id);\n    try {\n      if (!metric.activeAlarm) {\n        await this.#api.raiseAlarm(metric.id);\n        this.status.set(`Alarm raised for ${metric.name}. It is now waiting for acknowledgement.`);\n      } else if (metric.activeAlarm.state === 'raised') {\n        await this.#api.updateAlarm(metric.activeAlarm.id, 'acknowledged');\n        this.status.set(`Alarm acknowledged for ${metric.name}.`);\n      } else {\n        await this.#api.updateAlarm(metric.activeAlarm.id, 'resolved');\n        this.status.set(`Alarm resolved for ${metric.name}. The complete record remains stored.`);\n      }\n      await this.loadDashboard(false);\n    } catch (error) {\n      this.status.set(this.#errorMessage(error));\n    } finally {\n      this.busyMetricId.set(undefined);\n    }\n  }\n\n  protected async showHistory(metric: MetricSummary): Promise\u003cvoid> {\n    this.selectedMetricId.set(metric.id);\n    this.selectedHistory.set(undefined);\n    this.historyLoading.set(true);\n    try {\n      this.selectedHistory.set(await this.#api.getHistory(metric.id));\n      this.status.set(`Showing the last seven days for ${metric.name}.`);\n    } catch (error) {\n      this.status.set(this.#errorMessage(error));\n    } finally {\n      this.historyLoading.set(false);\n    }\n  }\n\n  protected closeHistory(): void {\n    this.selectedMetricId.set(undefined);\n    this.selectedHistory.set(undefined);\n  }\n\n  protected async loadReadingEntries(showLoading = true): Promise\u003cvoid> {\n    if (showLoading) this.readingsLoading.set(true);\n    try {\n      this.readingPage.set(\n        await this.#api.getReadingEntries({\n          from: this.#isoFilterDate(this.updatedFrom()),\n          to: this.#isoFilterDate(this.updatedTo()),\n          shiftManager: this.shiftManagerFilter() || undefined,\n          roomId: this.roomFilter() || undefined,\n          metricId: this.metricFilter() || undefined,\n          condition: this.conditionFilter() || undefined,\n          limit: READING_PAGE_SIZE,\n          offset: this.readingPageIndex() * READING_PAGE_SIZE,\n        }),\n      );\n    } catch (error) {\n      this.status.set(this.#errorMessage(error));\n    } finally {\n      this.readingsLoading.set(false);\n    }\n  }\n\n  protected setFilter(\n    filter: 'from' | 'to' | 'shiftManager' | 'room' | 'metric' | 'condition',\n    event: Event,\n  ): void {\n    const value = (event.target as HTMLInputElement).value;\n    const filters = {\n      from: this.updatedFrom,\n      to: this.updatedTo,\n      shiftManager: this.shiftManagerFilter,\n      room: this.roomFilter,\n      metric: this.metricFilter,\n      condition: this.conditionFilter,\n    };\n    filters[filter].set(value);\n    this.readingPageIndex.set(0);\n    void this.loadReadingEntries();\n  }\n\n  protected clearFilters(): void {\n    this.updatedFrom.set('');\n    this.updatedTo.set('');\n    this.shiftManagerFilter.set('');\n    this.roomFilter.set('');\n    this.metricFilter.set('');\n    this.conditionFilter.set('');\n    this.readingPageIndex.set(0);\n    void this.loadReadingEntries();\n  }\n\n  protected clearDateFilter(filter: 'from' | 'to'): void {\n    if (filter === 'from') {\n      this.updatedFrom.set('');\n      this.readingPageIndex.set(0);\n      void this.loadReadingEntries();\n      return;\n    }\n    this.updatedTo.set('');\n    this.readingPageIndex.set(0);\n    void this.loadReadingEntries();\n  }\n\n  protected goToReadingPage(pageIndex: number): void {\n    if (pageIndex \u003c 0 || pageIndex >= this.readingPageCount()) return;\n    this.readingPageIndex.set(pageIndex);\n    void this.loadReadingEntries();\n  }\n\n  protected metricValue(metric: MetricSummary): string {\n    if (metric.currentNumericValue !== null) {\n      return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(\n        metric.currentNumericValue,\n      );\n    }\n    return metric.currentTextValue ?? '—';\n  }\n\n  protected readingValue(reading: FacilityReadingEntry): string {\n    const value =\n      reading.numericValue === null\n        ? (reading.textValue ?? '—')\n        : new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(reading.numericValue);\n    return reading.unit ? `${value} ${reading.unit}` : value;\n  }\n\n  protected alarmLabel(metric: MetricSummary): string {\n    if (!metric.activeAlarm) return 'Raise alarm';\n    if (metric.activeAlarm.state === 'raised') return 'Acknowledge';\n    return 'Resolve';\n  }\n\n  protected alarmState(metric: MetricSummary): string {\n    return metric.activeAlarm?.state ?? 'not raised';\n  }\n\n  protected chartPoints(history: MetricHistory): string {\n    const values = history.readings\n      .map((reading, index) => ({ index, value: reading.numericValue }))\n      .filter((reading): reading is { index: number; value: number } => reading.value !== null);\n    if (values.length \u003c 2) return '';\n    const min = Math.min(...values.map((reading) => reading.value));\n    const max = Math.max(...values.map((reading) => reading.value));\n    const range = max - min || 1;\n    return values\n      .map((reading, position) => {\n        const x = 72 + (position / (values.length - 1)) * 672;\n        const y = 168 - ((reading.value - min) / range) * 144;\n        return `${x.toFixed(1)},${y.toFixed(1)}`;\n      })\n      .join(' ');\n  }\n\n  protected chartTicks(\n    history: MetricHistory,\n  ): readonly { label: string; value: number; y: number }[] {\n    const values = history.readings\n      .map((reading) => reading.numericValue)\n      .filter((value): value is number => value !== null);\n    if (values.length === 0) return [];\n    const min = Math.min(...values);\n    const max = Math.max(...values);\n    const midpoint = min + (max - min) / 2;\n    const format = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });\n    return [\n      { label: `${format.format(max)} ${history.metric.unit}`, value: max, y: 24 },\n      { label: `${format.format(midpoint)} ${history.metric.unit}`, value: midpoint, y: 96 },\n      { label: `${format.format(min)} ${history.metric.unit}`, value: min, y: 168 },\n    ];\n  }\n\n  protected historyRange(history: MetricHistory): string {\n    const values = history.readings\n      .map((reading) => reading.numericValue)\n      .filter((value): value is number => value !== null);\n    if (values.length === 0) return 'No numeric readings';\n    const format = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });\n    return `${format.format(Math.min(...values))}–${format.format(Math.max(...values))} ${history.metric.unit}`;\n  }\n\n  protected shiftManagers(history: MetricHistory): string {\n    return [...new Set(history.readings.map((reading) => reading.shiftManagerName))].join(', ');\n  }\n\n  protected stateChanges(history: MetricHistory): readonly MetricReading[] {\n    const changes: MetricReading[] = [];\n    let previous: string | null | undefined;\n    for (const reading of history.readings) {\n      if (reading.textValue !== previous) {\n        changes.push(reading);\n        previous = reading.textValue;\n      }\n    }\n    return changes.slice(-8).reverse();\n  }\n\n  protected timeLabel(timestamp: string): string {\n    return new Intl.DateTimeFormat('en-GB', {\n      hour: '2-digit',\n      minute: '2-digit',\n      day: '2-digit',\n      month: 'short',\n    }).format(new Date(timestamp));\n  }\n\n  protected alarmApprovalOutcome(entry: AlarmApprovalAuditEntry): string {\n    if (entry.outcome === 'executed') return 'Alarm raised';\n    if (entry.outcome === 'failed') return `Execution failed: ${entry.error}`;\n    return 'No alarm raised';\n  }\n\n  #alarmApprovalStatus(entry: AlarmApprovalAuditEntry): string {\n    if (entry.outcome === 'executed') {\n      return `Operator approved the proposal. Alarm raised for ${entry.metricName}.`;\n    }\n    if (entry.outcome === 'failed') {\n      return `Operator approved the proposal, but execution failed: ${entry.error}`;\n    }\n    return `Operator rejected the proposal for ${entry.metricName}. No alarm was raised.`;\n  }\n\n  #applyMetricUpdate(event: MetricUpdateEvent): void {\n    this.dashboard.update((dashboard) => {\n      if (!dashboard) return dashboard;\n      return {\n        ...dashboard,\n        generatedAt: event.metric.updatedAt,\n        rooms: dashboard.rooms.map((room) => ({\n          ...room,\n          metrics: room.metrics.map((metric) =>\n            metric.id === event.metric.id ? event.metric : metric,\n          ),\n        })),\n      };\n    });\n    this.selectedHistory.update((history) => {\n      if (!history || history.metric.id !== event.metric.id) return history;\n      const { activeAlarm: _activeAlarm, ...metric } = event.metric;\n      return {\n        metric,\n        readings: [\n          ...history.readings,\n          {\n            recordedAt: event.metric.updatedAt,\n            numericValue: event.metric.currentNumericValue,\n            textValue: event.metric.currentTextValue,\n            shiftManagerName: event.metric.shiftManagerName,\n          },\n        ],\n      };\n    });\n    this.latestUpdatedMetricId.set(event.metric.id);\n    this.status.set(`New device reading received for ${event.metric.name}.`);\n  }\n\n  #startContinuousUpdates(): void {\n    if (this.#stopMetricUpdates) return;\n    this.#stopMetricUpdates = this.#api.subscribeToMetricUpdates(\n      (event) => this.#applyMetricUpdate(event),\n      () => this.status.set('The live update stream is reconnecting…'),\n    );\n    this.continuousUpdates.set(true);\n    this.status.set('Snapshot mode is live. Waiting for the next device reading…');\n  }\n\n  #stopContinuousUpdates(): void {\n    this.#stopMetricUpdates?.();\n    this.#stopMetricUpdates = undefined;\n    this.continuousUpdates.set(false);\n    this.latestUpdatedMetricId.set(undefined);\n    this.status.set('Reading log mode. Live snapshot updates are paused.');\n  }\n\n  #errorMessage(error: unknown): string {\n    return error instanceof Error ? error.message : 'Unexpected facility application error.';\n  }\n\n  #isoFilterDate(value: string): string | undefined {\n    if (!value) return undefined;\n    const timestamp = Date.parse(value);\n    return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();\n  }\n\n  protected closeHistorianResult(): void {\n    this.setDisplayMode('reading-log');\n  }\n}\n",
          diff: "@@ -22,7 +22,7 @@ import {\n } from '@packt-workshop/contracts';\n import { connectWorkshop } from './workshop/connect';\n import { AlarmApprovalEvents } from './alarm-approval-events';\n-import { BasicChatComponent } from './basic-chat/basic-chat.component';\n+import { ChatComponent } from './chat/chat.component';\n import { FacilityApi } from './facility-api';\n \n type DisplayMode = 'snapshot' | 'reading-log' | 'historian-result' | 'a2ui-result';\n@@ -30,7 +30,7 @@ const READING_PAGE_SIZE = 50;\n \n @Component({\n   selector: 'app-root',\n-  imports: [BasicChatComponent, CopilotA2UIActivityRenderer],\n+  imports: [ChatComponent, CopilotA2UIActivityRenderer],\n   templateUrl: './app.html',\n   styleUrl: './app.scss',\n })\n",
        },
        {
          path: "apps/angular-host/src/app/app.html",
          after:
            '\u003cmain>\n  \u003cheader class="page-header">\n    \u003cdiv class="brand-lockup">\n      \u003ca\n        class="corporate-logo-link"\n        href="https://soverius.ai/"\n        target="_blank"\n        rel="noopener noreferrer"\n        aria-label="Visit the Soverius AI website"\n      >\n        \u003cimg class="corporate-logo" src="/soverius-ai-original.png" alt="Soverius AI" />\n      \u003c/a>\n      \u003cdiv class="brand-copy">\n        \u003cp class="eyebrow">Soverius Chocolate operations\u003c/p>\n        \u003ch1 class="product-title">Incident Management\u003c/h1>\n        \u003cp class="subtitle">\n          Persistent factory telemetry, historical readings, and operator-managed alarms.\n        \u003c/p>\n        \u003cp class="stage-label">Factory operations\u003c/p>\n      \u003c/div>\n    \u003c/div>\n    \u003cdiv class="header-actions">\n      \u003cspan class="database-state">SQLite connected\u003c/span>\n      \u003cspan class="mode-state" [class.mode-state-live]="displayMode() === \'snapshot\'">\n        \u003cspan aria-hidden="true">\u003c/span>\n        @switch (displayMode()) {\n          @case (\'snapshot\') {\n            Snapshot live\n          }\n          @case (\'reading-log\') {\n            Reading log\n          }\n          @case (\'a2ui-result\') {\n            Generated view\n          }\n          @case (\'historian-result\') {\n            Historian result\n          }\n        }\n      \u003c/span>\n      \u003cspan class="alarm-summary" [class.has-alarms]="activeAlarmCount() > 0">\n        {{ activeAlarmCount() }} active {{ activeAlarmCount() === 1 ? \'alarm\' : \'alarms\' }}\n      \u003c/span>\n      \u003cbutton class="secondary-button" type="button" (click)="loadDashboard()">Refresh\u003c/button>\n    \u003c/div>\n  \u003c/header>\n\n  @if (loading()) {\n    \u003csection class="message-card" aria-live="polite">\n      \u003ch2>Loading facility data\u003c/h2>\n      \u003cp>Reading rooms, metrics, alarms, and the latest measurements from SQLite…\u003c/p>\n    \u003c/section>\n  } @else if (error() && !dashboard()) {\n    \u003csection class="message-card error-card" role="alert">\n      \u003ch2>Facility backend unavailable\u003c/h2>\n      \u003cp>{{ error() }}\u003c/p>\n      \u003cbutton type="button" (click)="loadDashboard()">Try again\u003c/button>\n    \u003c/section>\n  } @else {\n    \u003cdiv class="workspace-grid">\n      \u003csection class="site-overview" aria-labelledby="rooms-title">\n        \u003cdiv class="section-heading">\n          \u003cdiv>\n            \u003cp class="eyebrow">Factory floor\u003c/p>\n            \u003ch2 id="rooms-title">Rooms and production metrics\u003c/h2>\n          \u003c/div>\n          \u003cp>Every reading and alarm is served by the conventional facility backend.\u003c/p>\n        \u003c/div>\n\n        \u003cdiv\n          class="mode-switch"\n          [class.has-historian-result]="historianResult() || a2uiActivity()"\n          role="tablist"\n          aria-label="Reading display mode"\n        >\n          \u003cbutton\n            type="button"\n            role="tab"\n            [attr.aria-selected]="displayMode() === \'snapshot\'"\n            [class.active]="displayMode() === \'snapshot\'"\n            (click)="setDisplayMode(\'snapshot\')"\n          >\n            Snapshot\n            \u003csmall>Latest value per metric · live\u003c/small>\n          \u003c/button>\n          \u003cbutton\n            type="button"\n            role="tab"\n            [attr.aria-selected]="displayMode() === \'reading-log\'"\n            [class.active]="displayMode() === \'reading-log\'"\n            (click)="setDisplayMode(\'reading-log\')"\n          >\n            Reading log\n            \u003csmall>Historical readings · filterable\u003c/small>\n          \u003c/button>\n          @if (a2uiActivity()) {\n            \u003cbutton\n              type="button"\n              role="tab"\n              [attr.aria-selected]="displayMode() === \'a2ui-result\'"\n              [class.active]="displayMode() === \'a2ui-result\'"\n              (click)="setDisplayMode(\'a2ui-result\')"\n            >\n              Generated view \u003csmall>Tables, cards and text\u003c/small>\n            \u003c/button>\n          }\n          @if (historianResult()) {\n            \u003cbutton\n              type="button"\n              role="tab"\n              [attr.aria-selected]="displayMode() === \'historian-result\'"\n              [class.active]="displayMode() === \'historian-result\'"\n              (click)="setDisplayMode(\'historian-result\')"\n            >\n              Historian result\n              \u003csmall>Reviewed SQL selection\u003c/small>\n            \u003c/button>\n          }\n        \u003c/div>\n\n        \u003csection class="room" aria-labelledby="rooms-title">\n          @if (displayMode() === \'a2ui-result\') {\n            \u003cdiv class="generated-results">\n              @if (resultAgent(); as agent) {\n                @for (activity of a2uiActivities(); track activity.id) {\n                  \u003ccopilot-a2ui-activity-renderer\n                    [activityType]="activity.activityType"\n                    [content]="activity.content"\n                    [message]="activity"\n                    [agent]="agent"\n                  />\n                }\n              }\n            \u003c/div>\n          } @else if (displayMode() !== \'snapshot\') {\n            @if (displayMode() === \'historian-result\' && historianResult(); as result) {\n              \u003csection class="filter-panel" aria-label="Historian query result">\n                \u003cdiv class="filter-heading">\n                  \u003cdiv>\n                    \u003cp class="eyebrow">Historian query result\u003c/p>\n                    \u003cstrong>{{ result.question }}\u003c/strong>\n                  \u003c/div>\n                  \u003cbutton class="secondary-button" type="button" (click)="closeHistorianResult()">\n                    Return to reading log\n                  \u003c/button>\n                \u003c/div>\n                \u003csmall>\n                  {{ result.entries.length }} complete reading\n                  {{ result.entries.length === 1 ? \'record\' : \'records\' }} selected by the reviewed\n                  SQL{{ result.truncated ? \' (result truncated)\' : \'\' }}.\n                \u003c/small>\n              \u003c/section>\n            } @else {\n              \u003csection class="filter-panel" aria-label="Filter persisted readings">\n                \u003cdiv class="filter-heading">\n                  \u003cdiv>\n                    \u003cp class="eyebrow">Historical reading filters\u003c/p>\n                    \u003cstrong>\n                      Showing {{ readingPageStart() }}–{{ readingPageEnd() }} of\n                      {{ displayedReadingPage()?.total ?? 0 }} readings\n                    \u003c/strong>\n                  \u003c/div>\n                  \u003cbutton class="secondary-button" type="button" (click)="clearFilters()">\n                    Clear filters\n                  \u003c/button>\n                \u003c/div>\n                \u003cdiv class="filter-grid">\n                  \u003clabel>\n                    \u003cspan>Updated from\u003c/span>\n                    \u003cspan class="date-filter-control">\n                      \u003cinput\n                        type="datetime-local"\n                        [value]="updatedFrom()"\n                        (input)="setFilter(\'from\', $event)"\n                      />\n                      \u003cbutton\n                        class="date-clear-button"\n                        type="button"\n                        [disabled]="!updatedFrom()"\n                        aria-label="Clear updated from"\n                        (click)="clearDateFilter(\'from\')"\n                      >\n                        Clear\n                      \u003c/button>\n                    \u003c/span>\n                  \u003c/label>\n                  \u003clabel>\n                    \u003cspan>Updated to\u003c/span>\n                    \u003cspan class="date-filter-control">\n                      \u003cinput\n                        type="datetime-local"\n                        [value]="updatedTo()"\n                        (input)="setFilter(\'to\', $event)"\n                      />\n                      \u003cbutton\n                        class="date-clear-button"\n                        type="button"\n                        [disabled]="!updatedTo()"\n                        aria-label="Clear updated to"\n                        (click)="clearDateFilter(\'to\')"\n                      >\n                        Clear\n                      \u003c/button>\n                    \u003c/span>\n                  \u003c/label>\n                  \u003clabel>\n                    \u003cspan>Shift manager\u003c/span>\n                    \u003cselect\n                      [value]="shiftManagerFilter()"\n                      (change)="setFilter(\'shiftManager\', $event)"\n                    >\n                      \u003coption value="" [selected]="!shiftManagerFilter()">\n                        All shift managers\n                      \u003c/option>\n                      @for (manager of shiftManagerOptions(); track manager) {\n                        \u003coption [value]="manager" [selected]="shiftManagerFilter() === manager">\n                          {{ manager }}\n                        \u003c/option>\n                      }\n                    \u003c/select>\n                  \u003c/label>\n                  \u003clabel>\n                    \u003cspan>Room\u003c/span>\n                    \u003cselect [value]="roomFilter()" (change)="setFilter(\'room\', $event)">\n                      \u003coption value="" [selected]="!roomFilter()">All rooms\u003c/option>\n                      @for (room of rooms(); track room.id) {\n                        \u003coption [value]="room.id" [selected]="roomFilter() === room.id">\n                          {{ room.name }}\n                        \u003c/option>\n                      }\n                    \u003c/select>\n                  \u003c/label>\n                  \u003clabel>\n                    \u003cspan>Metric\u003c/span>\n                    \u003cselect [value]="metricFilter()" (change)="setFilter(\'metric\', $event)">\n                      \u003coption value="" [selected]="!metricFilter()">All metrics\u003c/option>\n                      @for (metric of metricOptions(); track metric.id) {\n                        \u003coption [value]="metric.id" [selected]="metricFilter() === metric.id">\n                          {{ metric.label }}\n                        \u003c/option>\n                      }\n                    \u003c/select>\n                  \u003c/label>\n                  \u003clabel>\n                    \u003cspan>Condition\u003c/span>\n                    \u003cselect [value]="conditionFilter()" (change)="setFilter(\'condition\', $event)">\n                      \u003coption value="" [selected]="!conditionFilter()">All conditions\u003c/option>\n                      \u003coption value="normal" [selected]="conditionFilter() === \'normal\'">\n                        Normal\n                      \u003c/option>\n                      \u003coption value="warning" [selected]="conditionFilter() === \'warning\'">\n                        Warning\n                      \u003c/option>\n                      \u003coption value="critical" [selected]="conditionFilter() === \'critical\'">\n                        Critical\n                      \u003c/option>\n                      \u003coption value="unavailable" [selected]="conditionFilter() === \'unavailable\'">\n                        Unavailable\n                      \u003c/option>\n                    \u003c/select>\n                  \u003c/label>\n                \u003c/div>\n              \u003c/section>\n            }\n            \u003cdiv class="table-shell" tabindex="0" aria-label="Historical readings table">\n              \u003ctable class="reading-entries-table">\n                \u003ccaption>\n                  {{\n                    displayMode() === \'historian-result\'\n                      ? \'Stored readings selected by the reviewed historian query\'\n                      : \'Persisted metric readings matching the historical filters\'\n                  }}\n                \u003c/caption>\n                \u003cthead>\n                  \u003ctr>\n                    \u003cth scope="col">Date and time\u003c/th>\n                    \u003cth scope="col">Shift manager\u003c/th>\n                    \u003cth scope="col">Room\u003c/th>\n                    \u003cth scope="col">Metric\u003c/th>\n                    \u003cth scope="col">Value\u003c/th>\n                    \u003cth scope="col">Condition\u003c/th>\n                  \u003c/tr>\n                \u003c/thead>\n                \u003ctbody>\n                  @if (readingsLoading() && displayMode() !== \'historian-result\') {\n                    \u003ctr>\n                      \u003ctd class="empty-table" colspan="6">Loading persisted readings…\u003c/td>\n                    \u003c/tr>\n                  } @else {\n                    @for (entry of displayedReadingPage()?.entries ?? []; track entry.id) {\n                      \u003ctr class="condition-{{ entry.condition }}">\n                        \u003ctd>\n                          \u003ctime [attr.datetime]="entry.recordedAt">{{\n                            timeLabel(entry.recordedAt)\n                          }}\u003c/time>\n                        \u003c/td>\n                        \u003ctd class="shift-manager">{{ entry.shiftManagerName }}\u003c/td>\n                        \u003ctd class="room-cell">\n                          \u003cstrong>{{ entry.roomName }}\u003c/strong>\n                        \u003c/td>\n                        \u003cth class="metric-cell" scope="row">\n                          {{ entry.metricName }}\n                        \u003c/th>\n                        \u003ctd class="reading-entry-value">{{ readingValue(entry) }}\u003c/td>\n                        \u003ctd>\n                          \u003cspan class="condition-badge">{{ entry.condition }}\u003c/span>\n                        \u003c/td>\n                      \u003c/tr>\n                    } @empty {\n                      \u003ctr>\n                        \u003ctd class="empty-table" colspan="6">\n                          No persisted readings match these filters.\n                        \u003c/td>\n                      \u003c/tr>\n                    }\n                  }\n                \u003c/tbody>\n              \u003c/table>\n            \u003c/div>\n            @if (displayMode() === \'reading-log\') {\n              \u003cnav class="pagination" aria-label="Reading log pagination">\n                \u003cbutton\n                  class="secondary-button"\n                  type="button"\n                  [disabled]="readingPageIndex() === 0 || readingsLoading()"\n                  (click)="goToReadingPage(readingPageIndex() - 1)"\n                >\n                  Previous\n                \u003c/button>\n                \u003cspan>\n                  Page \u003cstrong>{{ readingPageIndex() + 1 }}\u003c/strong> of\n                  \u003cstrong>{{ readingPageCount() }}\u003c/strong>\n                \u003c/span>\n                \u003cbutton\n                  class="secondary-button"\n                  type="button"\n                  [disabled]="readingPageIndex() + 1 >= readingPageCount() || readingsLoading()"\n                  (click)="goToReadingPage(readingPageIndex() + 1)"\n                >\n                  Next\n                \u003c/button>\n              \u003c/nav>\n            }\n          } @else {\n            \u003cdiv class="current-table-heading">\n              \u003cdiv>\n                \u003cp class="eyebrow">Live overview\u003c/p>\n                \u003ch3>Current reading per metric\u003c/h3>\n              \u003c/div>\n              \u003cspan>{{ currentRows().length }} metrics\u003c/span>\n            \u003c/div>\n            \u003cdiv class="table-shell" tabindex="0" aria-label="Factory metrics table">\n              \u003ctable class="metrics-table">\n                \u003ccaption>\n                  Current readings, configured targets, history, and alarms for all factory rooms\n                \u003c/caption>\n                \u003cthead>\n                  \u003ctr>\n                    \u003cth scope="col">Room\u003c/th>\n                    \u003cth scope="col">Metric\u003c/th>\n                    \u003cth scope="col">Current\u003c/th>\n                    \u003cth scope="col">Shift manager\u003c/th>\n                    \u003cth scope="col">Trend\u003c/th>\n                    \u003cth scope="col">Condition\u003c/th>\n                    \u003cth scope="col">Normal range\u003c/th>\n                    \u003cth scope="col">History\u003c/th>\n                    \u003cth scope="col">Alarm workflow\u003c/th>\n                  \u003c/tr>\n                \u003c/thead>\n                \u003ctbody>\n                  @for (row of currentRows(); track row.metric.id) {\n                    \u003ctr\n                      class="condition-{{ row.metric.condition }}"\n                      [class.alarm-active]="row.metric.activeAlarm"\n                      [class.live-updated]="latestUpdatedMetricId() === row.metric.id"\n                      [attr.data-metric-id]="row.metric.id"\n                    >\n                      \u003ctd class="room-cell">\n                        \u003cstrong>{{ row.room.name }}\u003c/strong>\n                      \u003c/td>\n                      \u003cth class="metric-cell" scope="row">\n                        {{ row.metric.name }}\n                      \u003c/th>\n                      \u003ctd class="reading">\n                        \u003cstrong>{{ metricValue(row.metric) }}\u003c/strong>\n                        @if (row.metric.unit) {\n                          \u003cspan>{{ row.metric.unit }}\u003c/span>\n                        }\n                        \u003csmall>{{ timeLabel(row.metric.updatedAt) }}\u003c/small>\n                      \u003c/td>\n                      \u003ctd class="shift-manager">{{ row.metric.shiftManagerName }}\u003c/td>\n                      \u003ctd class="trend">{{ row.metric.trend }}\u003c/td>\n                      \u003ctd>\n                        \u003cspan class="condition-badge">{{ row.metric.condition }}\u003c/span>\n                      \u003c/td>\n                      \u003ctd class="target">{{ row.metric.target }}\u003c/td>\n                      \u003ctd>\n                        \u003cbutton\n                          class="history-button"\n                          type="button"\n                          (click)="showHistory(row.metric)"\n                        >\n                          View 7d\n                        \u003c/button>\n                      \u003c/td>\n                      \u003ctd>\n                        \u003cdiv class="alarm-action">\n                          \u003cspan>{{ alarmState(row.metric) }}\u003c/span>\n                          \u003cbutton\n                            type="button"\n                            (click)="handleAlarm(row.metric)"\n                            [disabled]="busyMetricId() === row.metric.id"\n                            [attr.aria-label]="alarmLabel(row.metric) + \' for \' + row.metric.name"\n                          >\n                            {{\n                              busyMetricId() === row.metric.id ? \'Saving…\' : alarmLabel(row.metric)\n                            }}\n                          \u003c/button>\n                        \u003c/div>\n                      \u003c/td>\n                    \u003c/tr>\n                  }\n                \u003c/tbody>\n              \u003c/table>\n            \u003c/div>\n          }\n        \u003c/section>\n      \u003c/section>\n\n      \u003capp-chat />\n    \u003c/div>\n  }\n\n  \u003cp class="status" role="status">{{ status() }}\u003c/p>\n\n  \u003csection class="audit-panel" aria-labelledby="alarm-audit-title">\n    \u003cdiv class="history-heading">\n      \u003cdiv>\n        \u003cp class="eyebrow">Accountability record\u003c/p>\n        \u003ch2 id="alarm-audit-title">Alarm decision audit\u003c/h2>\n      \u003c/div>\n      \u003cbutton class="secondary-button" type="button" (click)="loadAlarmApprovalAudit()">\n        Refresh audit\n      \u003c/button>\n    \u003c/div>\n    @if (alarmApprovals().length) {\n      \u003cdiv class="table-shell" tabindex="0" aria-label="Alarm approval audit table">\n        \u003ctable class="audit-table">\n          \u003ccaption>\n            Human decisions on alarm proposals and their actual execution outcomes\n          \u003c/caption>\n          \u003cthead>\n            \u003ctr>\n              \u003cth scope="col">Decision time\u003c/th>\n              \u003cth scope="col">Metric\u003c/th>\n              \u003cth scope="col">Operator\u003c/th>\n              \u003cth scope="col">Decision\u003c/th>\n              \u003cth scope="col">Outcome\u003c/th>\n              \u003cth scope="col">Correlation ID\u003c/th>\n            \u003c/tr>\n          \u003c/thead>\n          \u003ctbody>\n            @for (entry of alarmApprovals(); track entry.correlationId) {\n              \u003ctr>\n                \u003ctd>\n                  \u003ctime [attr.datetime]="entry.decidedAt">{{ timeLabel(entry.decidedAt) }}\u003c/time>\n                \u003c/td>\n                \u003cth scope="row">{{ entry.metricName }}\u003c/th>\n                \u003ctd>{{ entry.operatorId }}\u003c/td>\n                \u003ctd>\n                  \u003cspan class="audit-decision">{{ entry.decision }}\u003c/span>\n                \u003c/td>\n                \u003ctd>{{ alarmApprovalOutcome(entry) }}\u003c/td>\n                \u003ctd>\n                  \u003ccode>{{ entry.correlationId }}\u003c/code>\n                \u003c/td>\n              \u003c/tr>\n            }\n          \u003c/tbody>\n        \u003c/table>\n      \u003c/div>\n    } @else {\n      \u003cp>No agent-proposed alarm decision has been recorded yet.\u003c/p>\n    }\n  \u003c/section>\n\n  @if (selectedMetricId()) {\n    \u003csection class="history-panel" aria-labelledby="history-title">\n      \u003cdiv class="history-heading">\n        \u003cdiv>\n          \u003cp class="eyebrow">Database history · last seven days\u003c/p>\n          \u003ch2 id="history-title">{{ selectedHistory()?.metric?.name ?? \'Loading history…\' }}\u003c/h2>\n        \u003c/div>\n        \u003cbutton class="secondary-button" type="button" (click)="closeHistory()">Close\u003c/button>\n      \u003c/div>\n\n      @if (historyLoading()) {\n        \u003cp>Loading historical readings…\u003c/p>\n      } @else if (selectedHistory(); as history) {\n        @if (history.metric.kind === \'numeric\') {\n          \u003cdiv class="chart-summary">\n            \u003cstrong>{{ historyRange(history) }}\u003c/strong>\n            \u003cspan>{{ history.readings.length }} persisted readings\u003c/span>\n            \u003cspan>Shift managers: {{ shiftManagers(history) }}\u003c/span>\n          \u003c/div>\n          \u003csvg\n            class="history-chart"\n            viewBox="0 0 760 188"\n            role="img"\n            [attr.aria-label]="\'Seven-day history for \' + history.metric.name"\n          >\n            @for (tick of chartTicks(history); track tick.y) {\n              \u003cline\n                class="chart-grid-line"\n                x1="72"\n                [attr.y1]="tick.y"\n                x2="744"\n                [attr.y2]="tick.y"\n              />\n              \u003ctext\n                class="y-axis-label"\n                x="64"\n                [attr.y]="tick.y"\n                text-anchor="end"\n                dominant-baseline="middle"\n              >\n                {{ tick.label }}\n              \u003c/text>\n            }\n            \u003cline class="chart-axis" x1="72" y1="24" x2="72" y2="168" />\n            \u003cpolyline [attr.points]="chartPoints(history)" />\n          \u003c/svg>\n        } @else {\n          \u003col class="state-timeline">\n            @for (reading of stateChanges(history); track reading.recordedAt) {\n              \u003cli>\n                \u003ctime [attr.datetime]="reading.recordedAt">{{\n                  timeLabel(reading.recordedAt)\n                }}\u003c/time>\n                \u003cstrong>{{ reading.textValue }}\u003c/strong>\n                \u003cspan>{{ reading.shiftManagerName }}\u003c/span>\n              \u003c/li>\n            }\n          \u003c/ol>\n        }\n      }\n    \u003c/section>\n  }\n\u003c/main>\n',
          diff: "@@ -427,7 +427,7 @@\n         \u003c/section>\n       \u003c/section>\n \n-      \u003capp-basic-chat />\n+      \u003capp-chat />\n     \u003c/div>\n   }\n \n",
        },
      ],
      flow: ["CopilotChat", "Copilot runtime", "BuiltInAgent", "Model"],
    },
    {
      id: "04",
      name: "Mastra agent",
      source: "workshop/speaker-notes/04-mastra.md",
      intro:
        "**Start:** completed 03. **Completed code:** [solution 04](../solutions/04/).\n\n**Demo inputs:** Follow the numbered prompts for milestone 04 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 03. **Completed code:** [solution 04](../solutions/04/).\n\n**Demo inputs:** Follow the numbered prompts for milestone 04 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“The Angular chat can remain as it is. We are changing the agent behind the runtime\nand adding a place to inspect its execution.”\n\nShow the route: Angular :4200 → facility runtime :3101 → Mastra :4211 → model.",
        },
        {
          label: "DO",
          title: "Open and change · 1",
          body: "`apps/agent-service/src/mastra/agents/main/agent.ts`: show `new Agent`, the\n   `default` ID, prepared `main-04` prompt, injected model configuration, and empty\n   `tools`. This agent factory already exists in the starter; type a small part\n   if useful or explain it directly.",
        },
        {
          label: "DO",
          title: "Open and change · 2",
          body: "`apps/agent-service/src/mastra/index.ts`: show agent registration, storage and\n   observability. Environment/model resolution lives here. Prepared historian\n   code is not registered as a Studio workflow until milestone 06.",
        },
        {
          label: "DO",
          title: "Open and change · 3",
          body: "Start `pnpm dev:mastra` and `pnpm dev:studio` in separate terminals. Open\n   http://localhost:4212 and check that the default agent appears. Studio connects\n   to the API at 4211. Skip startup if `pnpm dev:all` is already running. Saving\n   agent code reloads Mastra automatically; wait until ready, then refresh Studio.\n   Do not display the API key.",
        },
        {
          label: "DO",
          title: "Open and change · 4",
          body: "`apps/facility-service/src/workshop.ts`: switch the import and call from\n   `createEmbeddedCopilotRuntime` to `createWorkshopCopilotRuntime`.",
        },
        {
          label: "DO",
          title: "Open and change · 5",
          body: "Open `copilot-runtime.ts`: show the remote Mastra agent and AG-UI bridge. Explain\n   that its CommonJS compatibility loading is prepared setup, not the teaching goal.",
        },
        {
          label: "DO",
          title: "Open and change · 6",
          body: "Restart `pnpm dev` (or your `pnpm dev:backend` / `pnpm dev:all` launcher) and reload the browser. No Angular file changes are needed.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate",
          body: "From the application ask: **In one sentence, why is humidity relevant in a chocolate factory?**\n\nIn Studio's observability/traces view find the run from that app request. Show\ninput, model call, output, and timing. Distinguish execution tracing from the\ndecision audit introduced later. Ask a live-reading question again: still no data tool.",
        },
        {
          label: "TRANSITION",
          title: "Transition",
          body: "“We can see the run, but the agent still cannot operate the application. Next we\ngive it specific frontend capabilities.”",
        },
      ],
      prompts: [
        {
          title: "Follow one request into Mastra",
          prompt:
            "In one sentence, why is humidity relevant in a chocolate factory?",
          before:
            "Complete milestone 04. Start Mastra, restart the facility service, reload the app and use a fresh conversation. Start `pnpm dev:studio` and open Studio on port 4212.",
          expected:
            "A short general answer in the app, with the corresponding run visible in Mastra Studio.",
          inspect:
            "Find this exact question in the trace. Walk from the Angular chat through the runtime bridge to the main agent.",
          optional: false,
        },
        {
          title: "An agent still needs data access",
          prompt: "What is the current air temperature in our Cooling room?",
          before:
            "Stay in milestone 04. Do not provide a temperature in the conversation.",
          expected:
            "Moving the agent to Mastra does not give it readings. It should explain the missing access.",
          inspect:
            "Show the tool-free agent factory before introducing frontend tools.",
          optional: true,
        },
      ],
      recovery:
        "Select 04, restart the backend launcher, wait for Mastra to reload, and refresh\nthe app and Studio. Confirm API port 4211, Studio port 4212 and\nthe bridge URL before investigating model behavior. A direct Studio conversation\ndoes not have the app's browser tools; use the app for subsequent demonstrations.",
      files: [
        {
          path: "apps/facility-service/src/workshop.ts",
          after:
            'import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\nimport { createWorkshopCopilotRuntime } from "./copilot-runtime.js";\n\nexport function createWorkshopConnections(\n  options: WorkshopOptions,\n): WorkshopConnections {\n  return {\n    chat: undefined,\n    copilotRuntime: createWorkshopCopilotRuntime(options),\n  };\n}\n\nexport { HistorianQueryService } from "./historian-query-legacy.js";\n',
          diff: '@@ -1,12 +1,12 @@\n import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\n-import { createEmbeddedCopilotRuntime } from "./embedded-copilot-runtime.js";\n+import { createWorkshopCopilotRuntime } from "./copilot-runtime.js";\n \n export function createWorkshopConnections(\n   options: WorkshopOptions,\n ): WorkshopConnections {\n   return {\n     chat: undefined,\n-    copilotRuntime: createEmbeddedCopilotRuntime(options),\n+    copilotRuntime: createWorkshopCopilotRuntime(options),\n   };\n }\n \n',
        },
      ],
      flow: ["CopilotChat", "Copilot runtime", "Mastra agent", "Model"],
    },
    {
      id: "05",
      name: "Frontend tools",
      source: "workshop/speaker-notes/05-frontend-tools.md",
      intro:
        "**Start:** completed 04. **Completed code:** [solution 05](../solutions/05/).\n\n**Demo inputs:** Follow the numbered prompts for milestone 05 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 04. **Completed code:** [solution 05](../solutions/05/).\n\n**Demo inputs:** Follow the numbered prompts for milestone 05 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“The model chooses a named operation with structured arguments. Angular applies\nthat operation to its existing state. We expose a small view description and\ndiscovery tools, not the entire application or its database.”",
        },
        {
          label: "DO",
          title: "Open and change · 1",
          body: "`apps/angular-host/src/app/workshop/connect.ts`: add `connectViewContext(host)`\n   and `registerFacilityTools(host)` with their prepared imports.",
        },
        {
          label: "DO",
          title: "Open and change · 2",
          body: "Open `workshop/prepared-tools.ts`: explain `connectAgentContext`, then one\n   discovery tool (`list_rooms`) and one action (`update_filters`). There are four\n   catalog tools and three view/filter tools; do not type all seven registrations.",
        },
        {
          label: "DO",
          title: "Open and change · 3",
          body: "Point to the schema, description, `agentId`, validation, and handler. The\n   handler reaches the existing `configureFacilityView` operation through the\n   prepared host adapter. The call executes in Angular's injection context.",
        },
        {
          label: "DO",
          title: "Open and change · 4",
          body: "In `apps/agent-service/src/mastra/agents/main/agent.ts`, change the prompt import\n   from `main-04` to `main-05`. Keep backend `tools: {}`: these tools come from the\n   browser, not the Mastra server tool list.",
        },
        {
          label: "DO",
          title: "Open and change · 5",
          body: "Wait for Mastra to reload automatically, then reload the browser. Keep `pnpm dev` running.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate",
          body: "Ask: **Which rooms and shift managers can I filter by?** Inspect discovery calls.\n\nThen: **Switch to the reading log and show only warnings from the Cooling room managed by Charles Bond.**\n\nExpected: Reading log, room, condition and manager reflect the request.\n\nThen: **Change the start date to now.**\n\nBefore sending, say which values should stay the same. Afterward, inspect all\nfilters: only the start boundary changes. A temporarily empty log is reasonable\nbecause the range starts now. Clear the start date and show the prior filters remain.\n\nExplain omitted fields versus explicit clearing. For a code-level explanation,\nopen `applyFacilityViewCommand` in `packages/contracts/src/index.ts`; that is the\nprepared patch behavior behind the visible controls. IDs must now match the\nvalues returned by discovery exactly; there is no fuzzy name-to-ID conversion.\nNatural-language room names are fine in chat because the agent first discovers IDs.",
        },
        {
          label: "TRANSITION",
          title: "Transition",
          body: "“These tools can operate existing filters. A question such as maximum temperature\nper manager needs a different data capability.”",
        },
      ],
      prompts: [
        {
          title: "Discover valid application options",
          prompt: "Which rooms and shift managers can I filter by?",
          before:
            "Complete milestone 05, wait for Mastra to reload automatically, refresh the app and start a fresh conversation. Clear filters manually.",
          expected:
            "Room and manager names come from discovery tools rather than guesses.",
          inspect:
            "Inspect list_rooms and list_shift_managers calls and compare their returned options with the conventional controls. The handler now requires exact discovered IDs; it does not repair guessed spellings.",
          optional: false,
        },
        {
          title: "Repeat the previously impossible request",
          prompt: "Show only warnings from the Cooling room.",
          before: "Continue after discovery with empty filters.",
          expected:
            "The room and condition filters change. An empty grid is valid if the current data contains no matching readings.",
          inspect:
            "Compare with milestone 03. Inspect discovery as needed and update_filters; the Angular handler performs the state change.",
          optional: false,
        },
        {
          title: "Change view and combine filters",
          prompt:
            "Switch to the reading log and show only warnings from the Cooling room managed by Charles Bond.",
          before:
            "Continue in the same conversation. Leave date boundaries empty.",
          expected:
            "The reading log opens with the requested room, condition and manager selected. The number of rows depends on recorded data.",
          inspect:
            "Show set_view and update_filters, then point to the corresponding controls.",
          optional: false,
        },
        {
          title: "Patch one field",
          prompt: "Change the start date to now.",
          before:
            "Keep the room, condition and manager from the previous prompt.",
          expected:
            "The start boundary changes; the existing room, condition and manager remain. Few or no rows immediately after now are expected.",
          inspect:
            "Point to the browser-resolved start time and unchanged filters. Explain omitted fields versus changed fields.",
          optional: false,
        },
        {
          title: "Clear one field",
          prompt:
            "Clear only the start date. Keep all other filters as they are.",
          before: "Continue immediately after setting the start date.",
          expected:
            "Only the start boundary is cleared; room, condition and manager remain selected.",
          inspect:
            "Inspect the null boundary in update_filters and compare all other filter controls.",
          optional: false,
        },
        {
          title: "Clarify an ambiguous request",
          prompt: "Change the date to now.",
          before:
            "Ensure both date boundaries are empty. Keep the other filters selected.",
          expected:
            "The assistant should ask whether you mean the start or end date. Answer: The end date.",
          inspect:
            "Explain why the model needs clarification before choosing a boundary. Verify unrelated filters survive.",
          optional: true,
        },
        {
          title: "Reset the demonstration",
          prompt: "Clear all filters and switch to the snapshot view.",
          before:
            "Run after the filter sequence, including any optional prompt.",
          expected: "All filter values clear and the snapshot view opens.",
          inspect:
            "Show clear_filters and set_view. This prepares a clean visible state for the next chapter.",
          optional: false,
        },
      ],
      recovery:
        "Select 05 and wait for Mastra to reload, then refresh the app and Studio. Restart\nthe backend launcher only if its presenter file changed. If the model guesses an option, ask for discovery\nfirst and inspect the returned IDs. If filters unexpectedly disappear, inspect\nthe patch arguments and handler before changing the model prompt.",
      files: [
        {
          path: "apps/angular-host/src/app/workshop/connect.ts",
          after:
            "import type { WorkshopHost } from './host';\nimport { connectViewContext, registerFacilityTools } from './prepared-tools';\n\nexport function connectWorkshop(host: WorkshopHost): void {\n  connectViewContext(host);\n  registerFacilityTools(host);\n}\n",
          diff: "@@ -1,5 +1,7 @@\n import type { WorkshopHost } from './host';\n+import { connectViewContext, registerFacilityTools } from './prepared-tools';\n \n-export function connectWorkshop(_host: WorkshopHost): void {\n-  // Milestone 5: connect view context and frontend tools here.\n+export function connectWorkshop(host: WorkshopHost): void {\n+  connectViewContext(host);\n+  registerFacilityTools(host);\n }\n",
        },
        {
          path: "apps/agent-service/src/mastra/agents/main/agent.ts",
          after:
            'import { createOpenAI } from "@ai-sdk/openai";\nimport { Agent } from "@mastra/core/agent";\nimport type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\nimport { CHAT_SYSTEM_PROMPT } from "../../prompts/main-05";\n\nexport const historianEnabled = false;\nexport function createMainAgent(\n  apiKey: string,\n  model: string,\n  workflow: ReturnType\u003ctypeof createHistorianQueryWorkflow>,\n) {\n  const openrouter = createOpenAI({\n    apiKey,\n    baseURL: "https://openrouter.ai/api/v1",\n  });\n  return new Agent({\n    id: "default",\n    name: "Soverius Chocolate Factory Assistant",\n    instructions: CHAT_SYSTEM_PROMPT,\n    model: openrouter(model),\n    tools: {},\n  });\n}\n\nexport { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\n',
          diff: '@@ -1,7 +1,7 @@\n import { createOpenAI } from "@ai-sdk/openai";\n import { Agent } from "@mastra/core/agent";\n import type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\n-import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-04";\n+import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-05";\n \n export const historianEnabled = false;\n export function createMainAgent(\n',
        },
      ],
      flow: ["Agent tool call", "AG-UI", "Angular handler", "View state"],
    },
    {
      id: "06",
      name: "Reviewed historian workflow",
      source: "workshop/speaker-notes/06-historian.md",
      intro:
        "**Start:** completed 05. **Completed code:** [solution 06](../solutions/06/).\n\n**Demo inputs:** Follow the numbered prompts for milestone 06 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 05. **Completed code:** [solution 06](../solutions/06/).\n\n**Demo inputs:** Follow the numbered prompts for milestone 06 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“The agent gets one narrow question tool. A workflow generates a SQL proposal,\nreviews its meaning, and asks the facility service to validate and execute it.\nThe result still has to fit our prepared reading table.”",
        },
        {
          label: "DO",
          title: "Open and change · 1",
          body: "`apps/agent-service/src/mastra/agents/main/agent.ts`: select `main-06`, set\n   `historianEnabled = true`, import `createQueryHistorianTool`, and add\n   `query_historian: createQueryHistorianTool(workflow)` to `tools`. Import\n   `ToolCallFilter` and add the prepared `inputProcessors` line from solution 06\n   so previous historian results stay out of later model requests.",
        },
        {
          label: "DO",
          title: "Open and change · 2",
          body: "Open `tools/query-historian-tool.ts`: point to the input/output schemas and\n   `workflow.createRun()` → `run.start()`. The tool adapter does not generate SQL.",
        },
        {
          label: "DO",
          title: "Open and change · 3",
          body: "Open `workflows/historian-query/workflow.ts`. Explain the three `.then(...)`\n   connections in order. The steps are already prepared; show their composition\n   without rewriting SQL execution infrastructure.",
        },
        {
          label: "DO",
          title: "Open and change · 4",
          body: "Open the two prepared prompts under `mastra/prompts/sql-generator.ts` and\n   `sql-reviewer.ts`. Show the allowed view/columns and complete-reading result\n   requirement. Long prompt text is copied or imported, never typed live.",
        },
        {
          label: "DO",
          title: "Open and change · 5",
          body: "No Angular edit is needed. Open the prepared `historianResult` computed value\n   in `apps/angular-host/src/app/app.ts`: it reads validated tool results from\n   the agent store. `toModelOutput` in the backend tool gives the model only a\n   completion message. The bridge removes old query payloads from replayed history.\n   Explain why neither a second display tool nor model copying is needed.",
        },
        {
          label: "DO",
          title: "Open and change · 6",
          body: "Wait for Mastra to reload automatically, then refresh the app and Studio. The historian workflow should\n   now appear in Studio. The facility API was already prepared in the starter.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate",
          body: "Ask: **Show me the maximum air temperature for each shift manager.**\n\nTrace `query_historian` → generator → reviewer → deterministic validation/execution\n→ delivered tool result → the prepared grid. Inspect the complete reading records in the result\nview. Explain that a maximum can be represented by selecting the stored row that\ncontains it. Do not promise an exact row count or value before seeing the data.\n\nThen: **Show me the average air temperature for each shift manager.**\n\nExpected: an explicit unsupported/rejected result because computed summaries do\nnot fit this milestone's complete-reading grid. It must not pretend an average\nis a stored reading. This motivates the later A2UI addition.\n\nFor the policy boundary, inspect `historian-query-legacy.ts` in the facility service:\nthe reviewer assesses meaning; deterministic policy and the read-only connection\nenforce execution restrictions. This branch preserves milestone 07's sequence:\ngenerate → review → validate-and-execute. Milestone 08 adds a separate workflow\nwith an earlier deterministic check and a data/UI branch; teach that when it is connected.",
        },
      ],
      prompts: [
        {
          title: "Select records through the reviewed workflow",
          prompt: "Show me the maximum air temperature for each shift manager.",
          before:
            "Complete milestone 06, wait for Mastra to reload automatically, refresh the app and use a fresh conversation. Ensure the historian contains readings; no dates or specific temperatures are assumed.",
          expected:
            "The reviewed workflow returns complete stored reading records and the prepared Historian result view displays them. Empty or truncated results must be reported honestly.",
          inspect:
            "In Studio follow query_historian → SQL generation → review → validation/execution. The application reads the delivered tool result directly into its prepared grid. Show toModelOutput: the model receives only a receipt, with no second display call. Do not promise one row per manager when ties exist.",
          optional: false,
        },
        {
          title: "Narrow the data question",
          prompt:
            "Show the latest ten air temperature readings from the Cooling room.",
          before:
            "Continue after the first successful query. Put scope in the question explicitly; do not assume screen filters are automatically included in the SQL request.",
          expected:
            "Up to ten matching complete reading records appear in the Historian result view, ordered by recency as requested.",
          inspect:
            "Compare room, metric and timestamps with returned records. Explain that SQL selects records while the application owns the layout.",
          optional: true,
        },
        {
          title: "Expose the fixed result shape",
          prompt: "Show me the average air temperature for each shift manager.",
          before:
            "Use the completed milestone 06 implementation, which accepts complete reading records rather than computed summaries.",
          expected:
            "The workflow should reject the unsupported aggregate request and the assistant should explain why. It must not fabricate averages or render a new result. An earlier result grid may remain visible.",
          inspect:
            "Inspect the rejection in the workflow trace. If the model refuses before calling the tool, explain that this shows instruction-following only; open the workflow guard to show the enforced boundary. Use this limitation to introduce the A2UI chapter 08.",
          optional: false,
        },
      ],
      recovery:
        "Select 06, wait for Mastra to reload, then refresh the app and Studio. Restart\nthe backend launcher only if its presenter file changed. On failure find the workflow step and\nstructured error. A model refusal, schema mismatch, validator rejection and HTTP\nfailure are distinct. Never weaken SQL restrictions to make a live demo pass.",
      files: [
        {
          path: "apps/agent-service/src/mastra/agents/main/agent.ts",
          after:
            'import { ToolCallFilter } from "@mastra/core/processors";\nimport { createOpenAI } from "@ai-sdk/openai";\nimport { Agent } from "@mastra/core/agent";\nimport type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\nimport { createQueryHistorianTool } from "./tools/query-historian-tool";\nimport { CHAT_SYSTEM_PROMPT } from "../../prompts/main-06";\n\nexport const historianEnabled = true;\nexport function createMainAgent(\n  apiKey: string,\n  model: string,\n  workflow: ReturnType\u003ctypeof createHistorianQueryWorkflow>,\n) {\n  const openrouter = createOpenAI({\n    apiKey,\n    baseURL: "https://openrouter.ai/api/v1",\n  });\n  return new Agent({\n    id: "default",\n    name: "Soverius Chocolate Factory Assistant",\n    instructions: CHAT_SYSTEM_PROMPT,\n    model: openrouter(model),\n    inputProcessors: [new ToolCallFilter({ exclude: ["query_historian"] })],\n    tools: { query_historian: createQueryHistorianTool(workflow) },\n  });\n}\n\nexport { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\n',
          diff: '@@ -1,9 +1,11 @@\n+import { ToolCallFilter } from "@mastra/core/processors";\n import { createOpenAI } from "@ai-sdk/openai";\n import { Agent } from "@mastra/core/agent";\n import type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\n-import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-05";\n+import { createQueryHistorianTool } from "./tools/query-historian-tool";\n+import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-06";\n \n-export const historianEnabled = false;\n+export const historianEnabled = true;\n export function createMainAgent(\n   apiKey: string,\n   model: string,\n@@ -18,7 +20,8 @@ export function createMainAgent(\n     name: "Soverius Chocolate Factory Assistant",\n     instructions: CHAT_SYSTEM_PROMPT,\n     model: openrouter(model),\n-    tools: {},\n+    inputProcessors: [new ToolCallFilter({ exclude: ["query_historian"] })],\n+    tools: { query_historian: createQueryHistorianTool(workflow) },\n   });\n }\n \n',
        },
      ],
      flow: [
        "Historian tool",
        "Generate → review",
        "Validate + execute",
        "Result view",
      ],
    },
    {
      id: "07",
      name: "Human approval and audit",
      source: "workshop/speaker-notes/07-approval.md",
      intro:
        "**Start:** completed 06. Ensure the demo metric has no active alarm; use the\nconventional controls to acknowledge/resolve an existing one.\n**Completed code:** [solution 07](../solutions/07/).\n\n**Demo inputs:** Follow the numbered prompts for milestone 07 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 06. Ensure the demo metric has no active alarm; use the\nconventional controls to acknowledge/resolve an existing one.\n**Completed code:** [solution 07](../solutions/07/).\n\n**Demo inputs:** Follow the numbered prompts for milestone 07 in the\n[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts\nin the Presenter desk. Each includes setup, expected results and what to show.",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“The assistant can propose an alarm. The operator decides, and the facility service\nrecords the actual outcome. A plausible model response is not authorization.”",
        },
        {
          label: "DO",
          title: "Open and change · 1",
          body: "In Angular's `workshop/connect.ts`, add `registerAlarmApproval()`.",
        },
        {
          label: "DO",
          title: "Open and change · 2",
          body: "In `prepared-tools.ts`, show the `registerHumanInTheLoop` call, shared schema,\n   and `AlarmApprovalCard` reference. The complete component already exists.",
        },
        {
          label: "DO",
          title: "Open and change · 3",
          body: "In the Mastra agent factory, change the instruction import to `main-07`.\n   Read its approval/rejection paragraph. No server-side alarm tool is added.",
        },
        {
          label: "DO",
          title: "Open and change · 4",
          body: "Open `alarm-approval-card.ts` and locate `decide()`: explain the facility API\n   call, persisted outcome, and the response that allows the paused run to continue.",
        },
        {
          label: "DO",
          title: "Open and change · 5",
          body: "Briefly open `FacilityRepository.decideAlarmApproval` to explain its transaction\n   and correlation ID. Implementation is prepared; do not type database code.",
        },
        {
          label: "DO",
          title: "Open and change · 6",
          body: "Wait for Mastra to reload automatically, then reload the browser.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate: rejection first",
          body: "Ask: **Raise an alarm for the Packaging hall package reject rate because I want it investigated.**\n\nWait for the approval card. Point to the exact metric, reason and named operator.\nClick **Reject**. Show that no alarm was raised and that the audit records the\nrejection with its correlation ID. The assistant should report rejection.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate: approval",
          body: "Make the request again and click **Approve and raise alarm**. Confirm the actual\nalarm in the conventional UI and the executed result in the audit. If execution\nfails, distinguish approval from successful execution. Acknowledge and resolve\nthe demo alarm with the conventional controls when finished.\n\nIf explaining duplicate decisions, show that replaying the same correlation ID\ndoes not create another alarm. Do not claim that every new conversational request\nshares that ID; a new proposal is a new decision.",
        },
        {
          label: "DO",
          title: "Transition to milestone 08",
          body: "“We can select readings and request an approved action. Our result layout is still\nfixed. A2UI will let the assistant compose a view from components we supply.”\n\nContinue with [08 — A2UI](08-a2ui.md). The catalogue and renderer already exist;\nconnect them and repeat a request that the fixed grid could not represent. A2A\nand MCP/MCP Apps remain later additions.",
        },
      ],
      prompts: [
        {
          title: "Reject a proposed action",
          prompt:
            "Raise an alarm for the Packaging hall package reject rate because I want it investigated.",
          before:
            "Complete milestone 07, wait for Mastra to reload automatically, refresh the app and use a fresh conversation. Ensure this metric has no active alarm; resolve any previous demo alarm with the conventional UI.",
          expected:
            "An approval card shows the exact metric, reason and operator. Click Reject. No alarm is raised, and the audit records the rejected decision.",
          inspect:
            "Pause before clicking: the model has proposed, not executed. After rejection inspect the audit and the assistant response. This request is your reason for investigation, not proof of an abnormal reading.",
          optional: false,
        },
        {
          title: "Approve and verify execution",
          prompt:
            "Raise an alarm for the Packaging hall package reject rate because I want it investigated.",
          before:
            "Repeat the request after rejecting it. Ensure the metric still has no active alarm. A new proposal has a new correlation ID.",
          expected:
            "Click Approve and raise alarm. Verify the actual alarm and the executed outcome in the audit. Approval alone is not proof of successful execution.",
          inspect:
            "Follow the card into the facility decision API and correlated audit. If execution fails, show the failure honestly. Finish by acknowledging and resolving the demo alarm through conventional controls.",
          optional: false,
        },
        {
          title: "Show the action boundary",
          prompt:
            "Resolve the alarm for the Packaging hall package reject rate.",
          before:
            "Optional: run while the approved demo alarm is still active, before manual cleanup.",
          expected:
            "The assistant should explain that resolving alarms remains a conventional operator action in this checkpoint.",
          inspect:
            "Use the normal acknowledge/resolve controls yourself, then confirm the alarm state. Distinguish the one exposed action from unrestricted operational access.",
          optional: true,
        },
      ],
      recovery:
        "Select 07, wait for Mastra to reload, then refresh the app and Studio. Restart\nthe backend launcher only if its presenter file changed. If no card appears, check the registration, metric\ndiscovery and tool arguments. If saving a decision fails, inspect the facility\nresponse; never report success based only on the model's acknowledgement.",
      files: [
        {
          path: "apps/angular-host/src/app/workshop/connect.ts",
          after:
            "import type { WorkshopHost } from './host';\nimport { connectViewContext, registerFacilityTools, registerAlarmApproval } from './prepared-tools';\n\nexport function connectWorkshop(host: WorkshopHost): void {\n  connectViewContext(host);\n  registerFacilityTools(host);\n  registerAlarmApproval();\n}\n",
          diff: "@@ -1,7 +1,8 @@\n import type { WorkshopHost } from './host';\n-import { connectViewContext, registerFacilityTools } from './prepared-tools';\n+import { connectViewContext, registerFacilityTools, registerAlarmApproval } from './prepared-tools';\n \n export function connectWorkshop(host: WorkshopHost): void {\n   connectViewContext(host);\n   registerFacilityTools(host);\n+  registerAlarmApproval();\n }\n",
        },
        {
          path: "apps/agent-service/src/mastra/agents/main/agent.ts",
          after:
            'import { ToolCallFilter } from "@mastra/core/processors";\nimport { createOpenAI } from "@ai-sdk/openai";\nimport { Agent } from "@mastra/core/agent";\nimport type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\nimport { createQueryHistorianTool } from "./tools/query-historian-tool";\nimport { CHAT_SYSTEM_PROMPT } from "../../prompts/main-07";\n\nexport const historianEnabled = true;\nexport function createMainAgent(\n  apiKey: string,\n  model: string,\n  workflow: ReturnType\u003ctypeof createHistorianQueryWorkflow>,\n) {\n  const openrouter = createOpenAI({\n    apiKey,\n    baseURL: "https://openrouter.ai/api/v1",\n  });\n  return new Agent({\n    id: "default",\n    name: "Soverius Chocolate Factory Assistant",\n    instructions: CHAT_SYSTEM_PROMPT,\n    model: openrouter(model),\n    inputProcessors: [new ToolCallFilter({ exclude: ["query_historian"] })],\n    tools: { query_historian: createQueryHistorianTool(workflow) },\n  });\n}\n\nexport { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\n',
          diff: '@@ -3,7 +3,7 @@ import { createOpenAI } from "@ai-sdk/openai";\n import { Agent } from "@mastra/core/agent";\n import type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\n import { createQueryHistorianTool } from "./tools/query-historian-tool";\n-import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-06";\n+import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-07";\n \n export const historianEnabled = true;\n export function createMainAgent(\n',
        },
      ],
      flow: [
        "Alarm proposal",
        "Operator decision",
        "Facility transaction",
        "Alarm + audit",
      ],
    },
    {
      id: "08",
      name: "A2UI result composition",
      source: "workshop/speaker-notes/08-a2ui.md",
      intro:
        "**Start:** completed 07. A working key and recent demo readings are required.\n**Completed code:** [solution 08](../solutions/08/).\n\n**Demo inputs:** Follow milestone 08 in the [demo prompt sequence](../demo-prompts.md)\nor this chapter’s Demo prompts in the Presenter desk. Use the three core examples\nin order; each replaces the previous generated view. The manager-card example\nrequires rehearsal: this worktree’s two live attempts rendered valid but incorrect\narrangements. Table-only and stored room-description examples passed.",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 07. A working key and recent demo readings are required.\n**Completed code:** [solution 08](../solutions/08/).\n\n**Demo inputs:** Follow milestone 08 in the [demo prompt sequence](../demo-prompts.md)\nor this chapter’s Demo prompts in the Presenter desk. Use the three core examples\nin order; each replaces the previous generated view. The manager-card example\nrequires rehearsal: this worktree’s two live attempts rendered valid but incorrect\narrangements. Table-only and stored room-description examples passed.",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“Until now, the application chose the result layout. We will give the agent three\ncomponents and let it arrange them. SQL still selects real data. The model chooses\nthe layout and bindings; the application supplies every table value.”",
        },
        {
          label: "DO",
          title: "Open and change · 1",
          body: "In `apps/angular-host/src/app/app.config.ts`, import `facilityWebCatalog` from\n   `./a2ui/web-catalog` and add `a2ui: { catalog: facilityWebCatalog }` to\n   `provideCopilotKit`. The catalogue and Lit components are already inside Angular.",
        },
        {
          label: "DO",
          title: "Open and change · 2",
          body: "In `apps/angular-host/src/app/chat/chat.component.ts`, import\n   `registerGeneratedViewNotice` from `../a2ui/chat-notice` and call it in the\n   constructor. It leaves a short chat notice while the prepared main-area slot\n   displays `CopilotA2UIActivityRenderer`. No renderer implementation is typed live.",
        },
        {
          label: "DO",
          title: "Open and change · 3",
          body: "In `apps/agent-service/src/mastra/agents/main/agent.ts`, select the prepared\n   `main-08` prompt, change the workflow type import and factory export to\n   `../../workflows/historian-composition/workflow`, and change the tool import\n   to `./tools/query-composition-tool`. The public tool remains `query_historian`.\n   Use the exact solution diff; both occurrences of the workflow path must change.",
        },
        {
          label: "DO",
          title: "Open and change · 4",
          body: "In `apps/facility-service/src/workshop.ts`, change the `HistorianQueryService`\n   export from `./historian-query-legacy.js` to `./historian-query.js`.\n   This explicitly replaces the complete-reading policy with the dataset policy.",
        },
        {
          label: "DO",
          title: "Open and change · 5",
          body: "Open `workflows/historian-composition/workflow.ts` near the final chain:\n   generate SQL → deterministic check → model review → execute → select format\n   → data or UI. These steps are prepared. Show that the initial check only prepares\n   SQL, and that execution repeats the policy checks before reading any rows.",
        },
        {
          label: "DO",
          title: "Open and change · 6",
          body: "Open the prepared format/composer agents under `historian-composition/agents`.\n   Show that the format agent decides inside the workflow. The composer receives\n   the question and column definitions, not row values. A requested table or card\n   selects UI; an ordinary factual question can select the plain-data branch.",
        },
        {
          label: "DO",
          title: "Open and change · 7",
          body: "Open `apps/angular-host/src/app/a2ui/web-catalog.ts` and the shared\n   `packages/contracts/src/facility-catalog.ts`. Show Table, Card and Text, then\n   follow a Table’s `dataset` binding. The main agent does not emit arbitrary HTML,\n   JavaScript, URLs, or cell values. Grouped summaries run over the full snapshot\n   before table paging; mixed metric/unit values do not produce a combined number.",
        },
        {
          label: "DO",
          title: "Open and change · 8",
          body: "Restart the facility backend launcher and wait for Mastra to reload automatically,\n   then refresh the app and Studio. If using `pnpm dev:all`, restart that command.\n   Select 08 only as a recovery shortcut; the preceding four edits are the live work.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate · 1",
          body: "Send the table-only prompt from Demo prompts. Confirm exactly the requested\n   Time, Temperature and Shift Manager columns. Page the table. There should be\n   no surrounding titled Card, explanatory Text, or manual column chooser.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate · 2",
          body: "Rehearse the manager-card prompt first. If the output combines rooms or puts\n   manager names on Tables instead of Cards, use it to review the unmet request.\n   A passing result has manager Cards containing a short layout\n   introduction and separate room Tables. Inspect one table’s manager/room scope.\n   Page one table and verify the others keep their positions. Model-written\n   introductions describe the layout; they must not interpret unseen temperatures.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate · 3",
          body: "Send the room-overview prompt. Show that two Cards containing stored descriptions\n   replace the temperature tables. Follow the native binding to the actual room\n   description. This proves the catalogue composes different kinds of views.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate · 4",
          body: "Optionally request an average-temperature table per manager. Contrast this with\n   the rejected aggregate in 06. Inspect the SQL/dataset and calculated result;\n   do not treat a confident chat acknowledgement as numerical evidence.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate · 5",
          body: "In Studio inspect the format and composition steps. In the transported result\n   show `createSurface`, `updateComponents`, and `updateDataModel`. Explain the\n   current-result receipt, browser-history filtering and `ToolCallFilter` together.",
        },
        {
          label: "TRANSITION",
          title: "Transition",
          body: "“We can acquire data through a reviewed workflow and compose a bounded view from\nour own components. Next we can add specialist knowledge or external capabilities.”\n\nA2A and MCP/MCP Apps remain future chapters. They are not included in 08.",
        },
      ],
      prompts: [
        {
          title: "Only a table",
          prompt:
            "Show the Cooling room air temperature readings from the last seven days. Include time, temperature and shift manager, in that order. Only show a table, with no cards or explanatory text.",
          before:
            "Complete 08, restart the facility backend launcher, wait for Mastra to reload automatically and refresh the app. Ensure the local historian contains readings from the last seven days. If needed, stop services and deliberately reset the demo database before rehearsal.",
          expected:
            "The Generated view shows a standalone Table with Time, Temperature and Shift Manager in that order. Paging is local. No surrounding titled Card, explanatory Text or column chooser.",
          inspect:
            "Inspect the query and result-format decision, then the validated Table definition and real dataset binding. Relative dates stay in the original question until SQL resolves them using the database clock.",
          optional: false,
        },
        {
          title: "Manager cards containing room tables — rehearse first",
          prompt:
            "Show air temperature readings from both rooms over the last seven days. Create one card per shift manager, titled with the manager's name. Inside EACH manager card put one short layout introduction and TWO separate tables: one for the Cooling room and one for the Packaging hall. Title each table with its room name. Each table must contain only readings for its own room and that card's manager, with time and temperature columns. Do not combine both rooms into one table.",
          before:
            "Rehearse this complex example before teaching it. In the 15 September Workshop check, both the original and clarified prompts produced structurally valid layouts that missed the requested manager-card/room-table arrangement. Continue after the table demo and compare the result with the expected hierarchy; do not count rendering alone as success.",
          expected:
            "For complete seeded coverage, three titled manager Cards contain three Text introductions and six room Tables. Each table receives only its manager/room group. A new result replaces the previous view.",
          inspect:
            "Compare one table with its returned records, then page only that table and check the others stay put. Explain native repeated child templates and dataset bindings. The short introduction describes layout, not unseen measurements. A schema-valid composition can still miss the requested layout. Count the separate room tables and check their titles before calling the demo successful.",
          optional: false,
        },
        {
          title: "Room cards without tables",
          prompt:
            "Give me an overview of the rooms. Show one card per room, with its name as the title and one short explanation of what happens there. Use the stored room descriptions. No tables or temperature statistics.",
          before:
            "Continue after the manager-card demo. The historian view includes stored room descriptions and area types.",
          expected:
            "Two Cards with Text replace the previous tables. Room names and descriptions come from the dataset; no temperature table is generated.",
          inspect:
            "Follow Text and title bindings into stored metadata. Contrast this composition with the first two examples: the same catalogue supports a standalone table, nested tables and text-only cards.",
          optional: false,
        },
        {
          title: "Revisit the earlier aggregate limitation",
          prompt:
            "Show the average air temperature for each shift manager over the last seven days in a table.",
          before:
            "Optional after the three core demos. Explicitly request a table so the format agent selects UI.",
          expected:
            "A supported aggregate result is displayed in a Table, using data or calculations from the complete query snapshot. No model-invented averages.",
          inspect:
            "Contrast with 06. Inspect the generated SQL: it may return named aggregate columns or underlying readings with a Table aggregate configuration. Verify values against the dataset; paging must not change an average.",
          optional: true,
        },
        {
          title: "Expose the read-only boundary",
          prompt:
            "Delete all Cooling room readings from the historian, then show a table of the remaining readings.",
          before:
            "Optional boundary example. This is intentionally unsupported; the model has no deletion tool and SQL execution is read-only.",
          expected:
            "No readings are deleted. The main agent should refuse, or the workflow should reject any proposed write. If it instead performs only a read, explain that the requested deletion was not available.",
          inspect:
            "Inspect where the request stopped. A refusal alone tests instructions; the deterministic suite separately verifies blocked writes. Do not modify the policy to force a demo through.",
          optional: true,
        },
      ],
      recovery:
        "Select 08, restart the backend launcher, wait for Mastra to reload automatically,\nand refresh the app and Studio. If the generated\nview is missing, inspect catalogue registration, the result-format decision,\n`a2ui_operations`, and the prepared main-area renderer in that order.\n\nIf SQL, layout validation, or composition times out, show the reported failure.\nThe previous successful view may remain; do not present it as the failed request’s\nanswer. Do not loosen the schema. A new user message starts a fresh workflow run.\n\nFor stale dates or existing demo alarms, stop the app first and deliberately run\n`pnpm reset:demo`. It reseeds the local seven-day readings and deletes demo alarms\nand approval records. Start services again and begin a fresh conversation. Never\nrun it merely to switch a code checkpoint.",
      files: [
        {
          path: "apps/angular-host/src/app/chat/chat.component.ts",
          after:
            "import { registerGeneratedViewNotice } from '../a2ui/chat-notice';\nimport { Component } from '@angular/core';\nimport { CopilotChat } from '@copilotkit/angular';\nimport { StreamingAutoScrollDirective } from './streaming-auto-scroll.directive';\n\n@Component({\n  selector: 'app-chat',\n  imports: [CopilotChat, StreamingAutoScrollDirective],\n  templateUrl: './chat.component.html',\n  styleUrl: './chat.component.scss',\n})\nexport class ChatComponent {\n  constructor() {\n    registerGeneratedViewNotice();\n  }\n}\n",
          diff: "@@ -1,3 +1,4 @@\n+import { registerGeneratedViewNotice } from '../a2ui/chat-notice';\n import { Component } from '@angular/core';\n import { CopilotChat } from '@copilotkit/angular';\n import { StreamingAutoScrollDirective } from './streaming-auto-scroll.directive';\n@@ -8,4 +9,8 @@ import { StreamingAutoScrollDirective } from './streaming-auto-scroll.directive'\n   templateUrl: './chat.component.html',\n   styleUrl: './chat.component.scss',\n })\n-export class ChatComponent {}\n+export class ChatComponent {\n+  constructor() {\n+    registerGeneratedViewNotice();\n+  }\n+}\n",
        },
        {
          path: "apps/angular-host/src/app/app.config.ts",
          after:
            "import { facilityWebCatalog } from './a2ui/web-catalog';\nimport { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';\nimport { provideHttpClient } from '@angular/common/http';\nimport { provideRouter } from '@angular/router';\nimport { provideCopilotChatLabels, provideCopilotKit } from '@copilotkit/angular';\n\nimport { routes } from './app.routes';\n\nexport const appConfig: ApplicationConfig = {\n  providers: [\n    provideBrowserGlobalErrorListeners(),\n    provideHttpClient(),\n    provideRouter(routes),\n    provideCopilotKit({\n      runtimeUrl: '/api/copilotkit',\n      a2ui: { catalog: facilityWebCatalog },\n    }),\n    provideCopilotChatLabels({\n      chatInputPlaceholder: 'Ask about this view or its history…',\n      welcomeMessageText: 'How can I help?',\n      chatDisclaimerText:\n        'Check answers against facility evidence. Operational actions require operator control.',\n    }),\n  ],\n};\n",
          diff: "@@ -1,3 +1,4 @@\n+import { facilityWebCatalog } from './a2ui/web-catalog';\n import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';\n import { provideHttpClient } from '@angular/common/http';\n import { provideRouter } from '@angular/router';\n@@ -10,7 +11,10 @@ export const appConfig: ApplicationConfig = {\n     provideBrowserGlobalErrorListeners(),\n     provideHttpClient(),\n     provideRouter(routes),\n-    provideCopilotKit({ runtimeUrl: '/api/copilotkit' }),\n+    provideCopilotKit({\n+      runtimeUrl: '/api/copilotkit',\n+      a2ui: { catalog: facilityWebCatalog },\n+    }),\n     provideCopilotChatLabels({\n       chatInputPlaceholder: 'Ask about this view or its history…',\n       welcomeMessageText: 'How can I help?',\n",
        },
        {
          path: "apps/facility-service/src/workshop.ts",
          after:
            'import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\nimport { createWorkshopCopilotRuntime } from "./copilot-runtime.js";\n\nexport function createWorkshopConnections(\n  options: WorkshopOptions,\n): WorkshopConnections {\n  return {\n    chat: undefined,\n    copilotRuntime: createWorkshopCopilotRuntime(options),\n  };\n}\n\nexport { HistorianQueryService } from "./historian-query.js";\n',
          diff: '@@ -10,4 +10,4 @@ export function createWorkshopConnections(\n   };\n }\n \n-export { HistorianQueryService } from "./historian-query-legacy.js";\n+export { HistorianQueryService } from "./historian-query.js";\n',
        },
        {
          path: "apps/agent-service/src/mastra/agents/main/agent.ts",
          after:
            'import { ToolCallFilter } from "@mastra/core/processors";\nimport { createOpenAI } from "@ai-sdk/openai";\nimport { Agent } from "@mastra/core/agent";\nimport type { createHistorianQueryWorkflow } from "../../workflows/historian-composition/workflow";\nimport { createQueryHistorianTool } from "./tools/query-composition-tool";\nimport { CHAT_SYSTEM_PROMPT } from "../../prompts/main-08";\n\nexport const historianEnabled = true;\nexport function createMainAgent(\n  apiKey: string,\n  model: string,\n  workflow: ReturnType\u003ctypeof createHistorianQueryWorkflow>,\n) {\n  const openrouter = createOpenAI({\n    apiKey,\n    baseURL: "https://openrouter.ai/api/v1",\n  });\n  return new Agent({\n    id: "default",\n    name: "Soverius Chocolate Factory Assistant",\n    instructions: CHAT_SYSTEM_PROMPT,\n    model: openrouter(model),\n    inputProcessors: [new ToolCallFilter({ exclude: ["query_historian"] })],\n    tools: { query_historian: createQueryHistorianTool(workflow) },\n  });\n}\n\nexport { createHistorianQueryWorkflow } from "../../workflows/historian-composition/workflow";\n',
          diff: '@@ -1,9 +1,9 @@\n import { ToolCallFilter } from "@mastra/core/processors";\n import { createOpenAI } from "@ai-sdk/openai";\n import { Agent } from "@mastra/core/agent";\n-import type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\n-import { createQueryHistorianTool } from "./tools/query-historian-tool";\n-import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-07";\n+import type { createHistorianQueryWorkflow } from "../../workflows/historian-composition/workflow";\n+import { createQueryHistorianTool } from "./tools/query-composition-tool";\n+import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-08";\n \n export const historianEnabled = true;\n export function createMainAgent(\n@@ -25,4 +25,4 @@ export function createMainAgent(\n   });\n }\n \n-export { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\n+export { createHistorianQueryWorkflow } from "../../workflows/historian-composition/workflow";\n',
        },
      ],
      flow: [
        "Reviewed query",
        "Format decision",
        "Table / Card / Text",
        "Generated view",
      ],
    },
  ],
};
