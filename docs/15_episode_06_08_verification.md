# Episodes 06–08: Screen Verification

Use the localhost URL printed by `bun run dev`. The episode links below use the current development port, 38605. Reload after source changes. Automated checks cover simulation and rendered markup; visual layout and physical input behavior are for manual verification.

## EP06 — First Light

Open http://localhost:38605/#episode=06&view=pc and dismiss the introduction.

1. Check the black LIVE POCKET screen. Press/release A: the LED still follows it. The startup log reports premature TEST/ENABLE settings even after READY becomes 1.
2. Remove the three installed draft blocks. Add POWER ON, WAIT READY, SELECT TEST MODE, ENABLE DISPLAY in that order. The live screen stays black until Build & Flash.
3. Flash. Observe WAIT READY, then the test pattern and completion. Open STATION → OPEN COVER → DISPLAY to compare power, mode and output.
4. Try WAIT READY before POWER ON, or omit one block. Flash still works; the resulting startup failure is visible. RESET reruns installed firmware while preserving the edited draft; Reset episode restores the original premature sequence.

## EP07 — Wrong Place

Open http://localhost:38605/#episode=07&view=pc and dismiss the introduction.

1. Initial request (3,5) writes 0x000030A3, outside the visible framebuffer. Test another coordinate: the outline shows the request, a solid cell shows actual output, and the physical screen shows only actual pixels.
2. Select ROW_BYTES 16. Before flashing, coordinate tests still use the installed stride 32. Flash to install 16.
3. Click center (8,4) and corners (0,0), (15,0), (0,7), (15,7), in any order. Expect 5/5 and completion. Use the D-pad and arrow keys to move freely afterward.
4. Try stride 8 and 32. Inspect STATION → OPEN COVER → RAM for framebuffer bytes and off-screen writes. RESET clears trial evidence and restores (3,5), preserving installed stride and draft.

## EP08 — Keep Moving

Open http://localhost:38605/#episode=08&view=pc and dismiss the introduction.

1. Watch the automatic dot move. Hold A: frame count stops, CPU stays in button_irq_handler / WAIT FOR RELEASE, and a timer request becomes pending. Release: movement resumes without a burst of missed frames.
2. Remove WAIT FOR RELEASE and handler APPLY INPUT. Rebuild the handler as READ BUTTON → RECORD INPUT EVENT → ACK IRQ. Put APPLY INPUT in MAIN / INPUT EVENT. MOVE HERE can relocate APPLY INPUT directly. Draft editing leaves the old freeze intact.
3. Build & Flash. Hold A for at least one second while frames continue; use the D-pad or arrow keys. Expect completion. Each A press reverses once, and release does not reverse again.
4. While holding A with one pointer, operate the D-pad with another pointer or arrow keys. A must remain held. Test quick press/release, keyboard Space/Enter on A, lost window focus, and pointer cancellation.
5. Omit ACK, READ, RECORD, or main APPLY. Observe pending work or missing response and no completion. Flash/reset during a broken hold: no old pending work or history should return.

## Shared checks

- Switch among PC, STATION, Pocket, DATASHEET and BOOK. Installed execution continues; draft and reading position survive live updates.
- Check narrow layouts, source/palette ordering, keyboard focus and the coordinate grid's requested/actual distinction.
- Use EP05 → EP06 → EP07 → EP08 success links. EP08 must have no unavailable next-episode button.
- Confirm new episode content and helpers are English. Existing language settings remain available.
