import { handler, json, ApiError } from "../server/http.js";
import { searchMovies } from "../server/omdb.js";
import { getAvailableSet } from "../server/catalog.js";

function normalise(raw) {
  return (raw || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s'&:.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const GET = handler(
  async (_req, params) => {
    const q = normalise(params.get("q"));
    const page = parseInt(params.get("page"), 10) || 1;
    if (q.length < 2 || q.length > 60) throw new ApiError("Query must be 2–60 characters.", 400, "bad_request");
    if (page < 1 || page > 5) throw new ApiError("Page must be 1–5.", 400, "bad_request");

    const [{ results, tooMany }, available] = await Promise.all([
      searchMovies(q, page),
      getAvailableSet("movie"),
    ]);
    if (!available) {
      return json({ results, tooMany, filtered: false }, { cacheSeconds: 120 });
    }
    return json(
      { results: results.filter((m) => available.has(m.imdbID)), tooMany, filtered: true },
      { cacheSeconds: 86400 }
    );
  },
  { rateLimit: { bucket: "search", max: 40 } }
);
