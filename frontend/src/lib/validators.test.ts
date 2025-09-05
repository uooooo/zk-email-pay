import { describe, it, expect } from 'vitest';
import { isEmail, isHexAddress, parseAmount } from './validators';

describe('validators', () => {
  describe('isEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name@domain.co.jp')).toBe(true);
      expect(isEmail('123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isEmail('')).toBe(false);
      expect(isEmail('invalid')).toBe(false);
      expect(isEmail('test@')).toBe(false);
      expect(isEmail('@domain.com')).toBe(false);
      expect(isEmail('test@domain')).toBe(false);
      expect(isEmail('test@@domain.com')).toBe(false);
      expect(isEmail('test @domain.com')).toBe(false);
    });

    it('should handle whitespace correctly', () => {
      expect(isEmail('  test@example.com  ')).toBe(true);
      expect(isEmail(' test @example.com ')).toBe(false);
    });
  });

  describe('isHexAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(isHexAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isHexAddress('0xaBcDeF1234567890123456789012345678901234')).toBe(true);
      expect(isHexAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('should reject invalid Ethereum addresses', () => {
      expect(isHexAddress('')).toBe(false);
      expect(isHexAddress('0x')).toBe(false);
      expect(isHexAddress('1234567890123456789012345678901234567890')).toBe(false); // missing 0x
      expect(isHexAddress('0x123456789012345678901234567890123456789')).toBe(false); // too short
      expect(isHexAddress('0x12345678901234567890123456789012345678901')).toBe(false); // too long
      expect(isHexAddress('0x123456789012345678901234567890123456789g')).toBe(false); // invalid character
    });

    it('should handle whitespace correctly', () => {
      expect(isHexAddress('  0x1234567890123456789012345678901234567890  ')).toBe(true);
    });
  });

  describe('parseAmount', () => {
    it('should parse valid amounts', () => {
      expect(parseAmount('123')).toBe(123);
      expect(parseAmount('123.45')).toBe(123.45);
      expect(parseAmount('0')).toBe(0);
      expect(parseAmount('0.01')).toBe(0.01);
    });

    it('should reject invalid amounts', () => {
      expect(parseAmount('')).toBe(null);
      expect(parseAmount('abc')).toBe(null);
      expect(parseAmount('123.45.67')).toBe(null);
      expect(parseAmount('123.')).toBe(null);
      expect(parseAmount('.123')).toBe(null);
      expect(parseAmount('-123')).toBe(null);
      expect(parseAmount('123,45')).toBe(null);
    });

    it('should handle whitespace correctly', () => {
      expect(parseAmount('  123.45  ')).toBe(123.45);
    });

    it('should handle edge cases', () => {
      expect(parseAmount('Infinity')).toBe(null);
      expect(parseAmount('NaN')).toBe(null);
    });
  });
});