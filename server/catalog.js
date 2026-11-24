import { getMovie } from "./omdb.js";
import { memoize, HOUR } from "./memo.js";
import { isBlocked } from "./blocklist.js";

const VIDSRC = (process.env.VIDSRC_BASE || "https://vidsrc.sh").replace(/\/$/, "");

const sets = {};

function loadList(type) {
  return memoize(
    `vidsrc:${type}`,
    12 * HOUR,
    async () => {
      const res = await fetch(`${VIDSRC}/ids/${type}_imdb.txt`, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`vidsrc catalog request failed (${res.status})`);
      const text = await res.text();
      return text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith("tt"));
    },
    { stale: true }
  ).then((ids) => {
    if (sets[type]?.ids !== ids) sets[type] = { ids, set: new Set(ids) };
    return sets[type];
  });
}

export function catalogStatus() {
  return { movies: sets.movie?.ids.length ?? 0, tv: sets.tv?.ids.length ?? 0 };
}

export async function getMovieIds() {
  return (await loadList("movie")).ids;
}

export async function getAvailableSet(type, timeoutMs = 4000) {
  const load = loadList(type).then((l) => ({ has: (id) => l.set.has(id) && !isBlocked(id) }));
  load.catch(() => {});
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs));
  return Promise.race([load, timeout]).catch(() => null);
}

loadList("movie").catch(() => {});
loadList("tv").catch(() => {});

const known = async (id) => Boolean(await getMovie(id));
const hasPoster = (m) => m && m.Poster && m.Poster !== "N/A";

function findBoundary(ids) {
  return memoize(`boundary:${ids.length}`, 12 * HOUR, () => searchBoundary(ids));
}

async function searchBoundary(ids) {
  const last = ids.length - 1;
  const offsets = [0];
  for (let o = 1; o <= Math.min(4096, last); o *= 2) offsets.push(o);
  const flags = await Promise.all(offsets.map((o) => known(ids[last - o])));

  let index;
  const firstKnown = flags.indexOf(true);
  if (firstKnown === 0) index = last;
  else if (firstKnown === -1) index = Math.max(0, last - offsets.at(-1) - 1);
  else {
    let hi = last - offsets[firstKnown - 1];
    let lo = last - offsets[firstKnown];
    if (hi - lo <= 32) {
      const gap = ids.slice(lo + 1, hi);
      const gapFlags = await Promise.all(gap.map(known));
      const newest = gapFlags.lastIndexOf(true);
      index = newest === -1 ? lo : lo + 1 + newest;
    } else {
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        if (await known(ids[mid])) lo = mid;
        else hi = mid;
      }
      index = lo;
    }
  }
  return index;
}

const year = (m) => parseInt(m.Year, 10) || 0;
const rating = (m) => parseFloat(m.imdbRating) || 0;
const votes = (m) => parseInt(String(m.imdbVotes).replace(/,/g, ""), 10) || 0;

function byYearThenRating(a, b) {
  return year(b) - year(a) || rating(b) - rating(a) || votes(b) - votes(a);
}

export function getRecentlyAdded(pool = 36) {
  return memoize(`recent:${pool}`, 12 * HOUR, async () => {
    const ids = await getMovieIds();
    let cursor = await findBoundary(ids);
    const movies = [];
    const BATCH = 12;
    for (let b = 0; b < Math.ceil(pool / BATCH) + 3 && movies.length < pool && cursor >= 0; b++) {
      const batch = ids.slice(Math.max(0, cursor - BATCH + 1), cursor + 1).reverse();
      cursor -= BATCH;
      movies.push(...(await Promise.all(batch.map(getMovie))).filter(hasPoster));
    }
    return movies.slice(0, pool).sort(byYearThenRating);
  });
}

function seededRandom(seed) {
  let t = [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761), 1);
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDiscover(count = 12) {
  const day = new Date().toISOString().slice(0, 10);
  return memoize(`discover:${day}:${count}`, 12 * HOUR, async () => {
    const ids = await getMovieIds();
    const rand = seededRandom(day);
    const picks = new Set();
    while (picks.size < Math.min(count + 6, ids.length)) picks.add(ids[Math.floor(rand() * ids.length)]);
    const movies = (await Promise.all([...picks].map(getMovie))).filter(hasPoster);
    return movies.slice(0, count);
  });
}

export function warmUp() {
  setTimeout(() => {
    getRecentlyAdded(36).catch((err) => console.warn("warm-up recent:", err.message));
    getDiscover(12).catch((err) => console.warn("warm-up discover:", err.message));
  }, 2000);
}
