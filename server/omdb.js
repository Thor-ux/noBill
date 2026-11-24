import { ApiError } from "./http.js";
import { memoize, DAY, HOUR } from "./memo.js";
import { diskRead, diskWrite } from "./diskcache.js";

const BASE_URL = "https://www.omdbapi.com/";
export const LIMIT_MESSAGE =
  "Movie data is temporarily unavailable (daily limit reached). It will load again within 24 hours.";
const BUSY_MESSAGE = "The site is very busy right now. Please try again in a minute.";

const DAILY_BUDGET = Number(process.env.OMDB_DAILY_BUDGET) || 90_000;
const SEARCH_SHARE = 0.6;
const PER_MINUTE = Number(process.env.OMDB_MAX_PER_MINUTE) || 300;
const SEARCH_PER_MINUTE = Math.floor(PER_MINUTE * SEARCH_SHARE);
const MAX_CONCURRENT = 16;
const MAX_QUEUE = 300;
const TIMEOUT_MS = 10_000;

const today = () => new Date().toISOString().slice(0, 10);
let usage = { day: today(), total: 0, search: 0 };
let minute = { at: 0, total: 0, search: 0 };
let dirty = false;

diskRead("omdb:usage").then((saved) => {
  if (saved?.value?.day === usage.day) {
    usage.total += saved.value.total;
    usage.search += saved.value.search;
  }
});
setInterval(() => {
  if (dirty) diskWrite("omdb:usage", usage, 2 * DAY).catch(() => {});
  dirty = false;
}, 15_000).unref();

function spend(kind) {
  const now = Date.now();
  if (usage.day !== today()) usage = { day: today(), total: 0, search: 0 };
  if (now - minute.at >= 60_000) minute = { at: now, total: 0, search: 0 };

  const isSearch = kind === "search";
  if (usage.total >= DAILY_BUDGET || (isSearch && usage.search >= DAILY_BUDGET * SEARCH_SHARE)) {
    throw new ApiError(LIMIT_MESSAGE, 429, "limit");
  }
  if (minute.total >= PER_MINUTE || (isSearch && minute.search >= SEARCH_PER_MINUTE)) {
    throw new ApiError(BUSY_MESSAGE, 503, "busy");
  }
  usage.total++;
  minute.total++;
  if (isSearch) {
    usage.search++;
    minute.search++;
  }
  dirty = true;
}

let active = 0;
const queue = [];
async function withSlot(fn) {
  if (active >= MAX_CONCURRENT) {
    if (queue.length >= MAX_QUEUE) throw new ApiError(BUSY_MESSAGE, 503, "busy");
    await new Promise((resolve) => queue.push(resolve));
  }
  active++;
  try {
    return await fn();
  } finally {
    active--;
    queue.shift()?.();
  }
}

let limitHitAt = 0;

export function omdbStatus() {
  return {
    keyConfigured: Boolean(process.env.OMDB_API_KEY),
    limitReached: Date.now() - limitHitAt < HOUR || usage.total >= DAILY_BUDGET,
    usedToday: usage.total,
    dailyBudget: DAILY_BUDGET,
  };
}

async function request(params, kind = "movie") {
  const key = process.env.OMDB_API_KEY;
  if (!key) throw new ApiError("Server is missing OMDB_API_KEY.", 500, "config");
  if (Date.now() - limitHitAt < HOUR) throw new ApiError(LIMIT_MESSAGE, 429, "limit");
  spend(kind);

  const url = new URL(BASE_URL);
  url.search = new URLSearchParams({ apikey: key, ...params });
  const { res, data } = await withSlot(async () => {
    let res;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch {
      throw new ApiError("OMDb didn't respond in time.", 504, "upstream");
    }
    return { res, data: await res.json().catch(() => null) };
  });

  if (data?.Error?.includes("limit")) {
    limitHitAt = Date.now();
    throw new ApiError(LIMIT_MESSAGE, 429, "limit");
  }
  if (data?.Error?.includes("Invalid API key")) {
    throw new ApiError("The server's OMDb API key is invalid.", 500, "config");
  }
  if (!res.ok || !data) throw new ApiError(`OMDb request failed (${res.status})`, 502, "upstream");
  return data;
}

export function getMovie(imdbID) {
  return memoize(`m:${imdbID}`, DAY, async () => {
    const data = await request({ i: imdbID, plot: "full" });
    return data.Response === "False" ? null : data;
  });
}

function rawSearch(term, page) {
  return memoize(`s:${term.toLowerCase()}|${page}`, DAY, async () => {
    const data = await request({ s: term, type: "movie", page }, "search");
    if (data.Response !== "False") return data.Search;
    if (data.Error?.includes("not found")) return [];
    if (data.Error?.includes("Too many")) return null;
    throw new ApiError(data.Error || "OMDb error", 502, "upstream");
  });
}

export async function searchMovies(query, page = 1) {
  const term = query.trim().replace(/\*+$/, "");
  if (!term) return { results: [], tooMany: false };

  let results = await rawSearch(`${term}*`, page);
  if (!results || results.length === 0) {
    const exact = await rawSearch(term, page);
    if (exact?.length) results = exact;
  }
  return { results: results ?? [], tooMany: results === null };
}
