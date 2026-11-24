import { apiGet } from "./server.js";

const BASE = (import.meta.env.VITE_VIDSRC_BASE || "https://vidsrc.sh").replace(/\/$/, "");

export function movieEmbedUrl(imdbID) {
  return `${BASE}/embed/movie/${imdbID}`;
}

export function episodeEmbedUrl(imdbID, season, episode) {
  return `${BASE}/embed/tv/${imdbID}/${season}/${episode}`;
}

const known = { movie: new Map(), tv: new Map() };
const CHUNK = 100;

async function check(type, ids) {
  const cache = known[type];
  const missing = [...new Set(ids)].filter((id) => /^tt\d+$/.test(id) && !cache.has(id)).sort();

  for (let i = 0; i < missing.length; i += CHUNK) {
    const chunk = missing.slice(i, i + CHUNK);
    try {
      const { available } = await apiGet(`/api/available?type=${type}&ids=${chunk.join(",")}`);
      if (available === null) continue;
      const yes = new Set(available);
      chunk.forEach((id) => cache.set(id, yes.has(id)));
    } catch {
    }
  }
  return new Map(ids.map((id) => [id, cache.has(id) ? cache.get(id) : null]));
}

export async function isMovieAvailable(imdbID) {
  return (await check("movie", [imdbID])).get(imdbID) !== false;
}

export async function isShowAvailable(imdbID) {
  if (!imdbID) return false;
  return (await check("tv", [imdbID])).get(imdbID) !== false;
}

export async function filterStreamableShows(shows) {
  const withImdb = shows.filter((s) => s.externals?.imdb);
  const result = await check("tv", withImdb.map((s) => s.externals.imdb));
  return withImdb.filter((s) => result.get(s.externals.imdb) !== false);
}
