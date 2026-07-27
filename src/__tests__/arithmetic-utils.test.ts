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
} from '../arithmetic-utils';

describe('getSafeRange', () => {
  it('returns MIN_SAFE_INTEGER and MAX_SAFE_INTEGER', () => {
    expect(getSafeRange()).toEqual({
      min: Number.MIN_SAFE_INTEGER,
      max: Number.MAX_SAFE_INTEGER,
    });
  });
});

describe('isWithinSafeRange', () => {
  it('accepts integers within range', () => {
    expect(isWithinSafeRange(0)).toBe(true);
    expect(isWithinSafeRange(100)).toBe(true);
    expect(isWithinSafeRange(-100)).toBe(true);
    expect(isWithinSafeRange(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(isWithinSafeRange(Number.MIN_SAFE_INTEGER)).toBe(true);
  });

  it('rejects values outside range', () => {
    expect(isWithinSafeRange(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    expect(isWithinSafeRange(Number.MIN_SAFE_INTEGER - 1)).toBe(false);
  });

  it('rejects non-integers', () => {
    expect(isWithinSafeRange(1.5)).toBe(false);
    expect(isWithinSafeRange(NaN)).toBe(false);
    expect(isWithinSafeRange(Infinity)).toBe(false);
    expect(isWithinSafeRange(-Infinity)).toBe(false);
  });
});

describe('validateSafeInteger', () => {
  it('does not throw for safe integers', () => {
    expect(() => validateSafeInteger(42)).not.toThrow();
  });

  it('throws ArithmeticError for unsafe values', () => {
    expect(() => validateSafeInteger(Number.MAX_SAFE_INTEGER + 1)).toThrow(ArithmeticError);
    expect(() => validateSafeInteger(1.5)).toThrow(ArithmeticError);
  });
});

describe('safeAdd', () => {
  it('adds two safe integers', () => {
    expect(safeAdd(100, 50)).toBe(150);
    expect(safeAdd(-10, -20)).toBe(-30);
  });

  it('throws ArithmeticError on overflow', () => {
    expect(() => safeAdd(Number.MAX_SAFE_INTEGER, 1)).toThrow(ArithmeticError);
  });

  it('throws ArithmeticError when an operand is unsafe', () => {
    expect(() => safeAdd(Number.MAX_SAFE_INTEGER + 1, 1)).toThrow(ArithmeticError);
  });
});

describe('safeSubtract', () => {
  it('subtracts two safe integers', () => {
    expect(safeSubtract(100, 50)).toBe(50);
  });

  it('throws ArithmeticError on underflow', () => {
    expect(() => safeSubtract(Number.MIN_SAFE_INTEGER, 1)).toThrow(ArithmeticError);
  });
});

describe('safeMultiply', () => {
  it('multiplies two safe integers', () => {
    expect(safeMultiply(100, 50)).toBe(5000);
  });

  it('throws ArithmeticError on overflow', () => {
    expect(() => safeMultiply(Number.MAX_SAFE_INTEGER, 2)).toThrow(ArithmeticError);
  });
});

describe('safeDivide', () => {
  it('divides two safe integers', () => {
    expect(safeDivide(100, 50)).toBe(2);
  });

  it('throws ArithmeticError on division by zero', () => {
    expect(() => safeDivide(10, 0)).toThrow(ArithmeticError);
    expect(() => safeDivide(10, 0)).toThrow('Division by zero');
  });

  it('throws ArithmeticError when result is not a safe integer', () => {
    expect(() => safeDivide(10, 3)).toThrow(ArithmeticError);
  });
});

describe('safeModulo', () => {
  it('computes the remainder', () => {
    expect(safeModulo(5, 3)).toBe(2);
  });

  it('throws ArithmeticError on modulo by zero', () => {
    expect(() => safeModulo(5, 0)).toThrow(ArithmeticError);
    expect(() => safeModulo(5, 0)).toThrow('Modulo by zero');
  });
});

describe('safePower', () => {
  it('raises base to exponent', () => {
    expect(safePower(2, 10)).toBe(1024);
    expect(safePower(10, 3)).toBe(1000);
  });

  it('throws ArithmeticError on overflow', () => {
    expect(() => safePower(2, 1024)).toThrow(ArithmeticError);
  });
});

describe('safeIncrement', () => {
  it('adds one to the value', () => {
    expect(safeIncrement(1)).toBe(2);
  });

  it('throws ArithmeticError at MAX_SAFE_INTEGER', () => {
    expect(() => safeIncrement(Number.MAX_SAFE_INTEGER)).toThrow(ArithmeticError);
  });
});

describe('safeDecrement', () => {
  it('subtracts one from the value', () => {
    expect(safeDecrement(2)).toBe(1);
  });

  it('throws ArithmeticError at MIN_SAFE_INTEGER', () => {
    expect(() => safeDecrement(Number.MIN_SAFE_INTEGER)).toThrow(ArithmeticError);
  });
});
