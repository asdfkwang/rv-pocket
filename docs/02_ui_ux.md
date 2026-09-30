# UI / UX Specification

## Global navigation

The top-left control selects a chapter. The top-right control selects one of three views, using these labels and internal IDs consistently:

| Label | ID | Purpose |
| --- | --- | --- |
| Workbench | `workbench` | Inspect the physical machine and connect equipment |
| Computer | `computer` | Run diagnostics and guided repair actions |
| Manual | `manual` | Look up explanations and answer short quizzes |

Older notes used “Full” for Workbench and “Document” for Manual; those are aliases, not additional views. RV Pocket is an object in the Workbench, not a fourth view.

Any implemented chapter can be selected directly. Future roadmap entries are not playable until implemented; no persistent unlock system is needed.

## State and navigation behavior

Keep the selected chapter, selected view, and the active mission state separate.

- Switching views preserves both the chapter and its current mission state.
- Selecting a different chapter creates that chapter's initial mission state and preserves the selected view.
- Loading a direct chapter URL starts that chapter fresh; use Workbench if no valid view is specified.
- Selecting an unavailable chapter URL falls back to Chapter 00 with a short explanation.
- Reset restores the active mission to its initial state without changing the chapter or view.
- Reloading the page starts fresh. The prototype has no save/load or cross-chapter progress persistence.

Each chapter starts with the prerequisite repairs represented in its initial state, so jumping to a later chapter does not require playing earlier missions. Narrative continuity does not require carrying mutable state across chapters. The [Chapter contract](08_content_and_data_model.md) defines state creation.

## Views

### Workbench

Use simple text buttons for RV Pocket, Computer, Manual, and mission-specific equipment such as the UART cable. Clicking an object should perform or reveal a concrete action: inspect the board, connect the cable, or switch to the relevant view.

### Computer

Show only tools needed by the current chapter. Chapter 01 needs a terminal and a guided UART task. Memory inspection, registers, stepping, DMA, and other panels arrive only when their missions need them.

### Manual

Show the current mission's explanations and quiz, with relevant earlier material available as reference. Do not expose future topics as prerequisites. All three views remain usable in Chapter 00; its Manual contains interface help only.

## Guided interactions

Prefer choices, code tiles, ordering, and small value fields. Later missions may introduce addresses, registers, and constrained code fragments as the [learning design](04_learning_design.md) permits. Do not turn the prototype into a free-form programming environment.

For Chapter 01, show named UART controls and the supplied value `65 ('A')`; no address calculation or instruction syntax is required. Its exact interaction and feedback are specified in the [Chapter 01 mission](03_chapter_roadmap.md#chapter-01--is-anyone-there).

## Feedback

Display the mission summary and initial symptom before an explanation. Invalid actions should explain the observed machine behavior and allow immediate retry. Successful repair must produce both a machine result and a clear completion message.

Use text, CSS, and ASCII for feedback. A terminal character, PASS status, changing counter, or simple block on a screen can carry the reward without graphical assets.
