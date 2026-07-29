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

describe('negative zero normalization', () => {
  // IEEE 754 produces -0 from several ordinary operations. It passes range
  // validation (Number.isInteger(-0) is true), so without normalization it
  // reaches callers and compares unequal to 0 under Object.is - which is
  // exactly what `toBe` uses, so these assertions fail on a raw -0.
  it('returns +0 from multiplication by a negative operand', () => {
    expect(safeMultiply(0, -5)).toBe(0);
    expect(safeMultiply(-5, 0)).toBe(0);
    expect(Object.is(safeMultiply(0, -5), -0)).toBe(false);
  });

  it('returns +0 from division producing a signed zero', () => {
    expect(safeDivide(-0, 5)).toBe(0);
    expect(safeDivide(0, -5)).toBe(0);
    expect(Object.is(safeDivide(0, -5), -0)).toBe(false);
  });

  it('returns +0 from a modulo that divides evenly into a negative', () => {
    expect(safeModulo(-5, 5)).toBe(0);
    expect(Object.is(safeModulo(-5, 5), -0)).toBe(false);
  });

  it('returns +0 from addition and subtraction of signed zeros', () => {
    expect(safeAdd(-0, -0)).toBe(0);
    expect(safeSubtract(-0, 0)).toBe(0);
  });

  it('returns +0 from a power with a negative-zero base', () => {
    expect(safePower(-0, 3)).toBe(0);
    expect(Object.is(safePower(-0, 3), -0)).toBe(false);
  });

  it('leaves every non-zero result untouched', () => {
    expect(safeMultiply(-5, 3)).toBe(-15);
    expect(safeDivide(-10, 5)).toBe(-2);
    expect(safeModulo(-7, 5)).toBe(-2);
    expect(safePower(-2, 3)).toBe(-8);
  });
});

describe('additional edge cases', () => {
  it('treats anything to the power of zero as 1', () => {
    expect(safePower(0, 0)).toBe(1);
    expect(safePower(5, 0)).toBe(1);
  });

  it('handles negative bases with odd and even exponents', () => {
    expect(safePower(-2, 3)).toBe(-8);
    expect(safePower(-2, 4)).toBe(16);
  });

  it('accepts a negative divisor and dividend', () => {
    expect(safeDivide(-100, -50)).toBe(2);
    expect(safeDivide(100, -50)).toBe(-2);
  });
});

describe('operand validation across every operation', () => {
  // Only safeAdd covered this. Each operation validates both operands before
  // computing, so the same invalid inputs must be rejected identically
  // everywhere - in either position.
  const binaryOps: ReadonlyArray<[string, (a: number, b: number) => number]> = [
    ['safeAdd', safeAdd],
    ['safeSubtract', safeSubtract],
    ['safeMultiply', safeMultiply],
    ['safeDivide', safeDivide],
    ['safeModulo', safeModulo],
    ['safePower', safePower],
  ];

  const invalidOperands: ReadonlyArray<[string, number]> = [
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['a non-integer', 1.5],
    ['one past MAX_SAFE_INTEGER', MAX + 1],
    ['one past MIN_SAFE_INTEGER', MIN - 1],
  ];

  binaryOps.forEach(([opName, op]) => {
    invalidOperands.forEach(([label, value]) => {
      it(`${opName} rejects ${label} as either operand`, () => {
        expect(() => op(value, 2)).toThrow(ArithmeticError);
        expect(() => op(2, value)).toThrow(ArithmeticError);
      });
    });
  });

  const unaryOps: ReadonlyArray<[string, (value: number) => number]> = [
    ['safeIncrement', safeIncrement],
    ['safeDecrement', safeDecrement],
  ];

  unaryOps.forEach(([opName, op]) => {
    invalidOperands.forEach(([label, value]) => {
      it(`${opName} rejects ${label}`, () => {
        expect(() => op(value)).toThrow(ArithmeticError);
      });
    });
  });
});

describe('safe range boundaries', () => {
  it('permits arithmetic that lands exactly on a boundary', () => {
    expect(safeAdd(MAX, 0)).toBe(MAX);
    expect(safeSubtract(MIN, 0)).toBe(MIN);
    expect(safeMultiply(MAX, 1)).toBe(MAX);
    expect(safeMultiply(MAX, -1)).toBe(MIN);
    expect(safeDecrement(MAX)).toBe(MAX - 1);
    expect(safeIncrement(MIN)).toBe(MIN + 1);
  });

  it('rejects arithmetic that crosses a boundary by one', () => {
    expect(() => safeAdd(MIN, -1)).toThrow(ArithmeticError);
    expect(() => safeSubtract(MAX, -1)).toThrow(ArithmeticError);
    expect(() => safeMultiply(MIN, 2)).toThrow(ArithmeticError);
  });
});

describe('results that are out of range or not integers', () => {
  it('rejects a power whose result overflows to Infinity', () => {
    expect(() => safePower(0, -1)).toThrow(ArithmeticError);
    expect(() => safePower(10, 400)).toThrow(ArithmeticError);
  });

  it('rejects a negative exponent that yields a fraction', () => {
    expect(() => safePower(2, -1)).toThrow(ArithmeticError);
    expect(() => safePower(2, -2)).toThrow(ArithmeticError);
    expect(() => safePower(10, -3)).toThrow(ArithmeticError);
  });

  it('rejects division that does not divide evenly, in either sign', () => {
    expect(() => safeDivide(10, 3)).toThrow(ArithmeticError);
    expect(() => safeDivide(-10, 3)).toThrow(ArithmeticError);
    expect(() => safeDivide(10, -3)).toThrow(ArithmeticError);
  });

  it('follows JavaScript remainder sign rules, which track the dividend', () => {
    expect(safeModulo(7, 5)).toBe(2);
    expect(safeModulo(-7, 5)).toBe(-2);
    expect(safeModulo(7, -5)).toBe(2);
    expect(safeModulo(-7, -5)).toBe(-2);
  });
});

describe('getSafeRange', () => {
  it('returns a fresh object each call, so a caller cannot corrupt it', () => {
    const first = getSafeRange();
    first.max = 0;

    expect(getSafeRange().max).toBe(MAX);
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
