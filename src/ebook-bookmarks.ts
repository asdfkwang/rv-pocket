// Per-episode EBOOK bookmarks (chapter level).
// The book itself is identical from every episode; this only highlights
// where to read to solve the current repair. Keys match Episode ids.
export const EBOOK_BOOKMARKS: Record<number, readonly string[]> = {
  1: ["01_the_computer_as_a_system"],
  2: ["02_bits_bytes_numbers_and_addresses", "03_memory_where_state_lives"],
  3: ["11_polling_time_and_timers"],
};
