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

export function safeAdd(a: number, b: number): number {
  validateSafeInteger(a);
  validateSafeInteger(b);
  const result = a + b;
  validateSafeInteger(result);
  return result;
}

export function safeSubtract(a: number, b: number): number {
  validateSafeInteger(a);
  validateSafeInteger(b);
  const result = a - b;
  validateSafeInteger(result);
  return result;
}

export function safeMultiply(a: number, b: number): number {
  validateSafeInteger(a);
  validateSafeInteger(b);
  const result = a * b;
  validateSafeInteger(result);
  return result;
}

export function safeDivide(a: number, b: number): number {
  validateSafeInteger(a);
  validateSafeInteger(b);
  if (b === 0) {
    throw new ArithmeticError('Division by zero');
  }
  const result = a / b;
  validateSafeInteger(result);
  return result;
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
  const result = a % b;
  validateSafeInteger(result);
  return result;
}

export function safePower(base: number, exponent: number): number {
  validateSafeInteger(base);
  validateSafeInteger(exponent);
  const result = Math.pow(base, exponent);
  validateSafeInteger(result);
  return result;
}
