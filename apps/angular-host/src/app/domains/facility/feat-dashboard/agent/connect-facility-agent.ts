import { computed, effect, inject, untracked } from '@angular/core';
import {
  connectAgentContext,
  registerFrontendTool,
  injectAgentStore,
  registerHumanInTheLoop,
} from '@copilotkit/angular';
import {
  alarmApprovalToolSchema,
  clearFiltersToolSchema,
  getUserTimeZone,
  listConditionsToolSchema,
  listMetricsToolSchema,
  listRoomsToolSchema,
  listShiftManagersToolSchema,
  resolveFacilityViewAvailableOptions,
  setViewToolSchema,
  historianToolResultSchema,
  updateFiltersToolSchema,
} from '@packt-workshop/contracts';
import { FacilityStore } from '../../data/facility-store';
import { AlarmApprovalCard } from './alarm-approval-card';

export function connectFacilityAgent(): void {
  const store = inject(FacilityStore);
  const agentStore = injectAgentStore('default');
  const historianResult = computed(() => {
    const messages = agentStore().messages();
    const queryIds = new Set(
      messages.flatMap((message) =>
        message.role === 'assistant'
          ? (message.toolCalls ?? [])
              .filter((call) => call.function.name === 'query_historian')
              .map((call) => call.id)
          : [],
      ),
    );
    for (const message of [...messages].reverse()) {
      if (message.role !== 'tool' || !queryIds.has(message.toolCallId)) continue;
      try {
        const result = historianToolResultSchema.safeParse(JSON.parse(message.content));
        if (result.success && result.data.status === 'executed') {
          return { ...result.data, id: message.id };
        }
      } catch {
        // An incomplete tool message has no result to display yet.
      }
    }
    return undefined;
  });
  effect(() => {
    const result = historianResult();
    if (result) untracked(() => store.showHistorianResult(result));
  });
  const invalidToolPayload = (message?: string) => ({
    ok: false,
    state: store.facilityViewState(),
    error: message ?? 'Invalid frontend tool payload.',
  });
  async function listMetrics(input: unknown): Promise<unknown> {
    const validation = listMetricsToolSchema.safeParse(input);
    if (!validation.success) return invalidToolPayload(validation.error.issues[0]?.message);

    let roomId = validation.data.roomId;
    if (roomId) {
      try {
        const resolved = resolveFacilityViewAvailableOptions(
          { action: 'update_filters', filters: { roomId } },
          store.availableFilterOptions(),
        );
        roomId =
          resolved.action === 'update_filters' ? (resolved.filters.roomId ?? undefined) : roomId;
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Invalid room option.',
        };
      }
    }

    return {
      metrics: store
        .rooms()
        .filter((room) => !roomId || room.id === roomId)
        .flatMap((room) =>
          room.metrics.map((metric) => ({
            id: metric.id,
            name: metric.name,
            roomId: room.id,
            roomName: room.name,
            kind: metric.kind,
            unit: metric.unit,
          })),
        ),
    };
  }

  connectAgentContext(() => ({
    description:
      'Current facility view, active filters, and user timezone. This context contains no option catalogs, readings, alarm records, or historian results.',
    value: JSON.stringify({
      ...store.facilityViewState(),
      userTimeZone: getUserTimeZone(),
    }),
  }));
  registerFrontendTool({
    name: 'list_rooms',
    description:
      'List the rooms currently supported by the facility application. Use this tool when the user asks which rooms exist or before selecting a room filter.',
    parameters: listRoomsToolSchema,
    agentId: 'default',
    followUp: true,
    handler: async (input) => {
      const validation = listRoomsToolSchema.safeParse(input);
      if (!validation.success) return invalidToolPayload(validation.error.issues[0]?.message);
      return { rooms: store.rooms().map(({ id, name }) => ({ id, name })) };
    },
  });
  registerFrontendTool({
    name: 'list_metrics',
    description:
      'List supported facility metrics. Optionally provide a room ID returned by list_rooms to restrict the result to that room.',
    parameters: listMetricsToolSchema,
    agentId: 'default',
    followUp: true,
    handler: async (input) => listMetrics(input),
  });
  registerFrontendTool({
    name: 'list_shift_managers',
    description: 'List the shift managers currently available for reading-log filtering.',
    parameters: listShiftManagersToolSchema,
    agentId: 'default',
    followUp: true,
    handler: async (input) => {
      const validation = listShiftManagersToolSchema.safeParse(input);
      if (!validation.success) return invalidToolPayload(validation.error.issues[0]?.message);
      return { shiftManagers: store.shiftManagerOptions() };
    },
  });
  registerFrontendTool({
    name: 'list_conditions',
    description: 'List the reading conditions supported by the reading-log filter.',
    parameters: listConditionsToolSchema,
    agentId: 'default',
    followUp: true,
    handler: async (input) => {
      const validation = listConditionsToolSchema.safeParse(input);
      if (!validation.success) return invalidToolPayload(validation.error.issues[0]?.message);
      return { conditions: ['normal', 'warning', 'critical', 'unavailable'] };
    },
  });
  registerFrontendTool({
    name: 'set_view',
    description:
      'Switch the visible facility view between snapshot and reading-log. Existing filters are preserved.',
    parameters: setViewToolSchema,
    agentId: 'default',
    followUp: true,
    handler: async (input) => {
      const validation = setViewToolSchema.safeParse(input);
      if (!validation.success) return invalidToolPayload(validation.error.issues[0]?.message);
      return store.configureFacilityView({ action: 'set_view', ...validation.data });
    },
  });
  registerFrontendTool({
    name: 'update_filters',
    description:
      'Patch only the supplied reading-log filters and preserve all omitted filters. Use IDs returned by the list tools and the condition field returned by list_conditions. The literal "now" means the browser current time.',
    parameters: updateFiltersToolSchema,
    agentId: 'default',
    followUp: true,
    handler: async (input) => {
      const validation = updateFiltersToolSchema.safeParse(input);
      if (!validation.success) return invalidToolPayload(validation.error.issues[0]?.message);
      return store.configureFacilityView({ action: 'update_filters', ...validation.data });
    },
  });
  registerFrontendTool({
    name: 'clear_filters',
    description:
      'Clear the selected reading-log filters. Omit the filters list to clear every filter. The current view is preserved.',
    parameters: clearFiltersToolSchema,
    agentId: 'default',
    followUp: true,
    handler: async (input) => {
      const validation = clearFiltersToolSchema.safeParse(input);
      if (!validation.success) return invalidToolPayload(validation.error.issues[0]?.message);
      return store.configureFacilityView({ action: 'clear_filters', ...validation.data });
    },
  });
  registerHumanInTheLoop({
    name: 'review_alarm',
    description:
      'Ask the operator to approve or reject raising an alarm for one exact metric. Use an ID and name returned by list_metrics and explain why the alarm is proposed.',
    parameters: alarmApprovalToolSchema,
    component: AlarmApprovalCard,
    agentId: 'default',
  });
}
