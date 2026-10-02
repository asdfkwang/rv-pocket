// Per-episode EBOOK bookmarks (chapter level).
// The book itself is identical from every episode; this only highlights
// where to read to solve the current repair. Keys match Episode ids.
export const EBOOK_BOOKMARKS: Record<number, readonly string[]> = {
  1: ["01_the_computer_as_a_system"],
  2: ["02_bits_bytes_numbers_and_addresses", "03_memory_where_state_lives"],
  3: ["11_polling_time_and_timers"],
  5: ["11_polling_time_and_timers", "12_interrupts_hardware_wants_attention"],
  7: ["03_memory_where_state_lives", "06_loads_stores_and_pointers"],
  8: ["12_interrupts_hardware_wants_attention", "31_sleeping_waiting_and_asynchronous_events"],
  6: ["10_device_registers", "37_reading_a_datasheet"],
};
