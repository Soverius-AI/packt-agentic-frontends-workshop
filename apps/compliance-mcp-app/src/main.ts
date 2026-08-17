import { App } from "@modelcontextprotocol/ext-apps";
import { complianceAssessmentSchema } from "@packt-workshop/contracts";
import "./style.css";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Missing MCP App root element.");
}

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );

const renderEmpty = (message: string): void => {
  root.innerHTML = `
    <main class="shell" aria-live="polite">
      <p class="eyebrow">Specialist guidance</p>
      <h1>Facilities and compliance case</h1>
      <p class="muted">${escapeHtml(message)}</p>
    </main>
  `;
};

const renderAssessment = (value: unknown): void => {
  const parsed = complianceAssessmentSchema.safeParse(value);
  if (!parsed.success) {
    renderEmpty("The host did not provide a valid compliance assessment.");
    return;
  }

  const assessment = parsed.data;
  root.innerHTML = `
    <main class="shell">
      <header>
        <div>
          <p class="eyebrow">Fictional workshop corpus</p>
          <h1>${escapeHtml(assessment.caseId)}</h1>
        </div>
        <span class="status">Human review required</span>
      </header>

      <section aria-labelledby="recommendation">
        <h2 id="recommendation">Recommendation</h2>
        <p>${escapeHtml(assessment.recommendation)}</p>
      </section>

      <section aria-labelledby="actions">
        <h2 id="actions">Required actions</h2>
        <ol class="cards">
          ${assessment.requiredActions
            .map(
              (action) => `
                <li>
                  <div class="card-title">
                    <strong>${escapeHtml(action.label)}</strong>
                    ${action.consequential ? '<span class="consequential">Consequential</span>' : ""}
                  </div>
                  <p>${escapeHtml(action.rationale)}</p>
                  <small>Sources: ${action.sourceIds.map(escapeHtml).join(", ")}</small>
                </li>
              `,
            )
            .join("")}
        </ol>
      </section>

      <section aria-labelledby="evidence">
        <h2 id="evidence">Evidence and provenance</h2>
        <div class="sources">
          ${assessment.sources
            .map(
              (source) => `
                <article>
                  <p class="source-id">${escapeHtml(source.sourceId)}</p>
                  <h3>${escapeHtml(source.title)}</h3>
                  <p><strong>${escapeHtml(source.section)}</strong></p>
                  <blockquote>${escapeHtml(source.excerpt)}</blockquote>
                  <p class="uri">${escapeHtml(source.uri)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>

      <aside>
        <strong>Uncertainty</strong>
        <p>${assessment.uncertainties.map(escapeHtml).join(" ")}</p>
      </aside>
      <footer>${escapeHtml(assessment.disclaimer)}</footer>
    </main>
  `;
};

renderEmpty("Waiting for the case result from the host…");

const app = new App(
  { name: "workshop-specialist-guidance", version: "0.1.0" },
  {},
  { autoResize: true, strict: true },
);

app.ontoolinput = ({ arguments: toolArguments }) => {
  const caseId =
    toolArguments && typeof toolArguments["caseId"] === "string"
      ? toolArguments["caseId"]
      : "the selected case";
  renderEmpty(`Loading ${caseId}…`);
};

app.ontoolresult = ({ structuredContent }) => {
  renderAssessment(structuredContent);
};

app.ontoolcancelled = () => {
  renderEmpty("Loading was cancelled.");
};

await app.connect();
