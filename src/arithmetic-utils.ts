/**
 * Safe arithmetic operations with overflow/underflow validation.
 * All operations validate their operands and result against JavaScript's
 * safe integer range (±(2^53 - 1)) to prevent silent precision loss.
 */

export class ArithmeticError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArithmeticError';
  }
}

/**
 * Get the safe integer limits for JavaScript (IEEE 754 double-precision).
 */
export function getSafeRange(): { min: number; max: number } {
  return { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER };
}

/**
 * Check whether a value is a safe integer.
 */
export function isWithinSafeRange(value: number): boolean {
  return Number.isInteger(value) && value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER;
}

/**
 * Throw if a value is outside the safe integer range.
 */
export function validateSafeInteger(value: number): void {
  if (!isWithinSafeRange(value)) {
    throw new ArithmeticError(`Value ${value} is outside the safe integer range`);
  }
}

/**
 * Validate an operation's result and normalize negative zero to positive zero.
 *
 * IEEE 754 has two zeros, and ordinary operations produce the negative one
 * (`0 * -5`, `-5 % 5`, `-0 / 5`). `Number.isInteger(-0)` is true, so range
 * validation alone lets it through to callers, where it compares unequal to 0
 * under `Object.is` — which is what `===`-style identity checks and most test
 * assertions use. Every operation below returns through here so a result of
 * zero is always +0.
 */
function normalizeResult(value: number): number {
  validateSafeInteger(value);
  return value === 0 ? 0 : value;
}

export function safeAdd(a: number, b: number): number {
  validateSafeInteger(a);
  validateSafeInteger(b);
  return normalizeResult(a + b);
}

export function safeSubtract(a: number, b: number): number {
  validateSafeInteger(a);
  validateSafeInteger(b);
  return normalizeResult(a - b);
}

export function safeMultiply(a: number, b: number): number {
  validateSafeInteger(a);
  validateSafeInteger(b);
  return normalizeResult(a * b);
}

export function safeDivide(a: number, b: number): number {
  validateSafeInteger(a);
  validateSafeInteger(b);
  if (b === 0) {
    throw new ArithmeticError('Division by zero');
  }
  return normalizeResult(a / b);
}

export function safeIncrement(value: number): number {
  return safeAdd(value, 1);
}

export function safeDecrement(value: number): number {
  return safeSubtract(value, 1);
}

export function safeModulo(a: number, b: number): number {
  validateSafeInteger(a);
  validateSafeInteger(b);
  if (b === 0) {
    throw new ArithmeticError('Modulo by zero');
  }
  return normalizeResult(a % b);
}

export function safePower(base: number, exponent: number): number {
  validateSafeInteger(base);
  validateSafeInteger(exponent);
  return normalizeResult(Math.pow(base, exponent));
}
