import { NextRequest } from 'next/server';
import { ShopCommandStatus } from '@prisma/client';
import { getPrismaClient } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest) {
  const provided = request.headers.get('x-internal-key');
  const expected = process.env.INTERNAL_API_KEY;

  return Boolean(expected && provided && provided === expected);
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return fail('Unauthorized', 401);
    }

    const prisma = getPrismaClient();
    const timeoutMinutes = Number(process.env.SHOP_COMMAND_PROCESSING_TIMEOUT_MINUTES ?? '5');

    if (!Number.isFinite(timeoutMinutes) || timeoutMinutes <= 0) {
      return fail('Invalid processing timeout configuration', 500);
    }

    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const result = await prisma.shopCommand.updateMany({
      where: {
        status: ShopCommandStatus.PROCESSING,
        processingStartedAt: {
          lt: cutoff,
        },
      },
      data: {
        status: ShopCommandStatus.PENDING,
        processingStartedAt: null,
        processingOwner: null,
        lastError: 'Processing timeout expired; command requeued',
      },
    });

    return ok({
      requeuedCount: result.count,
      cutoff,
      timeoutMinutes,
    });
  } catch (error) {
    console.error('POST /api/internal/shop/requeue-stuck-commands error:', error);
    return fail('Internal server error', 500);
  }
}