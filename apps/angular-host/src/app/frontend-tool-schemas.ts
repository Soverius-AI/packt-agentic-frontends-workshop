import { z } from 'zod';

export const setViewInputSchema = z.object({
  view: z.enum(['snapshot', 'reading-log']),
});

export const setViewOutputSchema = z.object({
  view: z.enum(['snapshot', 'reading-log']),
});

export const updateFiltersInputSchema = z.object({
  from: z
    .string()
    .nullable()
    .optional()
    .describe(
      'Start date: "now", ISO date-time or local YYYY-MM-DDTHH:mm. Null clears it; omission preserves it.',
    ),
  to: z
    .string()
    .nullable()
    .optional()
    .describe(
      'End date: "now", ISO date-time or local YYYY-MM-DDTHH:mm. Null clears it; omission preserves it.',
    ),
  roomId: z
    .string()
    .nullable()
    .optional()
    .describe('Room ID from context. Null clears it; omission preserves it.'),
  metricId: z
    .string()
    .nullable()
    .optional()
    .describe('Metric ID from context. Null clears it; omission preserves it.'),
  shiftManager: z
    .string()
    .nullable()
    .optional()
    .describe('Shift-manager name from context. Null clears it; omission preserves it.'),
  condition: z
    .enum(['normal', 'warning', 'critical', 'unavailable'])
    .nullable()
    .optional()
    .describe('Null clears it; omission preserves it.'),
});

// Optional local validation for the value returned by updateFilters.
// registerFrontendTool accepts an input schema via parameters, but no output-schema option.
export const updateFiltersOutputSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    state: z.object({
      view: z.enum(['snapshot', 'reading-log', 'historian-result', 'a2ui-result']),
      filters: z.object({
        from: z.string().nullable(),
        to: z.string().nullable(),
        roomId: z.string().nullable(),
        metricId: z.string().nullable(),
        shiftManager: z.string().nullable(),
        condition: z.enum(['normal', 'warning', 'critical', 'unavailable']).nullable(),
      }),
    }),
  }),
  z.object({
    ok: z.literal(false),
    error: z.string(),
  }),
]);
