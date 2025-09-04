export function isEmail(input: string): boolean {
  // Basic email pattern; full RFC compliance is unnecessary here
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(input.trim());
}

export function isHexAddress(input: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(input.trim());
}

export function parseAmount(input: string): number | null {
  const v = input.trim();
  if (!/^\d+(?:\.\d+)?$/.test(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

