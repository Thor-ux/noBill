import { handler, json } from "../server/http.js";
import { omdbStatus } from "../server/omdb.js";
import { catalogStatus } from "../server/catalog.js";

const startedAt = Date.now();

export const GET = handler(
  async () => {
    const omdb = omdbStatus();
    const catalog = catalogStatus();
    const ok = omdb.keyConfigured && !omdb.limitReached;
    return json(
      {
        ok,
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        omdb,
        catalog,
        node: process.version,
      },
      { status: ok ? 200 : 503 }
    );
  },
  { rateLimit: { bucket: "health", max: 30 } }
);
