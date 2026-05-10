import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis }

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}

export async function cacheGet(key: string): Promise<string | null> {
  return redis.get(key)
}

export async function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, value)
  } else {
    await redis.set(key, value)
  }
}

export async function cacheDelete(key: string): Promise<void> {
  await redis.del(key)
}

export async function cacheIncr(key: string, ttlSeconds?: number): Promise<number> {
  const val = await redis.incr(key)
  if (val === 1 && ttlSeconds) {
    await redis.expire(key, ttlSeconds)
  }
  return val
}
