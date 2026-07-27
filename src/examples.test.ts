import { describe, expect, it, vi } from 'vitest';
import { BankAccount, SafeCounter } from './examples';

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
    consoleSpy.mockRestore();
  });

  it('leaves the balance unchanged when a withdrawal would underflow', () => {
    const account = new BankAccount(Number.MIN_SAFE_INTEGER);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    account.withdraw(1);

    expect(account.getBalance()).toBe(Number.MIN_SAFE_INTEGER);
    consoleSpy.mockRestore();
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
});
