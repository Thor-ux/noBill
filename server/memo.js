import { diskRead, diskWrite } from "./diskcache.js";

const store = new Map();
const MAX_ENTRIES = 5000;

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export function memoGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.exp) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function memoSet(key, value, ttl) {
  if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value);
  store.set(key, { value, exp: Date.now() + ttl });
  return value;
}

const inFlight = new Map();

export async function memoize(key, ttl, fn, { stale = false } = {}) {
  const hit = memoGet(key);
  if (hit !== undefined) return hit;
  if (inFlight.has(key)) return inFlight.get(key);

  const run = (async () => {
    const disk = await diskRead(key);
    if (disk && !disk.expired) return memoSet(key, disk.value, ttl);
    if (disk && stale) {
      refresh(key, ttl, fn);
      return memoSet(key, disk.value, Math.min(ttl, HOUR));
    }
    const value = await fn();
    await diskWrite(key, value, ttl);
    return memoSet(key, value, ttl);
  })().finally(() => inFlight.delete(key));

  inFlight.set(key, run);
  return run;
}

function refresh(key, ttl, fn) {
  if (inFlight.has(`refresh:${key}`)) return;
  const p = fn()
    .then(async (value) => {
      await diskWrite(key, value, ttl);
      memoSet(key, value, ttl);
    })
    .catch((err) => console.warn(`refresh ${key} failed:`, err.message))
    .finally(() => inFlight.delete(`refresh:${key}`));
  inFlight.set(`refresh:${key}`, p);
}
