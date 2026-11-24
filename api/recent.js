import { handler, json } from "../server/http.js";
import { getRecentlyAdded } from "../server/catalog.js";
import { isBlocked } from "../server/blocklist.js";

export const GET = handler(
  async () => {
    return json({ movies: (await getRecentlyAdded(36)).filter((m) => !isBlocked(m.imdbID)) }, { cacheSeconds: 12 * 3600 });
  },
  { rateLimit: { bucket: "recent", max: 20 } }
);
