import { Redis } from '@upstash/redis';

// Vercel's KV-branded Marketplace provisioning injects KV_REST_API_URL /
// KV_REST_API_TOKEN, not the UPSTASH_REDIS_REST_* names Redis.fromEnv()
// looks for by default — construct explicitly instead of relying on it.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
