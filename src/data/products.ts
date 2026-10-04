import type { Product } from "./types";

// Nieuwste items bovenaan. Zie README.md voor uitleg over alle velden.
// Prijzen zijn de europrijzen uit de shop van het merk.
export const products: Product[] = [
  {
    id: "ronning-work-pant-black",
    name: "Work Pant - Black",
    brand: "ronning",
    category: "pants",
    price: 198.95,
    images: [
      "https://cdn.shopify.com/s/files/1/1649/1143/files/BLACKWORKPANT1.jpg",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/BLACKWORKPANT2.jpg",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/workpantblack1.jpg",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/workpantblack3.jpg",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/Ronning_ec2_0683440.jpg",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/Ronning_ec2_0565431.jpg",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/BLACKWORKPANT4.jpg",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/BLACKWORKPANT3.jpg",
    ],
    sizes: ["28 R", "30 R", "32 R", "34 R", "36 R", "28 L", "30 L", "32 L", "34 L", "36 L"],
    soldOutSizes: ["28 L"],
    colors: ["zwart"],
    description:
      "Workwear you'd wear off the clock. Heavy cotton canvas and knee darts give you room to move: somewhere between jeans and carpenter pants. Heavyweight cotton canvas, darted knees, garment-dyed black, tonal script embroidery, concealed welt pocket and a black leather branded patch.",
    url: "https://www.ronning.store/products/work-pant-black",
    addedAt: "2026-10-04",
    featured: true,
    tags: ["workwear", "canvas", "garment dyed"],
  },
  {
    id: "ronning-fatigue-jacket-sand",
    name: "Fatigue Jacket - Sand",
    brand: "ronning",
    category: "jackets",
    price: 222.95,
    images: [
      "https://cdn.shopify.com/s/files/1/1649/1143/files/fatiguefront.png",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/SANDFATIGUEFRONT.png",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/IMG_1048_1_1.png",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/fatigueback.png",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/sandfatigueback.png",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/SANDFATIGUEFRONTZOOM.png",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["beige"],
    description:
      "Takes its design from classic military styling and softens to your torso the more you wear it. Heavyweight cotton canvas, triple-stitch construction, garment-dyed sand colour, tonal embroidery, custom branded metal hardware and a back neck hook.",
    url: "https://www.ronning.store/products/fatigue-jacket-sand",
    addedAt: "2026-10-04",
    featured: true,
    tags: ["workwear", "military", "canvas", "garment dyed"],
  },
  {
    id: "ronning-everyday-shirt-baby-blue-seersucker",
    name: "Everyday Shirt - Baby Blue Seersucker",
    brand: "ronning",
    category: "shirts",
    price: 162.95,
    images: [
      "https://cdn.shopify.com/s/files/1/1649/1143/files/seersuckerfront.png",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/seersuckerfrontpose.png",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/IMG_4358-3.jpg",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/seersuckerblueshirt.png",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/seersuckerfullront.png",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/seersuckerbackfull.png",
      "https://cdn.shopify.com/s/files/1/1649/1143/files/BABY-BLUE-SEERSUCKER-SHIRT_ff3ce621-23c5-4707-89cf-a8334ca908b4.jpg",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["lichtblauw"],
    description:
      "The one you'll keep reaching for: on its own, over a tank top or under your favourite knit. Long-sleeve button-up in 100% cotton striped seersucker from Portugal, with a classic unstructured stand collar.",
    url: "https://www.ronning.store/products/everyday-shirt-baby-blue-seersucker",
    addedAt: "2026-10-04",
    featured: true,
    tags: ["seersucker", "stripes", "cotton"],
  },
];
