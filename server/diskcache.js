import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.resolve(ROOT, process.env.CACHE_DIR || ".cache");

function fileFor(key) {
  const hash = crypto.createHash("sha1").update(key).digest("hex");
  return path.join(DIR, hash.slice(0, 2), `${hash}.json`);
}

export async function diskRead(key) {
  try {
    const { v, exp } = JSON.parse(await fs.readFile(fileFor(key), "utf8"));
    return { value: v, expired: Date.now() > exp };
  } catch {
    return undefined;
  }
}

export async function diskWrite(key, value, ttl) {
  try {
    const file = fileFor(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ v: value, exp: Date.now() + ttl }));
    await fs.rename(tmp, file);
  } catch (err) {
    console.warn("disk cache write failed:", err.message);
  }
}

export async function diskCleanup(graceMs = 7 * 24 * 60 * 60 * 1000) {
  let removed = 0;
  try {
    for (const sub of await fs.readdir(DIR)) {
      const subDir = path.join(DIR, sub);
      for (const name of await fs.readdir(subDir).catch(() => [])) {
        const file = path.join(subDir, name);
        try {
          const { exp } = JSON.parse(await fs.readFile(file, "utf8"));
          if (Date.now() > exp + graceMs) {
            await fs.unlink(file);
            removed++;
          }
        } catch {
          await fs.unlink(file).catch(() => {});
        }
      }
    }
  } catch {
  }
  return removed;
}
