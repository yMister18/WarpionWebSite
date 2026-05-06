import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
  redisPublisher?: Redis;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL as string, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });

export const redisPublisher =
  globalForRedis.redisPublisher ??
  new Redis(process.env.REDIS_URL as string, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
  globalForRedis.redisPublisher = redisPublisher;
}