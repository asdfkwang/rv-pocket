# UI / UX Specification

## Global navigation

The top-left control selects an episode. The top-right control selects one of three views, using these labels and internal IDs consistently:

| Label | ID | Purpose |
| --- | --- | --- |
| Workbench | `workbench` | Inspect the physical machine and connect equipment |
| Computer | `computer` | Run diagnostics and guided repair actions |
| Manual | `manual` | Look up explanations and answer short quizzes |

Older notes used “Full” for Workbench and “Document” for Manual; those are aliases, not additional views. RV Pocket is an object in the Workbench, not a fourth view.

Any implemented episode can be selected directly. Future roadmap entries are not playable until implemented; no persistent unlock system is needed.

## State and navigation behavior

Keep the selected episode, selected view, and the active episode state separate.

- Switching views preserves both the episode and its current episode state.
- Selecting a different episode creates that episode's initial episode state and preserves the selected view.
- Loading a direct episode URL starts that episode fresh; use Workbench if no valid view is specified.
- Selecting an unavailable episode URL falls back to the Prologue with a short explanation.
- Reset restores the active episode to its initial state without changing the episode or view.
- Reloading the page starts fresh. The prototype has no save/load or cross-episode progress persistence.

Each episode starts with the prerequisite repairs represented in its initial state, so jumping to a later episode does not require playing earlier episodes. Narrative continuity does not require carrying mutable state across episodes. The [Episode contract](08_content_and_data_model.md#canonical-episode-contract) defines state creation.

## Views

### Workbench

Use simple text buttons for RV Pocket, Computer, Manual, and episode-specific equipment such as the UART cable. Clicking an object should perform or reveal a concrete action: inspect the board, connect the cable, or switch to the relevant view.

### Computer

Show only tools needed by the current episode. Episode 01 needs a terminal and a guided UART task. Memory inspection, registers, stepping, DMA, and other panels arrive only when their episodes need them.

### Manual

Show the current episode's explanations and quiz, with relevant earlier material available as reference. Do not expose future topics as prerequisites. All three views remain usable in the Prologue; its Manual contains interface help only.

## Guided interactions

Prefer choices, code tiles, ordering, and small value fields. Later episodes may introduce addresses, registers, and constrained code fragments as the [learning design](04_learning_design.md) permits. Do not turn the prototype into a free-form programming environment.

For Episode 01, show named UART controls and the supplied value `65 ('A')`; no address calculation or instruction syntax is required. Its exact interaction and feedback are specified in the [Episode 01 script](03_episode_roadmap.md#episode-01--output-in-the-wrong-place).

## Feedback

Display the episode Problem and Objective before an explanation. Invalid actions should explain the observed machine behavior and allow immediate retry. Successful repair must produce both a machine result and a clear completion message.

Use text, CSS, and ASCII for feedback. A terminal character, PASS status, changing counter, or simple block on a screen can carry the reward without graphical assets.
