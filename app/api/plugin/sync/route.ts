import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { getPrismaClient } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-response';
import { validatePluginKey } from '@/lib/plugin-auth';
import { isJsonValue, isObject, isString, isValidUuid } from '@/lib/validation';

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

    const { uuid, username, stats } = body;

    if (!isValidUuid(uuid)) {
      return fail('Invalid or missing uuid', 400);
    }

    if (!isString(username)) {
      return fail('Invalid or missing username', 400);
    }

    if (!isJsonValue(stats)) {
      return fail('Invalid or missing stats', 400);
    }

    const validatedStats = stats as Prisma.InputJsonValue;

    const player = await prisma.player.upsert({
      where: { uuid },
      update: {
        username,
        stats: validatedStats,
        lastSeenAt: new Date(),
      },
      create: {
        uuid,
        username,
        stats: validatedStats,
        lastSeenAt: new Date(),
      },
    });

    return ok({
      player,
    });
  } catch (error) {
    console.error('POST /api/plugin/sync error:', error);
    return fail('Internal server error', 500);
  }
}