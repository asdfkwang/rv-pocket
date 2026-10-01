export function renderTerminal(): string {
  return `<div class="terminal-screen">
    <div class="back-row"><button id="terminal-back" class="text-button" data-action="view" data-view="station">← Back</button></div>
    <section class="panel" aria-labelledby="terminal-heading">
      <span class="eyebrow">SERIAL TERMINAL</span>
      <h2 id="terminal-heading">Terminal.</h2>
      <p class="muted">Empty for now. Wiring comes with the episodes.</p>
    </section>
  </div>`;
}
