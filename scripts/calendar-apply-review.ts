import path from 'path';
import { promises as fs } from 'fs';
import { FsStore } from '../lib/calendar/store';
import { applyReview, type ApplyReviewInput } from '../lib/calendar/review';

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: npm run calendar:apply-review -- <path-to-results.json>');
    process.exit(1);
  }

  const raw = await fs.readFile(inputPath, 'utf-8');
  const input = JSON.parse(raw) as ApplyReviewInput;

  const filePath = process.env.CALENDAR_FS_PATH || path.join(__dirname, '../data/events.json');
  const store = new FsStore(filePath);
  const ranAt = new Date().toISOString().slice(0, 10);

  const summary = await applyReview(store, input, ranAt);
  for (const run of summary.runs) {
    console.log(`[${run.horizon}] ${run.runId} — checked ${run.eventsChecked}, changed ${run.changesFound}, errors ${run.errors}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
