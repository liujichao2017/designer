import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'
import { createPrismaRedisCache } from "prisma-redis-middleware"

const globalForStorege = globalThis as unknown as {
  prisma: PrismaClient | undefined
  redis: Redis | undefined
}

const redisUrl = process.env.REDIS_URL

export const prisma = globalForStorege.prisma ?? new PrismaClient()
export const redis = globalForStorege.redis ?? (redisUrl ? new Redis(redisUrl) : new Redis())

export const sql = prisma.$queryRaw

if (process.env.NODE_ENV !== 'production') {
  globalForStorege.prisma = prisma
  globalForStorege.redis = redis
}

const cacheMiddleware = createPrismaRedisCache({
  models: [
    { model: "user", excludeMethods: ["findMany"] },
    { model: "project", cacheTime: 10, cacheKey: "project" },
  ],
  storage: { type: "redis", options: { client: redis, invalidation: { referencesTTL: 300 } } },
  cacheTime: 300,
  excludeModels: ["role", "permission"],
  excludeMethods: ["count", "groupBy"],
  onHit: (key) => {
    console.log("hit", key);
  },
  onMiss: (key) => {
    console.log("miss", key);
  },
  onError: (key) => {
    console.log("error", key);
  },
});

// prisma.$use(cacheMiddleware)

export enum DBStatusCode {
  INVALID = 0,
  VALID = 1,
}