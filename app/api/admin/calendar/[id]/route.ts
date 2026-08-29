import { NextResponse } from 'next/server';
import { getStore } from '@/lib/calendar/store';
import type { DateConfidence } from '@/lib/calendar/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorised(request: Request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  return !!process.env.ADMIN_PASSWORD && token === process.env.ADMIN_PASSWORD;
}

const EDITABLE_FIELDS = ['start', 'end', 'dateConfidence', 'priority', 'officialUrl', 'angle', 'postWindow'] as const;
const DATE_CONFIDENCE_VALUES: DateConfidence[] = ['confirmed', 'unverified', 'tbc'];

/**
 * Manual override for a single event. A field changed here is added to
 * `pinnedFields` so the next scheduled review logs a conflict instead of
 * silently overwriting good manual research (tasksheet §5).
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAuthorised(request)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  if (body.dateConfidence !== undefined && !DATE_CONFIDENCE_VALUES.includes(body.dateConfidence as DateConfidence)) {
    return NextResponse.json({ error: 'Invalid dateConfidence' }, { status: 400 });
  }
  if (body.priority !== undefined && ![1, 2, 3].includes(body.priority as number)) {
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
  }

  const store = getStore();
  const data = await store.read();
  const event = data.events.find((e) => e.id === params.id);
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const changedFields = new Set(event.pinnedFields || []);
  for (const field of EDITABLE_FIELDS) {
    if (body[field] === undefined) continue;
    const next = body[field];
    const current = (event as unknown as Record<string, unknown>)[field];
    if (JSON.stringify(next) !== JSON.stringify(current)) {
      (event as unknown as Record<string, unknown>)[field] = next;
      changedFields.add(field);
    }
  }

  event.pinnedFields = Array.from(changedFields);
  event.verifiedBy = 'manual';
  event.lastVerifiedAt = new Date().toISOString().slice(0, 10);

  await store.write(data);
  return NextResponse.json(event);
}
