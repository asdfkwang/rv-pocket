# Product Vision

## Premise and player goal

The player's parents ran a small game company that went bankrupt. They left behind a broken RV Pocket prototype, its technical manual, a development computer, and a few cables and tools.

The player investigates and repairs the machine until it becomes a functioning Linux-based game device. Each repair should make low-level hardware behavior tangible and give the player a reason to care about the next subsystem.

## Problem-first design

Every repair episode begins with a malfunction or concrete repair objective:

1. Present the broken behavior.
2. Let the player inspect and experiment.
3. Make the missing information discoverable in the Manual.
4. Offer a short explanation and reasoning quiz there.
5. Let the player apply the idea through the Computer or Workbench.
6. Show a visible or measurable improvement.

This is an intended learning loop, not a forced screen sequence. The Manual remains available throughout the episode; knowing players can attempt the repair directly. Success depends on the repaired machine, not on opening the Manual or passing a quiz first. See [learning design](04_learning_design.md) for quiz policy.

The Prologue is the explicit exception: it introduces the story and interface, with no hardware lesson, quiz, or repair requirement.

## Hardware before software

Introduce behavior before its abstraction: observation → explanation → software interaction. A player first sees polling consume work, then learns why an interrupt helps; first sees stale DMA data, then learns why cache maintenance is needed.

The [roadmap](03_episode_roadmap.md) owns the exact order and scope. Its broad progression is diagnostic access → repaired bare-metal hardware → a playable bare-metal game → OS foundations → Linux boot → restored Linux hardware support.

## Rewards and priorities

Every repair must have an observable payoff: the first UART character, a value landing in RAM, a correct timer interval, responsive input, a working display, smoother rendering, restored sound, and eventually a Linux login and a playable old company game.

When scope or schedule is constrained, prioritize:

1. Problem clarity.
2. Interaction quality.
3. Hardware learning value.
4. Immediate machine feedback.
5. Code simplicity.
6. Number of episodes.
7. Visual polish.

## Ending and epilogue

The main story ends with the full power-on path through firmware, Linux, drivers, and the old game. Actual Linux execution is a long-term goal; a scripted boot log must not be presented as a running kernel. Its runtime choice is deferred in [technical architecture](05_technical_architecture.md).

The epilogue is one constrained kernel-style fix, a diff and commit message, a simulated review, and one revision. The static prototype can use authored maintainer comments; it does not depend on a live AI service or send a real patch. Kernel contribution remains a brief taste rather than the main subject.
