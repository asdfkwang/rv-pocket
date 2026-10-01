# Chapter 38 — Reading a Linux Driver

> **Part VIII — A Complete System**

## How do you read a driver without getting lost?

Reading a driver from its first include to its last registration often obscures the control flow. Callbacks can be defined far from the code that registers them, and asynchronous work can run long after its initiating function returns. Start with one question and build a map of entry points, state, and lifetime around it.

For a reproducible example, use Linux v6.12's gpio-keys source linked below. The question is: how can a GPIO change become an input report while respecting whether reading that GPIO may sleep? We will identify a bounded path and leave unrelated functionality for targeted follow-up.

## Locate the wiring before following execution

The following source landmarks connect Chapter 35's conceptual path to the chosen revision:

| Purpose | Landmark |
| --- | --- |
| Driver registration | `gpio_keys_device_driver` |
| Per-device initialization | `gpio_keys_probe` |
| Per-button setup | `gpio_keys_setup_key` |
| GPIO interrupt entry | `gpio_keys_gpio_isr` |
| Deferred alternatives | `gpio_keys_gpio_work_func`, `gpio_keys_debounce_timer` |
| Reporting | `gpio_keys_debounce_event`, `gpio_keys_gpio_report_event` |
| Deferred activity cleanup | `gpio_keys_quiesce_key` |

In the GPIO-backed path, setup selects debounce handling using the GPIO's sleeping constraints. The ISR schedules the chosen timer/work path. Reporting obtains GPIO state and emits an input event; the debounce wrapper adds input synchronization. The quiesce action cancels the relevant deferred activity. The file also supports an IRQ-only path, which should not be merged into this GPIO-backed trace.

Those landmarks are a map, not a substitute for reading their conditions. Open the linked revision and verify each edge for the selected configuration. A call found elsewhere in the file may belong to suspend/resume or a different device arrangement.

## Annotate a path with obligations

For any driver, build a small table containing caller, execution context, state read/written, and the condition allowing the next step. Then follow one concrete event with selected values: released before entry, stable pressed afterward, one chosen key code, and no suspend transition.

At a deferred boundary, draw two arrows. One records the scheduling request now; the other records execution later. The original callback may return between them. This explains why its local variables cannot be used later unless the needed data lives in a longer-lived object.

For every state pointer, ask how the callback obtains it and who owns that allocation. For every lock, identify every competing access rather than assuming the nearest write is the only one. For every helper, inspect its contract before inferring behavior from its name.

Suppose a hypothetical path reads a GPIO in process context successfully but fails when moved into hard IRQ context. The important difference may be the accessor's ability to sleep, not the numeric GPIO value. A source trace that lists only function names misses the constraint that explains the failure.

## Follow one failure path with equal care

After understanding the successful path, choose a resource acquisition that can fail. Record which earlier resources exist at that point and where they are released. Include managed release actions: absence of a large remove function does not prove absence of cleanup, and the presence of devm calls does not prove every asynchronous dependency is safe.

Now choose a callback that can run after setup returns. Identify what stops further scheduling, what waits for in-flight activity, and what happens to state if initialization fails late. Chapter 28's resource table and Chapter 30's teardown timeline provide the tools for this reading.

Avoid converting an unfamiliar pattern into an immediate bug report. First establish its preconditions and framework guarantees. A helper may already provide synchronization; conversely, a reassuring comment may omit a real concurrent caller. Evidence requires following the call and lifetime relationships.

## Produce an explanation another reader can verify

A useful source-reading note states the revision, selected configuration, entry-to-result path, important state transitions, and unresolved questions. It points to exact functions or stable line links without copying the entire file. Someone else should be able to repeat the trace and determine where your interpretation depends on an assumption.

Chapter 39 applies that practice to a failure across several layers, where no single file contains the full explanation.

## Check

1. Why record a fixed source revision before tracing callbacks?
   - A) Function signatures and implementation paths can change.
   - B) A revision makes every hardware assumption true.
   - C) It removes the need to inspect helper contracts.
   - Answer: A
   - Explanation: Reproducibility identifies the code being explained; it does not supply missing device or framework guarantees.

2. Which belong in an asynchronous path annotation? Select all that apply.
   - A) The scheduling point and later execution point
   - B) The lifetime of the callback's state
   - C) Whether the callback may sleep
   - Answer: A, B, C
   - Explanation: These explain constraints that a plain call-name list cannot capture.

3. Using the fixed source revision, complete the selected GPIO-backed trace for a stable press. Record the branch conditions needed to follow one deferred path and identify where a different configuration selects another path.

4. Choose one setup failure after some resources were acquired. Draw the rollback and state-lifetime argument, including managed actions, and identify one assumption you had to verify in a framework helper.

5. Research challenge: compare the chosen revision with another release. Find one meaningful change or document that your selected path is unchanged. Explain how to update the reading note without assuming that identical function names imply identical behavior.

## Limits

The source landmarks describe one fixed revision and a selected GPIO-backed case. They are not a complete audit of gpio-keys or a promise about newer kernels. The reusable result is the method: follow context, data, lifetime, and evidence across actual callback registrations.

## Go Deeper

- [Linux v6.12 gpio-keys source](https://github.com/torvalds/linux/blob/v6.12/drivers/input/keyboard/gpio_keys.c) — verify the bounded path at a fixed revision.
- [Linux GPIO consumer API](https://docs.kernel.org/driver-api/gpio/consumer.html) — check accessor context and polarity contracts.
- [Linux managed resources](https://docs.kernel.org/driver-api/driver-model/devres.html) — understand cleanup hidden behind managed actions.

## Related

- [Chapter 37 — Reading a Datasheet](37_reading_a_datasheet.md)
- [Chapter 39 — Bugs Across Layers](39_bugs_across_layers.md)
