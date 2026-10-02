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
  next?: LocalizedText;
  mission: LocalizedMission;
  editorHint?: LocalizedText;
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
        { kind: "text", body: { en: "Two places. STATION is the workbench, BOOK is the reference.", ko: "두 곳이 있습니다. 스테이션(STATION)은 작업대, 북(BOOK)은 참고서입니다." } },
        { kind: "text", body: { en: "STATION is where you inspect the device, connect the cable, and run diagnostics. Each repair brings only the tools it needs.", ko: "스테이션에서 기기를 확인하고, 케이블을 연결하고, 진단을 실행합니다. 각 수리는 그 수리에 필요한 도구만 제공합니다." } },
        { kind: "text", body: { en: "BOOK is your reference. When something does not make sense, look here for an explanation and a short check of your understanding.", ko: "북(BOOK)은 참고서입니다. 이해가 안 될 때는 여기서 설명과 짧은 확인 문제로 이해를 점검하세요." } },
        { kind: "text", body: { en: "There is no saved progress. When you are ready, choose Start Episode 01.", ko: "진행 상황은 저장되지 않습니다. 준비되면 에피소드 01 시작을 누르세요." } },
      ],
    }],
    quiz: [],
  },

  1: {
    title: { en: "Wrong Byte", ko: "잘못된 바이트" },
    next: { en: "Wrong Destination", ko: "잘못된 목적지" },
    mission: {
      summary: { en: "Make the serial terminal receive A.", ko: "시리얼 터미널이 A를 받게 만드세요." },
      initialObservation: {
        en: "Your parents' Pocket powers on. Their last boot.S is still open on the development PC. A character arrives over the UART cable: B. The expected output is A.",
        ko: "부모님의 포켓에 전원이 들어옵니다. 마지막 boot.S가 개발 PC에 열려 있습니다. UART 케이블을 통해 문자 하나가 도착했습니다: B. 기대하는 출력은 A입니다.",
      },
      successMessage: { en: "UART PASS — A received.", ko: "UART 통과 — A를 받았습니다." },
    },
    editorHint: { en: "Only the highlighted byte can be changed.", ko: "표시된 바이트만 바꿀 수 있습니다." },
    manual: [], quiz: [],
  },

  2: {
    title: { en: "Wrong Destination", ko: "잘못된 목적지" },
    next: { en: "Wrong Clock", ko: "잘못된 클럭" },
    mission: {
      summary: { en: "Get the program to store its value in RAM at 0x00002000.", ko: "프로그램이 값을 RAM의 0x00002000에 저장하게 만드세요." },
      initialObservation: {
        en: "UART works now. The next program should save a value in RAM, but the PC keeps receiving a character instead. Output cannot tell you where the value went. Open the Pocket's cover on STATION and read memory directly.",
        ko: "이제 UART는 동작합니다. 다음 프로그램은 값을 RAM에 저장해야 하는데, PC는 계속 문자만 받고 있습니다. 출력만으로는 값이 어디로 갔는지 알 수 없습니다. 스테이션에서 포켓의 덮개를 열어 메모리를 직접 읽으세요.",
      },
      successMessage: { en: "RAM PASS — a value reached 0x00002000.", ko: "RAM 통과 — 값이 0x00002000에 도달했습니다." },
    },
    editorHint: { en: "Change only the destination address. Inspect the RAM result through OPEN COVER on STATION.", ko: "목적지 주소만 바꾸세요. RAM 결과는 스테이션의 OPEN COVER에서 확인합니다." },
    manual: [], quiz: [],
  },

  3: {
    title: { en: "Wrong Clock", ko: "잘못된 클럭" },
    next: { en: "Button to LED", ko: "버튼에서 LED로" },
    mission: {
      summary: { en: "Make the Pocket's timer diagnostic send one tick every second.", ko: "포켓의 타이머 진단이 매초 한 번씩 틱을 보내게 만드세요." },
      initialObservation: {
        en: "UART and RAM are reliable. The next diagnostic should report every second, but the serial ticks and the Pocket's timer LED are too slow. Does the program's timebase agree with the timer frequency in DATASHEET?",
        ko: "UART와 RAM은 신뢰할 수 있습니다. 다음 진단은 매초를 보고해야 하는데, 시리얼 틱과 포켓의 타이머 LED가 너무 느립니다. 프로그램의 시간 기준이 DATASHEET의 타이머 주파수와 맞나요?",
      },
      successMessage: { en: "TIMER PASS — one tick every second.", ko: "타이머 통과 — 매초 한 번의 틱." },
    },
    editorHint: { en: "The diagnostic converts one second into ticks using PROGRAM TIMEBASE below. Match that setting to the hardware timer frequency.", ko: "아래 PROGRAM TIMEBASE를 사용해 진단이 1초를 틱으로 환산합니다. 그 설정을 하드웨어 타이머 주파수와 맞추세요." },
    manual: [], quiz: [],
  },

  4: {
    title: { en: "Button to LED", ko: "버튼에서 LED로" },
    next: { en: "Stop Asking", ko: "그만 물어봐" },
    mission: {
      summary: { en: "Press the A button and the LED turns on. Let go and it turns off.", ko: "A 버튼을 누르면 LED가 켜지고, 놓으면 꺼지게 만드세요." },
      initialObservation: {
        en: "The diagnostics are reliable now, but nothing on the Pocket answers a touch. Press the A button on the station: the LED stays dark. Open the cover and read the button register — the hardware is answering, so the program is what is missing.",
        ko: "진단은 이제 신뢰할 수 있지만, 포켓은 만져도 아무 반응이 없습니다. 스테이션에서 A 버튼을 눌러 보세요: LED는 계속 어두웁니다. 덮개를 열어 버튼 레지스터를 읽어 보세요 — 하드웨어는 응답하고 있으니 없는 것은 프로그램입니다.",
      },
      successMessage: { en: "Button and LED are connected.", ko: "버튼과 LED가 연결되었습니다." },
    },
    editorHint: { en: "Put the blocks in an order that reads the button, then decides, then writes the LED.", ko: "버튼을 읽고, 판단하고, LED에 쓰는 순서로 블록을 배치하세요." },
    manual: [], quiz: [],
  },

  5: {
    title: { en: "Stop Asking", ko: "그만 물어봐" },
    next: { en: "First Light", ko: "첫 빛" },
    mission: {
      summary: { en: "Keep the LED working. Make the CPU stop checking the button when nothing happens.", ko: "LED는 계속 동작시키세요. 아무 일도 없을 때 CPU가 버튼을 그만 확인하게 만드세요." },
      initialObservation: {
        en: "The button program from Episode 04 works: press A and the LED turns on; let go and it turns off. But open the cover on CPU. BUTTON READS keeps climbing even when you touch nothing. The CPU keeps asking the same address the same question. Let the button interrupt the CPU when it needs attention.",
        ko: "에피소드 04의 버튼 프로그램은 동작합니다: A를 누르면 LED가 켜지고, 놓으면 꺼집니다. 그런데 덮개의 CPU 탭을 열어 보세요. 아무것도 건드리지 않아도 BUTTON READS가 계속 올라갑니다. CPU가 같은 주소에 같은 질문을 반복하고 있습니다. 버튼이 주의가 필요할 때 CPU를 인터럽트하게 만드세요.",
      },
      successMessage: { en: "The button calls. The CPU handles it, acknowledges the IRQ, and waits again.", ko: "버튼이 부릅니다. CPU가 처리하고, IRQ를 확인하고, 다시 기다립니다." },
    },
    editorHint: { en: "Replace polling with an interrupt. Enable button IRQs, wait in main, and read → update → acknowledge in the handler. Build & Flash installs your draft.", ko: "폴링을 인터럽트로 대체하세요. 버튼 IRQ를 켜고, main에서 기다리고, 핸들러에서 read → update → acknowledge를 수행합니다. Build & Flash가 초안을 설치합니다." },
    manual: [], quiz: [],
  },

  6: {
    title: { en: "First Light", ko: "첫 빛" },
    next: { en: "Wrong Place", ko: "잘못된 위치" },
    mission: {
      summary: { en: "Bring the display to life. Make its test pattern appear.", ko: "디스플레이를 깨우세요. 테스트 패턴이 나타나게 만드세요." },
      initialObservation: {
        en: "The A button still lights the LED, but the screen is black. The installed startup program switches on display power and immediately sends its settings. A device needs time to become ready. Inspect DISPLAY under OPEN COVER, then repair the startup sequence on the PC.",
        ko: "A 버튼은 여전히 LED를 켜지만 화면은 검은색입니다. 설치된 시작 프로그램이 디스플레이 전원을 켜고 곧바로 설정을 보냅니다. 장치는 준비될 시간이 필요합니다. 덮개의 DISPLAY에서 확인한 뒤, PC에서 시작 순서를 수리하세요.",
      },
      successMessage: { en: "First light. The display is ready, configured, and showing its test pattern.", ko: "첫 빛. 디스플레이가 준비되고 설정되어 테스트 패턴을 보여줍니다." },
    },
    editorHint: { en: "Remove and add blocks to change their order. Flash an experiment and compare the screen with the actual startup log. Editing leaves the installed program running.", ko: "블록을 제거하고 추가해 순서를 바꾸세요. 실험을 플래시하고 화면을 실제 시작 로그와 비교하세요. 편집해도 설치된 프로그램은 계속 실행됩니다." },
    manual: [], quiz: [],
  },

  7: {
    title: { en: "Wrong Place", ko: "잘못된 위치" },
    next: { en: "Keep Moving", ko: "계속 움직여" },
    mission: {
      summary: { en: "Put the marker where you ask for it. Check the center and all four corners.", ko: "요청한 위치에 마커를 놓으세요. 중앙과 네 모서리를 모두 확인하세요." },
      initialObservation: {
        en: "The display now scans a small framebuffer in RAM: 16 pixels across, 8 rows, one byte per pixel. The program asks for (3, 5), but nothing appears there. Click the PC grid or use the D-pad to try other coordinates. Follow the calculated write address and compare it with the RAM the display actually reads.",
        ko: "디스플레이가 이제 RAM의 작은 프레임버퍼를 스캔합니다: 가로 16픽셀, 8행, 픽셀당 1바이트. 프로그램은 (3, 5)를 요청하지만 아무것도 나타나지 않습니다. PC 그리드를 클릭하거나 D-패드로 다른 좌표를 시도해 보세요. 계산된 쓰기 주소를 따라가며 디스플레이가 실제로 읽는 RAM과 비교하세요.",
      },
      successMessage: { en: "Every row is in place. You can move the marker across the whole screen.", ko: "모든 행이 제자리에 있습니다. 화면 전체에 마커를 움직일 수 있습니다." },
    },
    editorHint: { en: "Choose the bytes between rows, then Build & Flash. Test coordinates immediately run the installed program; changing ROW_BYTES is only a draft.", ko: "행 사이의 바이트 수를 고른 뒤 Build & Flash를 누르세요. 좌표를 시험하면 설치된 프로그램이 즉시 실행되며, ROW_BYTES를 바꾸는 것은 초안만 바꿉니다." },
    manual: [], quiz: [],
  },

  8: {
    title: { en: "Keep Moving", ko: "계속 움직여" },
    mission: {
      summary: { en: "Keep the animation moving while A is held, and keep the D-pad responsive.", ko: "A를 누르고 있는 동안에도 애니메이션이 계속 움직이고, D-패드가 반응하도록 유지하세요." },
      initialObservation: {
        en: "The screen finally moves: a small dot bounces by itself, and the D-pad controls your marker. A reverses the dot's direction. Try holding A. Everything freezes until you let go. Interrupts brought the CPU here, but the handler waits for release before returning. Move input work into main so frame events can run too.",
        ko: "화면이 드디어 움직입니다: 작은 점이 스스로 튀고, D-패드가 마커를 조종합니다. A는 점의 방향을 뒤집습니다. A를 길게 눌러 보세요. 놓을 때까지 모든 것이 멈춥니다. 인터럽트로 CPU를 여기까지 왔지만, 핸들러가 반환 전에 놓임을 기다리고 있습니다. 입력 처리를 main으로 옮겨 프레임 이벤트도 함께 돌게 만드세요.",
      },
      successMessage: { en: "The Pocket keeps moving. Short handlers leave time for input and animation.", ko: "포켓이 계속 움직입니다. 짧은 핸들러가 입력과 애니메이션을 위한 시간을 남깁니다." },
    },
    editorHint: { en: "Remove WAIT FOR RELEASE. Record the input and acknowledge in the handler; move APPLY INPUT to MAIN / INPUT EVENT. A block can occupy one slot. Build & Flash, then hold A for one second and use the D-pad.", ko: "WAIT FOR RELEASE를 제거하세요. 핸들러에서 입력을 기록하고 확인하고, APPLY INPUT을 MAIN / INPUT EVENT로 옮기세요. 한 블록은 한 슬롯만 차지할 수 있습니다. Build & Flash 후 A를 1초간 누르고 D-패드를 쓰세요." },
    manual: [], quiz: [],
  },
};

interface AnyChapter {
  id: number;
  title: string;
  computer: { editorHint?: string };
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

export function chapterNextTitle(chapter: AnyChapter, fallback: string): string {
  return pick(localeFor(chapter)?.next, fallback);
}

export function chapterEditorHint(chapter: AnyChapter): string {
  return pick(localeFor(chapter)?.editorHint, chapter.computer.editorHint ?? "");
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
