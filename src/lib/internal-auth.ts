import { NextRequest } from 'next/server';

export function validateInternalKey(request: NextRequest): boolean {
  const provided = request.headers.get('x-internal-key');
  const expected = process.env.INTERNAL_API_KEY;

  return Boolean(expected && provided && provided === expected);
}