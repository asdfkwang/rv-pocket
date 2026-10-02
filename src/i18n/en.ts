export const en = {
  langToggleLabel: "한/EN",
  episodeLabel: "EPISODE",
  prologue: "Prologue",
  episodeFmt: "Episode {n}",
  resetEpisode: "Reset episode",
  docTitleFmt: "{label} — {title} | RV Pocket",

  back: "← Back",
  ebook: "EBOOK",
  terminal: "TERMINAL",
  station: "Station",
  terminalView: "Terminal",
  ebookView: "Ebook",

  startEpisode01: "Start Episode 01",
  startEpisodeNum: "Start Episode {n}",
  successNextLabel: "Next repair:",
  successRepairComplete: "Repair complete",
  gotIt: "Got it",
  guideFmt: "GUIDE {i} / {n}",
  tourSkip: "Skip",
  tourNext: "Next",
  tourDone: "Done",

  prologueEyebrow: "PROLOGUE / THE OLD STUDIO",
  episode01Eyebrow: "FIRST REPAIR / DIAGNOSTIC ACCESS",
  benchFeedback: "BENCH FEEDBACK",

  successNextEpisode: "Next: the Pocket's buttons — Button to LED.",

  routeNoticeUnavailable: "That episode is not available yet. You are back at the Prologue.",
  resetFeedback: "Episode reset. You are starting fresh in the same view.",
  announceDismiss: "Got it. EBOOK and Terminal on the station.",
  announceTourDone: "Guide done.",
  announceCopyOk: "Prompt copied. Paste it into your AI assistant.",
  announceCopyFail: "Copy failed. Select and copy the prompt manually.",
  announceViewFmt: "{label}: {title}. {view} view.",

  tourEpisodesTitle: "Episodes",
  tourEpisodesBody: "Switch episodes here. Each episode is one repair.",
  tourEbookTitle: "EBOOK",
  tourEbookBody: "The old manual. Check it whenever something is unclear.",
  tourTerminalTitle: "TERMINAL",
  tourTerminalBody: "Talk to the machine here.",
  tourStartTitle: "Start Episode 01",
  tourStartBody: "Ready? Begin the first repair.",

  stationEyebrow: "RV POCKET / DEVELOPMENT UNIT 001",
  stationDeviceHeading: "The machine.",
  stationCaption: "Power is on. The screen stays dark.",
  stationUartCable: "UART CABLE",
  stationConnected: "Connected",

  terminalEyebrow: "SERIAL TERMINAL",
  terminalHeading: "Terminal.",
  terminalEmpty: "Empty for now. Wiring comes with the episodes.",

  ebookForThisEpisode: "FOR THIS EPISODE",
  ebookSearchLabel: "Search the book",
  ebookSearchPlaceholder: "Title, section, or word…",
  ebookChaptersNav: "Chapters",
  ebookNoMatch: "No chapters match.",
  ebookWordmark: "RV POCKET FIELD EBOOK",
  ebookCheckFmt: "CHECK · {i} / {n}",
  ebookCheckButton: "Check",
  ebookHint: "Hint",
  ebookPrev: "← Prev",
  ebookNext: "Next →",
  ebookHarder: "Want harder questions? Copy an AI prompt",
  ebookChoicesLabel: "Choices",
  ebookCorrect: "That's right.",
  ebookWrong: "Not quite. Try again.",
  ebookPromptFmt:
    "I'm reading RV Pocket EBOOK '{chapter}' and worked on this question: \"{question}\". Give me 3 harder questions on the same concept. Don't give answers right away, only hints.",
} as const;

export type TranslationKey = keyof typeof en;
export type Translations = Record<TranslationKey, string>;
