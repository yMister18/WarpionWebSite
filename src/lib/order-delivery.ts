import { PrismaClient, ShopCommandStatus } from '@prisma/client';

export async function recomputeOrderDeliveryStatus(
  prisma: PrismaClient,
  orderId: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shopCommands: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  const commands = order.shopCommands;

  if (commands.length === 0) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: 'PENDING',
        deliveryCompletedAt: null,
      },
    });
  }

  const statuses = commands.map((command) => command.status);

  const pendingLikeStatuses: ShopCommandStatus[] = [
    ShopCommandStatus.PENDING,
    ShopCommandStatus.PUBLISHED,
    ShopCommandStatus.PROCESSING,
  ];

  const hasPendingLike = statuses.some((status) =>
    pendingLikeStatuses.includes(status)
  );

  const deliveredCount = statuses.filter(
    (status) => status === ShopCommandStatus.DELIVERED
  ).length;

  const failedCount = statuses.filter(
    (status) => status === ShopCommandStatus.FAILED
  ).length;

  if (hasPendingLike) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: 'PROCESSING',
        deliveryCompletedAt: null,
      },
    });
  }

  if (deliveredCount === commands.length) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: 'DELIVERED',
        deliveryCompletedAt: new Date(),
      },
    });
  }

  if (failedCount === commands.length) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: 'FAILED',
        deliveryCompletedAt: new Date(),
      },
    });
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryStatus: 'PARTIAL',
      deliveryCompletedAt: new Date(),
    },
  });
}