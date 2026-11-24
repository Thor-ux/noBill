import { handler, json, ApiError, isImdbId } from "../server/http.js";
import { getAvailableSet } from "../server/catalog.js";

const MAX_IDS = 100;

export const GET = handler(
  async (_req, params) => {
    const type = params.get("type");
    if (type !== "movie" && type !== "tv") throw new ApiError("type must be movie or tv.", 400, "bad_request");
    const ids = (params.get("ids") || "").split(",").filter(Boolean);
    if (!ids.length || ids.length > MAX_IDS || !ids.every(isImdbId)) {
      throw new ApiError(`ids must be 1–${MAX_IDS} IMDb IDs.`, 400, "bad_request");
    }

    const set = await getAvailableSet(type);
    if (!set) return json({ available: null }, { cacheSeconds: 60 });
    return json({ available: ids.filter((id) => set.has(id)) }, { cacheSeconds: 12 * 3600 });
  },
  { rateLimit: { bucket: "available", max: 120 } }
);
