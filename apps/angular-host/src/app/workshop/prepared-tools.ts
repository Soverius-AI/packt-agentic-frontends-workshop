import {
  connectAgentContext,
  registerFrontendTool,
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
  setViewToolSchema,
  showHistorianReadingsToolSchema,
  updateFiltersToolSchema,
} from '@packt-workshop/contracts';
import { AlarmApprovalCard } from '../alarm-approval-card';
import type { WorkshopHost } from './host';

export function connectViewContext(host: WorkshopHost): void {
  connectAgentContext(() => ({
    description:
      'Current facility view, active filters, and user timezone. This context contains no option catalogs, readings, alarm records, or historian results.',
    value: JSON.stringify({
      ...host.facilityViewState(),
      userTimeZone: getUserTimeZone(),
    }),
  }));
}

export function registerFacilityTools(host: WorkshopHost): void {
  registerFrontendTool({
    name: 'list_rooms',
    description:
      'List the rooms currently supported by the facility application. Use this tool when the user asks which rooms exist or before selecting a room filter.',
    parameters: listRoomsToolSchema,
    agentId: 'default',
    followUp: true,
    handler: async (input) => {
      const validation = listRoomsToolSchema.safeParse(input);
      if (!validation.success) return host.invalidToolPayload(validation.error.issues[0]?.message);
      return { rooms: host.rooms().map(({ id, name }) => ({ id, name })) };
    },
  });
  registerFrontendTool({
    name: 'list_metrics',
    description:
      'List supported facility metrics. Optionally provide a room ID returned by list_rooms to restrict the result to that room.',
    parameters: listMetricsToolSchema,
    agentId: 'default',
    followUp: true,
    handler: async (input) => host.listMetrics(input),
  });
  registerFrontendTool({
    name: 'list_shift_managers',
    description: 'List the shift managers currently available for reading-log filtering.',
    parameters: listShiftManagersToolSchema,
    agentId: 'default',
    followUp: true,
    handler: async (input) => {
      const validation = listShiftManagersToolSchema.safeParse(input);
      if (!validation.success) return host.invalidToolPayload(validation.error.issues[0]?.message);
      return { shiftManagers: host.shiftManagerOptions() };
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
      if (!validation.success) return host.invalidToolPayload(validation.error.issues[0]?.message);
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
      if (!validation.success) return host.invalidToolPayload(validation.error.issues[0]?.message);
      return host.configureFacilityView({ action: 'set_view', ...validation.data });
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
      if (!validation.success) return host.invalidToolPayload(validation.error.issues[0]?.message);
      return host.configureFacilityView({ action: 'update_filters', ...validation.data });
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
      if (!validation.success) return host.invalidToolPayload(validation.error.issues[0]?.message);
      return host.configureFacilityView({ action: 'clear_filters', ...validation.data });
    },
  });
}

export function registerHistorianView(host: WorkshopHost): void {
  registerFrontendTool({
    name: 'show_historian_readings',
    description:
      'Display complete reading records returned by query_historian in the dedicated Historian result view. Copy question, entries, and truncated exactly from the successful backend tool result.',
    parameters: showHistorianReadingsToolSchema,
    agentId: 'default',
    followUp: true,
    handler: async (input) => {
      const validation = showHistorianReadingsToolSchema.safeParse(input);
      if (!validation.success) return host.invalidToolPayload(validation.error.issues[0]?.message);
      return host.showHistorianReadings(validation.data);
    },
  });
}

export function registerAlarmApproval(): void {
  registerHumanInTheLoop({
    name: 'review_alarm',
    description:
      'Ask the operator to approve or reject raising an alarm for one exact metric. Use an ID and name returned by list_metrics and explain why the alarm is proposed.',
    parameters: alarmApprovalToolSchema,
    component: AlarmApprovalCard,
    agentId: 'default',
  });
}
