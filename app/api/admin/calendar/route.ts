import { NextResponse } from 'next/server';
import { getStore } from '@/lib/calendar/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorised(request: Request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  return !!process.env.ADMIN_PASSWORD && token === process.env.ADMIN_PASSWORD;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const data = await getStore().read();
  return NextResponse.json(data);
}
