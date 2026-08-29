import type { Store } from './store';
import type { CalendarEvent, CalendarStoreData, Horizon, ReviewLogEntry, ReviewRun } from './types';
import { applyClashNotes, applyCommentaryResults, type CommentaryResultItem } from './commentary';

const CATEGORY_VALUES = ['road', 'mtb', 'gravel', 'cx', 'indoor', 'show', 'moment'];
const AUDIENCE_VALUES = ['watch', 'ride', 'visit'];
const DATE_CONFIDENCE_VALUES = ['confirmed', 'unverified', 'tbc'];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface VerificationResultItem {
  id: string;
  outcome: 'confirmed' | 'changed' | 'inconclusive';
  changes?: { field: string; to: string; source: string }[];
  cancelled?: boolean;
  note?: string;
}

export interface DiscoveredEvent {
  name: string;
  category: string;
  audience: string[];
  start: string;
  end: string;
  dateConfidence: string;
  country: string;
  place: string;
  officialUrl: string | null;
  sourceUrls: string[];
  note?: string;
}

/**
 * Applies one already-researched verification result to an event, enforcing
 * the rules that matter regardless of who did the research (a scheduled
 * cloud agent, in the current design):
 *   - no source URL on a proposed change -> it's dropped, not applied
 *   - a manually pinned field is never overwritten -> logged as a conflict
 *   - cancelled events are marked, never deleted
 */
function applyVerificationResult(
  event: CalendarEvent,
  result: VerificationResultItem,
  runId: string,
  horizon: Horizon
): { changed: boolean; inconclusive: boolean } {
  const pinned = new Set(event.pinnedFields || []);
  const appliedChanges: ReviewLogEntry['changes'] = [];
  const notes: string[] = [];

  for (const change of result.changes || []) {
    if (!change.source) { notes.push(`Skipped ${change.field} change — no source given.`); continue; }
    if (pinned.has(change.field)) { notes.push(`Skipped ${change.field} change — manually pinned.`); continue; }
    const from = (event as unknown as Record<string, unknown>)[change.field];
    if (change.field === 'start' || change.field === 'end' || change.field === 'officialUrl' || change.field === 'place') {
      (event as unknown as Record<string, unknown>)[change.field] = change.to;
      appliedChanges.push({ field: change.field, from: String(from ?? ''), to: change.to, source: change.source });
      if (!event.sourceUrls.includes(change.source)) event.sourceUrls.push(change.source);
    }
  }

  if (result.cancelled && event.status !== 'cancelled' && !pinned.has('status')) {
    appliedChanges.push({ field: 'status', from: event.status || 'active', to: 'cancelled', source: result.changes?.[0]?.source || '' });
    event.status = 'cancelled';
  }

  const dateFieldsChanged = appliedChanges.some((c) => c.field === 'start' || c.field === 'end');
  if (result.outcome === 'confirmed' && event.dateConfidence !== 'confirmed' && !pinned.has('dateConfidence')) {
    event.dateConfidence = 'confirmed';
  } else if (dateFieldsChanged) {
    event.dateConfidence = 'confirmed';
  }

  const outcome = appliedChanges.length > 0 ? 'changed' : result.outcome === 'inconclusive' ? 'inconclusive' : 'confirmed';
  event.reviewLog.push({
    runId,
    checkedAt: new Date().toISOString().slice(0, 10),
    horizon,
    outcome,
    changes: appliedChanges,
    note: [result.note, ...notes].filter(Boolean).join(' ') || (outcome === 'confirmed' ? 'Confirmed, no changes.' : ''),
  });
  event.lastVerifiedAt = new Date().toISOString().slice(0, 10);
  event.verifiedBy = horizon === '6m' ? 'review-6m' : 'review-2m';

  return { changed: outcome === 'changed', inconclusive: outcome === 'inconclusive' };
}

function applyVerificationBatch(
  data: CalendarStoreData,
  results: VerificationResultItem[],
  horizon: Horizon,
  runId: string
): { eventsChecked: number; changesFound: number; errors: number; changedIds: string[] } {
  let changesFound = 0;
  let errors = 0;
  let eventsChecked = 0;
  const changedIds: string[] = [];

  for (const result of results) {
    const event = data.events.find((e) => e.id === result.id);
    if (!event) { errors++; continue; }
    eventsChecked++;
    const { changed } = applyVerificationResult(event, result, runId, horizon);
    if (changed) { changesFound++; changedIds.push(event.id); }
  }

  return { eventsChecked, changesFound, errors, changedIds };
}

function insertDiscovered(data: CalendarStoreData, found: DiscoveredEvent, runId: string): string | null {
  if (!found.name || !found.start || !found.sourceUrls?.length) return null;
  if (!CATEGORY_VALUES.includes(found.category)) return null;
  const audience = (found.audience || []).filter((a) => AUDIENCE_VALUES.includes(a));
  if (!audience.length) return null;
  const dateConfidence = DATE_CONFIDENCE_VALUES.includes(found.dateConfidence) ? found.dateConfidence : 'tbc';

  let id = slugify(found.name);
  if (data.events.some((e) => e.id === id)) id = `${id}-${found.start.slice(0, 4)}`;
  if (data.events.some((e) => e.id === id)) return null;

  data.events.push({
    id,
    name: found.name,
    category: found.category as CalendarEvent['category'],
    audience: audience as CalendarEvent['audience'],
    priority: 3,
    start: found.start,
    end: found.end || found.start,
    dateConfidence: dateConfidence as CalendarEvent['dateConfidence'],
    country: found.country || 'XX',
    place: found.place || '',
    officialUrl: found.officialUrl || null,
    sourceUrls: found.sourceUrls,
    handles: { instagram: null, x: null },
    handleConfidence: 'none',
    hashtags: [],
    angle: '',
    postWindow: '',
    lastVerifiedAt: new Date().toISOString().slice(0, 10),
    verifiedBy: 'review-6m',
    reviewLog: [{
      runId, checkedAt: new Date().toISOString().slice(0, 10), horizon: '6m',
      outcome: 'new', changes: [], note: found.note || 'Discovered by the scheduled review.',
    }],
  });
  return id;
}

export interface ApplyReviewInput {
  runId6m: string;
  runId2m: string;
  pass6m: { verification: VerificationResultItem[]; discovered: DiscoveredEvent[] };
  pass2m: { verification: VerificationResultItem[] };
  commentary: CommentaryResultItem[];
}

export interface ApplyReviewSummary {
  runs: ReviewRun[];
}

/**
 * Applies an already-researched review (produced by the monthly cloud
 * routine's own web search) to the store: verification rules, new-event
 * insertion, commentary regeneration for changed/new events only, and
 * clash notes. No network calls of its own — pure data transformation, so
 * it's fully testable without touching a live API.
 */
export async function applyReview(store: Store, input: ApplyReviewInput, ranAt: string): Promise<ApplyReviewSummary> {
  const data = await store.read();
  const touchedIds = new Set<string>();

  const verify6m = applyVerificationBatch(data, input.pass6m.verification, '6m', input.runId6m);
  verify6m.changedIds.forEach((id) => touchedIds.add(id));

  let discoveredCount = 0;
  for (const found of input.pass6m.discovered) {
    const id = insertDiscovered(data, found, input.runId6m);
    if (id) { discoveredCount++; touchedIds.add(id); }
  }

  const verify2m = applyVerificationBatch(data, input.pass2m.verification, '2m', input.runId2m);
  verify2m.changedIds.forEach((id) => touchedIds.add(id));

  applyCommentaryResults(data, input.commentary, touchedIds);
  applyClashNotes(data.events);

  const runs: ReviewRun[] = [
    {
      runId: input.runId6m, ranAt, horizon: '6m',
      eventsChecked: verify6m.eventsChecked + discoveredCount,
      changesFound: verify6m.changesFound + discoveredCount,
      errors: verify6m.errors,
    },
    {
      runId: input.runId2m, ranAt, horizon: '2m',
      eventsChecked: verify2m.eventsChecked, changesFound: verify2m.changesFound, errors: verify2m.errors,
    },
  ];

  data.reviewRuns.push(...runs);
  await store.write(data);
  return { runs };
}
