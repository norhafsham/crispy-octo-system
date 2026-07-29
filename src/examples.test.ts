import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { BankAccount, SafeCounter } from './examples';
import { ArithmeticError } from './arithmetic-utils';

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BankAccount', () => {
  it('applies successful deposits and withdrawals', () => {
    const account = new BankAccount(1000);
    account.deposit(500);
    account.withdraw(200);
    expect(account.getBalance()).toBe(1300);
  });

  it('leaves the balance unchanged when a deposit would overflow', () => {
    const account = new BankAccount(Number.MAX_SAFE_INTEGER);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    account.deposit(1);

    expect(account.getBalance()).toBe(Number.MAX_SAFE_INTEGER);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('leaves the balance unchanged when a withdrawal would underflow', () => {
    const account = new BankAccount(Number.MIN_SAFE_INTEGER);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    account.withdraw(1);

    expect(account.getBalance()).toBe(Number.MIN_SAFE_INTEGER);
    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe('BankAccount error contract', () => {
  it('rejects an invalid opening balance at construction', () => {
    // The constructor is the one operation that throws - there is no account
    // yet to leave in a consistent state.
    expect(() => new BankAccount(1.5)).toThrow(ArithmeticError);
    expect(() => new BankAccount(Number.MAX_SAFE_INTEGER + 1)).toThrow(ArithmeticError);
    expect(() => new BankAccount(NaN)).toThrow(ArithmeticError);
  });

  it('reports a non-integer amount the same way as an overflow, without throwing', () => {
    // Regression: validateSafeInteger used to sit outside the try/catch, so a
    // non-integer amount threw to the caller while an overflow of the very
    // same method was swallowed and logged.
    const account = new BankAccount(100);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => account.deposit(1.5)).not.toThrow();
    expect(() => account.withdraw(1.5)).not.toThrow();

    expect(account.getBalance()).toBe(100);
    expect(consoleSpy).toHaveBeenCalledTimes(2);
  });

  it('returns true on success and false on every failure', () => {
    const account = new BankAccount(100);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(account.deposit(50)).toBe(true);
    expect(account.withdraw(20)).toBe(true);
    expect(account.deposit(1.5)).toBe(false);
    expect(account.withdraw(NaN)).toBe(false);
    expect(account.getBalance()).toBe(130);
  });

  it('rejects a negative deposit instead of treating it as a withdrawal', () => {
    const account = new BankAccount(100);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(account.deposit(-50)).toBe(false);

    expect(account.getBalance()).toBe(100);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('must not be negative'));
  });

  it('rejects a negative withdrawal instead of treating it as a deposit', () => {
    const account = new BankAccount(100);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(account.withdraw(-50)).toBe(false);

    expect(account.getBalance()).toBe(100);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('must not be negative'));
  });

  it('accepts a zero-amount operation as a successful no-op', () => {
    const account = new BankAccount(100);

    expect(account.deposit(0)).toBe(true);
    expect(account.withdraw(0)).toBe(true);
    expect(account.getBalance()).toBe(100);
  });

  it('permits an overdraft: the class models safe arithmetic, not bank policy', () => {
    // Documented on purpose. Withdrawing past zero is allowed; only the
    // MIN_SAFE_INTEGER underflow guard stops it, which is the behaviour this
    // example exists to demonstrate.
    const account = new BankAccount(100);

    expect(account.withdraw(999)).toBe(true);
    expect(account.getBalance()).toBe(-899);
  });
});

describe('SafeCounter', () => {
  it('increments and decrements the count', () => {
    const counter = new SafeCounter();
    counter.increment();
    counter.increment();
    counter.decrement();
    expect(counter.getCount()).toBe(1);
  });

  it('allows the count to go negative (still a safe integer)', () => {
    const counter = new SafeCounter();
    counter.decrement();
    expect(counter.getCount()).toBe(-1);
  });

  it('defaults to a starting count of zero', () => {
    expect(new SafeCounter().getCount()).toBe(0);
  });

  it('accepts a starting count', () => {
    const counter = new SafeCounter(41);
    expect(counter.increment()).toBe(true);
    expect(counter.getCount()).toBe(42);
  });

  it('rejects an invalid starting count at construction', () => {
    expect(() => new SafeCounter(1.5)).toThrow(ArithmeticError);
    expect(() => new SafeCounter(Number.MAX_SAFE_INTEGER + 1)).toThrow(ArithmeticError);
  });

  it('leaves the count unchanged when incrementing past MAX_SAFE_INTEGER', () => {
    // Only reachable because the starting count is now a constructor
    // parameter; counting to MAX_SAFE_INTEGER one step at a time is not
    // a viable test.
    const counter = new SafeCounter(Number.MAX_SAFE_INTEGER);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(counter.increment()).toBe(false);

    expect(counter.getCount()).toBe(Number.MAX_SAFE_INTEGER);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Increment failed'));
  });

  it('leaves the count unchanged when decrementing past MIN_SAFE_INTEGER', () => {
    const counter = new SafeCounter(Number.MIN_SAFE_INTEGER);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(counter.decrement()).toBe(false);

    expect(counter.getCount()).toBe(Number.MIN_SAFE_INTEGER);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Decrement failed'));
  });

  it('returns true from a successful increment and decrement', () => {
    const counter = new SafeCounter();
    expect(counter.increment()).toBe(true);
    expect(counter.decrement()).toBe(true);
    expect(counter.getCount()).toBe(0);
  });
});
