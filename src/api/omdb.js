import { apiGet } from "./server.js";
import { cacheGet, cacheSet, DAY } from "./cache.js";

export function isFatalOmdbError(err) {
  return Boolean(err?.fatal);
}

export async function searchMovies(query, page = 1) {
  const term = query.trim().toLowerCase();
  if (term.length < 2) return [];

  const key = `search2:${term}|${page}`;
  let data = cacheGet(key);
  if (data === undefined) {
    data = await apiGet(`/api/search?q=${encodeURIComponent(term)}&page=${page}`);
    cacheSet(key, data, data.filtered ? DAY : 2 * 60 * 1000);
  }
  if (data.tooMany) {
    const err = new Error("Too many matches — keep typing.");
    err.tooShort = true;
    throw err;
  }

  return data.results;
}

export async function lookupMovie(id) {
  const key = `m:${id}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  const { movie } = await apiGet(`/api/movie?i=${encodeURIComponent(id)}`);
  cacheSet(key, movie, movie ? 7 * DAY : DAY);
  return movie;
}

export async function getMovie(imdbID) {
  const movie = await lookupMovie(imdbID);
  if (!movie) throw new Error("Movie not found.");
  return movie;
}

export async function getMoviesByIds(ids) {
  return (await Promise.all(ids.map(lookupMovie))).filter(Boolean);
}

export function posterOrFallback(poster) {
  return poster && poster !== "N/A" ? poster : "/no-poster.svg";
}
