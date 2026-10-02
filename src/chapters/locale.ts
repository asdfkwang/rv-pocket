import { getLang } from "../i18n";

interface LocalizedText { en: string; ko: string }
export interface LocalizedMission {
  summary: LocalizedText;
  initialObservation: LocalizedText;
  successMessage: LocalizedText;
}

export interface LocalizedManualBlock { kind: "text" | "ascii"; body: LocalizedText }
export interface LocalizedManualSection { id: string; title: LocalizedText; blocks: LocalizedManualBlock[] }
export interface LocalizedChoice { id: string; label: LocalizedText }
export interface LocalizedQuestion {
  id: string;
  prompt: LocalizedText;
  choices: LocalizedChoice[];
  answerId: string;
  explanation: LocalizedText;
}

export interface ChapterLocale {
  title: LocalizedText;
  mission: LocalizedMission;
  manual: LocalizedManualSection[];
  quiz: LocalizedQuestion[];
}

const chapterLocales: Record<number, ChapterLocale> = {
  0: {
    title: { en: "Before You Begin", ko: "시작하기 전에" },
    mission: {
      summary: { en: "Get to know what was left behind.", ko: "남겨진 것이 무엇인지 알아보세요." },
      initialObservation: {
        en: "Your parents' game studio has closed. On the old development desk: a broken pocket computer, its technical manual, and one unfinished story.",
        ko: "부모님의 게임 스튜디오는 문을 닫았습니다. 낡은 개발 책상 위에는 고장 난 포켓 컴퓨터, 기술 매뉴얼, 그리고 완성되지 못한 하나의 이야기가 남아 있습니다.",
      },
      successMessage: { en: "The bench is yours. Time for the first repair.", ko: "이제 이 벤치는 당신 것입니다. 첫 수리를 시작할 시간입니다." },
    },
    manual: [{
      id: "using-the-bench",
      title: { en: "A place to start", ko: "시작할 곳" },
      blocks: [
        { kind: "text", body: { en: "Two buttons. STATION is the workbench, EBOOK is the manual.", ko: "버튼은 두 개입니다. 스테이션(STATION)은 작업대, 전자책(EBOOK)은 매뉴얼입니다." } },
        { kind: "text", body: { en: "STATION is where you inspect the device, connect the cable, and run diagnostics. Each repair brings only the tools it needs.", ko: "스테이션에서 기기를 확인하고, 케이블을 연결하고, 진단을 실행합니다. 각 수리는 그 수리에 필요한 도구만 제공합니다." } },
        { kind: "text", body: { en: "EBOOK is your reference. When something does not make sense, look here for an explanation and a short check of your understanding.", ko: "전자책은 참고서입니다. 이해가 안 될 때는 설명과 짧은 확인 문제로 이해를 점검하세요." } },
        { kind: "text", body: { en: "There is no saved progress. When you are ready, choose Start Chapter 01.", ko: "진행 상황은 저장되지 않습니다. 준비되면 에피소드 01 시작을 누르세요." } },
      ],
    }],
    quiz: [],
  },

};

interface AnyChapter {
  id: number;
  title: string;
  mission: { summary: string; initialObservation: string; successMessage: string };
  manual: readonly { id: string; title: string; blocks: readonly { kind: "text" | "ascii"; body: string }[] }[];
  quiz: readonly { id: string; prompt: string; choices: readonly { id: string; label: string }[]; answerId: string; explanation: string }[];
}

function localeFor(chapter: AnyChapter): ChapterLocale | undefined {
  return chapterLocales[chapter.id];
}

function pick(text: LocalizedText | undefined, fallback: string): string {
  if (!text) return fallback;
  return getLang() === "ko" ? text.ko : text.en;
}

export function chapterTitle(chapter: AnyChapter): string {
  return pick(localeFor(chapter)?.title, chapter.title);
}

export function chapterMission(chapter: AnyChapter) {
  const locale = localeFor(chapter);
  return {
    summary: pick(locale?.mission.summary, chapter.mission.summary),
    initialObservation: pick(locale?.mission.initialObservation, chapter.mission.initialObservation),
    successMessage: pick(locale?.mission.successMessage, chapter.mission.successMessage),
  };
}

export function chapterManual(chapter: AnyChapter) {
  const locale = localeFor(chapter);
  if (!locale) return chapter.manual.map((section) => ({ id: section.id, title: section.title, blocks: section.blocks.map((block) => ({ kind: block.kind, body: block.body })) }));
  return locale.manual.map((section) => ({
    id: section.id,
    title: pick(section.title, section.id),
    blocks: section.blocks.map((block) => ({ kind: block.kind, body: pick(block.body, "") })),
  }));
}

export function chapterQuiz(chapter: AnyChapter) {
  const locale = localeFor(chapter);
  if (!locale) return chapter.quiz.map((q) => ({ id: q.id, prompt: q.prompt, choices: q.choices.map((c) => ({ id: c.id, label: c.label })), answerId: q.answerId, explanation: q.explanation }));
  return locale.quiz.map((question) => ({
    id: question.id,
    prompt: pick(question.prompt, question.id),
    choices: question.choices.map((choice) => ({ id: choice.id, label: pick(choice.label, choice.id) })),
    answerId: question.answerId,
    explanation: pick(question.explanation, question.id),
  }));
}
