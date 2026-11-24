const memory = new Map();

function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim();
}

function memoryHit(key, windowMs) {
  const now = Date.now();
  let entry = memory.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    memory.set(key, entry);
    if (memory.size > 10000) {
      for (const [k, v] of memory) if (now > v.resetAt) memory.delete(k);
      if (memory.size > 50000) {
        let drop = memory.size - 40000;
        for (const k of memory.keys()) {
          if (drop-- <= 0) break;
          memory.delete(k);
        }
      }
    }
  }
  entry.count += 1;
  return { count: entry.count, resetIn: entry.resetAt - now };
}

async function redisHit(key, windowMs) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, String(windowMs), "NX"],
      ["PTTL", key],
    ]),
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  const [incr, , ttl] = await res.json();
  return { count: incr.result, resetIn: Math.max(ttl.result, 0) };
}

export async function checkRateLimit(request, { bucket, max, windowMs = 60_000 }) {
  const key = `rl:${bucket}:${clientIp(request)}`;
  let hit;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      hit = await redisHit(key, windowMs);
    } catch {
      hit = memoryHit(key, windowMs);
    }
  } else {
    hit = memoryHit(key, windowMs);
  }
  return hit.count > max ? Math.ceil(hit.resetIn / 1000) || 1 : null;
}
