import { PrismaClient, TargetDatabase } from '@prisma/client';
import { ApiError } from '../middlewares/error.middleware';
import { deleteCache, getCache, setCache } from './cache.service';

const prisma = new PrismaClient();
const CACHE_KEY_PREFIX = 'targetDatabases';

const createTargetDatabase = async (data: Omit<TargetDatabase, 'id' | 'createdAt' | 'updatedAt'>): Promise<TargetDatabase> => {
  const newDb = await prisma.targetDatabase.create({ data });
  await deleteCache(CACHE_KEY_PREFIX); // Invalidate cache for list
  return newDb;
};

const getTargetDatabaseById = async (id: string): Promise<TargetDatabase | null> => {
  const cacheKey = `${CACHE_KEY_PREFIX}:${id}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) return cachedData;

  const db = await prisma.targetDatabase.findUnique({
    where: { id },
    include: { owner: true }
  });
  if (db) await setCache(cacheKey, db);
  return db;
};

const getAllTargetDatabases = async (ownerId?: string): Promise<TargetDatabase[]> => {
  const cacheKey = ownerId ? `${CACHE_KEY_PREFIX}:owner:${ownerId}` : CACHE_KEY_PREFIX;
  const cachedData = await getCache(cacheKey);
  if (cachedData) return cachedData;

  const dbs = await prisma.targetDatabase.findMany({
    where: ownerId ? { ownerId } : {},
    include: { owner: true },
    orderBy: { createdAt: 'desc' }
  });
  await setCache(cacheKey, dbs, 600); // Cache for 10 minutes
  return dbs;
};

const updateTargetDatabase = async (id: string, data: Partial<TargetDatabase>): Promise<TargetDatabase> => {
  const existingDb = await prisma.targetDatabase.findUnique({ where: { id } });
  if (!existingDb) {
    throw new ApiError(404, 'Target Database not found');
  }
  const updatedDb = await prisma.targetDatabase.update({ where: { id }, data });
  await deleteCache(CACHE_KEY_PREFIX); // Invalidate list cache
  await deleteCache(`${CACHE_KEY_PREFIX}:${id}`); // Invalidate specific item cache
  return updatedDb;
};

const deleteTargetDatabase = async (id: string): Promise<void> => {
  const existingDb = await prisma.targetDatabase.findUnique({ where: { id } });
  if (!existingDb) {
    throw new ApiError(404, 'Target Database not found');
  }
  await prisma.targetDatabase.delete({ where: { id } });
  await deleteCache(CACHE_KEY_PREFIX);
  await deleteCache(`${CACHE_KEY_PREFIX}:${id}`);
};

export {
  createTargetDatabase,
  getTargetDatabaseById,
  getAllTargetDatabases,
  updateTargetDatabase,
  deleteTargetDatabase,
};
```