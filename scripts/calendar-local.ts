// Runs the season calendar as a local, editable page in Safari — no website, no login, nothing deployed.
//
//   npm run calendar:local
//
// Serves the same editable calendar document the old /admin/calendar page used (lib/calendar/renderCalendarDocument)
// and the same edit endpoint (PATCH /api/admin/calendar/:id), reading and writing data/events.json on disk via
// FsStore. It listens on 127.0.0.1 only, so nothing outside this Mac can reach it and it needs no password.
//
// Edits land in data/events.json as normal file changes (pinned fields, verifiedBy "manual" — exactly as before).
// They are NOT committed or pushed automatically: commit data/events.json yourself (or ask Claude) when you're done.
// Env: CALENDAR_FS_PATH (events file), CALENDAR_PORT (default 4321), CALENDAR_NO_OPEN=1 (don't launch Safari).
import http from 'http';
import path from 'path';
import { spawn } from 'child_process';
import { FsStore } from '../lib/calendar/store';
import { renderCalendarDocument } from '../lib/calendar/renderCalendarDocument';
import type { DateConfidence } from '../lib/calendar/types';

const filePath = process.env.CALENDAR_FS_PATH || path.join(__dirname, '../data/events.json');
const port = Number(process.env.CALENDAR_PORT || 4321);
const store = new FsStore(filePath);

const EDITABLE_FIELDS = ['start', 'end', 'dateConfidence', 'priority', 'officialUrl', 'angle', 'postWindow'] as const;
const DATE_CONFIDENCE_VALUES: DateConfidence[] = ['confirmed', 'unverified', 'tbc'];

function send(res: http.ServerResponse, status: number, body: string, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store' });
  res.end(body);
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 1_000_000) throw new Error('Body too large');
    chunks.push(c as Buffer);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Same rules as the old API route: only whitelisted fields, and an edited field is pinned so the next scheduled review
// logs a conflict instead of silently overwriting manual research.
async function patchEvent(id: string, body: Record<string, unknown>) {
  if (body.dateConfidence !== undefined && !DATE_CONFIDENCE_VALUES.includes(body.dateConfidence as DateConfidence)) {
    return { status: 400, json: { error: 'Invalid dateConfidence' } };
  }
  if (body.priority !== undefined && ![1, 2, 3].includes(body.priority as number)) {
    return { status: 400, json: { error: 'Invalid priority' } };
  }
  const data = await store.read();
  const event = data.events.find((e) => e.id === id);
  if (!event) return { status: 404, json: { error: 'Not found' } };

  const changed = new Set(event.pinnedFields || []);
  for (const field of EDITABLE_FIELDS) {
    if (body[field] === undefined) continue;
    const next = body[field];
    const current = (event as unknown as Record<string, unknown>)[field];
    if (JSON.stringify(next) !== JSON.stringify(current)) {
      (event as unknown as Record<string, unknown>)[field] = next;
      changed.add(field);
    }
  }
  event.pinnedFields = Array.from(changed);
  event.verifiedBy = 'manual';
  event.lastVerifiedAt = new Date().toISOString().slice(0, 10);
  await store.write(data);
  return { status: 200, json: event };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/') {
      return send(res, 200, renderCalendarDocument(await store.read(), { editable: true }), 'text/html');
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/calendar') {
      return send(res, 200, JSON.stringify(await store.read()));
    }
    const m = url.pathname.match(/^\/api\/admin\/calendar\/([^/]+)$/);
    if (req.method === 'PATCH' && m) {
      const body = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
      const r = await patchEvent(decodeURIComponent(m[1]), body);
      return send(res, r.status, JSON.stringify(r.json));
    }
    send(res, 404, JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    console.error(err);
    send(res, 500, JSON.stringify({ error: 'Something went wrong' }));
  }
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use — the calendar may already be running. Open http://localhost:${port}/ in Safari, or set CALENDAR_PORT.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  const url = `http://localhost:${port}/`;
  console.log(`Season calendar running at ${url}  (events file: ${filePath})`);
  console.log('Press Ctrl+C to stop. Edits are saved to the events file as you make them; commit it when you are done.');
  if (!process.env.CALENDAR_NO_OPEN) spawn('open', ['-a', 'Safari', url], { stdio: 'ignore' }).unref();
});
