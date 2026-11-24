import fs from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function localApi() {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        if (!url.pathname.startsWith("/api/")) return next();

        const name = url.pathname.slice(5).replace(/\/$/, "");
        const file = path.resolve("api", `${name}.js`);
        if (!/^[a-z-]+$/.test(name) || !fs.existsSync(file)) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: "Not found" }));
        }

        try {
          const mod = await server.ssrLoadModule(file);
          if (req.method !== "GET" || !mod.GET) {
            res.statusCode = 405;
            return res.end();
          }
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
          headers.set("x-forwarded-for", req.socket.remoteAddress || "local");
          const response = await mod.GET(new Request(url, { headers }));
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          console.error(err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of ["OMDB_API_KEY", "VIDSRC_BASE", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }

  const siteUrl = (env.SITE_URL || "").replace(/\/$/, "");
  const siteUrlPlugin = {
    name: "site-url",
    transformIndexHtml: (html) => html.replaceAll("__SITE_URL__", siteUrl),
  };

  return {
    plugins: [react(), tailwindcss(), localApi(), siteUrlPlugin],
  };
});
