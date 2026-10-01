# Tentative Schedule and Milestones

This is a relative planning estimate, not a record of completed work or a delivery commitment. Week 1 starts with browser implementation; the existing Bun bootstrap and documentation do not imply that Milestone 1 is complete.

The [development plan](06_development_plan.md) owns tasks and exit criteria. This table only groups that work into tentative time windows.

| Milestone | Initial time window | Scope in the development plan |
| --- | --- | --- |
| 1 — Shell and onboarding | Week 1 | Phases 0–2: deployed browser shell and Prologue; Episode 01 may still be unavailable |
| 2 — First complete episode | Week 2 | Phase 3: Episode 01 vertical slice and playtest |
| 3 — Diagnostic foundation | Weeks 3–4 | Phase 4: Episodes 02–05 |
| 4 — Visible game-device behavior | Weeks 5–6 | Phase 5: Episodes 06–09 |
| 5 — Performance bugs | Weeks 7–8 | Phase 6: Episodes 10–13 |
| 6 — Bare-metal game | Weeks 9–10 | Phase 7: Episodes 14–17 |
| 7 — OS foundations | Weeks 11–13 | Phase 8: Episodes 18–24 and runtime feasibility decision |
| 8 — Linux bring-up | Weeks 14–15 | First part of Phase 9: Episodes 25–28 |
| 9 — Ending and epilogue | Week 16 | Remaining Phase 9 and Phase 10: Episodes 29–33 |

The later windows preserve the initial planning outline but are placeholders. Reestimate after the Episode 01 playtest, the bare-metal milestone, and especially the Linux runtime investigation. A new kernel-capable execution environment cannot be assumed to fit the original estimate.

If a milestone slips, reduce chapter depth or count using the [product priorities](01_product_vision.md#rewards-and-priorities). Do not respond by adding speculative infrastructure. Track completed work in the [backlog](13_pm_backlog.md), not by advancing this schedule's week labels.
