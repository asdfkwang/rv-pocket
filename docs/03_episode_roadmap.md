# Episode Roadmap

This roadmap is organized around **broken behavior and repair objectives**, not academic topic names. It follows one development story: building a finished device that boots Linux from a clean image with working game, input, display, sound, and storage — **observation → first execution → integration → performance and stability → independent boot → Linux driver integration → reproducible finished product**.

Each episode solves a real problem found in that process. Features earned by repair become the tools that investigate the next problem. The earlier 33-episode outline and the Ebook table of contents are not used as fixed frames.

Use the [canonical Episode contract](08_content_and_data_model.md#canonical-episode-contract) for implementation and the [learning design](04_learning_design.md) for depth and quiz policy. The Prologue is onboarding; every later episode starts with a malfunction or concrete repair objective and ends with an observable result.

Each episode document records:

- **증상 (Symptom):** what the player first observes.
- **실제 원인 (Actual cause):** what is really wrong.
- **관찰 가능한 증거 (Observable evidence):** what the player can check.
- **시험할 가설 (Hypotheses to test):** candidate explanations to try.
- **수정할 대상 (Fix target):** what to change.
- **성공 판정 (Success criterion):** the observable outcome of a successful repair.
- **다음 문제와의 연결 (Link to next):** how this repair becomes a tool for the next problem.

---

## Prologue — Before You Begin

The game opening. Understand what was left behind and learn the interface.

- Story setup.
- Episode selector.
- STATION / PC / DATASHEET / BOOK views; inspect Pocket from STATION.
- No hardware lesson or quiz; the Manual contains interface help only.
- Start Episode 01 action.

**Result:** Player is ready to begin repairs.

---

## 01–03: Trustworthy observation

### Episode 01 — Wrong Byte

- **증상:** The parents' Pocket powers on, and the last `boot.S` project is open. The connected serial terminal receives `B`; the expected output is `A`.
- **실제 원인:** The boot code sends the wrong byte, `0x42`, to the UART data register at the fictional RV Pocket address `0xD4110000`.
- **관찰 가능한 증거:** The source byte, received character, connected cable, and a brief TX LED pulse on boot. The display stays black.
- **시험할 가설:** A different byte in the same boot code produces a different received character.
- **수정할 대상:** Only the immediate value in `li t1, [0x42]`. The remaining source is locked. DATASHEET supplies `A = 0x41` and `B = 0x42`; BOOK provides separate study chapters and checks.
- **성공 판정:** Build & Flash completes, the Pocket reboots, and the PC receives `A`, producing `UART PASS`. Editing without flashing does not change the output; Reset alone reruns the installed firmware.
- **다음 문제와의 연결:** The serial terminal becomes the shared observation tool for Episode 02's memory diagnostic. Episode 01 requires no quiz or reading gate.

### Episode 02 — False Memory Failure

- **증상:** UART already passes, but `memtest.S` reports different RAM failure addresses on repeated runs.
- **실제 원인:** The check overwrites its own working area, so it manufactures the failures it reports.
- **관찰 가능한 증거:** Failures move within MEMTEST WORKAREA, `0x00001800–0x000019FF`, inside the 8 KiB diagnostic RAM window. The PC memory map shows the reserved area and highlights overlap with the draft range.
- **시험할 가설:** The RAM is broken / the check range covers its own workspace.
- **수정할 대상:** START and END for the supplied diagnostic. END is excluded. RUN tries the draft range; Build & Flash installs it for RESET.
- **성공 판정:** A non-empty RAM range excluding the workspace passes. For START `0x00001A00` and END `0x00002000`, serial output reports PASS, 1536 bytes checked, and 0 errors; the Pocket readout also shows PASS.
- **다음 문제와의 연결:** Trusted memory inspection supports every later diagnosis.

### Episode 03 — Wrong Clock

- **증상:** UART and RAM pass, but serial ticks and the timer LED pulse every two seconds instead of one.
- **실제 원인:** The supplied diagnostic waits for 10,000,000 counter ticks while its selected source is only 5 MHz.
- **관찰 가능한 증거:** TIMER at `0xA2180000`, applied counter rate, fixed target ticks, configured delay, and elapsed browser time measured between serial ticks. DATASHEET gives the clock-to-delay relationship.
- **시험할 가설:** The diagnostic logic is wrong / the counter runs at an unexpected rate.
- **수정할 대상:** Clock source: 5, 10, or 20 MHz. Build & Flash applies the selected source and restarts the diagnostic; the target remains 10,000,000 ticks.
- **성공 판정:** After applying 10 MHz, at least two live ticks establish an observed interval within 200 ms of one second. TIMER PASS completes BASIC DIAGNOSTICS COMPLETE with UART and RAM already passing.
- **다음 문제와의 연결:** Reliable timing is the basis for input handling and animation later. Display bring-up is next; the Pocket screen remains black in this episode.

---

## 04–07: A first manipulable device

### Episode 04 — Black Screen First

- **증상:** Only a black screen; nothing was ever initialized.
- **실제 원인:** The display initialization order is wrong.
- **관찰 가능한 증거:** Init sequence log; registers never enabled.
- **시험할 가설:** The screen hardware is dead / init steps run in the wrong order.
- **수정할 대상:** The initialization sequence.
- **성공 판정:** The display initializes and shows output.
- **다음 문제와의 연결:** A live screen makes position and movement problems visible.

### Episode 05 — Off the Screen

- **증상:** A marker or status block renders outside the visible screen.
- **실제 원인:** A coordinate/address calculation error.
- **관찰 가능한 증거:** Computed coordinates vs. screen bounds; single-stepped calculation.
- **시험할 가설:** The display is misconfigured / the address math is wrong.
- **수정할 대상:** The calculation.
- **성공 판정:** The marker appears where intended.
- **다음 문제와의 연결:** Correct addressing is reused for sprites, buffers, and DMA targets.

### Episode 06 — One Press, Endless Move

- **증상:** One button press keeps moving the target forever.
- **실제 원인:** The code reacts to input *state* instead of input *change*.
- **관찰 가능한 증거:** Button state trace vs. movement log; press-and-hold vs. single-press behavior.
- **시험할 가설:** The button is stuck / the handler never sees release.
- **수정할 대상:** The input handling: detect change, not level.
- **성공 판정:** One press moves exactly once.
- **다음 문제와의 연결:** State-vs-change thinking returns in interrupts and event waiting.

### Episode 07 — Frozen While Waiting

- **증상:** While waiting for input, the screen and diagnostics stop.
- **실제 원인:** A blocking wait holds the whole loop.
- **관찰 가능한 증거:** Frozen frame counter during waits; input arrives but nothing updates.
- **시험할 가설:** The screen task crashed / the wait never yields.
- **수정할 대상:** The wait: switch to an event-processing flow.
- **성공 판정:** The screen stays alive while waiting for input.
- **다음 문제와의 연결:** Event flow is the foundation for interrupt-driven input and async waits.

---

## 08–12: A demo worth using

### Episode 08 — CPU-Bound Copy

- **증상:** Screen copies hold the CPU; nothing else progresses during transfers.
- **실제 원인:** The CPU copies every byte itself instead of handing the transfer off.
- **관찰 가능한 증거:** CPU busy during copies; frame time dominated by the copy loop.
- **시험할 가설:** The copy algorithm is slow / the CPU should not be doing the copy.
- **수정할 대상:** Connect a DMA transfer for the copy.
- **성공 판정:** The copy completes without holding the CPU.
- **다음 문제와의 연결:** DMA introduces buffer ownership questions.

### Episode 09 — Old Frames

- **증상:** Faster now, but previous frames sometimes show.
- **실제 원인:** Stale cache/buffer contents reach the display; ownership of the buffer is untracked.
- **관찰 가능한 증거:** Cache vs. RAM contents; which buffer the display reads.
- **시험할 가설:** DMA wrote the wrong data / the display reads a stale buffer.
- **수정할 대상:** Cache and buffer ownership tracking.
- **성공 판정:** The display consistently shows current data.
- **다음 문제와의 연결:** Coherency discipline is reused for device buffers under Linux.

### Episode 10 — Vanishing Transfer Bug

- **증상:** A transfer error disappears as soon as logging is added.
- **실제 원인:** An access-ordering problem; observation changes timing enough to hide it.
- **관찰 가능한 증거:** Failure with and without logging; order of descriptor writes vs. device start.
- **시험할 가설:** The log fixes the bug / the access order is wrong.
- **수정할 대상:** The access order.
- **성공 판정:** Transfers succeed deterministically, with or without logging.
- **다음 문제와의 연결:** Ordering discipline is reused for calls, stacks, and device startup.

### Episode 11 — Broken Return

- **증상:** One specific restart path breaks function returns.
- **실제 원인:** Call state and the stack are not tracked across that path.
- **관찰 가능한 증거:** Return addresses and stack contents on the failing path vs. working paths.
- **시험할 가설:** The function is wrong / the restart path corrupts call state.
- **수정할 대상:** The restart path's call/stack handling.
- **성공 판정:** All restart paths return correctly.
- **다음 문제와의 연결:** Call/stack discipline supports traps, firmware handoff, and context switches.

### Episode 12 — The Quiet Game

- **증상:** The demo runs but has no audio, and the pieces have never run as one game.
- **실제 원인:** Leftover audio initialization was never restored; integration was never attempted.
- **관찰 가능한 증거:** Audio init state; each subsystem passing alone.
- **시험할 가설:** The audio hardware is dead / init was skipped during bring-up.
- **수정할 대상:** Restore audio init; integrate screen, input, and sound into a small game.
- **성공 판정:** A stable bare-metal demo with screen, input, and sound.
- **다음 문제와의 연결:** A working demo is the baseline that must survive without the development PC.

---

## 13–15: To Linux without the development PC

### Episode 13 — Won't Boot Untethered

- **증상:** With the debugger detached, the device does not boot.
- **실제 원인:** Initialization the development tools performed silently was never moved into the boot process.
- **관찰 가능한 증거:** Boot log with debugger attached vs. detached; which init steps have no in-device owner.
- **시험할 가설:** The board needs the debugger / some init step only exists on the PC side.
- **수정할 대상:** Move the initialization into the on-device boot process.
- **성공 판정:** The device boots with no debugger attached.
- **다음 문제와의 연결:** An autonomous boot is the prerequisite for firmware handoff.

### Episode 14 — Stuck at Handoff

- **증상:** Firmware runs, then everything stops at the handoff to the kernel.
- **실제 원인:** The handoff conditions the kernel requires are not met.
- **관찰 가능한 증거:** Last firmware log lines; expected vs. actual handoff state.
- **시험할 가설:** The kernel image is broken / the handoff state is incomplete.
- **수정할 대상:** The handoff conditions.
- **성공 판정:** Control visibly transfers into the kernel.
- **다음 문제와의 연결:** A clean handoff is what later Device Tree and boot-arg problems build on.

### Episode 15 — No Shell

- **증상:** Kernel logs appear, but the boot never reaches a shell.
- **실제 원인:** Hardware description, boot arguments, or the root filesystem connection is wrong.
- **관찰 가능한 증거:** Kernel log tail; which device or mount step fails.
- **시험할 가설:** The kernel crashed / userspace was never found.
- **수정할 대상:** The hardware description, boot arguments, or root filesystem setup.
- **성공 판정:** The boot reaches a shell login.
- **다음 문제와의 연결:** A booting system exposes the driver integration problems next.

---

## 16–21: Integration problems under Linux

### Episode 16 — Unbound Display

- **증상:** Linux boots, but the screen is black again: no driver is bound to the display device.
- **실제 원인:** Driver-device matching fails for the display.
- **관찰 가능한 증거:** Bound-driver list; device vs. driver tables.
- **시험할 가설:** The display hardware regressed / matching information is missing.
- **수정할 대상:** The driver binding for the display.
- **성공 판정:** Linux drives the display.
- **다음 문제와의 연결:** Binding is the pattern reused for input and audio.

### Episode 17 — Endless Interrupts

- **증상:** One button press fires interrupts forever.
- **실제 원인:** The interrupt source is never acknowledged or cleared.
- **관찰 가능한 증거:** Interrupt counters climbing from a single press.
- **시험할 가설:** The button is stuck / the handler never completes its acknowledge step.
- **수정할 대상:** The acknowledge/clear step in the interrupt path.
- **성공 판정:** One press produces a bounded interrupt sequence.
- **다음 문제와의 연결:** Clean interrupt handling is required before blocking waits can work.

### Episode 18 — Unresponsive While Waiting

- **증상:** While waiting for the device, whole-system responsiveness collapses.
- **실제 원인:** The wait blocks instead of sleeping for the event.
- **관찰 가능한 증거:** Latency measurements during device waits.
- **시험할 가설:** The device is slow / the wait never yields the CPU.
- **수정할 대상:** The wait: sleep for the event instead of spinning.
- **성공 판정:** The system stays responsive during device waits.
- **다음 문제와의 연결:** Proper waiting is what later sleep/wakeup mechanisms formalize.

### Episode 19 — Wrong Address Kind to DMA

- **증상:** Screen data is corrupted when DMA is involved.
- **실제 원인:** DMA is handed the wrong kind of address for the buffer.
- **관찰 가능한 증거:** Buffer addresses vs. what the device actually reads; corruption pattern.
- **시험할 가설:** The buffer contents are wrong / the address passed to DMA is not a device-usable address.
- **수정할 대상:** The address mapping for DMA buffers.
- **성공 판정:** DMA-transferred screen data is intact.
- **다음 문제와의 연결:** Address-kind discipline returns in storage and userspace mapping.

### Episode 20 — Freed Memory Touched

- **증상:** Right after the game exits, an in-flight transfer touches released memory.
- **실제 원인:** Lifetime is unmanaged: the transfer outlives its buffer.
- **관찰 가능한 증거:** Transfer completion vs. buffer release order; fault address matching the old buffer.
- **시험할 가설:** The game corrupts memory on exit / the transfer is not synchronized with teardown.
- **수정할 대상:** Buffer lifetime vs. transfer completion.
- **성공 판정:** Exit never touches released memory.
- **다음 문제와의 연결:** Lifetime thinking is reused for process and driver teardown.

### Episode 21 — Sleeper Never Wakes

- **증상:** The event fires, but the waiting program never wakes.
- **실제 원인:** The wakeup path between event and waiter is broken.
- **관찰 가능한 증거:** Event log shows the event; waiter state stays asleep.
- **시험할 가설:** The event never fired / the waiter waits on the wrong condition.
- **수정할 대상:** The event-to-wakeup connection.
- **성공 판정:** The waiter wakes on the event.
- **다음 문제와의 연결:** Reliable wakeup is the basis for input, audio, and storage waits.

---

## 22–25: Tying the finished product

### Episode 22 — Sound Gone After Reboot

- **증상:** Sound works until reboot, then disappears.
- **실제 원인:** Linux device initialization and resource management skip the audio setup.
- **관찰 가능한 증거:** Audio init state before vs. after reboot.
- **시험할 가설:** The audio hardware is unreliable / init is not owned by any driver path.
- **수정할 대상:** The Linux audio initialization and resource handling.
- **성공 판정:** Sound survives reboot.
- **다음 문제와의 연결:** Managed initialization is the pattern storage must follow too.

### Episode 23 — Storage That Forgets

- **증상:** A save reports success but is gone after reboot.
- **실제 원인:** The write never reaches the real storage path.
- **관찰 가능한 증거:** Reported write vs. bytes on the medium after reboot.
- **시험할 가설:** The medium is broken / the write path ends before the medium.
- **수정할 대상:** The real storage path.
- **성공 판정:** Saved data survives reboot.
- **다음 문제와의 연결:** A verified storage path is required for a reproducible image.

### Episode 24 — Clean Image Won't Boot

- **증상:** Everything works in the development environment, but a fresh image does not boot.
- **실제 원인:** Missing components and packaging dependencies that the dev environment silently provided.
- **관찰 가능한 증거:** Dev-environment boot vs. clean-image boot; component inventory diff.
- **시험할 가설:** The image is corrupt / something the dev setup provides was never packaged.
- **수정할 대상:** The missing components and packaging.
- **성공 판정:** A clean image boots.
- **다음 문제와의 연결:** A reproducible image is what the final regression gate tests.

### Episode 25 — Regression Gate

- **증상:** No single check proves the device is finished.
- **실제 원인:** Cold boot, repeated runs, input, display, audio, and storage were never verified together.
- **관찰 가능한 증거:** The per-area results from Episodes 22–24.
- **시험할 가설:** Individual passes imply a finished product (they do not).
- **수정할 대상:** Whatever the combined gate catches.
- **성공 판정:** Cold boot, repeated runs, input, display, audio, and storage regression checks all pass.
- **다음 문제와의 연결:** A finished device earns its epilogue: explaining one fix properly.

---

## Episode 26 — Epilogue: One Last Patch

- **증상:** One small driver problem remains, unexplained.
- **실제 원인:** A constrained, realistic driver bug.
- **관찰 가능한 증거:** Reproduction, plus the evidence collected for the fix.
- **시험할 가설:** Candidate causes narrowed by observation.
- **수정할 대상:** The constrained code fragment.
- **성공 판정:** A patch with reproduction, fix, verification evidence, and a commit message, revised once after simulated review.
- **다음 문제와의 연결:** None — this is the ending: explaining one's own fix with evidence.
