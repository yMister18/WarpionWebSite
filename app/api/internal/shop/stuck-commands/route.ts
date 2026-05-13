import { NextRequest } from 'next/server';
import { Prisma, ShopCommandStatus } from '@prisma/client';
import { getPrismaClient } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-response';
import { validateInternalKey } from '@/lib/internal-auth';

export const dynamic = 'force-dynamic';

const PROCESSING_TIMEOUT_MINUTES = Number(
  process.env.SHOP_COMMAND_PROCESSING_TIMEOUT_MINUTES ?? '15'
);

const ALLOWED_SORT_FIELDS = [
  'processingStartedAt',
  'updatedAt',
  'createdAt',
  'attempts',
] as const;

type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

export async function GET(request: NextRequest) {
  try {
    if (!validateInternalKey(request)) {
      return fail('Unauthorized', 401);
    }

    const prisma = getPrismaClient();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q')?.trim() ?? '';
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get('pageSize') ?? '25'))
    );

    const rawSortBy = searchParams.get('sortBy') ?? 'processingStartedAt';
    const sortBy: SortField = ALLOWED_SORT_FIELDS.includes(rawSortBy as SortField)
      ? (rawSortBy as SortField)
      : 'processingStartedAt';

    const rawSortDirection = searchParams.get('sortDirection') ?? 'asc';
    const sortDirection: Prisma.SortOrder =
      rawSortDirection === 'desc' ? 'desc' : 'asc';

    const cutoff = new Date(Date.now() - PROCESSING_TIMEOUT_MINUTES * 60 * 1000);

    const where: Prisma.ShopCommandWhereInput = {
      status: ShopCommandStatus.PROCESSING,
      processingStartedAt: {
        lt: cutoff,
      },
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: 'insensitive' } },
              { command: { contains: q, mode: 'insensitive' } },
              { processingOwner: { contains: q, mode: 'insensitive' } },
              { orderId: { contains: q, mode: 'insensitive' } },
              {
                player: {
                  is: {
                    username: { contains: q, mode: 'insensitive' },
                  },
                },
              },
              {
                player: {
                  is: {
                    uuid: { contains: q, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [commands, totalCount] = await Promise.all([
      prisma.shopCommand.findMany({
        where,
        orderBy: {
          [sortBy]: sortDirection,
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
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.shopCommand.count({ where }),
    ]);

    return ok({
      cutoff: cutoff.toISOString(),
      count: commands.length,
      totalCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      commands,
    });
  } catch (error) {
    console.error('GET /api/internal/shop/stuck-commands error:', error);
    return fail('Internal server error', 500);
  }
}