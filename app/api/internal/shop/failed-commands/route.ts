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

    const commands = await prisma.shopCommand.findMany({
      where: {
        status: ShopCommandStatus.FAILED,
      },
      orderBy: {
        updatedAt: 'desc',
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
      count: commands.length,
      commands,
    });
  } catch (error) {
    console.error('GET /api/internal/shop/failed-commands error:', error);
    return fail('Internal server error', 500);
  }
}