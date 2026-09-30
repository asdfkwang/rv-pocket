// Keep all dynamic text inert when composing the small, framework-free views.
export function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export const viewLabels = { workbench: "Workbench", computer: "Computer", manual: "Manual" } as const;
