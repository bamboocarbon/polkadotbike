import { NextResponse } from 'next/server';
import { getPageviewStats } from '@/lib/pageviewLog';

export const runtime = 'nodejs';

function isAuthorised(request: Request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  return !!process.env.ADMIN_PASSWORD && token === process.env.ADMIN_PASSWORD;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const stats = await getPageviewStats();
  return NextResponse.json(stats);
}
