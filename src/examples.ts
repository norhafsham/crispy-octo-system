/**
 * Examples of safe arithmetic operations
 * Demonstrates proper usage of overflow/underflow checks
 */

import {
  safeAdd,
  safeSubtract,
  safeMultiply,
  safeDivide,
  safeIncrement,
  safeDecrement,
  safeModulo,
  safePower,
  ArithmeticError,
  isWithinSafeRange,
  validateSafeInteger,
} from './arithmetic-utils';

/**
 * Example 1: Basic arithmetic with error handling
 */
export function basicArithmeticExample(): void {
  console.log('=== Basic Arithmetic Example ===');

  try {
    const a = 100;
    const b = 50;

    console.log(`Adding ${a} + ${b} = ${safeAdd(a, b)}`);
    console.log(`Subtracting ${a} - ${b} = ${safeSubtract(a, b)}`);
    console.log(`Multiplying ${a} * ${b} = ${safeMultiply(a, b)}`);
    console.log(`Dividing ${a} / ${b} = ${safeDivide(a, b)}`);
  } catch (error) {
    if (error instanceof ArithmeticError) {
      console.error(`Error: ${error.message}`);
    }
  }
}

/**
 * Example 2: Detecting overflow
 */
export function overflowDetectionExample(): void {
  console.log('\n=== Overflow Detection Example ===');

  try {
    const maxSafe = Number.MAX_SAFE_INTEGER;
    console.log(`Attempting to add 1 to MAX_SAFE_INTEGER: ${maxSafe}`);
    safeAdd(maxSafe, 1); // This will throw
  } catch (error) {
    if (error instanceof ArithmeticError) {
      console.error(`✓ Caught overflow: ${error.message}`);
    }
  }
}

/**
 * Example 3: Bank transaction calculator
 */
export class BankAccount {
  private balance: number;

  /**
   * Construction is the one operation that throws: there is no balance to
   * leave untouched and no return value to report failure through, so an
   * invalid opening balance must not produce an account at all.
   */
  constructor(initialBalance: number) {
    validateSafeInteger(initialBalance);
    this.balance = initialBalance;
  }

  /**
   * Deposit an amount. Returns true when the balance changed.
   *
   * Every failure mode - an amount that is not a safe integer, a negative
   * amount, or an overflow - is reported the same way: log it, leave the
   * balance untouched, and return false. Validation happens inside the try so
   * that bad input and arithmetic overflow cannot take different exits.
   */
  deposit(amount: number): boolean {
    try {
      validateSafeInteger(amount);
      if (amount < 0) {
        throw new ArithmeticError(`Deposit amount must not be negative, got ${amount}`);
      }
      this.balance = safeAdd(this.balance, amount);
      console.log(`Deposited: $${amount}, New balance: $${this.balance}`);
      return true;
    } catch (error) {
      if (error instanceof ArithmeticError) {
        console.error(`Deposit failed: ${error.message}`);
        return false;
      }
      throw error;
    }
  }

  /**
   * Withdraw an amount. Returns true when the balance changed.
   *
   * Mirrors deposit(): same validation, same log-and-return-false contract.
   * Note that this deliberately permits the balance to go negative - the
   * class demonstrates safe arithmetic, not an overdraft policy, and the
   * underflow guard below is what stops it at MIN_SAFE_INTEGER.
   */
  withdraw(amount: number): boolean {
    try {
      validateSafeInteger(amount);
      if (amount < 0) {
        throw new ArithmeticError(`Withdrawal amount must not be negative, got ${amount}`);
      }
      this.balance = safeSubtract(this.balance, amount);
      console.log(`Withdrawn: $${amount}, New balance: $${this.balance}`);
      return true;
    } catch (error) {
      if (error instanceof ArithmeticError) {
        console.error(`Withdrawal failed: ${error.message}`);
        return false;
      }
      throw error;
    }
  }

  getBalance(): number {
    return this.balance;
  }
}

/**
 * Example 4: Bank account usage
 */
export function bankAccountExample(): void {
  console.log('\n=== Bank Account Example ===');

  const account = new BankAccount(1000);
  console.log(`Initial balance: $${account.getBalance()}`);

  account.deposit(500);
  account.withdraw(200);
  account.deposit(150);
  console.log(`Final balance: $${account.getBalance()}`);
}

/**
 * Example 5: Modulo and power operations
 */
export function moduloAndPowerExample(): void {
  console.log('\n=== Modulo and Power Example ===');

  try {
    console.log(`5 % 3 = ${safeModulo(5, 3)}`);
    console.log(`2^10 = ${safePower(2, 10)}`);
    console.log(`10^3 = ${safePower(10, 3)}`);
  } catch (error) {
    if (error instanceof ArithmeticError) {
      console.error(`Error: ${error.message}`);
    }
  }
}

/**
 * Example 6: Safe range validation
 */
export function rangeValidationExample(): void {
  console.log('\n=== Range Validation Example ===');

  const testValues = [0, 100, -50, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];

  testValues.forEach((value) => {
    const isSafe = isWithinSafeRange(value);
    console.log(`${value} is ${isSafe ? 'safe' : 'unsafe'}`);
  });
}

/**
 * Example 7: Counter with safe increment/decrement
 */
export class SafeCounter {
  private count: number;

  /**
   * The starting count is a parameter so the overflow and underflow branches
   * below are reachable: seeding at MAX_SAFE_INTEGER is the only practical
   * way to exercise them, since counting there one step at a time is not.
   * Defaults to 0, so `new SafeCounter()` behaves as before.
   */
  constructor(initialCount: number = 0) {
    validateSafeInteger(initialCount);
    this.count = initialCount;
  }

  /**
   * Increment the count. Returns true when the count changed. Follows the
   * same contract as BankAccount: on failure, log it, leave the count
   * untouched, and return false.
   */
  increment(): boolean {
    try {
      this.count = safeIncrement(this.count);
      console.log(`Count incremented to: ${this.count}`);
      return true;
    } catch (error) {
      if (error instanceof ArithmeticError) {
        console.error(`Increment failed: ${error.message}`);
        return false;
      }
      throw error;
    }
  }

  /**
   * Decrement the count. Returns true when the count changed.
   */
  decrement(): boolean {
    try {
      this.count = safeDecrement(this.count);
      console.log(`Count decremented to: ${this.count}`);
      return true;
    } catch (error) {
      if (error instanceof ArithmeticError) {
        console.error(`Decrement failed: ${error.message}`);
        return false;
      }
      throw error;
    }
  }

  getCount(): number {
    return this.count;
  }
}

/**
 * Example 8: Counter usage
 */
export function counterExample(): void {
  console.log('\n=== Safe Counter Example ===');

  const counter = new SafeCounter();
  counter.increment();
  counter.increment();
  counter.increment();
  counter.decrement();
  console.log(`Final count: ${counter.getCount()}`);
}

// Run all examples
if (require.main === module) {
  basicArithmeticExample();
  overflowDetectionExample();
  bankAccountExample();
  moduloAndPowerExample();
  rangeValidationExample();
  counterExample();
}
