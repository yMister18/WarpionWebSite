import { NextRequest } from 'next/server';
import { ShopCommandStatus } from '@prisma/client';
import { getPrismaClient } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-response';
import { validateInternalKey } from '@/lib/internal-auth';
import { isObject, isString } from '@/lib/validation';
import { recomputeOrderDeliveryStatus } from '@/lib/order-delivery';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!validateInternalKey(request)) {
      return fail('Unauthorized', 401);
    }

    const prisma = getPrismaClient();
    const body: unknown = await request.json();

    if (!isObject(body)) {
      return fail('Invalid request body', 400);
    }

    const { orderId } = body;

    if (!isString(orderId)) {
      return fail('Invalid or missing orderId', 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shopCommands: true,
      },
    });

    if (!order) {
      return fail('Order not found', 404);
    }

    const result = await prisma.shopCommand.updateMany({
      where: {
        orderId,
        status: {
          not: ShopCommandStatus.DELIVERED,
        },
      },
      data: {
        status: ShopCommandStatus.PENDING,
        processingStartedAt: null,
        processingOwner: null,
        deliveredAt: null,
        lastError: 'Manually requeued by admin (order-level)',
      },
    });

    const updatedOrder = await recomputeOrderDeliveryStatus(prisma, orderId);

    return ok({
      requeuedCount: result.count,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('POST /api/internal/shop/requeue-order error:', error);
    return fail('Internal server error', 500);
  }
}