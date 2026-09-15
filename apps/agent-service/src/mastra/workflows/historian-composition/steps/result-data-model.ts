import {
  groupRows,
  type HistorianDataset,
  type ResultGroup,
  type ResultDataModel,
} from "@packt-workshop/contracts";

// Renderer data only. This object is never passed to the layout model.
export function createResultDataModel(
  dataset: HistorianDataset,
  groupBy: string[] = [],
): ResultDataModel {
  const toData = (group: ResultGroup): ResultDataModel => ({
    label: group.label,
    dataset: { ...dataset, rows: group.rows, rowCount: group.rows.length },
    groups: group.children.map(toData),
  });
  return { dataset, groups: groupRows(dataset.rows, groupBy).map(toData) };
}
