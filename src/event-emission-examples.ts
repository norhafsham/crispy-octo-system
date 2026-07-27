/**
 * Event Emission Examples
 * Demonstrates best practices for emitting events on state-changing operations
 * Addresses GitHub Issue #1: Missing Event Emission
 *
 * Real smart contracts emit events so off-chain systems (indexers, UIs,
 * auditors) can react without polling storage. These examples use Node's
 * EventEmitter to model that same "emit on state change" discipline in
 * plain TypeScript.
 */

import { EventEmitter } from 'events';

// ============================================================================
// PATTERN 1: SIMPLE STATE CHANGES WITH EVENTS
// ============================================================================

/**
 * Basic pattern: emit an event any time tracked state changes.
 */
export class StatefulCounter extends EventEmitter {
  private value = 0;

  setValue(newValue: number): void {
    const oldValue = this.value;
    this.value = newValue;
    this.emit('StateChanged', { field: 'value', oldValue, newValue });
  }

  getValue(): number {
    return this.value;
  }
}

export function stateChangeExample(): void {
  console.log('=== Example 1: Simple State Changes ===');

  const counter = new StatefulCounter();
  counter.on('StateChanged', (event) => {
    console.log(`  StateChanged: ${event.field} ${event.oldValue} -> ${event.newValue}`);
  });

  counter.setValue(10);
  counter.setValue(25);
  console.log('✅ Example 1 complete\n');
}

// ============================================================================
// PATTERN 2: FINANCIAL TRANSACTIONS WITH TRANSFER EVENTS
// ============================================================================

/**
 * Token-style balance tracking. Every balance-changing operation emits
 * a Transfer event with enough context (from, to, amount) to reconstruct
 * the full transaction history off-chain.
 */
export class Token extends EventEmitter {
  private balances = new Map<string, number>();
  private allowances = new Map<string, Map<string, number>>();

  mint(to: string, amount: number): void {
    this.balances.set(to, (this.balances.get(to) ?? 0) + amount);
    this.emit('Transfer', { from: null, to, amount });
  }

  balanceOf(account: string): number {
    return this.balances.get(account) ?? 0;
  }

  transfer(from: string, to: string, amount: number): void {
    const fromBalance = this.balanceOf(from);
    if (fromBalance < amount) {
      throw new Error(`Insufficient balance: ${from} has ${fromBalance}, needs ${amount}`);
    }
    this.balances.set(from, fromBalance - amount);
    this.balances.set(to, this.balanceOf(to) + amount);
    this.emit('Transfer', { from, to, amount });
  }

  // ==========================================================================
  // PATTERN 3: APPROVAL AND ALLOWANCE MANAGEMENT
  // ==========================================================================

  approve(owner: string, spender: string, amount: number): void {
    if (!this.allowances.has(owner)) {
      this.allowances.set(owner, new Map());
    }
    this.allowances.get(owner)!.set(spender, amount);
    this.emit('Approval', { owner, spender, amount });
  }

  allowanceOf(owner: string, spender: string): number {
    return this.allowances.get(owner)?.get(spender) ?? 0;
  }

  transferFrom(spender: string, owner: string, to: string, amount: number): void {
    const allowed = this.allowanceOf(owner, spender);
    if (allowed < amount) {
      throw new Error(`Allowance exceeded: ${spender} may spend ${allowed} of ${owner}'s tokens, requested ${amount}`);
    }
    this.transfer(owner, to, amount);
    this.allowances.get(owner)!.set(spender, allowed - amount);
    this.emit('AllowanceSpent', { owner, spender, amount, remaining: allowed - amount });
  }
}

export function tokenTransferExample(): void {
  console.log('=== Example 2: Token Transfers ===');

  const token = new Token();
  token.on('Transfer', (event) => {
    console.log(`  Transfer: ${event.from ?? 'mint'} -> ${event.to} (${event.amount})`);
  });

  token.mint('alice', 1000);
  token.transfer('alice', 'bob', 250);
  console.log(`✅ Example 2 complete (alice: ${token.balanceOf('alice')}, bob: ${token.balanceOf('bob')})\n`);
}

export function allowanceExample(): void {
  console.log('=== Example 3: Approvals & Spending ===');

  const token = new Token();
  token.on('Approval', (event) => {
    console.log(`  Approval: ${event.owner} allows ${event.spender} to spend ${event.amount}`);
  });
  token.on('AllowanceSpent', (event) => {
    console.log(`  AllowanceSpent: ${event.spender} spent ${event.amount} of ${event.owner}'s tokens (${event.remaining} left)`);
  });
  token.on('Transfer', (event) => {
    console.log(`  Transfer: ${event.from ?? 'mint'} -> ${event.to} (${event.amount})`);
  });

  token.mint('alice', 1000);
  token.approve('alice', 'exchange', 300);
  token.transferFrom('exchange', 'alice', 'carol', 120);
  console.log(`✅ Example 3 complete (remaining allowance: ${token.allowanceOf('alice', 'exchange')})\n`);
}

// ============================================================================
// PATTERN 4: ROLE-BASED ACCESS CONTROL WITH ROLE EVENTS
// ============================================================================

/**
 * Access control changes are security-sensitive and must be auditable -
 * every grant/revoke emits an event with who changed what and for whom.
 */
export class AccessControl extends EventEmitter {
  private roles = new Map<string, Set<string>>();

  grantRole(role: string, account: string, grantedBy: string): void {
    if (!this.roles.has(role)) {
      this.roles.set(role, new Set());
    }
    this.roles.get(role)!.add(account);
    this.emit('RoleGranted', { role, account, grantedBy });
  }

  revokeRole(role: string, account: string, revokedBy: string): void {
    this.roles.get(role)?.delete(account);
    this.emit('RoleRevoked', { role, account, revokedBy });
  }

  hasRole(role: string, account: string): boolean {
    return this.roles.get(role)?.has(account) ?? false;
  }
}

export function roleManagementExample(): void {
  console.log('=== Example 4: Role Management ===');

  const acl = new AccessControl();
  acl.on('RoleGranted', (event) => {
    console.log(`  RoleGranted: ${event.grantedBy} granted '${event.role}' to ${event.account}`);
  });
  acl.on('RoleRevoked', (event) => {
    console.log(`  RoleRevoked: ${event.revokedBy} revoked '${event.role}' from ${event.account}`);
  });

  acl.grantRole('ADMIN', 'alice', 'system');
  acl.grantRole('MINTER', 'bob', 'alice');
  acl.revokeRole('MINTER', 'bob', 'alice');
  console.log(`✅ Example 4 complete (alice is ADMIN: ${acl.hasRole('ADMIN', 'alice')})\n`);
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

export function runEventEmissionExamples(): void {
  stateChangeExample();
  tokenTransferExample();
  allowanceExample();
  roleManagementExample();
}

if (require.main === module) {
  runEventEmissionExamples();
}
