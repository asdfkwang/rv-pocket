# RV Pocket — Computer Systems from RISC-V to Linux

Standalone eBook draft. It does not share a numbering scheme with the game Episodes.

It connects **Computer Architecture + RISC-V + Operating Systems + Linux Device Drivers** vertically within a single system instead of separating them like three books.

```text
Hardware / RISC-V
      ↓
OS mechanisms
      ↓
Linux kernel / driver
      ↓
Userspace-visible behavior
```

## Philosophy

- **Easy to read:** The main text explains through small examples and state tracking.
- **Hard to solve:** Checks require reasoning, debugging, and source/spec lookup.
- **Deep when you want it:** Deep definitions and edge cases are covered through official documentation links.
- Checks are open-book/open-web and are not game progression gates.

# Table of Contents

## Part I — A Computer That Can Run Code

- [Chapter 01 — The Computer as a System](chapters/01_the_computer_as_a_system.md)
- [Chapter 02 — Bits, Bytes, Numbers, and Addresses](chapters/02_bits_bytes_numbers_and_addresses.md)
- [Chapter 03 — Memory: Where State Lives](chapters/03_memory_where_state_lives.md)
- [Chapter 04 — Inside the CPU](chapters/04_inside_the_cpu.md)

## Part II — Speaking RISC-V

- [Chapter 05 — Instructions and the RISC-V ISA](chapters/05_instructions_and_the_risc_v_isa.md)
- [Chapter 06 — Loads, Stores, and Pointers](chapters/06_loads_stores_and_pointers.md)
- [Chapter 07 — Branches, Jumps, and Control Flow](chapters/07_branches_jumps_and_control_flow.md)
- [Chapter 08 — Functions, ABI, and the Stack](chapters/08_functions_abi_and_the_stack.md)

## Part III — CPU Meets Hardware

- [Chapter 09 — How Devices Become Addresses](chapters/09_how_devices_become_addresses.md)
- [Chapter 10 — Device Registers](chapters/10_device_registers.md)
- [Chapter 11 — Polling, Time, and Timers](chapters/11_polling_time_and_timers.md)
- [Chapter 12 — Interrupts: Hardware Wants Attention](chapters/12_interrupts_hardware_wants_attention.md)
- [Chapter 13 — Exceptions, Traps, and System Calls](chapters/13_exceptions_traps_and_system_calls.md)

## Part IV — Protection and the Operating System

- [Chapter 14 — Privilege: M, S, and U](chapters/14_privilege_m_s_and_u.md)
- [Chapter 15 — What an Operating System Actually Does](chapters/15_what_an_operating_system_actually_does.md)
- [Chapter 16 — Processes and Context Switching](chapters/16_processes_and_context_switching.md)
- [Chapter 17 — Threads and Scheduling](chapters/17_threads_and_scheduling.md)
- [Chapter 18 — Concurrency and Synchronization](chapters/18_concurrency_and_synchronization.md)

## Part V — Memory Becomes Virtual

- [Chapter 19 — Cache and the Memory Hierarchy](chapters/19_cache_and_the_memory_hierarchy.md)
- [Chapter 20 — Virtual Memory and Sv39](chapters/20_virtual_memory_and_sv39.md)
- [Chapter 21 — TLBs, Page Faults, and Memory Management](chapters/21_tlbs_page_faults_and_memory_management.md)
- [Chapter 22 — DMA: When the CPU Steps Aside](chapters/22_dma_when_the_cpu_steps_aside.md)
- [Chapter 23 — Cache Coherency, DMA, and Memory Ordering](chapters/23_cache_coherency_dma_and_memory_ordering.md)

## Part VI — How Linux Finds Hardware

- [Chapter 24 — Reset, Firmware, and Boot](chapters/24_reset_firmware_and_boot.md)
- [Chapter 25 — SBI and the Boundary Below Linux](chapters/25_sbi_and_the_boundary_below_linux.md)
- [Chapter 26 — Device Tree: Describing the Machine](chapters/26_device_tree_describing_the_machine.md)

## Part VII — Linux Device Drivers

- [Chapter 27 — What a Linux Device Driver Is](chapters/27_what_a_linux_device_driver_is.md)
- [Chapter 28 — Probe: Meeting the Device](chapters/28_probe_meeting_the_device.md)
- [Chapter 29 — MMIO in a Real Linux Driver](chapters/29_mmio_in_a_real_linux_driver.md)
- [Chapter 30 — Interrupts in a Real Linux Driver](chapters/30_interrupts_in_a_real_linux_driver.md)
- [Chapter 31 — Sleeping, Waiting, and Asynchronous Events](chapters/31_sleeping_waiting_and_asynchronous_events.md)
- [Chapter 32 — DMA in a Real Linux Driver](chapters/32_dma_in_a_real_linux_driver.md)
- [Chapter 33 — Exposing Devices to Userspace](chapters/33_exposing_devices_to_userspace.md)

## Part VIII — A Complete System

- [Chapter 34 — Files, Storage, and the I/O Path](chapters/34_files_storage_and_the_i_o_path.md)
- [Chapter 35 — One Button Press, End to End](chapters/35_one_button_press_end_to_end.md)
- [Chapter 36 — One DMA Frame, End to End](chapters/36_one_dma_frame_end_to_end.md)
- [Chapter 37 — Reading a Datasheet](chapters/37_reading_a_datasheet.md)
- [Chapter 38 — Reading a Linux Driver](chapters/38_reading_a_linux_driver.md)
- [Chapter 39 — Bugs Across Layers](chapters/39_bugs_across_layers.md)
- [Chapter 40 — From Power-On to Userspace](chapters/40_from_power_on_to_userspace.md)
