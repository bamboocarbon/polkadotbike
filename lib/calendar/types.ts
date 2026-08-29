export type Category = 'road' | 'mtb' | 'gravel' | 'cx' | 'indoor' | 'show' | 'moment';
export type Audience = 'watch' | 'ride' | 'visit';
export type DateConfidence = 'confirmed' | 'unverified' | 'tbc';
export type HandleConfidence = 'verified' | 'unverified' | 'none';
export type VerifiedBy = 'seed' | 'review-6m' | 'review-2m' | 'manual';
export type ReviewOutcome = 'changed' | 'confirmed' | 'inconclusive' | 'new';
export type Horizon = '6m' | '2m';

export interface ReviewLogChange {
  field: string;
  from: string;
  to: string;
  source: string;
}

export interface ReviewLogEntry {
  runId: string;
  checkedAt: string;
  horizon: Horizon;
  outcome: ReviewOutcome;
  changes: ReviewLogChange[];
  note: string;
}

export interface CalendarEvent {
  id: string;
  name: string;
  category: Category;
  audience: Audience[];
  priority: 1 | 2 | 3;
  start: string;
  end: string;
  dateConfidence: DateConfidence;
  country: string;
  place: string;
  officialUrl: string | null;
  sourceUrls: string[];
  handles: { instagram: string | null; x: string | null };
  handleConfidence: HandleConfidence;
  hashtags: string[];
  angle: string;
  postWindow: string;
  /** One line the admin page shows on hover, explaining the priority. */
  priorityRationale?: string;
  lastVerifiedAt: string;
  verifiedBy: VerifiedBy;
  reviewLog: ReviewLogEntry[];
  /** Present once an organiser confirms an event is off. Never delete an event instead. */
  status?: 'cancelled';
  /** Fields a manual edit has pinned — a review logs a conflict on these instead of overwriting. */
  pinnedFields?: string[];
}

export interface ReviewRun {
  runId: string;
  ranAt: string;
  horizon: string;
  eventsChecked: number;
  changesFound: number;
  errors: number;
}

export interface CalendarStoreData {
  schemaVersion: number;
  generatedAt: string;
  seedNote?: string;
  categories: Record<Category, string>;
  audiences: Record<Audience, string>;
  events: CalendarEvent[];
  reviewRuns: ReviewRun[];
}
