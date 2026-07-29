import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  StorageSimulator,
  User,
  Update,
  formatGasSavings,
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
  generateTestData,
  generateTestUpdates,
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

  it('report a zero average level for empty storage instead of NaN', () => {
    // Regression: averageLevel was totalLevel / arraySize, i.e. 0 / 0 = NaN.
    const inefficient = inefficientMultiPassAggregation(new StorageSimulator());
    const efficient = efficientSinglePassAggregation(new StorageSimulator());

    expect(inefficient).toEqual({ totalPoints: 0, activeCount: 0, averageLevel: 0 });
    expect(efficient).toEqual(inefficient);
    expect(Number.isNaN(inefficient.averageLevel)).toBe(false);
    expect(Number.isNaN(efficient.averageLevel)).toBe(false);
  });
});

describe('empty storage across every pattern', () => {
  it('does not produce NaN, Infinity, or a throw in any inefficient/efficient pair', () => {
    expect(inefficientArrayAccess(new StorageSimulator())).toBe(0);
    expect(efficientArrayAccess(new StorageSimulator())).toBe(0);
    expect(inefficientLinearSearch(new StorageSimulator(), 1)).toBeNull();
    expect(efficientMappingLookup(new StorageSimulator(), 1)).toBeNull();
    expect(() => inefficientBatchUpdates(new StorageSimulator(), [])).not.toThrow();
    expect(() => efficientBatchUpdates(new StorageSimulator(), [])).not.toThrow();
  });
});

describe('parity over randomized data', () => {
  // The whole point of this module is that each efficientX is equivalent to
  // its inefficientX. The fixtures above check that against hand-built cases;
  // these check it against the generated data the demo actually runs on.
  it('holds for read-only patterns across a full generated dataset', () => {
    const storage = generateTestData();

    expect(storage.users.length).toBe(storage.userMap.size);
    expect(efficientArrayAccess(storage)).toBe(inefficientArrayAccess(storage));
    expect(efficientSinglePassAggregation(storage)).toEqual(inefficientMultiPassAggregation(storage));

    storage.users.forEach((user) => {
      expect(efficientMappingLookup(storage, user.id)?.id).toBe(inefficientLinearSearch(storage, user.id)?.id);
      expect(efficientStructAccess(user)).toBe(inefficientStructAccess(user));
    });
  });

  it('holds for batch updates applied to identical copies of a generated dataset', () => {
    const source = generateTestData();
    const updates = generateTestUpdates(25);

    const storageA = makeStorage(source.users.map((user) => ({ ...user })));
    const storageB = makeStorage(source.users.map((user) => ({ ...user })));

    inefficientBatchUpdates(storageA, updates);
    efficientBatchUpdates(storageB, updates);

    expect(storageA.users).toEqual(storageB.users);
  });
});

describe('formatGasSavings', () => {
  it('computes a percentage against a non-zero baseline', () => {
    expect(formatGasSavings(2100, 210000)).toBe('99.0%');
    expect(formatGasSavings(50, 100)).toBe('50.0%');
  });

  it('returns a placeholder instead of -Infinity for an empty workload', () => {
    // Regression: `(1 - gas / 0) * 100` printed "-Infinity%".
    expect(formatGasSavings(2100, 0)).toBe('n/a (no work to do)');
  });
});

describe('StorageSimulator', () => {
  it('keeps the array and the map describing the same set', () => {
    const storage = makeStorage([makeUser({ id: 1 }), makeUser({ id: 2 })]);

    expect(storage.users.length).toBe(storage.userMap.size);
    storage.users.forEach((user) => expect(storage.userMap.get(user.id)).toBe(user));
  });

  it('rejects a duplicate user id rather than letting array and map diverge', () => {
    // Regression: the second addUser appended to `users` but overwrote the
    // single `userMap` entry, so array-based and map-based functions silently
    // disagreed from that point on.
    const storage = makeStorage([makeUser({ id: 1, points: 10 })]);

    expect(() => storage.addUser(makeUser({ id: 1, points: 99 }))).toThrow('Duplicate user id: 1');
    expect(storage.users.length).toBe(1);
    expect(storage.userMap.size).toBe(1);
    expect(storage.userMap.get(1)?.points).toBe(10);
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
