import type { CalendarStoreData } from './types';

export interface Store {
  read(): Promise<CalendarStoreData>;
  write(data: CalendarStoreData): Promise<void>;
}

function withReviewRuns(data: CalendarStoreData): CalendarStoreData {
  return data.reviewRuns ? data : { ...data, reviewRuns: [] };
}

/** Local dev / `npm run calendar:*` — reads and writes a JSON file on disk. */
export class FsStore implements Store {
  constructor(private filePath: string) {}

  async read(): Promise<CalendarStoreData> {
    const { promises: fs } = await import('fs');
    const raw = await fs.readFile(this.filePath, 'utf-8');
    return withReviewRuns(JSON.parse(raw) as CalendarStoreData);
  }

  async write(data: CalendarStoreData): Promise<void> {
    const { promises: fs } = await import('fs');
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2) + '\n');
  }
}

const GITHUB_REPO = 'bamboocarbon/polkadotbike';
const GITHUB_FILE_PATH = 'data/events.json';
const GITHUB_BRANCH = 'main';

/**
 * Production. `data/events.json` in the repo IS the store — not a seed —
 * kept current by a monthly cloud routine that researches changes with its
 * own web search, then commits and pushes directly (same pattern as the
 * digital-credit-yield site's daily scan). Vercel's filesystem is read-only
 * at runtime, so:
 *   - read() returns the file bundled into the current deployment — always
 *     up to date as of the last push, no propagation lag to worry about.
 *   - write() (used only by the admin manual-edit endpoint) commits the
 *     change straight to GitHub via the Contents API, which triggers a new
 *     Vercel deploy. A manual edit therefore takes effect after a short
 *     redeploy, not instantly.
 */
export class GitHubStore implements Store {
  async read(): Promise<CalendarStoreData> {
    const seed = (await import('@/data/events.json')).default as unknown as CalendarStoreData;
    return withReviewRuns(seed);
  }

  async write(data: CalendarStoreData): Promise<void> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN is not set — cannot commit calendar changes.');

    const api = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    const getRes = await fetch(`${api}?ref=${GITHUB_BRANCH}`, { headers });
    if (!getRes.ok) throw new Error(`GitHub read failed: ${getRes.status} ${await getRes.text()}`);
    const current = (await getRes.json()) as { sha: string };

    const content = Buffer.from(JSON.stringify(data, null, 2) + '\n', 'utf-8').toString('base64');
    const putRes = await fetch(api, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'calendar: admin edit',
        content,
        sha: current.sha,
        branch: GITHUB_BRANCH,
      }),
    });
    if (!putRes.ok) throw new Error(`GitHub write failed: ${putRes.status} ${await putRes.text()}`);
  }
}

let cached: Store | null = null;

/** Selected by `CALENDAR_STORE` (`github` in production, `fs` for local runs). */
export function getStore(): Store {
  if (cached) return cached;
  const mode = process.env.CALENDAR_STORE || (process.env.VERCEL ? 'github' : 'fs');
  if (mode === 'github') {
    cached = new GitHubStore();
  } else {
    const filePath = process.env.CALENDAR_FS_PATH || './data/events.json';
    cached = new FsStore(filePath);
  }
  return cached;
}
