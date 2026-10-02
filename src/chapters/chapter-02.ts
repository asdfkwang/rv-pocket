import type { Chapter } from "./types";
import { createInitialMemoryState, isMemoryMissionComplete, type MemoryMissionState } from "../sim/memory";

export const chapter02: Chapter<MemoryMissionState> = {
  id: 2,
  slug: "wrong-destination",
  title: "Wrong Destination",
  mission: {
    summary: "Get the program to store its value in RAM at 0x00002000.",
    initialObservation: "UART works now. The next program should save a value in RAM, but the PC keeps receiving a character instead. Output cannot tell you where the value went. Open the Pocket's cover on STATION and read memory directly.",
    successMessage: "RAM PASS — a value reached 0x00002000.",
  },
  next: { id: 3, title: "Wrong Clock" },
  cover: { modules: ["ram"], selected: "ram" },
  workbench: { objects: ["pocket", "computer", "datasheet", "book", "uart-cable"] },
  computer: {
    panels: ["editor", "terminal"],
    editorHint: "Change only the destination address. Inspect the RAM result through OPEN COVER on STATION.",
    datasheetSection: "memory-map",
    source: {
      fileName: "store.S",
      lines: [
        { before: "_start:" },
        { before: "    li   t0, ", field: "store-address", after: "  # editable destination" },
        { before: "    li   t1, <value>   # set by the build" },
        { before: "    sw   t1, 0(t0)" },
      ],
    },
  },
  manual: [], quiz: [], createInitialState: createInitialMemoryState, successCondition: isMemoryMissionComplete,
};
