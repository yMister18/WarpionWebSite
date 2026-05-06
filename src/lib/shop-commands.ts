import { redisPublisher } from './redis';

export type ShopCommandPayload = {
  type: 'SHOP_COMMAND_EXECUTION';
  orderId: string;
  playerUuid: string;
  commands: string[];
  createdAt: string;
};

export async function publishShopCommands(payload: ShopCommandPayload) {
  await redisPublisher.publish('warpion:shop:commands', JSON.stringify(payload));
}