import { VALIDATION_PATTERNS } from './constants';

export function isEmail(input: string): boolean {
  return VALIDATION_PATTERNS.EMAIL.test(input.trim());
}

export function isHexAddress(input: string): boolean {
  return VALIDATION_PATTERNS.HEX_ADDRESS.test(input.trim());
}

export function parseAmount(input: string): number | null {
  const v = input.trim();
  if (!VALIDATION_PATTERNS.DECIMAL_AMOUNT.test(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

