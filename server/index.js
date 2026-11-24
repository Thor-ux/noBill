import "./env.js";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

import * as movie from "../api/movie.js";
import * as search from "../api/search.js";
import * as recent from "../api/recent.js";
import * as discover from "../api/discover.js";
import * as available from "../api/available.js";
import * as health from "../api/health.js";
import { warmUp } from "./catalog.js";
import { diskCleanup } from "./diskcache.js";
import { checkRateLimit } from "./ratelimit.js";

const ROUTES = { movie, search, recent, discover, available, health };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || undefined;
const BEHIND_CLOUDFLARE = process.env.BEHIND_CLOUDFLARE === "true";
const TRUST_PROXY = process.env.TRUST_PROXY !== "false";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};
const COMPRESSIBLE = /^(text\/|application\/json|image\/svg)/;

const vidsrcOrigins = [process.env.VITE_VIDSRC_BASE, process.env.VIDSRC_BASE, "https://vidsrc.sh"]
  .filter(Boolean)
  .map((u) => {
    try {
      return new URL(u).origin;
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "connect-src 'self' https://api.tvmaze.com https://cloudflareinsights.com",
  `frame-src ${[...new Set(vidsrcOrigins)].join(" ")}`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const INDEXABLE = new Set(["/", "/about", "/rights-holders", "/advertising"]);

function isIndexable(req) {
  let path = (req.url || "/").split("?")[0];
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return INDEXABLE.has(path);
}

function securityHeaders(req) {
  const headers = {
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), browsing-topics=()",
    "X-Frame-Options": "SAMEORIGIN",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Permitted-Cross-Domain-Policies": "none",
  };
  if (!isIndexable(req)) headers["X-Robots-Tag"] = "noindex, nofollow";
  if (req.headers["x-forwarded-proto"] === "https") {
    headers["Strict-Transport-Security"] = "max-age=15552000; includeSubDomains";
  }
  return headers;
}

function clientIp(req) {
  if (BEHIND_CLOUDFLARE && req.headers["cf-connecting-ip"]) return req.headers["cf-connecting-ip"];
  const forwarded = TRUST_PROXY && req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",").pop().trim();
  return req.socket.remoteAddress || "unknown";
}

function send(req, res, status, headers, body) {
  const type = headers["Content-Type"] || "";
  const accepts = req.headers["accept-encoding"] || "";
  if (body.length > 1024 && COMPRESSIBLE.test(type)) {
    if (accepts.includes("br")) {
      body = zlib.brotliCompressSync(body);
      headers["Content-Encoding"] = "br";
    } else if (accepts.includes("gzip")) {
      body = zlib.gzipSync(body);
      headers["Content-Encoding"] = "gzip";
    }
    headers["Vary"] = "Accept-Encoding";
  }
  headers["Content-Length"] = body.length;
  res.writeHead(status, { ...securityHeaders(req), ...headers });
  res.end(req.method === "HEAD" ? undefined : body);
}

async function handleApi(req, res, url) {
  const name = url.pathname.slice(5).replace(/\/$/, "");
  const route = Object.hasOwn(ROUTES, name) ? ROUTES[name] : null;
  if (!route) {
    return send(req, res, 404, { "Content-Type": "application/json" }, Buffer.from('{"error":"Not found"}'));
  }

  if (req.headers["sec-fetch-site"] === "cross-site") {
    return send(req, res, 403, { "Content-Type": "application/json" }, Buffer.from('{"error":"Forbidden"}'));
  }

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  headers.set("x-forwarded-for", clientIp(req));
  const request = new Request(new URL(url.pathname + url.search, "http://localhost"), { headers });

  const wait = name !== "health" && (await checkRateLimit(request, { bucket: "all", max: 300 }));
  if (wait) {
    return send(
      req,
      res,
      429,
      { "Content-Type": "application/json", "Cache-Control": "no-store", "Retry-After": String(wait) },
      Buffer.from('{"error":"Too many requests — please slow down and try again shortly.","code":"rate_limit"}')
    );
  }

  const response = await route.GET(request);
  const out = {};
  response.headers.forEach((value, key) => {
    out[key.replace(/(^|-)\w/g, (c) => c.toUpperCase())] = value;
  });
  send(req, res, response.status, out, Buffer.from(await response.arrayBuffer()));
}

const fileCache = new Map();

function readDist(rel) {
  if (fileCache.has(rel)) return fileCache.get(rel);
  const file = path.join(DIST, rel);
  if (!file.startsWith(DIST + path.sep)) return null;
  try {
    if (!fs.statSync(file).isFile()) return null;
    const entry = { body: fs.readFileSync(file), type: TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" };
    fileCache.set(rel, entry);
    return entry;
  } catch {
    return null;
  }
}

function handleStatic(req, res, url) {
  let rel;
  try {
    rel = decodeURIComponent(url.pathname);
  } catch {
    return send(req, res, 400, { "Content-Type": "text/plain" }, Buffer.from("Bad request"));
  }

  let entry = rel !== "/" && readDist(rel);
  let cache = rel.startsWith("/assets/")
    ? "public, max-age=31536000, immutable"
    : "public, max-age=3600";

  if (!entry) {
    if (path.extname(rel)) {
      return send(req, res, 404, { "Content-Type": "text/plain" }, Buffer.from("Not found"));
    }
    entry = readDist("/index.html");
    cache = "no-cache";
    if (!entry) {
      return send(req, res, 500, { "Content-Type": "text/plain" }, Buffer.from("Site not built. Run: npm run build"));
    }
  }
  const headers = { "Content-Type": entry.type, "Cache-Control": cache };
  if (rel === "/og-image.png" || rel === "/icon-512.png") headers["Cross-Origin-Resource-Policy"] = "cross-origin";
  send(req, res, 200, headers, entry.body);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(req, res, 405, { "Content-Type": "text/plain", Allow: "GET, HEAD" }, Buffer.from("Method not allowed"));
    }
    if (req.url.length > 2048) {
      return send(req, res, 414, { "Content-Type": "text/plain" }, Buffer.from("URL too long"));
    }
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) await handleApi(req, res, url);
    else handleStatic(req, res, url);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) send(req, res, 500, { "Content-Type": "text/plain" }, Buffer.from("Server error"));
    else res.end();
  }
});

server.requestTimeout = 60_000;
server.headersTimeout = 15_000;
server.keepAliveTimeout = 65_000;
server.maxHeadersCount = 100;
server.maxConnections = 4000;

server.listen(PORT, HOST, () => {
  console.log(`noBill running on ${HOST || "all interfaces"}, port ${PORT}`);
  if (!process.env.OMDB_API_KEY) console.warn("⚠ OMDB_API_KEY is not set — movie data will not load.");
  warmUp();
  diskCleanup().then((n) => n && console.log(`cache cleanup: removed ${n} old entries`));
  setInterval(() => diskCleanup(), 24 * 60 * 60 * 1000).unref();
});

process.on("unhandledRejection", (err) => console.error("unhandled:", err));
