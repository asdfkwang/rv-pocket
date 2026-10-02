// RV Pocket adopts Atlantis's low-address layout for an RV32G teaching SoC.
// Reference: https://github.com/qemu/qemu/blob/master/hw/riscv/tt_atlantis.c
export const RAM_BASE = 0x00000000;
export const RAM_SIZE = 0x80000000;
export const BOOTROM_BASE = 0x80000000;
export const BOOTROM_SIZE = 0x2000;
export const RESET_VECTOR = BOOTROM_BASE;
export const ACLINT_BASE = 0xa2180000;
export const MTIME_ADDRESS = ACLINT_BASE;
export const MTIMECMP_ADDRESS = ACLINT_BASE + 0x8000;
export const TIMER_FREQUENCY_HZ = 1_000_000_000;
export const GPIO_BASE = 0xd4090000;
export const GPIO_SIZE = 0x10000;
export const GPIO_IRQ = 37;
// Atlantis has no GPIO in the QEMU model, so these are RV Pocket's own registers in
// the gap between I2C4 and UART1, where the real chip keeps its TTL GPIO.
export const BUTTON_ADDRESS = GPIO_BASE + 0x0;
export const LED_ADDRESS = GPIO_BASE + 0x4;
export const BUTTON_A_BIT = 0x1;
export const UART1_BASE = 0xd4110000;
export const UART1_IRQ = 39;

export function formatAddress(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(8, "0")}`;
}

export const PLATFORM_MEMORY_MAP = [
  { block: "RAM / DDR_LO", base: RAM_BASE, size: RAM_SIZE, sizeLabel: "2 GiB", purpose: "RAM in the RV32G low address space" },
  { block: "BOOTROM", base: BOOTROM_BASE, size: BOOTROM_SIZE, sizeLabel: "8 KiB", purpose: "Reset / boot ROM; reset vector 0x80000000" },
  { block: "M-IMSIC", base: 0xa0000000, size: 0x200000, sizeLabel: "2 MiB", purpose: "Machine-mode MSI interrupt files" },
  { block: "ACLINT", base: ACLINT_BASE, size: 0x10000, sizeLabel: "64 KiB", purpose: "Machine timer" },
  { block: "S-IMSIC", base: 0xa4000000, size: 0x200000, sizeLabel: "2 MiB", purpose: "Supervisor-mode MSI interrupt files" },
  { block: "M-APLIC", base: 0xcc000000, size: 0x4000000, sizeLabel: "64 MiB", purpose: "Machine external interrupt controller" },
  { block: "I2C0", base: 0xd4040000, size: 0x10000, sizeLabel: "64 KiB", purpose: "DesignWare I²C / IRQ 33" },
  { block: "I2C1", base: 0xd4050000, size: 0x10000, sizeLabel: "64 KiB", purpose: "DesignWare I²C / IRQ 34" },
  { block: "I2C2", base: 0xd4060000, size: 0x10000, sizeLabel: "64 KiB", purpose: "DesignWare I²C / IRQ 35" },
  { block: "I2C3", base: 0xd4070000, size: 0x10000, sizeLabel: "64 KiB", purpose: "DesignWare I²C / IRQ 36" },
  { block: "I2C4", base: 0xd4080000, size: 0x10000, sizeLabel: "64 KiB", purpose: "DesignWare I²C / IRQ 36" },
  { block: "GPIO", base: GPIO_BASE, size: GPIO_SIZE, sizeLabel: "64 KiB", purpose: "Pocket buttons and LEDs / IRQ 37" },
  { block: "UART1", base: UART1_BASE, size: 0x10000, sizeLabel: "64 KiB", purpose: "16550-compatible console / IRQ 39" },
  { block: "S-APLIC", base: 0xe8000000, size: 0x4000000, sizeLabel: "64 MiB", purpose: "Supervisor external interrupt controller" },
] as const;
