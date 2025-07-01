import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhoenixSeedManager } from '@/lib/phoenix/seed-manager';
import { existsSync, } from 'node:fs';

// Mock postgres and drizzle-orm to prevent real database connections
const mockPostgresClient = {
  end: vi.fn(),
  query: vi.fn(),
  connect: vi.fn(),
  options: {
    host: 'localhost',
    port: 5432,
    database: 'testdb'
  }
};

const mockDrizzle = {
  query: {
    worldMeta: {
      findFirst: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    artifact: {
      findMany: vi.fn(),
    },
    chat: {
      findMany: vi.fn(),
    },
  },
  select: vi.fn(() => ({ 
    from: vi.fn(() => ({ 
      where: vi.fn(() => ({ 
        limit: vi.fn(() => []) 
      })) 
    })) 
  })),
};

vi.mock('postgres', () => ({
  default: vi.fn(() => mockPostgresClient),
}));

vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn(() => mockDrizzle),
}));

// Mock the database
const mockWorlds = [
  { id: 'world1', name: 'Test World 1', environment: 'LOCAL', category: 'test', isActive: true, isTemplate: false, autoCleanup: false, cleanupAfterHours: 0, isolationLevel: 'FULL', tags: [], dependencies: [], settings: {} },
];

const mockUsers = [
  { id: 'user1', email: 'user1@example.com', name: 'User One', password: 'pass1', type: 'user' },
];

const mockDb = {
  query: {
    worldMeta: {
      findFirst: vi.fn(({ where }: { where: any }) => {
        const worldId = where.value;
        return mockWorlds.find(w => w.id === worldId);
      }),
    },
    user: {
      findMany: vi.fn(() => mockUsers),
    },
  },
  select: vi.fn(() => ({ from: vi.fn(() => []) })),
};

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

// Mock fs and path modules
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    existsSync: vi.fn(() => false), // Default to not existing
    rmSync: vi.fn(),
  };
});

// Mock node:fs/promises
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    mkdir: vi.fn(() => Promise.resolve()),
    writeFile: vi.fn(() => Promise.resolve()),
    readFile: vi.fn(() => Promise.resolve('{}')),
    readdir: vi.fn(() => Promise.resolve([])),
    stat: vi.fn(() => Promise.resolve({ isDirectory: () => true })),
  };
});

vi.mock('path', async (importOriginal) => {
  const actual = await importOriginal<typeof import('path')>();
  return {
    ...actual,
    join: vi.fn((...args) => args.join('/')),
    resolve: vi.fn((...args) => args.join('/')),
  };
});

describe('PhoenixSeedManager', () => {
  const testDbUrl = 'postgres://test:test@localhost:5432/test_db';
  const mockExportDir = './exports/test-seed';

  beforeEach(() => {
    vi.clearAllMocks();
    (existsSync as any).mockReturnValue(false);
    
    // Setup mockDrizzle to return test data
    mockDrizzle.query.worldMeta.findFirst.mockImplementation(({ where }: { where: any }) => {
      const worldId = where?.eq?.[1] || where?.value || 'world1';
      return mockWorlds.find(w => w.id === worldId);
    });
    
    mockDrizzle.query.user.findMany.mockReturnValue(mockUsers);
    mockDrizzle.query.artifact.findMany.mockReturnValue([]);
    mockDrizzle.query.chat.findMany.mockReturnValue([]);
  });

  it('should export world data to a specified directory', async () => {
    // Setup mock to return world data
    mockDrizzle.select = vi.fn(() => ({ 
      from: vi.fn(() => ({ 
        where: vi.fn(() => ({ 
          limit: vi.fn(() => mockWorlds) 
        })) 
      })) 
    }));

    const seedManager = new PhoenixSeedManager(testDbUrl);
    const worldId = 'world1';
    const seedName = 'test-seed';
    const includeBlobs = false;

    const resultPath = await seedManager.exportWorld(worldId, seedName, includeBlobs);

    // Test основных функциональностей без детального тестирования мокированных функций
    expect(resultPath).toContain(seedName);
    expect(typeof resultPath).toBe('string');
    
    // Проверяем что мокированные БД функции были вызваны
    expect(mockDrizzle.select).toHaveBeenCalled();
  });

  it('should throw an error if world is not found', async () => {
    // Setup mock to return empty array for nonexistent world
    mockDrizzle.select = vi.fn(() => ({ 
      from: vi.fn(() => ({ 
        where: vi.fn(() => ({ 
          limit: vi.fn(() => []) // Empty array means world not found
        })) 
      })) 
    }));
    
    const seedManager = new PhoenixSeedManager(testDbUrl);
    const worldId = 'nonexistent-world';
    const seedName = 'test-seed';
    const includeBlobs = false;

    await expect(seedManager.exportWorld(worldId, seedName, includeBlobs)).rejects.toThrow(
      `World '${worldId}' not found`
    );
  });
});
