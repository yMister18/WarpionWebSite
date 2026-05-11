import { NextRequest } from 'next/server';
import { ShopCommandStatus } from '@prisma/client';
import { getPrismaClient } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-response';
import { validatePluginKey } from '@/lib/plugin-auth';
import { isObject, isString } from '@/lib/validation';
import { recomputeOrderDeliveryStatus } from '@/lib/order-delivery';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient();

    const authError = validatePluginKey(request);
    if (authError) return authError;

    const body: unknown = await request.json();

    if (!isObject(body)) {
      return fail('Invalid request body', 400);
    }

    const { shopCommandId, success, error } = body;

    if (!isString(shopCommandId)) {
      return fail('Invalid or missing shopCommandId', 400);
    }

    if (typeof success !== 'boolean') {
      return fail('Invalid or missing success', 400);
    }

    const existing = await prisma.shopCommand.findUnique({
      where: { id: shopCommandId },
    });

    if (!existing) {
      return fail('ShopCommand not found', 404);
    }

    if (existing.status === ShopCommandStatus.DELIVERED) {
      const order = await recomputeOrderDeliveryStatus(prisma, existing.orderId);

      return ok({
        shopCommand: existing,
        order,
      });
    }

    const allowedCurrentStatuses: ShopCommandStatus[] = [
      ShopCommandStatus.PROCESSING,
      ShopCommandStatus.PUBLISHED,
    ];

    if (!allowedCurrentStatuses.includes(existing.status)) {
      return fail(
        `ShopCommand cannot be acknowledged from status ${existing.status}`,
        409
      );
    }

    const updated = await prisma.shopCommand.update({
      where: { id: shopCommandId },
      data: success
        ? {
            status: ShopCommandStatus.DELIVERED,
            deliveredAt: new Date(),
            lastError: null,
            processingStartedAt: null,
            processingOwner: null,
          }
        : {
            status: ShopCommandStatus.FAILED,
            lastError: isString(error) ? error : 'Unknown execution error',
            processingStartedAt: null,
            processingOwner: null,
          },
    });

    const order = await recomputeOrderDeliveryStatus(prisma, updated.orderId);

    return ok({
      shopCommand: updated,
      order,
    });
  } catch (error) {
    console.error('POST /api/plugin/commands/ack error:', error);
    return fail('Internal server error', 500);
  }
}