// Voorraadcheck: haalt voor elk item de productpagina van het merk op (Shopify) en
// - verwijdert items die helemaal uitverkocht zijn uit src/data/products.ts;
// - werkt `soldOutSizes` bij voor maten die op of weer terug zijn.
//
// Draait dagelijks via .github/workflows/stock-check.yml. Lokaal:
//   npm run stock            # past products.ts aan
//   npm run stock -- --dry-run  # laat alleen zien wat er zou veranderen
//
// Items zonder `url`, items die nog moeten droppen en shops die geen Shopify zijn
// worden overgeslagen. Bij een fout (shop onbereikbaar, 404) verandert er niets aan
// het item; dat komt alleen als waarschuwing in het rapport.

import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const PRODUCTS_FILE = fileURLToPath(new URL("../src/data/products.ts", import.meta.url));
const DROPS_FILE = fileURLToPath(new URL("../src/data/drops.ts", import.meta.url));

const dryRun = process.argv.includes("--dry-run");
// Zet REMOVE_SOLD_OUT=false om uitverkochte items te laten staan (ze krijgen dan soldOut: true).
const removeSoldOut = process.env.REMOVE_SOLD_OUT !== "false";

// ---------------------------------------------------------------------------
// Data uit de TypeScript-bestanden lezen (zonder ze uit te voeren)

function parse(file) {
  const text = readFileSync(file, "utf8");
  return { text, source: ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true) };
}

function findExportedArray(source, name) {
  let found;
  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const decl of node.declarationList.declarations) {
      if (decl.name.getText(source) === name && decl.initializer && ts.isArrayLiteralExpression(decl.initializer)) {
        found = decl.initializer;
      }
    }
  });
  if (!found) throw new Error(`Kon "export const ${name} = [...]" niet vinden in ${source.fileName}`);
  return found;
}

function literalValue(node) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literalValue);
  return undefined;
}

function readObjects(source, array) {
  return array.elements.filter(ts.isObjectLiteralExpression).map((node) => {
    const props = {};
    const nodes = {};
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = prop.name.getText(source);
      props[key] = literalValue(prop.initializer);
      nodes[key] = prop;
    }
    return { node, props, nodes };
  });
}

// ---------------------------------------------------------------------------
// Shopify

const SIZE_ALIASES = {
  XXS: ["XXS", "2XS", "XXSMALL"],
  XS: ["XS", "XSMALL", "EXTRASMALL"],
  S: ["S", "SMALL", "SM"],
  M: ["M", "MEDIUM", "MED"],
  L: ["L", "LARGE", "LG"],
  XL: ["XL", "XLARGE", "EXTRALARGE"],
  XXL: ["XXL", "2XL", "XXLARGE"],
  XXXL: ["XXXL", "3XL", "XXXLARGE"],
};
const ALIAS_TO_SIZE = new Map(
  Object.entries(SIZE_ALIASES).flatMap(([size, aliases]) => aliases.map((alias) => [alias, size])),
);

/** "X-Large", "x large" en "XL" worden allemaal "XL"; "28 R" wordt "28R". */
function normalizeSize(value) {
  const compact = String(value).toUpperCase().replace(/[\s\-_.]/g, "");
  return ALIAS_TO_SIZE.get(compact) ?? compact;
}

async function fetchShopifyProduct(url) {
  const clean = new URL(url);
  clean.search = "";
  clean.hash = "";
  if (!/\/products\/[^/]+\/?$/.test(clean.pathname)) {
    return { skip: "geen Shopify-productlink (/products/...)" };
  }
  clean.pathname = clean.pathname.replace(/\/$/, "") + ".js";

  let response;
  for (let attempt = 1; ; attempt++) {
    try {
      response = await fetch(clean, {
        headers: { accept: "application/json", "user-agent": "DeepcutStockCheck/1.0" },
        signal: AbortSignal.timeout(20_000),
      });
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      if (attempt >= 3) return { error: `niet bereikbaar (${error.message})` };
    }
    if (attempt >= 3) return { error: `HTTP ${response.status}` };
    await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
  }
  if (response.status === 404) return { error: "pagina niet gevonden (404), mogelijk offline gehaald" };
  if (!response.ok) return { error: `HTTP ${response.status}` };

  const data = await response.json().catch(() => undefined);
  if (!data || !Array.isArray(data.variants)) return { skip: "geen Shopify-productdata" };
  return { data };
}

/** Geeft per genormaliseerde maat terug of er nog minstens één variant van leverbaar is. */
function sizeAvailability(data) {
  const options = (data.options ?? []).map((option) => (typeof option === "string" ? option : option.name));
  let index = options.findIndex((name) => /size|maat|størrelse|storlek|größe|taille|talla/i.test(name ?? ""));
  if (index === -1 && options.length === 1) index = 0;
  if (index === -1) return undefined;

  const available = new Map();
  for (const variant of data.variants) {
    const value = variant.options?.[index] ?? variant[`option${index + 1}`];
    if (value == null) continue;
    const key = normalizeSize(value);
    available.set(key, (available.get(key) ?? false) || Boolean(variant.available));
  }
  return available;
}

// ---------------------------------------------------------------------------
// Check

const { text, source } = parse(PRODUCTS_FILE);
const products = readObjects(source, findExportedArray(source, "products"));

const drops = parse(DROPS_FILE);
const dropDates = new Map(
  readObjects(drops.source, findExportedArray(drops.source, "drops")).map(({ props }) => [props.id, props.date]),
);

const now = Date.now();
const edits = []; // { start, end, insert }
const report = { removed: [], soldOut: [], sizes: [], warnings: [], skipped: [] };

for (const { node, props, nodes } of products) {
  const label = `${props.id}`;
  if (typeof props.url !== "string") {
    report.skipped.push(`${label}: geen url`);
    continue;
  }
  const releaseAt = props.releaseAt ?? (props.drop ? dropDates.get(props.drop) : undefined);
  if (typeof releaseAt === "string" && Date.parse(releaseAt) > now) {
    report.skipped.push(`${label}: dropt nog`);
    continue;
  }

  const result = await fetchShopifyProduct(props.url);
  if (result.skip) {
    report.skipped.push(`${label}: ${result.skip}`);
    continue;
  }
  if (result.error) {
    report.warnings.push(`${label}: ${result.error} (${props.url})`);
    continue;
  }

  const { data } = result;
  const anyAvailable = data.variants.some((variant) => variant.available);

  if (!anyAvailable) {
    if (removeSoldOut) {
      // Hele object inclusief voorafgaande witruimte/commentaar en de komma erna.
      let end = node.getEnd();
      if (text[end] === ",") end++;
      edits.push({ start: node.getFullStart(), end, insert: "" });
      report.removed.push(`${label} (${props.url})`);
    } else if (props.soldOut !== true) {
      if (nodes.soldOut) {
        edits.push({ start: nodes.soldOut.initializer.getStart(), end: nodes.soldOut.initializer.getEnd(), insert: "true" });
      } else {
        edits.push(insertAfter(nodes.url, "soldOut: true"));
      }
      report.soldOut.push(label);
    }
    continue;
  }

  // Maten bijwerken. Maten die we niet in de shop terugvinden blijven zoals ze zijn.
  const sizes = Array.isArray(props.sizes) ? props.sizes : [];
  const availability = sizeAvailability(data);
  if (sizes.length === 0 || !availability) continue;

  const current = new Set(Array.isArray(props.soldOutSizes) ? props.soldOutSizes : []);
  const next = sizes.filter((size) => {
    const known = availability.get(normalizeSize(size));
    return known === undefined ? current.has(size) : !known;
  });
  const unchanged = next.length === current.size && next.every((size) => current.has(size));
  if (unchanged) continue;

  const arrayText = `[${next.map((size) => JSON.stringify(size)).join(", ")}]`;
  if (nodes.soldOutSizes && next.length > 0) {
    const init = nodes.soldOutSizes.initializer;
    edits.push({ start: init.getStart(), end: init.getEnd(), insert: arrayText });
  } else if (nodes.soldOutSizes) {
    let end = nodes.soldOutSizes.getEnd();
    if (text[end] === ",") end++;
    edits.push({ start: nodes.soldOutSizes.getFullStart(), end, insert: "" });
  } else if (nodes.sizes) {
    edits.push(insertAfter(nodes.sizes, `soldOutSizes: ${arrayText}`));
  }
  const nowOut = next.filter((size) => !current.has(size));
  const back = [...current].filter((size) => !next.includes(size));
  report.sizes.push(
    `${label}: ${[nowOut.length ? `op: ${nowOut.join(", ")}` : "", back.length ? `terug: ${back.join(", ")}` : ""]
      .filter(Boolean)
      .join("; ")}`,
  );
}

/** Voegt een nieuwe property in op de regel na `prop`, met dezelfde inspringing. */
function insertAfter(prop, propertyText) {
  let end = prop.getEnd();
  if (text[end] === ",") end++;
  const lineStart = text.lastIndexOf("\n", prop.getStart()) + 1;
  const indent = text.slice(lineStart, prop.getStart());
  return { start: end, end, insert: `\n${indent}${propertyText},` };
}

// ---------------------------------------------------------------------------
// Wegschrijven en rapporteren

let output = text;
for (const edit of edits.sort((a, b) => b.start - a.start)) {
  output = output.slice(0, edit.start) + edit.insert + output.slice(edit.end);
}
const changed = output !== text;
if (changed && !dryRun) writeFileSync(PRODUCTS_FILE, output);

const section = (title, lines) => (lines.length ? [`### ${title}`, ...lines.map((line) => `- ${line}`), ""] : []);
const summary = [
  `## Voorraadcheck${dryRun ? " (dry run)" : ""}`,
  "",
  `${products.length} items bekeken, ${changed ? "products.ts aangepast" : "niets veranderd"}.`,
  "",
  ...section("Verwijderd (helemaal uitverkocht)", report.removed),
  ...section("Gemarkeerd als uitverkocht", report.soldOut),
  ...section("Maten bijgewerkt", report.sizes),
  ...section("Waarschuwingen (niet aangepast, even zelf checken)", report.warnings),
  ...section("Overgeslagen", report.skipped),
].join("\n");

console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + "\n");
if (process.env.STOCK_COMMIT_MESSAGE_FILE && changed && !dryRun) {
  const parts = [
    report.removed.length && `removed ${report.removed.length} sold out`,
    report.soldOut.length && `marked ${report.soldOut.length} sold out`,
    report.sizes.length && `updated sizes on ${report.sizes.length}`,
  ].filter(Boolean);
  writeFileSync(process.env.STOCK_COMMIT_MESSAGE_FILE, `Stock check: ${parts.join(", ")}\n\n${summary}\n`);
}
