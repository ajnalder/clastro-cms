type ShimEnv = Partial<Cloudflare.Env> &
  Record<string, string | D1Database | R2Bucket | Fetcher | undefined>;

export const env = (globalThis.process?.env ?? {}) as ShimEnv;
