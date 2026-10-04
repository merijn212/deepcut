// Vaste lijsten waar je items aan koppelt. Voeg hier gerust categorieën of kleuren
// aan toe; TypeScript zorgt dat items alleen bestaande waarden kunnen gebruiken.

export const CATEGORIES = [
  { id: "tees", label: "T-shirts" },
  { id: "longsleeves", label: "Longsleeves" },
  { id: "hoodies", label: "Hoodies" },
  { id: "sweaters", label: "Sweaters" },
  { id: "knitwear", label: "Knitwear" },
  { id: "shirts", label: "Shirts" },
  { id: "jackets", label: "Jackets" },
  { id: "pants", label: "Trousers" },
  { id: "jeans", label: "Jeans" },
  { id: "shorts", label: "Shorts" },
  { id: "tracksuits", label: "Tracksuits" },
  { id: "headwear", label: "Headwear" },
  { id: "bags", label: "Bags" },
  { id: "accessories", label: "Accessories" },
  { id: "footwear", label: "Footwear" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const COLORS = {
  black: { label: "Black", swatch: "#141414" },
  white: { label: "White", swatch: "#f6f5f0" },
  cream: { label: "Cream", swatch: "#ece3cf" },
  grey: { label: "Grey", swatch: "#9b9b98" },
  beige: { label: "Beige", swatch: "#cdb994" },
  brown: { label: "Brown", swatch: "#6b4a32" },
  green: { label: "Green", swatch: "#475b3c" },
  blue: { label: "Blue", swatch: "#2c4f8f" },
  navy: { label: "Navy", swatch: "#1d2640" },
  red: { label: "Red", swatch: "#b0261e" },
  pink: { label: "Pink", swatch: "#e7a9bb" },
  purple: { label: "Purple", swatch: "#6a4c8c" },
  yellow: { label: "Yellow", swatch: "#e5c22e" },
  orange: { label: "Orange", swatch: "#e0702a" },
  multi: {
    label: "Multi",
    swatch: "conic-gradient(#b0261e, #e5c22e, #475b3c, #2c4f8f, #6a4c8c, #b0261e)",
  },
} as const;

export type ColorId = keyof typeof COLORS;

// Volgorde waarin maten getoond worden. Onbekende maten komen erachter
// (cijfers oplopend, daarna alfabetisch).
export const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "One size"];

export function getCategoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function compareSizes(a: string, b: string): number {
  const ia = SIZE_ORDER.indexOf(a);
  const ib = SIZE_ORDER.indexOf(b);
  if (ia !== -1 || ib !== -1) {
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  }
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return a.localeCompare(b, "en");
}
