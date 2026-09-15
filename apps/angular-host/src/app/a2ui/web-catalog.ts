import { createCatalog } from '@copilotkit/a2ui-renderer/web-components';
import { html } from 'lit';
import { FACILITY_CATALOG_ID, facilityCatalogDefinitions } from '@packt-workshop/contracts';
import './result-table';

export const facilityWebCatalog = createCatalog(
  facilityCatalogDefinitions,
  {
    Card: ({ props, children }) =>
      html`<section
        style=${`display:grid;gap:16px;min-width:0;width:100%;box-sizing:border-box;${props.title ? 'padding:16px;border:1px solid #c5d7d7;border-radius:12px;background:white' : ''}`}
        aria-label=${typeof props.title === 'string' ? props.title : undefined}
      >
        ${typeof props.title === 'string' && props.title ? html`<h2 style="font:600 20px system-ui;margin:0;color:#19323d">${props.title}</h2>` : null}
        ${Array.isArray(props.children) ? props.children.map((child: string | { id: string; basePath: string }) => (typeof child === 'string' ? children(child) : children(child.id, child.basePath))) : null}
      </section>`,
    Table: ({ props: { dataset, ...config } }) =>
      html`<facility-result-table .config=${config} .data=${dataset}></facility-result-table>`,
    Text: ({ props }) =>
      html`<p style="margin:0;white-space:pre-wrap;color:#19323d;font:14px/1.5 system-ui">
        ${typeof props.text === 'string' ? props.text : ''}
      </p>`,
  },
  { catalogId: FACILITY_CATALOG_ID },
);
