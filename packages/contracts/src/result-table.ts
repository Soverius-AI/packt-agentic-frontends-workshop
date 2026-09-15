import type { DatasetRow, HistorianDataset } from "./historian-dataset.js";
import type { ResultAggregate, ResultTableProps } from "./facility-catalog.js";

export function validateTableFields(
  dataset: HistorianDataset,
  props: ResultTableProps,
): void {
  const columns = new Map(
    dataset.columns.map((column) => [column.key, column]),
  );
  const requireField = (field: string) => {
    if (!columns.has(field))
      throw new Error(
        `Column "${field}" is unavailable. Available columns: ${[...columns.keys()].join(", ")}.`,
      );
  };
  for (const column of props.columns ?? []) requireField(column.field);
  for (const field of props.groupBy ?? []) requireField(field);
  for (const aggregate of props.aggregates ?? []) {
    if (aggregate.operation !== "count" && !aggregate.field)
      throw new Error(`${aggregate.operation} needs a numeric column.`);
    if (aggregate.field) {
      requireField(aggregate.field);
      if (
        aggregate.operation !== "count" &&
        columns.get(aggregate.field)?.type !== "number"
      ) {
        throw new Error(`${aggregate.field} is not a numeric column.`);
      }
    }
    if (aggregate.equals !== undefined && !aggregate.field)
      throw new Error("A conditional count needs a column.");
    if (aggregate.equals !== undefined && aggregate.operation !== "count")
      throw new Error("Only count supports an equals condition.");
  }
  for (const keys of [
    (props.columns ?? []).map((column) => column.field),
    props.groupBy ?? [],
  ]) {
    if (new Set(keys).size !== keys.length)
      throw new Error("Column and grouping identifiers must be unique.");
  }
}

export function aggregateRows(
  rows: readonly DatasetRow[],
  aggregate: ResultAggregate,
): number | null {
  if (aggregate.operation === "count") {
    return rows.filter((row) =>
      aggregate.equals !== undefined
        ? row[aggregate.field!] === aggregate.equals
        : !aggregate.field || row[aggregate.field] != null,
    ).length;
  }
  const values = rows
    .map((row) => row[aggregate.field!])
    .filter((value): value is number => typeof value === "number");
  if (!values.length) return null;
  // Do not silently average readings measured in different units or metrics.
  if (aggregate.field === "numeric_value") {
    const units = new Set(
      rows
        .filter((row) => typeof row.numeric_value === "number")
        .map((row) => row.unit),
    );
    const metrics = new Set(
      rows
        .filter((row) => typeof row.numeric_value === "number")
        .map((row) => row.metric_name ?? row.metric_id),
    );
    if (units.size > 1 || metrics.size > 1) return null;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  const result =
    aggregate.operation === "average"
      ? total / values.length
      : aggregate.operation === "sum"
        ? total
        : values.reduce((current, value) =>
            aggregate.operation === "minimum"
              ? Math.min(current, value)
              : Math.max(current, value),
          );
  return Number.isFinite(result) ? result : null;
}

export type ResultGroup = {
  key: string;
  label: string;
  rows: DatasetRow[];
  children: ResultGroup[];
};
export function groupRows(
  rows: DatasetRow[],
  fields: string[],
  order: "label" | "count-desc" = "label",
  parent: unknown[] = [],
): ResultGroup[] {
  const field = fields[0];
  if (!field) return [];
  const groups = new Map<string, { value: unknown; rows: DatasetRow[] }>();
  for (const row of rows) {
    const value = row[field] ?? null;
    const key = JSON.stringify(value);
    const group = groups.get(key) ?? { value, rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      key: JSON.stringify([...parent, field, group.value]),
      label: group.value === null ? "No value" : String(group.value),
      rows: group.rows,
      children: groupRows(group.rows, fields.slice(1), order, [
        ...parent,
        field,
        group.value,
      ]),
    }))
    .sort((a, b) =>
      order === "count-desc"
        ? b.rows.length - a.rows.length || a.label.localeCompare(b.label)
        : a.label.localeCompare(b.label),
    );
}
