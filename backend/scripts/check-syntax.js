const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const sourceDir = path.resolve(__dirname, "..", "src");

function getJavaScriptFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getJavaScriptFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith(".js") ? [fullPath] : [];
  });
}

const files = getJavaScriptFiles(sourceDir);
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    failed = true;
  } else if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  console.error("Backend syntax check failed.");
  process.exit(1);
}

console.log(`Backend syntax check passed (${files.length} JavaScript files).`);
