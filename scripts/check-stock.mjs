// Voorraadcheck: haalt voor elk item de productpagina van het merk op (Shopify) en
// - verwijdert items die in geen enkele kleur meer leverbaar zijn uit src/data/products.ts;
// - werkt `soldOutSizes` bij voor maten die op of weer terug zijn;
// - zoekt de andere kleuren van het item in de shop en houdt `colorways` bij: nieuwe kleuren
//   komen erbij, uitverkochte kleuren gaan eraf, en per kleur worden de uitverkochte maten
//   bijgewerkt.
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

import {
  fetchShopifyProduct,
  findColorways,
  guessColor,
  ownVariants,
  sizeAvailability,
  soldOutSizesFor,
} from "./shopify.mjs";

const PRODUCTS_FILE = fileURLToPath(new URL("../src/data/products.ts", import.meta.url));
const DROPS_FILE = fileURLToPath(new URL("../src/data/drops.ts", import.meta.url));

const dryRun = process.argv.includes("--dry-run");
// Zet REMOVE_SOLD_OUT=false om uitverkochte items te laten staan (ze krijgen dan soldOut: true).
// Dat geldt ook voor kleuren: die blijven dan staan met soldOut: true.
const removeSoldOut = process.env.REMOVE_SOLD_OUT !== "false";
// Meer foto's per kleur nemen we niet over uit de shop.
const MAX_COLORWAY_IMAGES = 8;

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
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(
      node.properties.filter(ts.isPropertyAssignment).map((prop) => [prop.name.getText(), literalValue(prop.initializer)]),
    );
  }
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
// Kleuren

/** Vergelijkt links zonder protocol, www., query of slash aan het eind. */
function sameUrl(a, b) {
  const key = (value) => {
    const url = new URL(value);
    const variant = url.searchParams.get("variant");
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}${variant ? `?variant=${variant}` : ""}`;
  };
  return key(a) === key(b);
}

/**
 * Bepaalt de nieuwe lijst `colorways` voor een item: kleuren uit de shop (`found`) en kleuren
 * die al in products.ts staan maar die we in de shop niet als kleur terugvonden (die halen we
 * los op). Bestaande namen, kleuren en foto's blijven staan, zodat je die met de hand kunt
 * verbeteren.
 */
async function nextColorways(props, found, warnings) {
  const existing = Array.isArray(props.colorways) ? props.colorways : [];
  const sizes = Array.isArray(props.sizes) ? props.sizes : [];
  const candidates = [];

  for (const old of existing) {
    const match = found?.others.find((other) => sameUrl(other.url, old.url));
    if (match) {
      candidates.push({ old, shop: match });
      continue;
    }
    const result = await fetchShopifyProduct(old.url);
    if (result.error || result.skip) {
      if (result.error) warnings.push(`${props.id}, kleur ${old.name}: ${result.error} (${old.url})`);
      candidates.push({ old, keep: true });
      continue;
    }
    const variants = ownVariants(old.url, result.data);
    candidates.push({
      old,
      shop: {
        availability: sizeAvailability(result.data, variants),
        anyAvailable: variants.some((variant) => variant.available),
      },
    });
  }
  for (const other of found?.others ?? []) {
    if (!existing.some((old) => sameUrl(old.url, other.url))) candidates.push({ shop: other });
  }

  const next = [];
  for (const { old, shop, keep } of candidates) {
    if (keep) {
      next.push(old);
      continue;
    }
    const name = old?.name ?? shop.name;
    let color = old?.color ?? guessColor(name);
    if (!color) {
      color = "multi";
      warnings.push(`${props.id}: kleur "${name}" niet herkend, staat nu op "multi"; pas dat even aan`);
    }
    const soldOutSizes = soldOutSizesFor(sizes, shop.availability, old?.soldOutSizes ?? []);
    const soldOut = !shop.anyAvailable || (sizes.length > 0 && soldOutSizes.length === sizes.length);
    if (soldOut && removeSoldOut) continue;
    // Een nieuwe kleur die al uitverkocht is, voegen we niet toe.
    if (soldOut && !old) continue;

    const colorway = { name, color, url: old?.url ?? shop.url };
    colorway.images = old?.images ?? shop.images.slice(0, MAX_COLORWAY_IMAGES);
    if (!soldOut && soldOutSizes.length > 0) colorway.soldOutSizes = soldOutSizes;
    if (soldOut) colorway.soldOut = true;
    if (colorway.images.length === 0) {
      warnings.push(`${props.id}: kleur "${name}" heeft geen foto's in de shop, overgeslagen`);
      continue;
    }
    next.push(colorway);
  }
  return next;
}

function describeColorwayChanges(before, after) {
  const names = (list) => list.map((colorway) => colorway.name);
  const added = names(after).filter((name) => !names(before).includes(name));
  const removed = names(before).filter((name) => !names(after).includes(name));
  const sizes = after
    .map((colorway) => {
      const old = before.find((item) => item.name === colorway.name);
      if (!old) return "";
      const was = JSON.stringify([old.soldOut ?? false, old.soldOutSizes ?? []]);
      const now = JSON.stringify([colorway.soldOut ?? false, colorway.soldOutSizes ?? []]);
      if (was === now) return "";
      if (colorway.soldOut) return `${colorway.name} uitverkocht`;
      return `${colorway.name} op: ${(colorway.soldOutSizes ?? []).join(", ") || "niets"}`;
    })
    .filter(Boolean);
  return [
    added.length ? `nieuw: ${added.join(", ")}` : "",
    removed.length ? `weg: ${removed.join(", ")}` : "",
    ...sizes,
  ]
    .filter(Boolean)
    .join("; ");
}

/** Zet een waarde om naar TypeScript-tekst in dezelfde stijl als products.ts. */
function toSource(value, indent) {
  const inner = `${indent}  `;
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string") && value.join("").length < 60) {
      return `[${value.map((item) => JSON.stringify(item)).join(", ")}]`;
    }
    return `[\n${value.map((item) => `${inner}${toSource(item, inner)},`).join("\n")}\n${indent}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    return `{\n${entries.map(([key, item]) => `${inner}${key}: ${toSource(item, inner)},`).join("\n")}\n${indent}}`;
  }
  return JSON.stringify(value);
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
const report = { removed: [], soldOut: [], sizes: [], colors: [], warnings: [], skipped: [] };

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
  const variants = ownVariants(props.url, data);
  const anyAvailable = variants.some((variant) => variant.available);

  let found;
  try {
    found = await findColorways(props.url, data);
  } catch (error) {
    report.warnings.push(`${label}: kleuren zoeken mislukt (${error.message})`);
  }
  const colorways = await nextColorways(props, found, report.warnings);
  const anyColorwayAvailable = colorways.some((colorway) => !colorway.soldOut);

  if (!anyAvailable && !anyColorwayAvailable) {
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

  // Kleuren bijwerken.
  updateColors(props, nodes, found, colorways, label);

  // Maten bijwerken. Is de eigen kleur op maar een andere kleur niet, dan staan alle maten
  // van de eigen kleur op uitverkocht. Maten die we niet in de shop terugvinden blijven zoals ze zijn.
  const sizes = Array.isArray(props.sizes) ? props.sizes : [];
  const availability = sizeAvailability(data, variants);
  if (sizes.length === 0 || !availability) continue;

  const current = new Set(Array.isArray(props.soldOutSizes) ? props.soldOutSizes : []);
  const next = soldOutSizesFor(sizes, availability, [...current]);
  const unchanged = next.length === current.size && next.every((size) => current.has(size));
  if (unchanged) continue;

  const arrayText = `[${next.map((size) => JSON.stringify(size)).join(", ")}]`;
  if (nodes.soldOutSizes && next.length > 0) {
    const init = nodes.soldOutSizes.initializer;
    edits.push({ start: init.getStart(), end: init.getEnd(), insert: arrayText });
  } else if (nodes.soldOutSizes) {
    edits.push(removeProperty(nodes.soldOutSizes));
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

function updateColors(props, nodes, found, colorways, label) {
  const before = Array.isArray(props.colorways) ? props.colorways : [];
  const changes = [];
  const indent = indentOf(nodes.url);
  const anchor = nodes.colors ?? nodes.sizes ?? nodes.url;
  const inserts = [];

  // Naam van de eigen kleur, en "Fatigue Jacket - Sand" wordt "Fatigue Jacket".
  if (found && colorways.length > 0 && typeof props.colorName !== "string") {
    inserts.push(`colorName: ${JSON.stringify(found.current.name)}`);
    changes.push(`kleurnaam: ${found.current.name}`);
    const suffix = new RegExp(`\\s+[-–—|/]\\s+${found.current.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    if (found.current.base && suffix.test(props.name)) {
      const init = nodes.name.initializer;
      edits.push({ start: init.getStart(), end: init.getEnd(), insert: JSON.stringify(found.current.base) });
      changes.push(`naam: ${found.current.base}`);
    }
  }

  if (JSON.stringify(before) !== JSON.stringify(colorways)) {
    const describe = describeColorwayChanges(before, colorways);
    if (describe) changes.push(describe);
    if (colorways.length === 0) {
      edits.push(removeProperty(nodes.colorways));
    } else if (nodes.colorways) {
      const init = nodes.colorways.initializer;
      edits.push({ start: init.getStart(), end: init.getEnd(), insert: toSource(colorways, indent) });
    } else {
      inserts.push(`colorways: ${toSource(colorways, indent)}`);
    }
  }

  if (inserts.length > 0) edits.push(insertAfter(anchor, inserts.join(`,\n${indent}`)));
  if (changes.length > 0) report.colors.push(`${label}: ${changes.join("; ")}`);
}

function indentOf(prop) {
  const lineStart = text.lastIndexOf("\n", prop.getStart()) + 1;
  return text.slice(lineStart, prop.getStart());
}

/** Voegt een nieuwe property in op de regel na `prop`, met dezelfde inspringing. */
function insertAfter(prop, propertyText) {
  let end = prop.getEnd();
  if (text[end] === ",") end++;
  return { start: end, end, insert: `\n${indentOf(prop)}${propertyText},` };
}

function removeProperty(prop) {
  let end = prop.getEnd();
  if (text[end] === ",") end++;
  return { start: prop.getFullStart(), end, insert: "" };
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
  ...section("Verwijderd (in geen enkele kleur meer leverbaar)", report.removed),
  ...section("Gemarkeerd als uitverkocht", report.soldOut),
  ...section("Maten bijgewerkt", report.sizes),
  ...section("Kleuren bijgewerkt", report.colors),
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
    report.colors.length && `updated colours on ${report.colors.length}`,
  ].filter(Boolean);
  writeFileSync(process.env.STOCK_COMMIT_MESSAGE_FILE, `Stock check: ${parts.join(", ")}\n\n${summary}\n`);
}
