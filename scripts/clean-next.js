const fs = require("fs");
const path = require("path");

const nextDir = path.join(process.cwd(), ".next");

function rm(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) rm(p);
    else fs.unlinkSync(p);
  }
  fs.rmdirSync(dir);
}

try {
  rm(nextDir);
  console.log("Removed .next — you can run npm run dev");
} catch (e) {
  console.error("Could not remove .next:", e.message);
  console.error("Close all Node/Next processes, then run as admin or move the project out of OneDrive.");
  process.exit(1);
}
