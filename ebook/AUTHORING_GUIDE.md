# Authoring Guide

Write a standalone computer-systems book for university students who know basic programming and can read small C examples involving variables, functions, loops, arrays, and pointers. Teach assembly, privileged execution, OS mechanisms, and driver interfaces within the book. Episode order and game progression do not determine the book's explanations.

## Explain the question, not just the terminology

- Give each chapter a concrete question it resolves and identify the earlier knowledge it uses. Definitions should serve an explanation the reader can follow.
- Let the necessary reasoning determine length. There is no 3–5 minute limit and no mandatory nine-section template. Use descriptive section headings that expose the argument.
- Include a worked case with initial conditions, actual values, intermediate state, and a final observation. A list of component names or API calls alone is not a worked example.
- Show why a tempting approach fails, then show how the correct mechanism resolves that failure. Distinguish a stated assumption from an architectural or API guarantee.
- Connect chapters through previously explained mechanisms and recurring examples. Do not force every chapter to preview every system layer. A forward reference may orient the reader, but must not replace the explanation needed now.
- Use the teaching RV64 little-endian machine and explicitly fictional UART map consistently. Label pseudocode, omitted production behavior, and examples that introduce a different device.
- End the explanatory material with the connection to the next question, not generic takeaway slogans. Keep chapter filenames stable when the teaching order does not require a move, because bookmarks and external translations use those identities.

## Difficulty and evidence

Checks are intentionally demanding and open-book/open-web. Use calculations, traces, counterexamples, diagnosis with discriminating observations, and focused primary-source research. Specify enough initial state to make a question answerable. Do not claim that one observation proves a unique cause when several causes remain possible. Mark research challenges and identify the relevant reference. Hard questions should extend reasoning, not depend on accidentally omitted premises.

Keep `## Check` as one H2 section for the reader's question cards. Put assumptions that govern solving before the questions. Follow it with `## Limits`, `## Go Deeper`, and `## Related`; all must appear in the rendered reader in source order. Limits should state concrete simplifications. References should say what to inspect, and Related should use working chapter links.

Use primary specifications and upstream kernel documentation to check exact architectural and API claims. Source-reading exercises must ask readers to record the kernel/spec revision; moving upstream branches are not a fixed ABI. Avoid invented measurements or broad claims such as “every interrupt switches tasks.”

Edit English source only unless translation is explicitly requested. Existing Korean source is maintained separately and must remain untouched during an English revision.

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

## Korean translation (ebook/ko/)

`ebook/ko/chapters/NN_*.md` mirrors the English files one-to-one. The TOC in `ebook/ko/README.md` lists `챕터 NN — English Title` and links to `ko/chapters/...`.

- Translate headings too: `## Why This Matters` becomes `## 왜 중요한가`, `## Core Idea` → `## 핵심 아이디어`, `## Worked Example` → `## 풀어낸 예`, `## The Same Idea Elsewhere` → `## 같은 아이디어, 다른 곳에서`, `## When It Fails` → `## 실패하는 경우`, `## Limits` → `## 정확성의 경계`, `## Go Deeper` → `## 더 깊이`, `## Related` → `## 관련 챕터`. `## Check` becomes `## 체크`.
- The Check block must keep the machine-parsed structure exactly: question, `   - A)` choices, `   - Answer: B` (or `정답: B`), `   - Explanation:` (or `해설:`), `   > Hint:`. Letters stay `A`/`B`/`C` — never localize them.
- Keep code blocks, registers, addresses, and hex values identical to the English source. Translate only the prose and comments inside ASCII diagrams when they are words.
- `Related` lists `챕터 NN` instead of `Chapter NN`.
- Untranslated chapters fall back to the English file automatically, so a partial `ebook/ko/` is safe.
