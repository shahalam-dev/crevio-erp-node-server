import { describe, it, expect } from 'vitest';

import { normalizePhone } from '../../src/utils/phone.util';

describe('normalizePhone', () => {
  it('should normalize international phone without country code', () => {
    expect(normalizePhone('+12025550123')).toBe('+12025550123');
  });

  it('should normalize national phone with country code', () => {
    expect(normalizePhone('2025550123', 'US')).toBe('+12025550123');
  });

  it('should normalize Bangladesh number with country code', () => {
    expect(normalizePhone('01712345678', 'BD')).toBe('+8801712345678');
  });

  it('should throw error for invalid phone', () => {
    expect(() => normalizePhone('12345')).toThrow('Invalid phone number');
  });

  it('should throw error for invalid phone with country code', () => {
    expect(() => normalizePhone('12345', 'US')).toThrow('Invalid phone number');
  });
});
