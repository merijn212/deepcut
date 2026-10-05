// Opschonen: houdt de repo klein door lokale foto's weg te halen die niet meer nodig zijn.
// - Drops die langer dan PREVIEW_DAYS_AFTER_DROP dagen geleden zijn, verliezen hun `previews`
//   (de "First look"-foto's uit Instagram). De echte items staan dan in de shop met foto's
//   van het merk zelf.
// - Foto's in public/items/ waar niets in src/ meer naar verwijst, worden verwijderd. Zo
//   verdwijnen ook lokale foto's van items die de voorraadcheck als uitverkocht heeft
//   weggehaald.
//
// Draait dagelijks na de voorraadcheck via .github/workflows/stock-check.yml. Lokaal:
//   npm run cleanup              # past drops.ts aan en verwijdert foto's
//   npm run cleanup -- --dry-run # laat alleen zien wat er weg zou gaan

import { appendFileSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DROPS_FILE = join(ROOT, "src/data/drops.ts");
const SRC_DIR = join(ROOT, "src");
const ITEMS_DIR = join(ROOT, "public/items");

const dryRun = process.argv.includes("--dry-run");
// Zo lang na de drop blijven de previews staan, zodat er tijd is om de items toe te voegen.
const PREVIEW_DAYS_AFTER_DROP = Number(process.env.PREVIEW_DAYS_AFTER_DROP ?? 3);

const report = { previews: [], files: [] };

// ---------------------------------------------------------------------------
// Previews van voorbije drops weghalen

const text = readFileSync(DROPS_FILE, "utf8");
const source = ts.createSourceFile(DROPS_FILE, text, ts.ScriptTarget.Latest, true);
const edits = [];
const cutoff = Date.now() - PREVIEW_DAYS_AFTER_DROP * 24 * 60 * 60 * 1000;

function visit(node) {
  if (ts.isObjectLiteralExpression(node)) {
    const props = node.properties.filter(ts.isPropertyAssignment);
    const get = (key) => props.find((prop) => prop.name.getText(source) === key);
    const date = get("date")?.initializer;
    const previews = get("previews");
    if (date && ts.isStringLiteralLike(date) && previews && Date.parse(date.text) < cutoff) {
      let end = previews.getEnd();
      if (text[end] === ",") end++;
      edits.push({ start: previews.getFullStart(), end });
      const id = get("id")?.initializer;
      report.previews.push(`${id && ts.isStringLiteralLike(id) ? id.text : "?"} (drop was ${date.text})`);
    }
    return;
  }
  ts.forEachChild(node, visit);
}
visit(source);

let drops = text;
for (const edit of edits.sort((a, b) => b.start - a.start)) {
  drops = drops.slice(0, edit.start) + drops.slice(edit.end);
}
if (drops !== text && !dryRun) writeFileSync(DROPS_FILE, drops);

// ---------------------------------------------------------------------------
// Foto's waar niets meer naar verwijst verwijderen

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

// Alle teksten in src/ (met de aangepaste drops.ts), zodat ook foto's die in een
// component staan blijven bestaan.
const sources = walk(SRC_DIR)
  .filter((path) => /\.(ts|tsx|css|mdx?)$/.test(path))
  .map((path) => (path === DROPS_FILE ? drops : readFileSync(path, "utf8")))
  .join("\n");

for (const file of walk(ITEMS_DIR)) {
  if (file.endsWith(".gitkeep")) continue;
  const publicPath = `/items/${relative(ITEMS_DIR, file).split(sep).join("/")}`;
  if (sources.includes(publicPath)) continue;
  report.files.push(publicPath);
  if (!dryRun) rmSync(file);
}
// Lege mappen van merken laten we staan; git negeert ze toch.

// ---------------------------------------------------------------------------
// Rapport

const section = (title, lines) => (lines.length ? [`### ${title}`, ...lines.map((line) => `- ${line}`), ""] : []);
const changed = report.previews.length > 0 || report.files.length > 0;
const summary = [
  `## Opschonen${dryRun ? " (dry run)" : ""}`,
  "",
  ...(changed ? [] : ["Niets op te schonen.", ""]),
  ...section(`Previews weg (drop langer dan ${PREVIEW_DAYS_AFTER_DROP} dagen geleden)`, report.previews),
  ...section("Foto's verwijderd (nergens meer gebruikt)", report.files),
].join("\n");

console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + "\n");
if (process.env.CLEANUP_COMMIT_MESSAGE_FILE && changed && !dryRun) {
  const parts = [
    report.previews.length && `removed previews of ${report.previews.length} past drop(s)`,
    report.files.length && `deleted ${report.files.length} unused image(s)`,
  ].filter(Boolean);
  writeFileSync(process.env.CLEANUP_COMMIT_MESSAGE_FILE, `Cleanup: ${parts.join(", ")}\n\n${summary}\n`);
}
