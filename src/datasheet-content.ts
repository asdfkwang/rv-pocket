import { UART_TX_ADDRESS } from "./sim/uart";
import { WATCHED_RAM_ADDRESS, INITIAL_STORE_ADDRESS, formatWordBytes } from "./sim/memory";
import { BUTTON_ADDRESS, formatAddress, GPIO_IRQ, LED_ADDRESS, MTIMECMP_ADDRESS, PLATFORM_MEMORY_MAP, TIMER_FREQUENCY_HZ, UART1_IRQ } from "./platform";
import { TIMER_ADDRESS } from "./sim/timer";
import { type UiText } from "./ui-locale";

// Register names, addresses, hex values, and code identifiers stay English: they name
// the device. The prose around them is translated, because a player who cannot read the
// notes cannot use the table.
export type Cell = string | UiText;

const T = (en: string, ko: string): Cell => ({ en, ko });

const BLOCK_PURPOSE: Record<string, Cell> = {
  "RAM / DDR_LO": T("RAM in the RV32G low address space", "RV32G 저주소 공간의 RAM"),
  "BOOTROM": T("Reset / boot ROM; reset vector 0x80000000", "리셋 / 부트 ROM, 리셋 벡터 0x80000000"),
  "M-IMSIC": T("Machine-mode MSI interrupt files", "머신 모드 MSI 인터럽트 파일"),
  "ACLINT": T("Machine timer", "머신 타이머"),
  "S-IMSIC": T("Supervisor-mode MSI interrupt files", "슈퍼바이저 모드 MSI 인터럽트 파일"),
  "M-APLIC": T("Machine external interrupt controller", "머신 외부 인터럽트 컨트롤러"),
  "I2C0": T("DesignWare I²C / IRQ 33", "DesignWare I²C / IRQ 33"),
  "I2C1": T("DesignWare I²C / IRQ 34", "DesignWare I²C / IRQ 34"),
  "I2C2": T("DesignWare I²C / IRQ 35", "DesignWare I²C / IRQ 35"),
  "I2C3": T("DesignWare I²C / IRQ 36", "DesignWare I²C / IRQ 36"),
  "I2C4": T("DesignWare I²C / IRQ 36", "DesignWare I²C / IRQ 36"),
  "GPIO": T("Pocket buttons and LEDs / IRQ 37", "포켓 버튼과 LED / IRQ 37"),
  "UART1": T("16550-compatible console / IRQ 39", "16550 호환 콘솔 / IRQ 39"),
  "S-APLIC": T("Supervisor external interrupt controller", "슈퍼바이저 외부 인터럽트 컨트롤러"),
};

// RV Pocket's Atlantis-inspired hardware reference, separate from the study book.
export const DATASHEET_SECTIONS = [
  {
    id: "events",
    title: T("Input and Frame Events", "입력과 프레임 이벤트"),
    summary: T("A button IRQ notifies the CPU. A short handler records the input and returns; main applies the event and draws the next screen.",
      "버튼 IRQ가 CPU에 알립니다. 짧은 핸들러가 입력을 기록하고 반환하면 main이 이벤트를 적용해 다음 화면을 그립니다."),
    columns: [T("Operation", "동작"), T("Responsibility", "역할")],
    rows: [
      ["READ BUTTON", T("Snapshot the input for this handler invocation", "이번 핸들러 호출을 위한 입력 스냅샷")],
      ["RECORD INPUT EVENT", T("Queue the snapshot for main", "main을 위해 스냅샷을 큐에 넣기")],
      ["ACK IRQ", T("Clear the source request; the handler still has to return", "발신 요청 해제. 핸들러는 여전히 반환해야 합니다")],
      ["APPLY INPUT", T("In main: A-down reverses the automatic dot; D-pad moves the marker", "main에서: A 누르면 자동 점의 방향이 뒤집히고, D-패드는 마커를 움직입니다")],
      ["event_wait()", T("Wait safely when the queue is empty; otherwise return the next event", "큐가 비면 안전하게 기다리고, 아니면 다음 이벤트를 반환")],
      ["timer_every_ms(100)", T("Request a frame event at 10 Hz", "10 Hz로 프레임 이벤트 요청")],
    ],
    notes: [
      T("WAIT FOR RELEASE inside the handler holds the CPU there. Timer requests become pending, main cannot step the animation, and the display keeps scanning its last frame. ACK does not itself return from the handler.",
        "핸들러 안에서 WAIT FOR RELEASE를 하면 CPU가 그 자리에 묶입니다. 타이머 요청이 대기 상태가 되고, main이 애니메이션을 진행할 수 없으며, 디스플레이는 마지막 프레임을 계속 스캔합니다. ACK만으로는 핸들러에서 반환하지 않습니다."),
      T("Runtime snapshots and queues press, release, and D-pad events, preserves context, and supplies the safe wait-and-dequeue operation. Controller setup, trap CSRs, synchronization primitives, and OS scheduling remain deferred.",
        "런타임이 누름·놓침·D-패드 이벤트를 스냅샷으로 기록해 큐에 넣고, 문맥을 보존하며, 안전한 대기·제거 연산을 제공합니다. 컨트롤러 설정, trap CSR, 동기화 원시 연산, OS 스케줄링은 여전히 뒤로 미뤄져 있습니다."),
      T("Press A once to reverse direction; holding it does not repeat the action. Release requests IRQ service but does not reverse direction again. D-pad clicks or arrow keys move one pixel per input.",
        "A를 한 번 누르면 방향이 뒤집히고, 누르고 있어도 반복되지 않습니다. 놓으면 IRQ 서비스를 요청하지만 방향을 다시 뒤집지는 않습니다. D-패드 클릭이나 방향키는 한 번에 한 픽셀씩 움직입니다."),
      T("Frame service is an application rate of ten updates per second, independent of the 1 GHz MTIME frequency. Requests coalesce while main is blocked; returning does not replay a burst of missed frames.",
        "프레임 서비스는 초당 10회의 애플리케이션 갱신률이며 1 GHz MTIME 주파수와는 별개입니다. main이 막혀 있는 동안 요청은 합쳐지고, 반환해도 놓친 프레임 묶음이 재생되지는 않습니다."),
      T("Missing ACK leaves the source pending. The prototype retries once per 100 ms tick, so a broken program remains observable without blocking the browser.",
        "ACK가 빠지면 발신원이 대기 상태로 남습니다. 프로토타입은 100 ms 틱마다 한 번 재시도하므로, 잘못된 프로그램이 브라우저를 막지 않으면서도 계속 관찰됩니다."),
    ],
  },
  {
    id: "display",
    title: T("Display", "디스플레이"),
    summary: T("The Pocket's teaching display has power, readiness, mode, and output state. Its test generator can light the screen before a framebuffer program is introduced.",
      "포켓의 교육용 디스플레이에는 전원, 준비 상태, 모드, 출력 상태가 있습니다. 프레임버퍼 프로그램을 다루기 전에 테스트 생성기로 화면을 켤 수 있습니다."),
    columns: [T("Helper", "헬퍼"), T("Behavior", "동작")],
    rows: [
      ["display_power_on()", T("Start device power-up / ready after 500 ms", "장치 전원 올림 시작 / 500 ms 후 준비 완료")],
      ["start_button_led_irqs()", T("Start the supplied Episode 05 button service before display setup", "디스플레이 설정 전에 제공된 에피소드 05 버튼 서비스를 시작")],
      ["display_wait_ready()", T("Wait for READY; without power it cannot finish", "READY를 기다림. 전원이 없으면 끝나지 않음")],
      ["display_select_test_mode()", T("Select the internal test pattern once ready", "준비되면 내부 테스트 패턴 선택")],
      ["display_enable()", T("Enable output once ready and configured", "준비되고 설정되면 출력 활성화")],
      ["FRAMEBUFFER", T("0x00003000–0x0000307F / 16 × 8 pixels, 1 byte per pixel", "0x00003000–0x0000307F / 16 × 8픽셀, 픽셀당 1바이트")],
      ["ROW STRIDE", T("16 bytes / address = FB_BASE + y × ROW_BYTES + x", "행 간격 16바이트 / 주소 = FB_BASE + y × ROW_BYTES + x")],
    ],
    notes: [
      T("Episode 07 uses framebuffer mode, configured by the provided runtime. clear_framebuffer() clears the 128 visible bytes before each marker write. Coordinates are test inputs for the installed program; they do not change the editor draft.",
        "에피소드 07은 제공된 런타임이 설정한 프레임버퍼 모드를 씁니다. clear_framebuffer()가 마커를 쓰기 전에 보이는 128바이트를 지웁니다. 좌표는 설치된 프로그램에 대한 시험 입력이며 에디터 초안은 바꾸지 않습니다."),
      T("Settings sent before READY are ignored, not queued. Waiting later does not replay an ignored command. OPEN COVER shows actual execution results.",
        "READY 이전에 보낸 설정은 대기열에 넣지 않고 무시됩니다. 나중에 기다려도 무시된 명령이 재생되지는 않습니다. OPEN COVER는 실제 실행 결과를 보여줍니다."),
      T("The provided runtime handles display transport and readiness waiting. These helpers describe RV Pocket's teaching display, not an Atlantis display controller.",
        "제공된 런타임이 디스플레이 전송과 준비 대기를 처리합니다. 이 헬퍼들은 RV Pocket의 교육용 디스플레이를 설명하며 Atlantis 디스플레이 컨트롤러가 아닙니다."),
      T("Editing a startup sequence changes the draft only. Build & Flash installs it; RESET restarts the installed sequence.",
        "시작 순서를 편집하면 초안만 바뀝니다. Build & Flash가 설치하고, RESET이 설치된 순서를 다시 시작합니다."),
    ],
  },
  {
    id: "memory-map",
    title: T("Memory Map", "메모리 맵"),
    summary: T("RV POCKET — RV32G. This SoC adopts the low-address layout of Tenstorrent Atlantis. The CPU uses this 32-bit physical address space to reach RAM, boot ROM, and memory-mapped peripherals.",
      "RV POCKET — RV32G. 이 SoC는 Tenstorrent Atlantis의 저주소 배치를 따릅니다. CPU는 이 32비트 물리 주소 공간으로 RAM, 부트 ROM, 메모리 맵 주변장치에 접근합니다."),
    columns: [T("Block", "블록"), T("Address range", "주소 범위"), T("Size", "크기"), T("Purpose", "용도")],
    rows: PLATFORM_MEMORY_MAP.map((region) => [
      region.block,
      `${formatAddress(region.base)}–${formatAddress(region.base + region.size - 1)}`,
      region.sizeLabel,
      BLOCK_PURPOSE[region.block] ?? region.purpose,
    ]),
    notes: [
      T("RESET starts execution at 0x80000000 in the 8 KiB Boot ROM, then hands control to firmware and the program.",
        "RESET은 8 KiB 부트 ROM의 0x80000000에서 실행을 시작해 펌웨어와 프로그램으로 제어를 넘깁니다."),
      T("RV Pocket uses RAM directly in the low address space. Atlantis's DDR_HI window above 4 GiB is omitted from this RV32G platform. PRCM and UART0/2/3/4 are outside this revision's map.",
        "RV Pocket는 저주소 공간에 RAM을 직접 씁니다. 4 GiB 이상의 Atlantis DDR_HI 구간은 이 RV32G 플랫폼에서 제외했습니다. PRCM과 UART0/2/3/4는 이번 리비전 맵 밖입니다."),
      T("Ranges in this table include both endpoints. Gaps between listed blocks are unassigned. Device addresses are a platform choice, not addresses prescribed by the RISC-V ISA.",
        "이 표의 범위는 양 끝을 모두 포함합니다. 나열된 블록 사이의 빈 공간은 미할당입니다. 장치 주소는 플랫폼의 선택이지 RISC-V ISA가 정한 주소가 아닙니다."),
    ],
    detail: {
      title: T("Episode 02 / Reading a RAM word", "에피소드 02 / RAM 워드 읽기"),
      summary: T("A store instruction can send its value to RAM or to a device register. The destination address decides which. The supplied program is observed at one word inside the 2 GiB region.",
        "저장 명령은 값을 RAM이나 장치 레지스터로 보낼 수 있고, 어느 쪽인지는 목적지 주소가 정합니다. 제공된 프로그램은 2 GiB 영역 안의 한 워드에서 관찰됩니다."),
      columns: [T("Item", "항목"), T("Value", "값"), T("Meaning", "의미")],
      rows: [
        ["TARGET WORD", formatAddress(WATCHED_RAM_ADDRESS), T("The RAM word the program is expected to fill", "프로그램이 채워야 하는 RAM 워드")],
        ["INHERITED DESTINATION", formatAddress(INITIAL_STORE_ADDRESS), T("UART1 DATA, so the value is transmitted instead", "UART1 DATA라서 값이 대신 전송됨")],
        ["WORD SIZE", "4 bytes", T("One store covers one 32-bit word", "저장 한 번이 32비트 워드 하나를 덮음")],
        ["BYTE ORDER", formatWordBytes(0x12345678), T("Lowest address holds the low byte / little-endian", "가장 낮은 주소가 낮은 바이트를 가짐 / 리틀 엔디안")],
      ],
      notes: [
        T("Serial output cannot show where a value went. A store to a device address transmits; a store to a RAM address changes memory. Only the RAM module under OPEN COVER shows where the value landed.",
          "시리얼 출력은 값이 어디로 갔는지 보여줄 수 없습니다. 장치 주소에 저장하면 전송하고, RAM 주소에 저장하면 메모리가 바뀝니다. 값이 놓인 곳을 보여주는 것은 OPEN COVER의 RAM 모듈뿐입니다."),
        T("The program builds a different value on every flash, so the repair is the destination, not the number. Read the target word after the program runs.",
          "프로그램은 플래시할 때마다 다른 값을 만들기 때문에 수리 대상은 숫자가 아니라 목적지입니다. 프로그램 실행 후 목표 워드를 읽으세요."),
        T("The destination in store.S must be four-byte aligned. RAM addresses and the UART1 DATA address are supported by the supplied program; Boot ROM is read-only and other device writes are outside this repair.",
          "store.S의 목적지는 4바이트 경계에 맞춰야 합니다. 제공된 프로그램은 RAM 주소와 UART1 DATA 주소를 지원합니다. 부트 ROM은 읽기 전용이고 다른 장치 쓰기는 이번 수리 범위 밖입니다."),
        T("Editing the destination is a draft. Build & Flash installs it and boots the program; RESET reruns only the installed program.",
          "목적지를 편집하면 초안만 바뀝니다. Build & Flash가 설치하고 프로그램을 부팅하며, RESET은 설치된 프로그램만 다시 실행합니다."),
      ],
    },
  },
  {
    id: "uart",
    title: "UART1",
    summary: T("UART1 is the 16550-compatible console at 0xD4110000–0xD411FFFF. Writing its transmit holding register sends a byte outside the Pocket.",
      "UART1은 0xD4110000–0xD411FFFF에 있는 16550 호환 콘솔입니다. 송신 보유 레지스터에 쓰면 바이트 하나가 포켓 밖으로 나갑니다."),
    columns: [T("Register", "레지스터"), T("Address", "주소"), T("Access", "접근"), T("Behavior", "동작")],
    rows: [
      ["THR / transmit", UART_TX_ADDRESS, T("Write / 32-bit store", "쓰기 / 32비트 저장"), T("DLAB = 0: transmit the low 8 bits", "DLAB = 0: 하위 8비트 전송")],
      ["RBR / receive", UART_TX_ADDRESS, T("Read / 32-bit access", "읽기 / 32비트 접근"), T("DLAB = 0: read a received byte", "DLAB = 0: 받은 바이트 읽기")],
    ],
    notes: [
      T("A store to this address transmits: the supplied boot code uses sw t1, 0(t0) with t0 = 0xD4110000. The DATA register sends bits [7:0]; the upper bits are ignored.",
        "이 주소에 저장하면 전송됩니다. 제공된 부트 코드는 t0 = 0xD4110000으로 sw t1, 0(t0)을 씁니다. DATA 레지스터는 비트 [7:0]을 보내고 상위 비트는 무시합니다."),
      T("Store the same value to a RAM address instead and the terminal receives nothing. The destination register decides between transmitting and storing.",
        "같은 값을 RAM 주소에 저장하면 터미널은 아무것도 받지 못합니다. 전송과 저장 중 무엇을 할지는 목적지 레지스터가 정합니다."),
      T(`UART1 IRQ = ${UART1_IRQ}. Register spacing uses reg-shift = 2 (four-byte strides), and reg-io-width = 4 (32-bit accesses). UART initialization supplies DLAB = 0 for the console data register.`,
        `UART1 IRQ = ${UART1_IRQ}. 레지스터 간격은 reg-shift = 2(4바이트 보폭), reg-io-width = 4(32비트 접근)입니다. UART 초기화가 콘솔 데이터 레지스터에 DLAB = 0을 제공합니다.`),
      T("The UART cable connects the Pocket transmitter to the development PC's serial receiver. Serial settings: 115200 baud. Initialization is already supplied.",
        "UART 케이블은 포켓의 송신기와 개발 PC의 시리얼 수신기를 연결합니다. 직렬 설정은 115200 baud이며 초기화는 이미 제공되어 있습니다."),
      T("A UART transmission does not initialize the Pocket's display.",
        "UART 전송은 포켓의 디스플레이를 초기화하지 않습니다."),
    ],
  },
  {
    id: "ascii",
    title: "ASCII",
    summary: T("The serial terminal displays the received byte as a character. These are the two character codes used by boot.S.",
      "시리얼 터미널은 받은 바이트를 문자로 표시합니다. boot.S가 쓰는 두 문자 코드입니다."),
    columns: [T("Character", "문자"), "Hex byte", "Decimal"],
    rows: [["A", "0x41", "65"], ["B", "0x42", "66"]],
    notes: [T("To send a different character, change the byte in boot.S and use Build & Flash. Reset reruns the firmware already installed on the Pocket.",
      "다른 문자를 보내려면 boot.S의 바이트를 바꾸고 Build & Flash를 사용하세요. Reset은 포켓에 이미 설치된 펌웨어를 다시 실행합니다.")],
  },
  {
    id: "gpio",
    title: "GPIO",
    summary: T("The GPIO block holds the Pocket's A button and its LED. Both are memory-mapped, so they are read and written like RAM.",
      "GPIO 블록에는 포켓의 A 버튼과 LED가 있습니다. 둘 다 메모리 맵이라 RAM처럼 읽고 씁니다."),
    columns: [T("Register", "레지스터"), T("Address", "주소"), T("Access", "접근"), T("Behavior", "동작")],
    rows: [
      ["BUTTON", formatAddress(BUTTON_ADDRESS), T("Read / 32-bit", "읽기 / 32비트"), T("Bit 0 set while A is held / 0x00000001", "A를 누르고 있으면 비트 0이 설정됨 / 0x00000001")],
      ["LED", formatAddress(LED_ADDRESS), T("Write / 32-bit", "쓰기 / 32비트"), T("Bit 0 drives the LED / 1 on, 0 off", "비트 0이 LED를 구동함 / 1 켜짐, 0 꺼짐")],
    ],
    notes: [
      T("The Pocket's TTL GPIO sits in the gap between I2C4 and UART1. Atlantis's QEMU model has no GPIO, so these two registers are RV Pocket's own.",
        "포켓의 TTL GPIO는 I2C4와 UART1 사이의 빈 구간에 있습니다. Atlantis의 QEMU 모델에는 GPIO가 없어서 이 두 레지스터는 RV Pocket 고유의 것입니다."),
      T("One register can carry several states as separate bits, which is why the program tests a bit rather than the whole word.",
        "하나의 레지스터가 여러 상태를 별개 비트로 담을 수 있어서, 프로그램은 워드 전체가 아니라 비트를 검사합니다."),
      T("Both registers appear as rows in the RAM module under OPEN COVER in the button episodes, the same way MTIME does in Episode 03. They are not a module of their own. Later display episodes show framebuffer bytes in RAM.",
        "버튼 에피소드에서 두 레지스터는 에피소드 03의 MTIME과 마찬가지로 OPEN COVER의 RAM 모듈에 행으로 나타납니다. 별도 모듈이 아닙니다. 이후 디스플레이 에피소드에서는 RAM의 프레임버퍼 바이트를 보여줍니다."),
      T(`GPIO IRQ = ${GPIO_IRQ}. Episode 04's program polls the button register on every pass of its loop. Episode 05 replaces polling with BUTTON → IRQ → CPU: hardware asks for service instead of the CPU continually asking the button.`,
        `GPIO IRQ = ${GPIO_IRQ}. 에피소드 04의 프로그램은 루프의 매 패스마다 버튼 레지스터를 폴링합니다. 에피소드 05는 폴링을 BUTTON → IRQ → CPU로 대체합니다. CPU가 계속 버튼을 묻는 대신 하드웨어가 서비스를 요청합니다.`),
      T("gpio_irq_enable(BUTTON_A) enables notification on both press and release. cpu_wait() waits without reading BUTTON_REG. In button_irq_handler(), read the current button value, update the LED, then call gpio_irq_ack() to clear the pending request. Without ACK the supplied model delivers the request again.",
        "gpio_irq_enable(BUTTON_A)는 누름과 놓침을 모두 알리게 합니다. cpu_wait()는 BUTTON_REG를 읽지 않고 기다립니다. button_irq_handler()에서 현재 버튼 값을 읽고 LED를 갱신한 뒤 gpio_irq_ack()를 호출해 대기 중인 요청을 지웁니다. ACK가 없으면 제공된 모델이 요청을 다시 전달합니다."),
      T("Runtime supplies interrupt routing, context preservation, CSR setup, and trap entry/return. APLIC and IMSIC details are reserved for a later episode. These helpers are RV Pocket teaching interfaces, not register definitions for every GPIO device.",
        "런타임이 인터럽트 라우팅, 문맥 보존, CSR 설정, trap 진입·복귀를 제공합니다. APLIC과 IMSIC 세부는 뒤 에피소드로 남겨둡니다. 이 헬퍼들은 RV Pocket의 교육용 인터페이스이지 모든 GPIO 장치의 레지스터 정의가 아닙니다."),
      T("Episode 08 adds D-pad input through the supplied snapshot/event runtime. Keep the handler short: read, record an input event, acknowledge, then return. Main applies input and animation. A valid idle wait does not prevent queued events from being processed.",
        "에피소드 08은 제공된 스냅샷·이벤트 런타임으로 D-패드 입력을 더합니다. 핸들러를 짧게 유지하세요. 읽고, 입력 이벤트를 기록하고, 확인하고, 반환합니다. main이 입력과 애니메이션을 적용합니다. 올바른 유휴 대기는 큐에 쌓인 이벤트의 처리를 막지 않습니다."),
      T("A read tells the CPU what the hardware is doing. A write tells the hardware what to do. Nothing else moves the LED.",
        "읽기는 CPU에게 하드웨어가 무엇을 하는지 알려줍니다. 쓰기는 하드웨어에게 무엇을 할지 알려줍니다. 그 외에는 LED를 움직이는 것이 없습니다."),
    ],
  },
  {
    id: "timer",
    title: T("Timer", "타이머"),
    summary: T(`The ACLINT machine timer occupies 0xA2180000–0xA218FFFF. Its MTIME counter runs at ${TIMER_FREQUENCY_HZ.toLocaleString("en-US")} Hz (1 GHz): one timer tick is one nanosecond.`,
      `ACLINT 머신 타이머는 0xA2180000–0xA218FFFF를 차지합니다. MTIME 카운터는 ${TIMER_FREQUENCY_HZ.toLocaleString("en-US")} Hz(1 GHz)로 동작하며 타이머 틱 하나가 1나노초입니다.`),
    columns: [T("Register", "레지스터"), T("Address", "주소"), "Width", T("Behavior", "동작")],
    rows: [
      ["MTIME", TIMER_ADDRESS, "64-bit", T("Counter / 1,000,000,000 ticks per second", "카운터 / 초당 1,000,000,000 틱")],
      ["MTIMECMP / hart 0", formatAddress(MTIMECMP_ADDRESS), "64-bit", T("Machine timer interrupt compare", "머신 타이머 인터럽트 비교")],
    ],
    notes: [
      T("1 second = 1,000,000,000 timer ticks. Delay in seconds = target ticks / 1,000,000,000. This is the timer frequency; it is not a CPU clock specification.",
        "1초 = 1,000,000,000 타이머 틱. 지연 시간(초) = 목표 틱 / 1,000,000,000. 이는 타이머 주파수이지 CPU 클록 사양이 아닙니다."),
      T("MTIME is at ACLINT base + 0x0000. Hart 0's MTIMECMP is at base + 0x8000. The register is 64-bit; the RAM view in the prototype shows a 32-bit word of it, which is enough to see it advancing.",
        "MTIME은 ACLINT base + 0x0000에 있습니다. hart 0의 MTIMECMP는 base + 0x8000에 있습니다. 레지스터는 64비트이며 프로토타입의 RAM 뷰는 그중 32비트 워드를 보여줍니다. 그것으로 증가하는 모습을 볼 수 있습니다."),
      T("Because MTIME is a memory-mapped register, it appears as a row in the RAM module under OPEN COVER, alongside the RAM words. It is not a separate module.",
        "MTIME은 메모리 맵 레지스터라 RAM 모듈의 RAM 워드 옆에 행으로 나타납니다. 별도 모듈이 아닙니다."),
      T("Episode 03's PROGRAM TIMEBASE is the program's assumption about ticks per second. It calculates the target for a one-second wait. A 2 GHz assumption requests 2,000,000,000 ticks, which takes two seconds on the actual 1 GHz timer. The assumption itself stays on the PC; the cover only shows what the machine is doing.",
        "에피소드 03의 PROGRAM TIMEBASE는 프로그램이 초당 틱 수에 대해 가정하는 값입니다. 1초 대기에 대한 목표를 계산합니다. 2 GHz 가정이면 2,000,000,000 틱을 요청하고, 실제 1 GHz 타이머에서는 2초가 걸립니다. 가정 자체는 PC에 남고, 덮개는 기계가 무엇을 하는지만 보여줍니다."),
      T("Build & Flash applies the edited program timebase and restarts the diagnostic. Editing the setting does not change the hardware timer's fixed frequency, and a firmware reset does not restart the counter.",
        "Build & Flash는 편집한 프로그램 시간 기준을 적용하고 진단을 다시 시작합니다. 설정을 편집해도 하드웨어 타이머의 고정 주파수는 바뀌지 않으며, 펌웨어를 리셋해도 카운터는 다시 시작되지 않습니다."),
      T("Observe at least two serial ticks to measure their interval. The timer LED pulses with each tick.",
        "간격을 측정하려면 시리얼 틱을 최소 두 개 관찰하세요. 타이머 LED는 틱마다 깜빡입니다."),
    ],
  },
] as const;

export type DatasheetSectionId = typeof DATASHEET_SECTIONS[number]["id"];