import type { Chapter } from "./types";
import { createInitialFramebufferState, isFramebufferMissionComplete, type FramebufferMissionState } from "../sim/framebuffer";

export const chapter07: Chapter<FramebufferMissionState> = {
  id: 7, slug: "wrong-place", title: "Wrong Place",
  mission: {
    summary: "Put the marker where you ask for it. Check the center and all four corners.",
    initialObservation: "The display now scans a small framebuffer in RAM: 16 pixels across, 8 rows, one byte per pixel. The program asks for (3, 5), but nothing appears there. Click the PC grid or use the D-pad to try other coordinates. Follow the calculated write address and compare it with the RAM the display actually reads.",
    successMessage: "Every row is in place. You can move the marker across the whole screen.",
  },
  next: { id: 8, title: "Keep Moving" },
  cover: { modules: ["display", "ram"], selected: "display" },
  workbench: { objects: ["pocket", "computer", "datasheet", "book", "uart-cable"] },
  computer: {
    panels: ["editor"], datasheetSection: "display",
    editorHint: "Choose the bytes between rows, then Build & Flash. Test coordinates immediately run the installed program; changing ROW_BYTES is only a draft.",
    source: {
      fileName: "pixel.c",
      lines: [
        { before: "#define FB_BASE 0x00003000" },
        { before: "#define ROW_BYTES ", field: "row-bytes" },
        { before: "" },
        { before: "void draw_marker(int x, int y)" },
        { before: "{" },
        { before: "    clear_framebuffer(); // supplied: erase the old marker" },
        { before: "    write8(FB_BASE + y * ROW_BYTES + x, 1);" },
        { before: "}" },
      ],
    },
  },
  manual: [], quiz: [], createInitialState: createInitialFramebufferState, successCondition: isFramebufferMissionComplete,
};
