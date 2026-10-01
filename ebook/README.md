# RV Pocket — Computer Systems from RISC-V to Linux

A standalone book about how instructions, operating systems, and devices cooperate. Its central question is: **when software requests an action, which state changes, who changes it, and what proves that the action finished?** You can read it without playing any Episodes or running a simulator.

## Who this book is for

The intended reader is a university student with basic programming experience. You should be comfortable with variables, loops, functions, arrays, and the idea that a C pointer refers to an object in memory. You do not need prior RISC-V assembly, kernel programming, or driver-writing experience. The book builds those mechanisms explicitly instead of using their terminology as a prerequisite.

The goal is to reason across boundaries: decode a small instruction trace, explain why a function needs saved state, follow a trap and a context switch, translate an address, and account for the lifetime of a buffer used by a device. Reading a familiar definition is not the completion criterion; being able to explain the next state is.

## How the argument develops

Parts I–II establish values, storage, execution, and calls. Part III changes the meaning of a memory access by connecting it to a device, then introduces waiting and traps. Parts IV–V explain shared execution, protection, cached state, address translation, and device ownership. Parts VI–VII apply those mechanisms to boot and Linux driver lifecycles. Part VIII follows complete paths and uses evidence to locate failures across layers.

The same byte and the same kinds of state recur as the model grows. Chapters 01 and 15 revisit a write at different depths; Chapters 12 and 30 connect hardware notification to a Linux handler; Chapters 22, 23, and 32 develop DMA from ownership to the real API. The later chapter should explain a previously hidden boundary, not merely repeat the earlier definition.

## Machine and code conventions

- Arithmetic and assembly examples use RV64 integer registers and little-endian memory unless stated otherwise. Four-byte instruction traces explicitly exclude compressed encodings.
- Chapter 09 defines a fictional UART at physical base `0x10000000`. Its register map is a teaching contract, not a real board specification. Device-specific examples introduce their own contracts before using them.
- Addresses in early RAM exercises are local examples, not one mandatory whole-machine memory map. Later virtual, physical, and DMA addresses are labeled separately.
- Linux snippets illustrate a stated mechanism and identify omitted error, teardown, or concurrency behavior. They are not complete loadable drivers. Read the target kernel's documentation and source before adapting an API.
- Tables and ASCII traces carry the explanation; no external assets, simulator, or episode state is required.

## How to use the Checks

Problems are deliberately harder than the exposition. Work them with paper, a calculator, and the linked official documentation. Some ask for a counterexample or a diagnostic plan rather than one numeric result. For those, a good answer states assumptions, tracks intermediate state, and explains what its evidence rules out and what remains uncertain.

Research challenges identify a source and a specific question to investigate. Record the version or commit you read. Open questions are not automatically graded, and a difficult question is not a gate to reading the next chapter. Return to it after the associated mechanism becomes clearer.

Each chapter includes the limits of its model, focused references, and neighboring chapter links. The reader provides section navigation and previous/next chapter controls. Episode bookmarks are optional entry points into this independent reading order.

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
