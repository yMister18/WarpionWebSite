import { publishShopCommands } from '@/lib/shop-commands';

await publishShopCommands({
  type: 'SHOP_COMMAND_EXECUTION',
  orderId: 'ord_123',
  playerUuid: '550e8400-e29b-41d4-a716-446655440000',
  commands: [
    'give vip yMister18',
    'say Obrigado pela tua compra!',
  ],
  createdAt: new Date().toISOString(),
});