import { redisPublisher } from './redis';

export type ShopCommandEvent = {
  type: 'SHOP_COMMAND_EXECUTION';
  shopCommandId: string;
  orderId: string;
  playerUuid: string;
  command: string;
  createdAt: string;
};

export async function publishShopCommand(event: ShopCommandEvent) {
  await redisPublisher.publish('warpion:shop:commands', JSON.stringify(event));
}