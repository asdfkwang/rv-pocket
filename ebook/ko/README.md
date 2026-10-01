# RV Pocket — RISC-V부터 Linux까지 컴퓨터 시스템

독립형 eBook 초안. 게임의 에피소드와 번호 체계를 공유하지 않습니다.

**컴퓨터 구조 + RISC-V + 운영체제 + 리눅스 디바이스 드라이버**를 세 권으로 나누지 않고 하나의 시스템 안에서 수직으로 연결합니다.

```text
하드웨어 / RISC-V
      ↓
OS 메커니즘
      ↓
리눅스 커널 / 드라이버
      ↓
사용자 공간에 보이는 동작
```

## 철학

- **쉽게 읽히게:** 본문은 작은 예제와 상태 추적으로 설명합니다.
- **풀기 어렵게:** 체크는 추론·디버깅·소스/규격 검색이 필요합니다.
- **원하면 깊게:** 깊은 정의와 예외는 공식 문서 링크로 확장합니다.
- 체크는 open-book/open-web이며 게임 진행을 막지 않습니다.

# 목차

## Part I — A Computer That Can Run Code

- [챕터 01 — The Computer as a System](ko/chapters/01_the_computer_as_a_system.md)
- [챕터 02 — Bits, Bytes, Numbers, and Addresses](ko/chapters/02_bits_bytes_numbers_and_addresses.md)
- [챕터 03 — Memory: Where State Lives](ko/chapters/03_memory_where_state_lives.md)
- [챕터 04 — Inside the CPU](ko/chapters/04_inside_the_cpu.md)

## Part II — Speaking RISC-V

- [챕터 05 — Instructions and the RISC-V ISA](ko/chapters/05_instructions_and_the_risc_v_isa.md)
- [챕터 06 — Loads, Stores, and Pointers](ko/chapters/06_loads_stores_and_pointers.md)
- [챕터 07 — Branches, Jumps, and Control Flow](ko/chapters/07_branches_jumps_and_control_flow.md)
- [챕터 08 — Functions, ABI, and the Stack](ko/chapters/08_functions_abi_and_the_stack.md)

## Part III — CPU Meets Hardware

- [챕터 09 — How Devices Become Addresses](ko/chapters/09_how_devices_become_addresses.md)
- [챕터 10 — Device Registers](ko/chapters/10_device_registers.md)
- [챕터 11 — Polling, Time, and Timers](ko/chapters/11_polling_time_and_timers.md)
- [챕터 12 — Interrupts: Hardware Wants Attention](ko/chapters/12_interrupts_hardware_wants_attention.md)
- [챕터 13 — Exceptions, Traps, and System Calls](ko/chapters/13_exceptions_traps_and_system_calls.md)

## Part IV — Protection and the Operating System

- [챕터 14 — Privilege: M, S, and U](ko/chapters/14_privilege_m_s_and_u.md)
- [챕터 15 — What an Operating System Actually Does](ko/chapters/15_what_an_operating_system_actually_does.md)
- [챕터 16 — Processes and Context Switching](ko/chapters/16_processes_and_context_switching.md)
- [챕터 17 — Threads and Scheduling](ko/chapters/17_threads_and_scheduling.md)
- [챕터 18 — Concurrency and Synchronization](ko/chapters/18_concurrency_and_synchronization.md)

## Part V — Memory Becomes Virtual

- [챕터 19 — Cache and the Memory Hierarchy](ko/chapters/19_cache_and_the_memory_hierarchy.md)
- [챕터 20 — Virtual Memory and Sv39](ko/chapters/20_virtual_memory_and_sv39.md)
- [챕터 21 — TLBs, Page Faults, and Memory Management](ko/chapters/21_tlbs_page_faults_and_memory_management.md)
- [챕터 22 — DMA: When the CPU Steps Aside](ko/chapters/22_dma_when_the_cpu_steps_aside.md)
- [챕터 23 — Cache Coherency, DMA, and Memory Ordering](ko/chapters/23_cache_coherency_dma_and_memory_ordering.md)

## Part VI — How Linux Finds Hardware

- [챕터 24 — Reset, Firmware, and Boot](ko/chapters/24_reset_firmware_and_boot.md)
- [챕터 25 — SBI and the Boundary Below Linux](ko/chapters/25_sbi_and_the_boundary_below_linux.md)
- [챕터 26 — Device Tree: Describing the Machine](ko/chapters/26_device_tree_describing_the_machine.md)

## Part VII — Linux Device Drivers

- [챕터 27 — What a Linux Device Driver Is](ko/chapters/27_what_a_linux_device_driver_is.md)
- [챕터 28 — Probe: Meeting the Device](ko/chapters/28_probe_meeting_the_device.md)
- [챕터 29 — MMIO in a Real Linux Driver](ko/chapters/29_mmio_in_a_real_linux_driver.md)
- [챕터 30 — Interrupts in a Real Linux Driver](ko/chapters/30_interrupts_in_a_real_linux_driver.md)
- [챕터 31 — Sleeping, Waiting, and Asynchronous Events](ko/chapters/31_sleeping_waiting_and_asynchronous_events.md)
- [챕터 32 — DMA in a Real Linux Driver](ko/chapters/32_dma_in_a_real_linux_driver.md)
- [챕터 33 — Exposing Devices to Userspace](ko/chapters/33_exposing_devices_to_userspace.md)

## Part VIII — A Complete System

- [챕터 34 — Files, Storage, and the I/O Path](ko/chapters/34_files_storage_and_the_i_o_path.md)
- [챕터 35 — One Button Press, End to End](ko/chapters/35_one_button_press_end_to_end.md)
- [챕터 36 — One DMA Frame, End to End](ko/chapters/36_one_dma_frame_end_to_end.md)
- [챕터 37 — Reading a Datasheet](ko/chapters/37_reading_a_datasheet.md)
- [챕터 38 — Reading a Linux Driver](ko/chapters/38_reading_a_linux_driver.md)
- [챕터 39 — Bugs Across Layers](ko/chapters/39_bugs_across_layers.md)
- [챕터 40 — From Power-On to Userspace](ko/chapters/40_from_power_on_to_userspace.md)
