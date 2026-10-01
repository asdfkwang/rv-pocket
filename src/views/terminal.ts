import { t } from "../i18n";

export function renderTerminal(): string {
  return `<div class="terminal-screen">
    <div class="back-row"><button id="terminal-back" class="text-button" data-action="view" data-view="station">${t("back")}</button></div>
    <section class="panel" aria-labelledby="terminal-heading">
      <span class="eyebrow">${t("terminalEyebrow")}</span>
      <h2 id="terminal-heading">${t("terminalHeading")}</h2>
      <p class="muted">${t("terminalEmpty")}</p>
    </section>
  </div>`;
}
