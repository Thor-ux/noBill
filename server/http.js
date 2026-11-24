import { checkRateLimit } from "./ratelimit.js";

const DAY_S = 24 * 60 * 60;

export function json(data, { status = 200, cacheSeconds = 0, headers: extra = {} } = {}) {
  const headers = { "Content-Type": "application/json; charset=utf-8", ...extra };
  headers["Cache-Control"] = cacheSeconds
    ? `public, max-age=${Math.min(cacheSeconds, 3600)}, s-maxage=${cacheSeconds}, stale-while-revalidate=${DAY_S}`
    : "no-store";
  return new Response(JSON.stringify(data), { status, headers });
}

export class ApiError extends Error {
  constructor(message, status = 500, code = "error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function handler(fn, { rateLimit } = {}) {
  return async (request) => {
    try {
      if (rateLimit) {
        const wait = await checkRateLimit(request, rateLimit);
        if (wait) {
          return json(
            { error: "Too many requests — please slow down and try again shortly.", code: "rate_limit" },
            { status: 429, headers: { "Retry-After": String(wait) } }
          );
        }
      }
      return await fn(request, new URL(request.url).searchParams);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 500;
      const code = err instanceof ApiError ? err.code : "error";
      if (status >= 500) console.error(err);
      return json({ error: err.message || "Server error", code }, { status });
    }
  };
}

export const isImdbId = (id) => typeof id === "string" && /^tt\d{5,10}$/.test(id);
