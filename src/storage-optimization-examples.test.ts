import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  StorageSimulator,
  User,
  Update,
  inefficientArrayAccess,
  efficientArrayAccess,
  inefficientStructAccess,
  efficientStructAccess,
  inefficientLinearSearch,
  efficientMappingLookup,
  inefficientMultiPassAggregation,
  efficientSinglePassAggregation,
  inefficientBatchUpdates,
  efficientBatchUpdates,
} from './storage-optimization-examples';

function makeUser(overrides: Partial<User>): User {
  return {
    id: 1,
    address: '0x1',
    points: 0,
    active: true,
    verified: true,
    level: 1,
    ...overrides,
  };
}

function makeStorage(users: User[]): StorageSimulator {
  const storage = new StorageSimulator();
  users.forEach((user) => storage.addUser(user));
  return storage;
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('array access: inefficient vs. efficient parity', () => {
  it('produce the same total points for active users only', () => {
    const users = [
      makeUser({ id: 1, points: 10, active: true }),
      makeUser({ id: 2, points: 20, active: false }),
      makeUser({ id: 3, points: 30, active: true }),
    ];

    expect(inefficientArrayAccess(makeStorage(users))).toBe(40);
    expect(efficientArrayAccess(makeStorage(users))).toBe(40);
  });
});

describe('struct access: inefficient vs. efficient parity', () => {
  it('return points * level only when active and verified', () => {
    const user = makeUser({ points: 5, level: 4, active: true, verified: true });
    expect(inefficientStructAccess(user)).toBe(20);
    expect(efficientStructAccess(user)).toBe(20);
  });

  it('return 0 when the user is not active', () => {
    const user = makeUser({ points: 5, level: 4, active: false, verified: true });
    expect(inefficientStructAccess(user)).toBe(0);
    expect(efficientStructAccess(user)).toBe(0);
  });

  it('return 0 when the user is not verified', () => {
    const user = makeUser({ points: 5, level: 4, active: true, verified: false });
    expect(inefficientStructAccess(user)).toBe(0);
    expect(efficientStructAccess(user)).toBe(0);
  });
});

describe('lookup: inefficient vs. efficient parity', () => {
  const users = [makeUser({ id: 1 }), makeUser({ id: 2 }), makeUser({ id: 3 })];

  it('find an existing user by id', () => {
    expect(inefficientLinearSearch(makeStorage(users), 2)?.id).toBe(2);
    expect(efficientMappingLookup(makeStorage(users), 2)?.id).toBe(2);
  });

  it('return null for a user id that does not exist', () => {
    expect(inefficientLinearSearch(makeStorage(users), 999)).toBeNull();
    expect(efficientMappingLookup(makeStorage(users), 999)).toBeNull();
  });
});

describe('aggregation: inefficient vs. efficient parity', () => {
  it('compute the same totals, active count, and average level', () => {
    const users = [
      makeUser({ id: 1, points: 10, level: 2, active: true }),
      makeUser({ id: 2, points: 20, level: 4, active: false }),
      makeUser({ id: 3, points: 30, level: 6, active: true }),
    ];

    const inefficient = inefficientMultiPassAggregation(makeStorage(users));
    const efficient = efficientSinglePassAggregation(makeStorage(users));

    expect(inefficient).toEqual({ totalPoints: 60, activeCount: 2, averageLevel: 4 });
    expect(efficient).toEqual(inefficient);
  });
});

describe('batch updates: inefficient vs. efficient parity', () => {
  it('apply add/subtract updates identically to both storage variants', () => {
    const users = [makeUser({ id: 1, points: 100 }), makeUser({ id: 2, points: 50 })];
    const updates: Update[] = [
      { userId: 1, amount: 30, operation: 'add' },
      { userId: 2, amount: 10, operation: 'subtract' },
      { userId: 1, amount: 5, operation: 'subtract' },
    ];

    const storageA = makeStorage(users.map((u) => ({ ...u })));
    const storageB = makeStorage(users.map((u) => ({ ...u })));

    inefficientBatchUpdates(storageA, updates);
    efficientBatchUpdates(storageB, updates);

    expect(storageA.userMap.get(1)?.points).toBe(125);
    expect(storageA.userMap.get(2)?.points).toBe(40);
    expect(storageB.userMap.get(1)?.points).toBe(125);
    expect(storageB.userMap.get(2)?.points).toBe(40);
  });

  it('ignores updates for a user id that does not exist', () => {
    const users = [makeUser({ id: 1, points: 100 })];
    const updates: Update[] = [{ userId: 999, amount: 30, operation: 'add' }];

    const storageA = makeStorage(users.map((u) => ({ ...u })));
    const storageB = makeStorage(users.map((u) => ({ ...u })));

    inefficientBatchUpdates(storageA, updates);
    efficientBatchUpdates(storageB, updates);

    expect(storageA.userMap.get(1)?.points).toBe(100);
    expect(storageB.userMap.get(1)?.points).toBe(100);
  });
});
