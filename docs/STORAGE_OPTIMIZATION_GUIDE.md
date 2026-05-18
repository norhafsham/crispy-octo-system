# Storage Optimization Guide: Reducing Gas Costs in Smart Contracts

## Overview

This guide provides comprehensive solutions to **GitHub Issue #2: Inefficient Storage Usage**. It demonstrates practical patterns for optimizing storage access patterns in smart contracts, particularly when handling loops and multiple reads.

---

## Problem Statement

Storage operations in EVM-compatible blockchains (Ethereum, Polygon, etc.) are among the most expensive operations:

- **Storage Read (SLOAD):** ~2,100 gas
- **Storage Write (SSTORE):** ~20,000 gas
- **Memory Read/Write:** ~3 gas
- **Stack Operations:** ~3 gas

### Real Cost Impact

```
Scenario: Processing 100 users with 3 storage accesses each

❌ Inefficient approach:
  100 users × 3 accesses × 2,100 gas = 630,000 gas

✅ Optimized approach:
  (100 users × 1 cached read) + (300 memory accesses) ≈ 3,000 gas

💰 Savings: 99.5% gas reduction! (627,000 gas saved)
```

---

## Core Optimization Patterns

### Pattern 1: Cache Array in Memory

**Problem:** Reading from a storage array repeatedly in a loop

```solidity
// ❌ INEFFICIENT
for (uint i = 0; i < users.length; i++) {  // SLOAD: users.length
    uint points = users[i].points;          // SLOAD: users[i]
    // ... do something ...
}
// Total: N * 2,100 gas per iteration
```

**Solution:** Copy storage array to memory once

```solidity
// ✅ EFFICIENT
User[] memory cachedUsers = users;  // Single SLOAD
uint cachedLength = cachedUsers.length;

for (uint i = 0; i < cachedLength; i++) {
    uint points = cachedUsers[i].points;  // Memory access (~3 gas)
}
// Total: Single storage read + N * 3 gas
```

**Gas Savings:** ~99% for arrays with 10+ elements

---

### Pattern 2: Cache Struct Fields

**Problem:** Accessing multiple fields from a storage struct

```solidity
// ❌ INEFFICIENT
if (users[i].active && users[i].points > 0 && users[i].verified) {
    uint bonus = users[i].points * 2;  // Multiple SLOAD calls
}
// Each access = separate storage read
```

**Solution:** Extract struct to memory first

```solidity
// ✅ EFFICIENT
User memory user = users[i];  // Single storage read

if (user.active && user.points > 0 && user.verified) {
    uint bonus = user.points * 2;  // All from memory
}
// All accesses = memory reads (~3 gas each)
```

**Gas Savings:** ~85-95% when accessing 3+ fields

---

### Pattern 3: Use Mappings for Lookups

**Problem:** Linear search through arrays in storage

```solidity
// ❌ INEFFICIENT - O(n) lookups with storage reads
function findUser(uint userId) internal view returns (User memory) {
    for (uint i = 0; i < users.length; i++) {  // Storage access per iteration
        if (users[i].id == userId) {             // Storage access per check
            return users[i];                      // Storage access for return
        }
    }
}
```

**Solution:** Use mappings for O(1) access

```solidity
// ✅ EFFICIENT - O(1) lookup
mapping(uint => User) public userMap;

function findUser(uint userId) internal view returns (User memory) {
    return userMap[userId];  // Single storage access
}
```

**Gas Savings:** 95%+ for large datasets (100+ items)

---

### Pattern 4: Single-Pass Aggregation

**Problem:** Multiple loops for aggregating data

```solidity
// ❌ INEFFICIENT
uint totalPoints = 0;
uint activeCount = 0;

// Pass 1: Count active
for (uint i = 0; i < users.length; i++) {
    if (users[i].active) activeCount++;  // Storage read
}

// Pass 2: Sum points
for (uint i = 0; i < users.length; i++) {
    totalPoints += users[i].points;  // Storage read again
}
// Total: 2N storage reads
```

**Solution:** Calculate everything in one loop

```solidity
// ✅ EFFICIENT
User[] memory cachedUsers = users;

uint totalPoints = 0;
uint activeCount = 0;

for (uint i = 0; i < cachedUsers.length; i++) {
    User memory user = cachedUsers[i];
    
    if (user.active) {
        activeCount++;
        totalPoints += user.points;
    }
}
// Total: Single storage read + N memory iterations
```

**Gas Savings:** ~50% (eliminates redundant array iterations)

---

### Pattern 5: Batch Operations

**Problem:** Processing multiple items with repeated storage accesses

```solidity
// ❌ INEFFICIENT - Multiple storage reads for same data
for (uint i = 0; i < updates.length; i++) {
    for (uint j = 0; j < users.length; j++) {
        if (users[j].id == updates[i].userId) {
            users[j].points += updates[i].amount;  // Repeated access
        }
    }
}
```

**Solution:** Use mapping for index lookup

```solidity
// ✅ EFFICIENT - O(1) lookups with caching
mapping(uint => uint) userIndex;  // userId => index in array

// Initialize once (do this during setup)
for (uint i = 0; i < users.length; i++) {
    userIndex[users[i].id] = i;
}

// Then batch process
for (uint i = 0; i < updates.length; i++) {
    uint idx = userIndex[updates[i].userId];
    User storage user = users[idx];
    user.points += updates[i].amount;  // Direct access
}
```

**Gas Savings:** 90-95% for batch operations on large datasets

---

## Implementation Checklist

### Before Deployment

- [ ] **Audit loops**: Identify all loops with storage accesses
- [ ] **Profile gas**: Measure gas before and after optimization
- [ ] **Document patterns**: Add comments explaining optimization rationale
- [ ] **Add tests**: Ensure functionality remains identical
- [ ] **Review nested loops**: Extra critical for nested loops (O(n²) scenarios)

### Specific Areas to Review

```solidity
// 🔴 Critical - High priority optimization needed
function processLargeArray() public {
    for (uint i = 0; i < bigArray.length; i++) {  // Array length SLOAD
        for (uint j = 0; j < bigArray[i].items.length; j++) {  // Nested SLOAD
            process(bigArray[i].items[j]);  // Multiple reads
        }
    }
}
// ACTION: Use memory caching for both arrays
```

### Expected Results

After applying these patterns, measure improvements:

```
Metric                      Before      After       Improvement
─────────────────────────────────────────────────────────────────
Gas per 100 items          630,000     3,000       99.5%
Gas per 1,000 items      6,300,000    30,000       99.5%
Memory usage              Normal      +N bytes     Small increase
Code complexity           Simple      Moderate     Worth it!
Security risk            None        None         Safe patterns
```

---

## Anti-Patterns to Avoid

### ❌ Reading array.length in loop condition

```solidity
// BAD: Storage read on each iteration
for (uint i = 0; i < storage_array.length; i++) { }

// GOOD: Cache length
uint length = storage_array.length;
for (uint i = 0; i < length; i++) { }
```

### ❌ Accessing multiple fields separately

```solidity
// BAD: Multiple storage reads
if (user.active) { /* ... */ }
uint points = user.points;
string memory name = user.name;

// GOOD: Cache struct
User memory user = storage_user;
if (user.active) { /* ... */ }
uint points = user.points;
string memory name = user.name;
```

### ❌ Repeated linear searches

```solidity
// BAD: O(n) per search
for (uint i = 0; i < 10; i++) {
    User memory user = findUser(searches[i].userId);  // Linear search each time
}

// GOOD: Use mapping for O(1)
mapping(uint => User) userMap;
for (uint i = 0; i < 10; i++) {
    User memory user = userMap[searches[i].userId];
}
```

---

## Real-World Examples from Token Contracts

### Example 1: ERC20-style Transfer in Batch

```solidity
// ❌ Inefficient
function batchTransfer(address[] calldata recipients, uint[] calldata amounts) public {
    for (uint i = 0; i < recipients.length; i++) {
        balances[msg.sender] -= amounts[i];      // Storage read + write
        balances[recipients[i]] += amounts[i];   // Storage read + write
    }
}

// ✅ Efficient
function batchTransfer(address[] calldata recipients, uint[] calldata amounts) public {
    uint senderBalance = balances[msg.sender];   // Single read
    
    for (uint i = 0; i < recipients.length; i++) {
        senderBalance -= amounts[i];              // Memory operation
        balances[recipients[i]] += amounts[i];   // Only write new addresses
    }
    
    balances[msg.sender] = senderBalance;        // Single write
}
// Gas savings: ~80% for batches of 10+ items
```

### Example 2: Voting System with Aggregation

```solidity
// ❌ Inefficient - Multiple passes
function getVotingStats() public view returns (uint total, uint unique) {
    for (uint i = 0; i < voters.length; i++) {
        total += votes[voters[i]];               // Pass 1
    }
    for (uint i = 0; i < voters.length; i++) {
        if (votes[voters[i]] > 0) unique++;      // Pass 2
    }
}

// ✅ Efficient - Single pass
function getVotingStats() public view returns (uint total, uint unique) {
    address[] memory cachedVoters = voters;
    uint total = 0;
    uint unique = 0;
    
    for (uint i = 0; i < cachedVoters.length; i++) {
        uint voteCount = votes[cachedVoters[i]];  // Single read per iteration
        total += voteCount;
        if (voteCount > 0) unique++;
    }
}
// Gas savings: ~50% reduction
```

---

## Tools for Profiling

### Hardhat Gas Reporter

```bash
# Install
npm install --save-dev hardhat-gas-reporter

# Configure in hardhat.config.js
module.exports = {
  gasReporter: {
    enabled: true,
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};

# Run tests with gas reporting
npm test
```

### Foundry (Forge)

```bash
# Profile function gas usage
forge test --gas-report

# Show detailed gas breakdown
forge test --gas-report --verbosity vvv
```

### Manual Profiling with events

```solidity
event GasSnapshot(string operation, uint gasUsed);

function profileFunction() external {
    uint startGas = gasleft();
    
    // Your function code
    
    uint gasUsed = startGas - gasleft();
    emit GasSnapshot("operation_name", gasUsed);
}
```

---

## Migration Path for Existing Contracts

### Step 1: Identify Hot Functions

Focus on functions that:
- Are called frequently
- Have loops
- Deal with large datasets
- Have multiple storage accesses

### Step 2: Add Memory Caching

Start with the highest-impact optimizations:

1. Cache array length
2. Cache arrays to memory
3. Extract struct fields

### Step 3: Refactor Data Structures

If needed:
- Add mappings for lookups
- Consider splitting storage into separate contracts
- Implement pagination for large queries

### Step 4: Test & Benchmark

```bash
# Before: Record baseline gas
npm run test:gas > baseline.txt

# After: Compare results
npm run test:gas > optimized.txt
diff baseline.txt optimized.txt
```

### Step 5: Document & Deploy

- Add natspec comments explaining optimizations
- Document gas savings in PR
- Create migration guide for users (if needed)

---

## Summary: Action Items

1. **Audit Loops**
   - [ ] Find all loops with storage accesses
   - [ ] Measure current gas usage
   - [ ] Prioritize by impact (nested loops first)

2. **Apply Optimizations**
   - [ ] Cache storage values before loops
   - [ ] Extract struct fields to memory
   - [ ] Replace linear searches with mappings
   - [ ] Consolidate multiple passes into single loops

3. **Test & Validate**
   - [ ] Run full test suite
   - [ ] Compare gas reports before/after
   - [ ] Verify correctness of calculations

4. **Deploy & Monitor**
   - [ ] Document gas improvements in PR
   - [ ] Deploy to testnet first
   - [ ] Monitor gas usage in production

---

## References

- [Solidity Docs: Memory vs Storage](https://docs.soliditylang.org/en/latest/types.html#data-location)
- [EVM Gas Reference](https://evm.codes)
- [OpenZeppelin Gas Optimization Patterns](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/GOVERNANCE.md)
- [Ethereum Foundation: Gas and Fees](https://ethereum.org/en/developers/docs/gas/)

---

## Questions?

For specific code reviews or implementation assistance, please provide:
1. The contract code or function you want to optimize
2. Current gas usage (if available)
3. Expected frequency of calls
4. Any data structure constraints

Happy optimizing! 🚀
