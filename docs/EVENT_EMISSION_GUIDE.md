# Event Emission Guide: Auditable State Changes in Smart Contracts

## Overview

This guide provides comprehensive solutions to **GitHub Issue #1: Missing Event Emission**. It demonstrates practical patterns for emitting events on every state-changing operation, so off-chain systems (indexers, UIs, auditors) can react without polling storage.

The runnable counterpart to this guide is [`src/event-emission-examples.ts`](../src/event-emission-examples.ts), which models these patterns with Node's `EventEmitter` in plain TypeScript rather than real Solidity/EVM code.

---

## Problem Statement

State-changing functions that don't emit events are effectively invisible to anything outside the contract:

- Off-chain systems have no reliable way to detect the change except by polling storage
- Indexers (e.g. The Graph) have nothing to subscribe to
- There is no audit trail of who changed what, and when
- UIs cannot update in real time

### Real Cost Impact

```
Scenario: A balance changes but no event is emitted

❌ Without events:
  Off-chain systems must poll every block and diff storage
  → Expensive, slow, and can miss transient state

✅ With events:
  Off-chain systems subscribe once and react instantly
  → Cheap, fast, and produces a complete audit log
```

---

## Core Event Emission Patterns

### Pattern 1: Simple State Changes

**Problem:** A value changes but nothing records the transition.

```typescript
// ❌ NO EVENT
class Counter {
  private value = 0;
  setValue(newValue: number): void {
    this.value = newValue;
  }
}
```

**Solution:** Emit an event with the old and new value any time tracked state changes.

```typescript
// ✅ WITH EVENT
class StatefulCounter extends EventEmitter {
  private value = 0;
  setValue(newValue: number): void {
    const oldValue = this.value;
    this.value = newValue;
    this.emit('StateChanged', { field: 'value', oldValue, newValue });
  }
}
```

**Implementation:** `StatefulCounter` / `stateChangeExample()` in `src/event-emission-examples.ts`

---

### Pattern 2: Financial Transactions (Transfer Events)

**Problem:** Balance changes with no way to reconstruct transaction history.

```typescript
// ❌ NO EVENT
transfer(from: string, to: string, amount: number): void {
  this.balances.set(from, this.balanceOf(from) - amount);
  this.balances.set(to, this.balanceOf(to) + amount);
}
```

**Solution:** Emit a `Transfer` event with `from`, `to`, and `amount` — enough context to replay the full balance history off-chain (mirrors the ERC-20 `Transfer` event, including `from: null` for mints).

```typescript
// ✅ WITH EVENT
transfer(from: string, to: string, amount: number): void {
  const fromBalance = this.balanceOf(from);
  if (fromBalance < amount) {
    throw new Error(`Insufficient balance: ${from} has ${fromBalance}, needs ${amount}`);
  }
  this.balances.set(from, fromBalance - amount);
  this.balances.set(to, this.balanceOf(to) + amount);
  this.emit('Transfer', { from, to, amount });
}
```

**Implementation:** `Token.mint()` / `Token.transfer()` / `tokenTransferExample()` in `src/event-emission-examples.ts`

---

### Pattern 3: Approval and Allowance Management

**Problem:** Multi-step operations (approve, then spend) need events at each step, not just the end result.

```typescript
// ❌ NO EVENT
approve(owner: string, spender: string, amount: number): void {
  this.allowances.get(owner)!.set(spender, amount);
}
```

**Solution:** Emit `Approval` when an allowance is set, and a separate event when it's spent, including the remaining balance so off-chain systems don't have to recompute it.

```typescript
// ✅ WITH EVENTS
approve(owner: string, spender: string, amount: number): void {
  this.allowances.get(owner)!.set(spender, amount);
  this.emit('Approval', { owner, spender, amount });
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
```

**Implementation:** `Token.approve()` / `Token.transferFrom()` / `allowanceExample()` in `src/event-emission-examples.ts`

---

### Pattern 4: Role-Based Access Control

**Problem:** Access control changes are security-sensitive; without events, there is no audit trail of who granted or revoked access.

```typescript
// ❌ NO EVENT
grantRole(role: string, account: string): void {
  this.roles.get(role)!.add(account);
}
```

**Solution:** Emit `RoleGranted` / `RoleRevoked` events that include who performed the change (`grantedBy` / `revokedBy`), not just what changed.

```typescript
// ✅ WITH EVENTS
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
```

**Implementation:** `AccessControl.grantRole()` / `AccessControl.revokeRole()` / `roleManagementExample()` in `src/event-emission-examples.ts`

---

## Implementation Checklist

### Before Deployment

- [ ] **Audit state-changing functions**: Identify every function that mutates storage
- [ ] **Confirm event coverage**: Every state-changing function emits at least one event
- [ ] **Include context**: Events carry enough data (who, what, old value, new value) to reconstruct history off-chain
- [ ] **Use consistent naming**: Event names describe what happened (`Transfer`, `RoleGranted`), not implementation details
- [ ] **Add tests**: Verify each state-changing path emits the expected event(s)

---

## Anti-Patterns to Avoid

### ❌ Changing state without emitting an event

```typescript
// BAD: silent state change
setValue(newValue: number): void {
  this.value = newValue;
}

// GOOD: emit on every state change
setValue(newValue: number): void {
  const oldValue = this.value;
  this.value = newValue;
  this.emit('StateChanged', { field: 'value', oldValue, newValue });
}
```

### ❌ Emitting generic or context-free events

```typescript
// BAD: no way to tell what changed
this.emit('Updated');

// GOOD: carries enough context to act on
this.emit('Transfer', { from, to, amount });
```

### ❌ Omitting the actor for security-sensitive changes

```typescript
// BAD: no record of who made the change
this.emit('RoleGranted', { role, account });

// GOOD: includes who authorized it
this.emit('RoleGranted', { role, account, grantedBy });
```

---

## Off-Chain Use Cases

These events enable:

1. **Real-time UI updates** — subscribe to `Transfer` and update balances without polling
2. **Indexing & analytics** — indexers like The Graph consume events to enable historical queries
3. **Audit & compliance** — the event log is a complete, ordered record of every state change
4. **Monitoring & alerts** — react to specific events (e.g. `RoleGranted` for an unexpected admin) in real time

---

## How to Run the Examples

```bash
npm run event-example
```

Output shows all four patterns end to end:
- Example 1: Simple state changes
- Example 2: Token transfers
- Example 3: Approvals & spending
- Example 4: Role management

To sanity-check types without running the demo:

```bash
npm run check
```

---

## References

- [OpenZeppelin: Events](https://docs.openzeppelin.com/contracts/4.x/api/utils#Events)
- [Solidity Docs: Events](https://docs.soliditylang.org/en/latest/contracts.html#events)
- [The Graph: Indexing events](https://thegraph.com/docs/en/)
