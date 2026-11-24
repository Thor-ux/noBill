import { handler, json } from "../server/http.js";
import { getDiscover } from "../server/catalog.js";
import { isBlocked } from "../server/blocklist.js";

export const GET = handler(
  async () => {
    return json({ movies: (await getDiscover(12)).filter((m) => !isBlocked(m.imdbID)) }, { cacheSeconds: 3600 });
  },
  { rateLimit: { bucket: "discover", max: 20 } }
);
