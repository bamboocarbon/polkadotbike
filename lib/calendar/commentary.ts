import type { CalendarEvent, CalendarStoreData } from './types';

export interface CommentaryResultItem {
  id: string;
  angle: string;
  postWindow: string;
  priority: 1 | 2 | 3;
  rationale: string;
}

/**
 * Applies already-written commentary (produced by the monthly cloud
 * routine) to events — but only for ids in `touchedIds` (events actually
 * changed or newly discovered this run), regardless of what the input
 * contains. Commentary for unchanged events is left alone, both so manual
 * edits survive and so an over-eager routine can't silently rewrite
 * everything every month.
 */
export function applyCommentaryResults(
  data: CalendarStoreData,
  results: CommentaryResultItem[],
  touchedIds: Set<string>
): { applied: number } {
  let applied = 0;
  for (const result of results) {
    if (!touchedIds.has(result.id)) continue;
    const event = data.events.find((e) => e.id === result.id);
    if (!event) continue;
    const pinned = new Set(event.pinnedFields || []);
    if (!pinned.has('angle') && result.angle) event.angle = result.angle;
    if (!pinned.has('postWindow') && result.postWindow) event.postWindow = result.postWindow;
    if (!pinned.has('priority') && [1, 2, 3].includes(result.priority)) event.priority = result.priority;
    if (result.rationale) event.priorityRationale = result.rationale;
    applied++;
  }
  return { applied };
}

/**
 * Deterministic, no AI: any date with two or more non-cancelled
 * priority-1/2 events gets a clash sentence appended to each one's angle,
 * unless the angle already names the other event.
 */
export function applyClashNotes(events: CalendarEvent[]) {
  const byDate = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    if (e.status === 'cancelled' || e.priority > 2) continue;
    if (!byDate.has(e.start)) byDate.set(e.start, []);
    byDate.get(e.start)!.push(e);
  }
  for (const group of byDate.values()) {
    if (group.length < 2) continue;
    for (const event of group) {
      const others = group.filter((o) => o.id !== event.id);
      const alreadyMentioned = others.some((o) => event.angle.toLowerCase().includes(o.name.toLowerCase()));
      if (alreadyMentioned || event.angle.includes('Clash on')) continue;
      const names = others.map((o) => o.name).join(' and ');
      event.angle = `${event.angle || ''} Clash on ${event.start}: also competing for the feed post against ${names}.`.trim();
    }
  }
}
