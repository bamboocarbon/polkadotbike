import { redis } from './redisClient';

// Namespaced because this Redis instance is shared with digital-credit-yield
// (single free-tier Upstash database — Marketplace only grants one free DB
// per account, see project_pageview_counter_pattern memory 2026-09-02).
const NS = 'pdb:pv';

export interface DayCount { date: string; count: number }
export interface WeekCount { label: string; count: number }
export interface MonthCount { month: string; count: number }
export interface PageCount { path: string; count: number }

export interface PageviewStats {
  daily: DayCount[];
  weekly: WeekCount[];
  monthly: MonthCount[];
  topPages: PageCount[];
  totalRecorded: number;
}

function decodePath(encoded: string): string {
  if (encoded === '_home') return '/';
  return '/' + encoded.replace(/--/g, '/');
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Reads the day/month/path/total counters middleware.ts increments on every
 * real pageview. Replaces the original list()-over-full-history design (one
 * Blob "Advanced Operation" per write AND per read) — that put both sites
 * over Vercel Blob's 2,000/month Hobby cap within ~3 days at normal traffic
 * (~400 combined real pageviews/day). Counters cost a handful of Redis
 * commands per event, comfortably inside Upstash's 500K/month free tier.
 */
export async function getPageviewStats(): Promise<PageviewStats> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // 28 days covers both the 7-day "daily" view and the 4-week "weekly"
  // view — fetch them all in one round trip and derive both from it.
  const dayDates: Date[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    dayDates.push(d);
  }
  const dayKeys = dayDates.map((d) => `${NS}:day:${ymd(d)}`);
  const dayCountsRaw = await redis.mget<(number | null)[]>(...dayKeys);
  const dayCounts = new Map(dayDates.map((d, i) => [ymd(d), Number(dayCountsRaw[i]) || 0]));

  const daily: DayCount[] = dayDates.slice(-7).map((d) => ({ date: ymd(d), count: dayCounts.get(ymd(d)) || 0 }));

  const weekly: WeekCount[] = [];
  for (let i = 3; i >= 0; i--) {
    const end = new Date(today);
    end.setUTCDate(end.getUTCDate() - i * 7 + 1);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 7);
    let count = 0;
    for (const d of dayDates) {
      if (d >= start && d < end) count += dayCounts.get(ymd(d)) || 0;
    }
    const label = `${start.toISOString().slice(5, 10)}–${new Date(end.getTime() - 86400000).toISOString().slice(5, 10)}`;
    weekly.push({ label, count });
  }

  const months = await redis.smembers(`${NS}:months`);
  let monthly: MonthCount[] = [];
  if (months.length) {
    const monthKeys = months.map((m) => `${NS}:month:${m}`);
    const monthCountsRaw = await redis.mget<(number | null)[]>(...monthKeys);
    monthly = months
      .map((month, i) => ({ month, count: Number(monthCountsRaw[i]) || 0 }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  const pathCounts = (await redis.hgetall<Record<string, number>>(`${NS}:paths`)) || {};
  const topPages: PageCount[] = Object.entries(pathCounts)
    .map(([path, count]) => ({ path: decodePath(path), count: Number(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalRecorded = Number(await redis.get<number>(`${NS}:total`)) || 0;

  return { daily, weekly, monthly, topPages, totalRecorded };
}
