import { handler, json, ApiError, isImdbId } from "../server/http.js";
import { getMovie } from "../server/omdb.js";
import { getAvailableSet } from "../server/catalog.js";

export const GET = handler(
  async (_req, params) => {
    const id = params.get("i");
    if (!isImdbId(id)) throw new ApiError("Invalid IMDb ID.", 400, "bad_request");
    const available = await getAvailableSet("movie");
    if (available && !available.has(id)) return json({ movie: null }, { cacheSeconds: 86400 });
    const movie = await getMovie(id);
    return json({ movie }, { cacheSeconds: movie ? 7 * 86400 : 86400 });
  },
  { rateLimit: { bucket: "movie", max: 60 } }
);
