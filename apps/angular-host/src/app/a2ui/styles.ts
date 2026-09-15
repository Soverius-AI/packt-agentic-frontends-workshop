import { css } from 'lit';

export const resultStyles = css`
  :host {
    display: block;
    min-width: 0;
    color: #19323d;
    font:
      14px/1.5 system-ui,
      sans-serif;
  }
  * {
    box-sizing: border-box;
  }
  h3 {
    margin: 0 0 8px;
    font-size: 17px;
  }
  .error {
    color: #942020;
    padding: 12px;
    background: #fff1f1;
    border: 1px solid #e6bebe;
  }
  .scroll {
    max-width: 100%;
    overflow: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
  }
  th,
  td {
    padding: 9px 10px;
    border-bottom: 1px solid #dce6e6;
    text-align: left;
    white-space: nowrap;
  }
  th {
    font-size: 12px;
    background: #edf5f4;
    color: #24464b;
  }
  caption {
    text-align: left;
    font-weight: 600;
    margin: 10px 0;
  }
  button,
  summary {
    cursor: pointer;
  }
  button {
    color: #163e40;
    background: #eff6f5;
    border: 1px solid #a6c1c0;
    border-radius: 6px;
    padding: 5px 9px;
    font: inherit;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  button:focus-visible,
  summary:focus-visible,
  input:focus-visible {
    outline: 3px solid #087e83;
    outline-offset: 3px;
  }
  summary {
    padding: 8px 0;
    font-weight: 600;
  }
  .pager {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    margin: 10px 0;
    font-size: 12px;
  }
  .nested {
    padding-left: 12px;
    border-left: 3px solid #bdd8d4;
    margin: 8px 0;
  }
  .toggle {
    text-align: left;
    white-space: normal;
    min-width: 130px;
  }
`;
