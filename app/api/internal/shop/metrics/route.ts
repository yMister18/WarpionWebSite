import { NextRequest } from 'next/server';
import { OrderStatus, ShopCommandStatus } from '@prisma/client';
import { getPrismaClient } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-response';
import { validateInternalKey } from '@/lib/internal-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!validateInternalKey(request)) {
      return fail('Unauthorized', 401);
    }

    const prisma = getPrismaClient();

    const [
      pendingCommands,
      publishedCommands,
      processingCommands,
      deliveredCommands,
      failedCommands,
      pendingOrders,
      paidOrders,
      failedOrders,
      deliveredOrders,
      partialOrders,
      processingOrders,
    ] = await Promise.all([
      prisma.shopCommand.count({ where: { status: ShopCommandStatus.PENDING } }),
      prisma.shopCommand.count({ where: { status: ShopCommandStatus.PUBLISHED } }),
      prisma.shopCommand.count({ where: { status: ShopCommandStatus.PROCESSING } }),
      prisma.shopCommand.count({ where: { status: ShopCommandStatus.DELIVERED } }),
      prisma.shopCommand.count({ where: { status: ShopCommandStatus.FAILED } }),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.PAID } }),
      prisma.order.count({ where: { status: OrderStatus.FAILED } }),
      prisma.order.count({ where: { deliveryStatus: 'DELIVERED' } }),
      prisma.order.count({ where: { deliveryStatus: 'PARTIAL' } }),
      prisma.order.count({ where: { deliveryStatus: 'PROCESSING' } }),
    ]);

    return ok({
      commands: {
        pending: pendingCommands,
        published: publishedCommands,
        processing: processingCommands,
        delivered: deliveredCommands,
        failed: failedCommands,
      },
      orders: {
        pendingPayment: pendingOrders,
        paid: paidOrders,
        failedPayment: failedOrders,
        delivered: deliveredOrders,
        partial: partialOrders,
        processing: processingOrders,
      },
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error('GET /api/internal/shop/metrics error:', error);
    return fail('Internal server error', 500);
  }
}