import { redis } from '@/lib/redis';

type ShopQueuePayload = {
  orderId: string;
  playerUuid: string;
  commands: string[];
  createdAt: string;
};

export async function enqueueShopCommands(payload: ShopQueuePayload) {
  await redis.rpush(
    'warpion:queue:shop-commands',
    JSON.stringify(payload)
  );
}