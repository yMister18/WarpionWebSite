import { NextRequest } from 'next/server';
import { ShopCommandStatus } from '@prisma/client';
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
    const timeoutMinutes = Number(process.env.SHOP_COMMAND_PROCESSING_TIMEOUT_MINUTES ?? '5');
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const commands = await prisma.shopCommand.findMany({
      where: {
        status: ShopCommandStatus.PROCESSING,
        processingStartedAt: {
          lt: cutoff,
        },
      },
      orderBy: {
        processingStartedAt: 'asc',
      },
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
            status: true,
            deliveryStatus: true,
          },
        },
      },
      take: 200,
    });

    return ok({
      cutoff,
      count: commands.length,
      commands,
    });
  } catch (error) {
    console.error('GET /api/internal/shop/stuck-commands error:', error);
    return fail('Internal server error', 500);
  }
}