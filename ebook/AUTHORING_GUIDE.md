# Authoring Guide

Each chapter follows this order: `Why This Matters → Core Idea → Worked Example → The Same Idea Elsewhere → When It Fails → Check → Limits → Go Deeper → Related`.

- Body targets 3–5 minutes: one concrete case, one traced example with real values, no boilerplate closings. Explain every term on first use; later chapters may rely on it.
- `When It Fails` shows one plausible-but-wrong approach and why it fails.
- `Limits` states 2–4 lines of accuracy boundary: what is simplified, virtual, or deferred to the linked spec.
- No `Trace It` repetition section and no generic takeaway bullets.
- `Related` lists neighboring chapters by number (matches the TOC order).

The main text targets a level where a beginner gains a mental model within 3–10 minutes. Do not cover every exception. Make Checks clearly harder than the main text and have readers track state such as register/memory/PC/task/buffer ownership. At least one problem may require searching the official specification or upstream source.

Do not include a game-specific `ON RV POCKET` section. Episodes use this eBook chapter only as a recommended link when needed.

## Check authoring

Each numbered Check item is one slider card. Write the question first, then optional fields:

```text
1. Question text?
   - A) First choice
   - B) Second choice
   - Answer: B
   - Explanation: Why B is right and the rest are wrong.
   > Hint: Nudge without giving it away.
```

- No `Choices`/`Answer` lines means an open question (think about it; hint + AI prompt only).
- One answer letter means single choice (radio); several comma-separated letters mean select-all (checkboxes). Choice count is free, not fixed at four.
- Grading is strict: the selected set must equal the answer set. Players confirm with the check button and can retry.
- `Explanation` and `Hint` are optional but recommended. Explanations show after confirming; hints hide behind a Hint button.
