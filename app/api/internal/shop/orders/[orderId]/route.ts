import { NextRequest } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-response';
import { validateInternalKey } from '@/lib/internal-auth';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    if (!validateInternalKey(request)) {
      return fail('Unauthorized', 401);
    }

    const { orderId } = await context.params;
    const prisma = getPrismaClient();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        player: {
          select: {
            id: true,
            uuid: true,
            username: true,
          },
        },
        items: true,
        shopCommands: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      return fail('Order not found', 404);
    }

    return ok({ order });
  } catch (error) {
    console.error('GET /api/internal/shop/orders/[orderId] error:', error);
    return fail('Internal server error', 500);
  }
}