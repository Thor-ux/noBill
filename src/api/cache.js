const PREFIX = "c:";

export const DAY = 24 * 60 * 60 * 1000;

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return undefined;
    const { v, exp } = JSON.parse(raw);
    if (exp && Date.now() > exp) {
      localStorage.removeItem(PREFIX + key);
      return undefined;
    }
    return v;
  } catch {
    return undefined;
  }
}

export function cacheSet(key, value, ttl = 7 * DAY) {
  const raw = JSON.stringify({ v: value, exp: Date.now() + ttl });
  try {
    localStorage.setItem(PREFIX + key, raw);
  } catch {
    pruneCache();
    try {
      localStorage.setItem(PREFIX + key, raw);
    } catch {
    }
  }
}

function pruneCache() {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(PREFIX)) continue;
    try {
      entries.push([k, JSON.parse(localStorage.getItem(k)).exp || 0]);
    } catch {
      entries.push([k, 0]);
    }
  }
  entries.sort((a, b) => a[1] - b[1]);
  const now = Date.now();
  const expired = entries.filter(([, exp]) => exp < now);
  const toRemove = expired.length ? expired : entries.slice(0, Math.ceil(entries.length / 2));
  toRemove.forEach(([k]) => localStorage.removeItem(k));
}
