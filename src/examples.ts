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

  constructor(initialBalance: number) {
    validateSafeInteger(initialBalance);
    this.balance = initialBalance;
  }

  deposit(amount: number): void {
    validateSafeInteger(amount);
    try {
      this.balance = safeAdd(this.balance, amount);
      console.log(`Deposited: $${amount}, New balance: $${this.balance}`);
    } catch (error) {
      if (error instanceof ArithmeticError) {
        console.error(`Deposit failed: ${error.message}`);
      }
    }
  }

  withdraw(amount: number): void {
    validateSafeInteger(amount);
    try {
      this.balance = safeSubtract(this.balance, amount);
      console.log(`Withdrawn: $${amount}, New balance: $${this.balance}`);
    } catch (error) {
      if (error instanceof ArithmeticError) {
        console.error(`Withdrawal failed: ${error.message}`);
      }
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
  private count: number = 0;

  increment(): void {
    try {
      this.count = safeIncrement(this.count);
      console.log(`Count incremented to: ${this.count}`);
    } catch (error) {
      if (error instanceof ArithmeticError) {
        console.error(`Increment failed: ${error.message}`);
      }
    }
  }

  decrement(): void {
    try {
      this.count = safeDecrement(this.count);
      console.log(`Count decremented to: ${this.count}`);
    } catch (error) {
      if (error instanceof ArithmeticError) {
        console.error(`Decrement failed: ${error.message}`);
      }
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
