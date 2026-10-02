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
- **실제 원인:** The boot code sends the wrong byte, `0x42`, to the UART1 transmit register at the Atlantis-inspired address `0xD4110000`.
- **관찰 가능한 증거:** The source byte, received character, connected cable, and a brief TX LED pulse on boot. The display stays black.
- **시험할 가설:** A different byte in the same boot code produces a different received character.
- **수정할 대상:** Only the immediate value in `li t1, [0x42]`. The remaining source is locked. DATASHEET supplies `A = 0x41` and `B = 0x42`; BOOK provides separate study chapters and checks.
- **성공 판정:** Build & Flash completes, the Pocket reboots, and the PC receives `A`. Editing without flashing does not change the output; Reset alone reruns the installed firmware.
- **다음 문제와의 연결:** The serial terminal becomes the shared observation tool for Episode 02. Episode 01 requires no quiz or reading gate, and shows no OPEN COVER: a simple execution experience with nothing internal to inspect.

### Episode 02 — Wrong Destination

- **증상:** UART already passes, and the next program should store a value in RAM at `0x00002000`. Instead the terminal keeps receiving a character, and the target word still reads `0x00000000`.
- **실제 원인:** The destination in `store.S` is the UART1 DATA address, `0xD4110000`, so the store transmits instead of storing. Output alone cannot show where the value went, which is why this episode introduces OPEN COVER.
- **관찰 가능한 증거:** The cover's RAM module, one row per 32-bit word, with the target word highlighted and a store to any other address appearing as its own row. DATASHEET separates the target word from the platform's full RAM region, `0x00000000–0x7FFFFFFF`.
- **시험할 가설:** The RAM is broken / the value was transmitted rather than stored / the destination address is a device register instead of RAM.
- **수정할 대상:** Only the destination address in `li t0, [0xD4110000]`. The build produces a different value on every flash, so there is no number to match. The supplied program supports four-byte-aligned RAM addresses and the UART1 DATA address; Boot ROM and other device writes are rejected before installing.
- **성공 판정:** This run's store lands on `0x00002000`, while transmitting nothing. Editing without flashing changes nothing observable. A store to any other valid RAM address leaves the target word empty, so an earlier correct value cannot carry a later wrong program.
- **다음 문제와의 연결:** Reading memory directly supports every later diagnosis, and the cover becomes the shared hardware observation surface for Episode 03.

### Episode 03 — Wrong Clock

- **증상:** UART and RAM pass, but serial ticks and the timer LED pulse every two seconds instead of one.
- **실제 원인:** The supplied diagnostic assumes a 2 GHz timebase and requests 2,000,000,000 ticks for one second, while ACLINT's hardware timer runs at a fixed 1 GHz.
- **관찰 가능한 증거:** The cover's RAM module shows the live MTIME counter as a row at `0xA2180000`, because the timer is a memory-mapped register rather than a module of its own. The CPU module shows the program counter and the register the program is comparing against. DATASHEET specifies one billion ticks per second. The assumed timebase stays on the PC. MTIME keeps counting across a firmware reset while the wait measurement restarts.
- **시험할 가설:** The diagnostic logic is wrong / the counter runs at an unexpected rate.
- **수정할 대상:** PROGRAM TIMEBASE: 500 MHz, 1 GHz, or 2 GHz. The supplied diagnostic calculates its one-second target from that setting. Build & Flash installs it and restarts the diagnostic; the hardware frequency stays fixed.
- **성공 판정:** After applying the correct 1 GHz program timebase, at least two live ticks establish an observed interval within 200 ms of one second. TIMER PASS completes BASIC DIAGNOSTICS COMPLETE with UART and RAM already passing.
- **다음 문제와의 연결:** Reliable timing is the basis for input handling and animation later. Display bring-up is next; the Pocket screen remains black in this episode.

---

## 04–08: A first manipulable device

Input comes before display. The buttons and LEDs exist while the screen is still black, so a repair here is observable through registers and indicators without pixel work, and the screen only has to answer for itself once the device already responds to being touched. This follows [D-004](11_decision_log.md) and the prerequisite order in the [learning design](04_learning_design.md#prerequisite-boundaries).

### Episode 04 — Button → LED

- **증상:** Nothing on the Pocket answers a touch. Hold the A button and the LED stays dark.
- **실제 원인:** The installed program reads the button register but never writes the LED register, so the machine reports an input and does nothing with it.
- **관찰 가능한 증거:** The A button on the station toggles the LED indicator. Under OPEN COVER the RAM module shows the button register going to `0x00000001` on press, while the LED register stays at `0x00000000`. The hardware is answering; the program is what is missing.
- **시험할 가설:** The button is dead / the program never reads it / the program never writes the output.
- **수정할 대상:** The order of the blocks in `button.c`: read the button, test its bit, then write the LED in each branch. Any order installs; the wrong one misbehaves.
- **성공 판정:** Hold the A button and the LED turns on; let go and it turns off. The repair is judged on a real press and release, so configuring the program without touching the device does not finish it.
- **다음 문제와의 연결:** This is the first complete input → CPU → output program. The player has seen an MMIO read, an MMIO write, a bit test, and a polling loop, which is what Episode 05 takes apart.

### Episode 05 — Stop Asking

- **증상:** Episode 04's button-to-LED program works, but BUTTON READS keeps climbing while the player touches nothing. IRQ COUNT is zero and CPU STATE is RUNNING.
- **실제 원인:** Polling makes the CPU repeatedly read the same MMIO address even when no input changes.
- **관찰 가능한 증거:** The CPU module shows live BUTTON READS, IRQ COUNT, CPU STATE, and LED. After the repair, idle is WAITING with no reads; each press or release adds one IRQ and one read. The RAM module retains the button and LED registers.
- **시험할 가설:** The button program failed / the CPU needs to keep asking / the button can request service when its state changes.
- **수정할 대상:** PC starts with the inherited polling source. SWITCH TO INTERRUPTS opens draft SETUP, WAIT, and HANDLER slots without replacing installed firmware. Enable IRQs in setup, wait in main, and assemble READ → UPDATE → ACK in the handler. Missing blocks may be flashed to observe failures; missing ACK leaves a pending source that repeatedly runs the handler.
- **성공 판정:** Install the five blocks in their intended slots and service order, observe a real press turning the LED on and a release turning it off, then verify one second of WAITING without further reads or pending IRQs. Opening the cover or book is optional.
- **다음 문제와의 연결:** Polling cost now motivates interrupt, handler, CPU wait/wakeup, and acknowledgement. Supplied runtime handles routing, context preservation, CSR setup, and trap entry/return. APLIC → IMSIC → CPU internals remain deferred; Episode 08 reuses notification while other work continues.

### Episode 06 — First Light

- **Symptom:** A lights the LED, but the screen stays black.
- **Cause:** Startup settings are sent before the display becomes ready.
- **Evidence:** DISPLAY power, readiness, mode, output, and actual startup results under OPEN COVER; LIVE POCKET beside the PC editor.
- **Repair:** Arrange POWER ON → WAIT READY → SELECT TEST MODE → ENABLE DISPLAY. The device becomes ready 500 ms after power-on. Premature settings are ignored; waiting before power stalls startup. Incomplete and reordered drafts can be installed.
- **Success:** The installed program produces the visible test pattern. Opening references is optional.
- **Next:** A framebuffer program turns coordinates into visible pixels.

### Episode 07 — Wrong Place

- **Symptom:** The marker is misplaced or absent at the requested coordinate.
- **Cause:** The program uses 32 bytes between rows; the display scans 16.
- **Evidence:** Requested outline versus actual pixel on the PC grid; row offset, byte offset, write address, and the 128-byte framebuffer under OPEN COVER. Off-screen writes still appear in RAM.
- **Repair:** Choose ROW_BYTES from 8 / 16 / 32 and flash. The 16×8 monochrome display uses one byte per pixel at 0x00003000–0x0000307F. Click coordinates or use the D-pad to execute the installed calculation immediately.
- **Success:** With stride 16 installed, verify the center (8,4) and all four corners in any order.
- **Next:** Input and animation must share the CPU without a long handler freezing frame updates.

### Episode 08 — Keep Moving

- **Symptom:** The automatic dot and D-pad marker stop updating while A is held, then resume after release.
- **Cause:** WAIT FOR RELEASE keeps the CPU inside the input handler. The hardware display retains its last frame, but main cannot service pending frame events.
- **Evidence:** FRAME, CPU AT, CURRENT STEP, pending timer/IRQ, and recent execution history under CPU. LIVE POCKET makes the freeze and recovery visible.
- **Repair:** Remove WAIT FOR RELEASE; assemble READ → RECORD INPUT EVENT → ACK in the handler; move APPLY INPUT to main's input-event slot. Each block has one location. The supplied runtime safely queues events and waits with event_wait().
- **Success:** Install the intended placement, hold A for at least one second while 10 Hz frame updates continue, and handle a D-pad input in main. A-down reverses direction once; release does not reverse it. Reading references remains optional.
- **Next:** The finished device demo supports direct input and continuous animation. Later episodes investigate CPU work, buffers, and DMA.

---

## 09–13: A demo worth using

### Episode 09 — CPU-Bound Copy

- **증상:** Screen copies hold the CPU; nothing else progresses during transfers.
- **실제 원인:** The CPU copies every byte itself instead of handing the transfer off.
- **관찰 가능한 증거:** CPU busy during copies; frame time dominated by the copy loop.
- **시험할 가설:** The copy algorithm is slow / the CPU should not be doing the copy.
- **수정할 대상:** Connect a DMA transfer for the copy.
- **성공 판정:** The copy completes without holding the CPU.
- **다음 문제와의 연결:** DMA introduces buffer ownership questions.

### Episode 10 — Old Frames

- **증상:** Faster now, but previous frames sometimes show.
- **실제 원인:** Stale cache/buffer contents reach the display; ownership of the buffer is untracked.
- **관찰 가능한 증거:** Cache vs. RAM contents; which buffer the display reads.
- **시험할 가설:** DMA wrote the wrong data / the display reads a stale buffer.
- **수정할 대상:** Cache and buffer ownership tracking.
- **성공 판정:** The display consistently shows current data.
- **다음 문제와의 연결:** Coherency discipline is reused for device buffers under Linux.

### Episode 11 — Vanishing Transfer Bug

- **증상:** A transfer error disappears as soon as logging is added.
- **실제 원인:** An access-ordering problem; observation changes timing enough to hide it.
- **관찰 가능한 증거:** Failure with and without logging; order of descriptor writes vs. device start.
- **시험할 가설:** The log fixes the bug / the access order is wrong.
- **수정할 대상:** The access order.
- **성공 판정:** Transfers succeed deterministically, with or without logging.
- **다음 문제와의 연결:** Ordering discipline is reused for calls, stacks, and device startup.

### Episode 12 — Broken Return

- **증상:** One specific restart path breaks function returns.
- **실제 원인:** Call state and the stack are not tracked across that path.
- **관찰 가능한 증거:** Return addresses and stack contents on the failing path vs. working paths.
- **시험할 가설:** The function is wrong / the restart path corrupts call state.
- **수정할 대상:** The restart path's call/stack handling.
- **성공 판정:** All restart paths return correctly.
- **다음 문제와의 연결:** Call/stack discipline supports traps, firmware handoff, and context switches.

### Episode 13 — The Quiet Game

- **증상:** The demo runs but has no audio, and the pieces have never run as one game.
- **실제 원인:** Leftover audio initialization was never restored; integration was never attempted.
- **관찰 가능한 증거:** Audio init state; each subsystem passing alone.
- **시험할 가설:** The audio hardware is dead / init was skipped during bring-up.
- **수정할 대상:** Restore audio init; integrate screen, input, and sound into a small game.
- **성공 판정:** A stable bare-metal demo with screen, input, and sound.
- **다음 문제와의 연결:** A working demo is the baseline that must survive without the development PC.

---

## 14–16: To Linux without the development PC

### Episode 14 — Won't Boot Untethered

- **증상:** With the debugger detached, the device does not boot.
- **실제 원인:** Initialization the development tools performed silently was never moved into the boot process.
- **관찰 가능한 증거:** Boot log with debugger attached vs. detached; which init steps have no in-device owner.
- **시험할 가설:** The board needs the debugger / some init step only exists on the PC side.
- **수정할 대상:** Move the initialization into the on-device boot process.
- **성공 판정:** The device boots with no debugger attached.
- **다음 문제와의 연결:** An autonomous boot is the prerequisite for firmware handoff.

### Episode 15 — Stuck at Handoff

- **증상:** Firmware runs, then everything stops at the handoff to the kernel.
- **실제 원인:** The handoff conditions the kernel requires are not met.
- **관찰 가능한 증거:** Last firmware log lines; expected vs. actual handoff state.
- **시험할 가설:** The kernel image is broken / the handoff state is incomplete.
- **수정할 대상:** The handoff conditions.
- **성공 판정:** Control visibly transfers into the kernel.
- **다음 문제와의 연결:** A clean handoff is what later Device Tree and boot-arg problems build on.

### Episode 16 — No Shell

- **증상:** Kernel logs appear, but the boot never reaches a shell.
- **실제 원인:** Hardware description, boot arguments, or the root filesystem connection is wrong.
- **관찰 가능한 증거:** Kernel log tail; which device or mount step fails.
- **시험할 가설:** The kernel crashed / userspace was never found.
- **수정할 대상:** The hardware description, boot arguments, or root filesystem setup.
- **성공 판정:** The boot reaches a shell login.
- **다음 문제와의 연결:** A booting system exposes the driver integration problems next.

---

## 17–22: Integration problems under Linux

### Episode 17 — Unbound Display

- **증상:** Linux boots, but the screen is black again: no driver is bound to the display device.
- **실제 원인:** Driver-device matching fails for the display.
- **관찰 가능한 증거:** Bound-driver list; device vs. driver tables.
- **시험할 가설:** The display hardware regressed / matching information is missing.
- **수정할 대상:** The driver binding for the display.
- **성공 판정:** Linux drives the display.
- **다음 문제와의 연결:** Binding is the pattern reused for input and audio.

### Episode 18 — Endless Interrupts

- **증상:** One button press fires interrupts forever.
- **실제 원인:** The interrupt source is never acknowledged or cleared.
- **관찰 가능한 증거:** Interrupt counters climbing from a single press.
- **시험할 가설:** The button is stuck / the handler never completes its acknowledge step.
- **수정할 대상:** The acknowledge/clear step in the interrupt path.
- **성공 판정:** One press produces a bounded interrupt sequence.
- **다음 문제와의 연결:** Clean interrupt handling is required before blocking waits can work.

### Episode 19 — Unresponsive While Waiting

- **증상:** While waiting for the device, whole-system responsiveness collapses.
- **실제 원인:** The wait blocks instead of sleeping for the event.
- **관찰 가능한 증거:** Latency measurements during device waits.
- **시험할 가설:** The device is slow / the wait never yields the CPU.
- **수정할 대상:** The wait: sleep for the event instead of spinning.
- **성공 판정:** The system stays responsive during device waits.
- **다음 문제와의 연결:** Proper waiting is what later sleep/wakeup mechanisms formalize.

### Episode 20 — Wrong Address Kind to DMA

- **증상:** Screen data is corrupted when DMA is involved.
- **실제 원인:** DMA is handed the wrong kind of address for the buffer.
- **관찰 가능한 증거:** Buffer addresses vs. what the device actually reads; corruption pattern.
- **시험할 가설:** The buffer contents are wrong / the address passed to DMA is not a device-usable address.
- **수정할 대상:** The address mapping for DMA buffers.
- **성공 판정:** DMA-transferred screen data is intact.
- **다음 문제와의 연결:** Address-kind discipline returns in storage and userspace mapping.

### Episode 21 — Freed Memory Touched

- **증상:** Right after the game exits, an in-flight transfer touches released memory.
- **실제 원인:** Lifetime is unmanaged: the transfer outlives its buffer.
- **관찰 가능한 증거:** Transfer completion vs. buffer release order; fault address matching the old buffer.
- **시험할 가설:** The game corrupts memory on exit / the transfer is not synchronized with teardown.
- **수정할 대상:** Buffer lifetime vs. transfer completion.
- **성공 판정:** Exit never touches released memory.
- **다음 문제와의 연결:** Lifetime thinking is reused for process and driver teardown.

### Episode 22 — Sleeper Never Wakes

- **증상:** The event fires, but the waiting program never wakes.
- **실제 원인:** The wakeup path between event and waiter is broken.
- **관찰 가능한 증거:** Event log shows the event; waiter state stays asleep.
- **시험할 가설:** The event never fired / the waiter waits on the wrong condition.
- **수정할 대상:** The event-to-wakeup connection.
- **성공 판정:** The waiter wakes on the event.
- **다음 문제와의 연결:** Reliable wakeup is the basis for input, audio, and storage waits.

---

## 23–26: Tying the finished product

### Episode 23 — Sound Gone After Reboot

- **증상:** Sound works until reboot, then disappears.
- **실제 원인:** Linux device initialization and resource management skip the audio setup.
- **관찰 가능한 증거:** Audio init state before vs. after reboot.
- **시험할 가설:** The audio hardware is unreliable / init is not owned by any driver path.
- **수정할 대상:** The Linux audio initialization and resource handling.
- **성공 판정:** Sound survives reboot.
- **다음 문제와의 연결:** Managed initialization is the pattern storage must follow too.

### Episode 24 — Storage That Forgets

- **증상:** A save reports success but is gone after reboot.
- **실제 원인:** The write never reaches the real storage path.
- **관찰 가능한 증거:** Reported write vs. bytes on the medium after reboot.
- **시험할 가설:** The medium is broken / the write path ends before the medium.
- **수정할 대상:** The real storage path.
- **성공 판정:** Saved data survives reboot.
- **다음 문제와의 연결:** A verified storage path is required for a reproducible image.

### Episode 25 — Clean Image Won't Boot

- **증상:** Everything works in the development environment, but a fresh image does not boot.
- **실제 원인:** Missing components and packaging dependencies that the dev environment silently provided.
- **관찰 가능한 증거:** Dev-environment boot vs. clean-image boot; component inventory diff.
- **시험할 가설:** The image is corrupt / something the dev setup provides was never packaged.
- **수정할 대상:** The missing components and packaging.
- **성공 판정:** A clean image boots.
- **다음 문제와의 연결:** A reproducible image is what the final regression gate tests.

### Episode 26 — Regression Gate

- **증상:** No single check proves the device is finished.
- **실제 원인:** Cold boot, repeated runs, input, display, audio, and storage were never verified together.
- **관찰 가능한 증거:** The per-area results from Episodes 22–24.
- **시험할 가설:** Individual passes imply a finished product (they do not).
- **수정할 대상:** Whatever the combined gate catches.
- **성공 판정:** Cold boot, repeated runs, input, display, audio, and storage regression checks all pass.
- **다음 문제와의 연결:** A finished device earns its epilogue: explaining one fix properly.

---

## Episode 27 — Epilogue: One Last Patch

- **증상:** One small driver problem remains, unexplained.
- **실제 원인:** A constrained, realistic driver bug.
- **관찰 가능한 증거:** Reproduction, plus the evidence collected for the fix.
- **시험할 가설:** Candidate causes narrowed by observation.
- **수정할 대상:** The constrained code fragment.
- **성공 판정:** A patch with reproduction, fix, verification evidence, and a commit message, revised once after simulated review.
- **다음 문제와의 연결:** None — this is the ending: explaining one's own fix with evidence.
