import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = process.env.BLOCKLIST_FILE || path.join(ROOT, "blocked.txt");

let blocked = new Set();
let loadedMtime = 0;

function reload() {
  let stat;
  try {
    stat = fs.statSync(FILE);
  } catch {
    if (blocked.size) console.log("blocklist: file removed, nothing blocked");
    blocked = new Set();
    loadedMtime = 0;
    return;
  }
  if (stat.mtimeMs === loadedMtime) return;
  loadedMtime = stat.mtimeMs;
  const ids = new Set();
  for (const line of fs.readFileSync(FILE, "utf8").split(/\r?\n/)) {
    const match = line.replace(/#.*/, "").match(/tt\d{5,10}/);
    if (match) ids.add(match[0]);
  }
  blocked = ids;
  console.log(`blocklist: ${ids.size} title(s) blocked`);
}

reload();
setInterval(reload, 30_000).unref();

export const isBlocked = (imdbID) => blocked.has(imdbID);
