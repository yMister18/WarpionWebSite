import { NextRequest } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-response';
import { validateInternalKey } from '@/lib/internal-auth';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    shopCommandId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    if (!validateInternalKey(request)) {
      return fail('Unauthorized', 401);
    }

    const { shopCommandId } = await context.params;
    const prisma = getPrismaClient();

    const shopCommand = await prisma.shopCommand.findUnique({
      where: { id: shopCommandId },
      include: {
        player: {
          select: {
            id: true,
            uuid: true,
            username: true,
          },
        },
        order: {
          select: {
            id: true,
            externalId: true,
            status: true,
            deliveryStatus: true,
            totalAmount: true,
            currency: true,
            paidAt: true,
            deliveryCompletedAt: true,
          },
        },
      },
    });

    if (!shopCommand) {
      return fail('ShopCommand not found', 404);
    }

    return ok({ shopCommand });
  } catch (error) {
    console.error('GET /api/internal/shop/commands/[shopCommandId] error:', error);
    return fail('Internal server error', 500);
  }
}