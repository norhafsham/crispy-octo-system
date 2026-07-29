import { describe, expect, it } from 'vitest';
import { StatefulCounter, Token, AccessControl } from './event-emission-examples';

describe('StatefulCounter', () => {
  it('emits StateChanged with the old and new value', () => {
    const counter = new StatefulCounter();
    const events: unknown[] = [];
    counter.on('StateChanged', (event) => events.push(event));

    counter.setValue(10);
    counter.setValue(25);

    expect(counter.getValue()).toBe(25);
    expect(events).toEqual([
      { field: 'value', oldValue: 0, newValue: 10 },
      { field: 'value', oldValue: 10, newValue: 25 },
    ]);
  });
});

describe('Token', () => {
  it('mints tokens and emits a Transfer event with from: null', () => {
    const token = new Token();
    const transfers: unknown[] = [];
    token.on('Transfer', (event) => transfers.push(event));

    token.mint('alice', 1000);

    expect(token.balanceOf('alice')).toBe(1000);
    expect(transfers).toEqual([{ from: null, to: 'alice', amount: 1000 }]);
  });

  it('transfers balance between accounts and emits Transfer', () => {
    const token = new Token();
    const transfers: unknown[] = [];
    token.mint('alice', 1000);
    token.on('Transfer', (event) => transfers.push(event));

    token.transfer('alice', 'bob', 250);

    expect(token.balanceOf('alice')).toBe(750);
    expect(token.balanceOf('bob')).toBe(250);
    expect(transfers).toEqual([{ from: 'alice', to: 'bob', amount: 250 }]);
  });

  it('throws on insufficient balance and leaves balances unchanged', () => {
    const token = new Token();
    token.mint('alice', 100);

    expect(() => token.transfer('alice', 'bob', 200)).toThrow('Insufficient balance');
    expect(token.balanceOf('alice')).toBe(100);
    expect(token.balanceOf('bob')).toBe(0);
  });

  it('defaults an unknown account balance to zero', () => {
    const token = new Token();
    expect(token.balanceOf('nobody')).toBe(0);
  });

  it('approves an allowance and emits Approval', () => {
    const token = new Token();
    const approvals: unknown[] = [];
    token.on('Approval', (event) => approvals.push(event));

    token.approve('alice', 'exchange', 300);

    expect(token.allowanceOf('alice', 'exchange')).toBe(300);
    expect(approvals).toEqual([{ owner: 'alice', spender: 'exchange', amount: 300 }]);
  });

  it('spends an allowance via transferFrom, decrementing it and emitting events in order', () => {
    const token = new Token();
    const emitted: string[] = [];
    token.mint('alice', 1000);
    token.approve('alice', 'exchange', 300);
    token.on('Transfer', () => emitted.push('Transfer'));
    token.on('AllowanceSpent', () => emitted.push('AllowanceSpent'));

    token.transferFrom('exchange', 'alice', 'carol', 120);

    expect(token.balanceOf('alice')).toBe(880);
    expect(token.balanceOf('carol')).toBe(120);
    expect(token.allowanceOf('alice', 'exchange')).toBe(180);
    expect(emitted).toEqual(['Transfer', 'AllowanceSpent']);
  });

  it('handles a zero-amount transferFrom against an owner who never approved', () => {
    const token = new Token();
    const emitted: string[] = [];
    token.on('AllowanceSpent', (event) => emitted.push(`AllowanceSpent:${event.remaining}`));

    // Regression: `allowed < amount` is false when both are 0, so this reaches
    // the allowance write for an owner with no allowance map at all.
    expect(() => token.transferFrom('spender', 'alice', 'bob', 0)).not.toThrow();

    expect(token.allowanceOf('alice', 'spender')).toBe(0);
    expect(token.balanceOf('alice')).toBe(0);
    expect(token.balanceOf('bob')).toBe(0);
    expect(emitted).toEqual(['AllowanceSpent:0']);
  });

  it('leaves the allowance intact when transferFrom fails on insufficient balance', () => {
    const token = new Token();
    const emitted: string[] = [];
    token.mint('alice', 10);
    token.approve('alice', 'exchange', 500);
    token.on('AllowanceSpent', () => emitted.push('AllowanceSpent'));

    // The balance check inside transfer() runs before the allowance is
    // decremented, so a failed spend must not consume any allowance.
    expect(() => token.transferFrom('exchange', 'alice', 'bob', 100)).toThrow('Insufficient balance');
    expect(token.allowanceOf('alice', 'exchange')).toBe(500);
    expect(token.balanceOf('alice')).toBe(10);
    expect(emitted).toEqual([]);
  });

  it('throws when spending more than the approved allowance', () => {
    const token = new Token();
    token.mint('alice', 1000);
    token.approve('alice', 'exchange', 100);

    expect(() => token.transferFrom('exchange', 'alice', 'carol', 200)).toThrow('Allowance exceeded');
    expect(token.balanceOf('alice')).toBe(1000);
    expect(token.allowanceOf('alice', 'exchange')).toBe(100);
  });
});

describe('AccessControl', () => {
  it('grants a role and emits RoleGranted', () => {
    const acl = new AccessControl();
    const events: unknown[] = [];
    acl.on('RoleGranted', (event) => events.push(event));

    acl.grantRole('ADMIN', 'alice', 'system');

    expect(acl.hasRole('ADMIN', 'alice')).toBe(true);
    expect(events).toEqual([{ role: 'ADMIN', account: 'alice', grantedBy: 'system' }]);
  });

  it('revokes a role and emits RoleRevoked', () => {
    const acl = new AccessControl();
    const events: unknown[] = [];
    acl.grantRole('MINTER', 'bob', 'alice');
    acl.on('RoleRevoked', (event) => events.push(event));

    acl.revokeRole('MINTER', 'bob', 'alice');

    expect(acl.hasRole('MINTER', 'bob')).toBe(false);
    expect(events).toEqual([{ role: 'MINTER', account: 'bob', revokedBy: 'alice' }]);
  });

  it('does not throw when revoking a role that was never granted', () => {
    const acl = new AccessControl();
    expect(() => acl.revokeRole('MINTER', 'nobody', 'alice')).not.toThrow();
    expect(acl.hasRole('MINTER', 'nobody')).toBe(false);
  });

  it('returns false for a role/account pair that was never granted', () => {
    const acl = new AccessControl();
    expect(acl.hasRole('ADMIN', 'nobody')).toBe(false);
  });
});
