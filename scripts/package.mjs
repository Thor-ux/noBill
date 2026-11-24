import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "release", "nobill");
const zip = path.join(root, "release", "nobill.zip");

const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: "inherit" });

console.log("1/3 Building the site...");
run("npm run build");

console.log("2/3 Collecting server files...");
fs.rmSync(path.join(root, "release"), { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const item of ["app.cjs", "api", "server", "dist", "deploy"]) {
  fs.cpSync(path.join(root, item), path.join(out, item), { recursive: true });
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
fs.writeFileSync(
  path.join(out, "package.json"),
  JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      private: true,
      type: "module",
      main: "app.cjs",
      scripts: { start: "node server/index.js" },
      engines: { node: ">=18.17" },
    },
    null,
    2
  ) + "\n"
);

console.log("3/3 Zipping...");
try {
  run(`zip -qr "${zip}" .`, out);
  console.log(`\n✓ Ready: ${path.relative(root, zip)}  (upload it to your server; see GO-LIVE.md)`);
} catch {
  console.log(`\n✓ Ready: ${path.relative(root, out)}/  (zip this folder and upload it)`);
}
