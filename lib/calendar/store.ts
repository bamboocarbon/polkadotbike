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

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/**
 * Production. `data/events.json` in the repo IS the store — not a seed —
 * kept current by a monthly cloud routine that researches changes with its
 * own web search, then commits and pushes directly (same pattern as the
 * digital-credit-yield site's daily scan). Vercel's filesystem is read-only
 * at runtime, so writes go through the GitHub Contents API, which triggers
 * a new Vercel deploy.
 *
 * read() ALSO goes through the GitHub API rather than trusting the file
 * bundled into the current deployment — the routine commits independently
 * of any given deployment's build, so reading the bundle risks a race: an
 * admin edit landing while a routine's push is still redeploying would read
 * stale data and, on write, clobber the routine's newer commit. Fetching
 * live avoids that at the cost of one extra request per admin-page load,
 * which is fine — this is a low-traffic admin path, not the public site.
 */
export class GitHubStore implements Store {
  private async currentFile(headers: Record<string, string>): Promise<{ sha: string; data: CalendarStoreData }> {
    const api = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    const res = await fetch(`${api}?ref=${GITHUB_BRANCH}`, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { sha: string; content: string };
    const raw = Buffer.from(json.content, 'base64').toString('utf-8');
    return { sha: json.sha, data: withReviewRuns(JSON.parse(raw) as CalendarStoreData) };
  }

  async read(): Promise<CalendarStoreData> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      // No token configured yet — fall back to the bundled file so the
      // calendar still renders read-only until GITHUB_TOKEN is set up.
      const seed = (await import('@/data/events.json')).default as unknown as CalendarStoreData;
      return withReviewRuns(seed);
    }
    const { data } = await this.currentFile(githubHeaders(token));
    return data;
  }

  async write(data: CalendarStoreData): Promise<void> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN is not set — cannot commit calendar changes.');
    const headers = githubHeaders(token);

    const { sha } = await this.currentFile(headers);
    const content = Buffer.from(JSON.stringify(data, null, 2) + '\n', 'utf-8').toString('base64');
    const api = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    const putRes = await fetch(api, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'calendar: admin edit',
        content,
        sha,
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
