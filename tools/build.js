import { mkdir, cp, writeFile } from "node:fs/promises";
// Explicit allowlist prevents the original workbook, local audits and private files from publishing.
await mkdir("dist", { recursive: true });
for (const path of ["index.html", "css", "js", "data", "assets"])
  await cp(path, "dist/" + path, { recursive: true });
await writeFile("dist/.nojekyll", "");
console.log("Static build created from public asset allowlist.");
