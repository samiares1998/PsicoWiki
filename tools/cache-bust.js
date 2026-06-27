const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const version = process.env.CACHE_VERSION || new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const htmlFiles = [
  path.join(root, "index.html"),
  ...fs
    .readdirSync(path.join(root, "topics"))
    .filter((file) => file.endsWith(".html"))
    .map((file) => path.join(root, "topics", file)),
];

function addVersion(html) {
  return html
    .replace(/((?:\.\.\/)?styles\.css)(?:\?v=[^"']*)?/g, `$1?v=${version}`)
    .replace(/((?:\.\.\/)?script\.js)(?:\?v=[^"']*)?/g, `$1?v=${version}`)
    .replace(/((?:\.\.\/)?favicon\.svg)(?:\?v=[^"']*)?/g, `$1?v=${version}`);
}

for (const file of htmlFiles) {
  const current = fs.readFileSync(file, "utf8");
  const next = addVersion(current);
  if (next !== current) fs.writeFileSync(file, next);
}

console.log(`Cache version applied: ${version}`);
