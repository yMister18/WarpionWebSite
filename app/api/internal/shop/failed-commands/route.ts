import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { getPrismaClient } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-response';
import { validateInternalKey } from '@/lib/internal-auth';

export const dynamic = 'force-dynamic';

const ALLOWED_SORT_FIELDS = [
  'updatedAt',
  'createdAt',
  'publishedAt',
  'deliveredAt',
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

    const rawSortBy = searchParams.get('sortBy') ?? 'updatedAt';
    const sortBy: SortField = ALLOWED_SORT_FIELDS.includes(rawSortBy as SortField)
      ? (rawSortBy as SortField)
      : 'updatedAt';

    const rawSortDirection = searchParams.get('sortDirection') ?? 'desc';
    const sortDirection: Prisma.SortOrder =
      rawSortDirection === 'asc' ? 'asc' : 'desc';

    const where: Prisma.ShopCommandWhereInput = {
      status: 'FAILED',
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: 'insensitive' } },
              { command: { contains: q, mode: 'insensitive' } },
              { lastError: { contains: q, mode: 'insensitive' } },
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
      count: commands.length,
      totalCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      commands,
    });
  } catch (error) {
    console.error('GET /api/internal/shop/failed-commands error:', error);
    return fail('Internal server error', 500);
  }
}