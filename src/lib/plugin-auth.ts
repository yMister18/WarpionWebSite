import { NextRequest } from 'next/server';
import { fail } from './api-response';

export function validatePluginKey(request: NextRequest) {
  const pluginKey = request.headers.get('x-warpion-key');
  const expectedKey = process.env.WARPION_PLUGIN_KEY;

  if (!expectedKey) {
    return fail('Server misconfiguration: missing WARPION_PLUGIN_KEY', 500);
  }

  if (!pluginKey || pluginKey !== expectedKey) {
    return fail('Unauthorized', 401);
  }

  return null;
}