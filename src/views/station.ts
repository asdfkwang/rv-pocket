import { t } from "../i18n";

export function renderStation(): string {
  return `<div class="station">
    <section class="device-panel panel" aria-labelledby="device-heading">
      <span class="eyebrow">${t("stationEyebrow")}</span>
      <h2 id="device-heading">${t("stationDeviceHeading")}</h2>
      <span class="device" aria-hidden="true">
        <span class="device-top"><span>RV POCKET</span><span class="power-light"></span></span>
        <span class="device-screen"></span>
        <span class="device-controls"><span class="dpad"></span><span class="speaker">||||||</span><span class="game-buttons"><span>B</span><span>A</span></span></span>
        <span class="device-bottom">DEVELOPMENT UNIT <span>001</span></span>
      </span>
      <p class="device-caption">${t("stationCaption")}</p>
      <div class="connection-strip">
        <div><span class="eyebrow">${t("stationUartCable")}</span><p class="connection-label"><span class="status-dot connected"></span>${t("stationConnected")}</p></div>
      </div>
    </section>
    <div class="station-buttons">
      <button id="open-ebook" class="station-button" data-action="view" data-view="ebook"><span class="station-mark" aria-hidden="true">M</span><strong>${t("ebook")}</strong></button>
      <button id="open-terminal" class="station-button" data-action="view" data-view="terminal"><span class="station-mark" aria-hidden="true">&gt;_</span><strong>${t("terminal")}</strong></button>
    </div>
  </div>`;
}
