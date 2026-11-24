import { execFileSync } from "node:child_process";
import path from "node:path";

const here = import.meta.dirname;
const pub = path.join(here, "..", "public");
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const shot = (html, out, w, h, scale = 1) =>
  execFileSync(chrome, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", `--force-device-scale-factor=${scale}`,
    `--window-size=${w},${h}`, `--screenshot=${path.join(pub, out)}`, `file://${path.join(here, html)}`,
  ], { stdio: "ignore" });

shot("og-image.html", "og-image.png", 1200, 630);
shot("icon.html", "icon-512.png", 512, 512);
console.log("✓ public/og-image.png (1200×630), public/icon-512.png (512×512)");
