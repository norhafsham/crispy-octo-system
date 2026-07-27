import { describe, expect, it } from 'vitest';
import {
  ArithmeticError,
  getSafeRange,
  isWithinSafeRange,
  validateSafeInteger,
  safeAdd,
  safeSubtract,
  safeMultiply,
  safeDivide,
  safeModulo,
  safePower,
  safeIncrement,
  safeDecrement,
} from './arithmetic-utils';

const MAX = Number.MAX_SAFE_INTEGER;
const MIN = Number.MIN_SAFE_INTEGER;

describe('getSafeRange', () => {
  it('returns MIN_SAFE_INTEGER and MAX_SAFE_INTEGER', () => {
    expect(getSafeRange()).toEqual({ min: MIN, max: MAX });
  });
});

describe('isWithinSafeRange', () => {
  it('accepts values inside the range, including the boundaries', () => {
    expect(isWithinSafeRange(0)).toBe(true);
    expect(isWithinSafeRange(MAX)).toBe(true);
    expect(isWithinSafeRange(MIN)).toBe(true);
  });

  it('rejects values one past either boundary', () => {
    expect(isWithinSafeRange(MAX + 1)).toBe(false);
    expect(isWithinSafeRange(MIN - 1)).toBe(false);
  });

  it('rejects non-integers', () => {
    expect(isWithinSafeRange(1.5)).toBe(false);
  });

  it('rejects NaN and Infinity', () => {
    expect(isWithinSafeRange(NaN)).toBe(false);
    expect(isWithinSafeRange(Infinity)).toBe(false);
    expect(isWithinSafeRange(-Infinity)).toBe(false);
  });
});

describe('validateSafeInteger', () => {
  it('does not throw for a safe integer', () => {
    expect(() => validateSafeInteger(42)).not.toThrow();
  });

  it('throws ArithmeticError for an out-of-range value', () => {
    expect(() => validateSafeInteger(MAX + 1)).toThrow(ArithmeticError);
  });
});

describe('safeAdd', () => {
  it('adds two safe integers', () => {
    expect(safeAdd(100, 50)).toBe(150);
  });

  it('throws on overflow past MAX_SAFE_INTEGER', () => {
    expect(() => safeAdd(MAX, 1)).toThrow(ArithmeticError);
  });

  it('throws when an operand is already unsafe', () => {
    expect(() => safeAdd(MAX + 1, 1)).toThrow(ArithmeticError);
  });
});

describe('safeSubtract', () => {
  it('subtracts two safe integers', () => {
    expect(safeSubtract(100, 50)).toBe(50);
  });

  it('throws on underflow past MIN_SAFE_INTEGER', () => {
    expect(() => safeSubtract(MIN, 1)).toThrow(ArithmeticError);
  });
});

describe('safeMultiply', () => {
  it('multiplies two safe integers', () => {
    expect(safeMultiply(6, 7)).toBe(42);
  });

  it('throws on overflow', () => {
    expect(() => safeMultiply(MAX, 2)).toThrow(ArithmeticError);
  });
});

describe('safeDivide', () => {
  it('divides two safe integers evenly', () => {
    expect(safeDivide(100, 50)).toBe(2);
  });

  it('throws ArithmeticError on division by zero', () => {
    expect(() => safeDivide(10, 0)).toThrow(ArithmeticError);
    expect(() => safeDivide(10, 0)).toThrow('Division by zero');
  });

  it('throws when the result is not an integer', () => {
    expect(() => safeDivide(10, 3)).toThrow(ArithmeticError);
  });
});

describe('safeModulo', () => {
  it('computes remainder for safe integers', () => {
    expect(safeModulo(5, 3)).toBe(2);
  });

  it('throws ArithmeticError on modulo by zero', () => {
    expect(() => safeModulo(5, 0)).toThrow(ArithmeticError);
    expect(() => safeModulo(5, 0)).toThrow('Modulo by zero');
  });
});

describe('safePower', () => {
  it('computes integer powers', () => {
    expect(safePower(2, 10)).toBe(1024);
    expect(safePower(10, 3)).toBe(1000);
  });

  it('throws on overflow', () => {
    expect(() => safePower(2, 100)).toThrow(ArithmeticError);
  });

  it('throws when a negative exponent produces a non-integer result', () => {
    expect(() => safePower(2, -1)).toThrow(ArithmeticError);
  });
});

describe('safeIncrement / safeDecrement', () => {
  it('increments and decrements by one', () => {
    expect(safeIncrement(5)).toBe(6);
    expect(safeDecrement(5)).toBe(4);
  });

  it('throws when incrementing past MAX_SAFE_INTEGER', () => {
    expect(() => safeIncrement(MAX)).toThrow(ArithmeticError);
  });

  it('throws when decrementing past MIN_SAFE_INTEGER', () => {
    expect(() => safeDecrement(MIN)).toThrow(ArithmeticError);
  });
});

describe('ArithmeticError', () => {
  it('is a proper Error subclass carrying the message', () => {
    const error = new ArithmeticError('boom');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ArithmeticError);
    expect(error.name).toBe('ArithmeticError');
    expect(error.message).toBe('boom');
  });
});
