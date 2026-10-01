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
  1: {
    title: { en: "Is Anyone There?", ko: "누군가 있나요?" },
    mission: {
      summary: { en: "Get the machine's first UART response.", ko: "기계의 첫 UART 응답을 받으세요." },
      initialObservation: {
        en: "The power indicator is on. The screen is black. The computer has received nothing. Find another way to hear from RV Pocket.",
        ko: "전원 표시등은 켜져 있습니다. 화면은 검은색입니다. 컴퓨터는 아무것도 받지 못했습니다. RV Pocket의 목소리를 들을 다른 방법을 찾으세요.",
      },
      successMessage: { en: "UART response received. The machine is alive.", ko: "UART 응답 수신. 기계가 살아있습니다." },
    },
    manual: [{
      id: "first-contact",
      title: { en: "Listening to a silent machine", ko: "조용한 기계의 소리 듣기" },
      blocks: [
        { kind: "text", body: { en: "A black screen is not the whole story. RV Pocket has a CPU that executes instructions, RAM that stores data, and a separate UART peripheral that handles serial communication.", ko: "검은 화면이 모든 이야기는 아닙니다. RV Pocket에는 명령을 실행하는 CPU, 데이터를 저장하는 RAM, 그리고 시리얼 통신을 담당하는 별도의 UART 주변장치가 있습니다." } },
        { kind: "text", body: { en: "A small diagnostic is already available on the board. It asks the output device to send one character. Select UART and use the supplied value 65 ('A'); no program or number conversion is needed.", ko: "보드에는 이미 작은 진단이 들어 있습니다. 출력 장치에 문자 하나를 보내라는 요청입니다. UART를 선택하고 제공된 값 65('A')를 사용하세요. 프로그램을 작성하거나 숫자를 변환할 필요는 없습니다." } },
        { kind: "ascii", body: { en: "RV Pocket                 Computer\n[ UART ] ----- cable ----> [ terminal ]", ko: "RV Pocket                 컴퓨터\n[ UART ] --- 케이블 ---> [ 터미널 ]" } },
        { kind: "text", body: { en: "The UART cable carries the board's response to the computer. Connect the cable below, then run the diagnostic. Connecting the cable by itself does not send a character.", ko: "UART 케이블은 보드의 응답을 컴퓨터로 전달합니다. 아래에서 케이블을 연결한 뒤 진단을 실행하세요. 케이블만 연결해서는 문자가 전송되지 않습니다." } },
        { kind: "text", body: { en: "Receiving A proves this diagnostic path works. It does not mean the screen or every other part has been repaired.", ko: "A를 수신했다는 것은 이 진단 경로가 동작한다는 뜻입니다. 화면이나 다른 모든 부품을 고쳤다는 의미는 아닙니다." } },
      ],
    }],
    quiz: [
      {
        id: "transmitter",
        prompt: { en: "Which part handles serial transmission after software requests it?", ko: "소프트웨어가 요청한 뒤 시리얼 전송을 담당하는 부품은?" },
        choices: [
          { id: "cpu", label: { en: "CPU", ko: "CPU" } },
          { id: "ram", label: { en: "RAM", ko: "RAM" } },
          { id: "uart", label: { en: "UART", ko: "UART" } },
        ],
        answerId: "uart",
        explanation: { en: "UART handles serial transmission. The CPU runs the instructions that request it; RAM stores data.", ko: "시리얼 전송은 UART가 담당합니다. CPU는 요청하는 명령을 실행하고, RAM은 데이터를 저장합니다." },
      },
      {
        id: "silent-screen",
        prompt: { en: "Does a silent built-in screen alone prove the CPU is dead?", ko: "내장 화면이 아무 반응이 없다는 것만으로 CPU가 죽었다고 판단할 수 있나요?" },
        choices: [
          { id: "yes", label: { en: "Yes. A working CPU must light the screen.", ko: "그렇다. 동작하는 CPU라면 화면이 켜져야 한다." } },
          { id: "no", label: { en: "No. Another output path may still work.", ko: "아니다. 다른 출력 경로가 동작할 수 있다." } },
        ],
        answerId: "no",
        explanation: { en: "No. The display is only one output path. A UART response gives you another way to observe the machine.", ko: "아니다. 디스플레이는 출력 경로 중 하나일 뿐입니다. UART 응답을 통해 기기를 관찰할 다른 방법을 얻습니다." },
      },
      {
        id: "cable",
        prompt: { en: "UART is asked to transmit, but the cable is disconnected. Why does the terminal receive nothing?", ko: "UART로 전송을 요청했지만 케이블이 끊겨 있습니다. 터미널이 아무것도 받지 못하는 이유는?" },
        choices: [
          { id: "path", label: { en: "The path to the computer is disconnected.", ko: "컴퓨터로 가는 경로가 끊어져 있다." } },
          { id: "ram", label: { en: "RAM must display the character first.", ko: "RAM이 먼저 문자를 표시해야 한다." } },
          { id: "screen", label: { en: "UART requires a working screen.", ko: "UART는 작동하는 화면이 필요하다." } },
        ],
        answerId: "path",
        explanation: { en: "The cable carries serial data to the computer. Without that connection, the terminal cannot receive the board's response.", ko: "케이블이 시리얼 데이터를 컴퓨터로 전달합니다. 그 연결이 없으면 터미널은 보드의 응답을 받을 수 없습니다." },
      },
    ],
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
