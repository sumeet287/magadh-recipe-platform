/**
 * Batch stock update by product slug / name + variant size.
 * Does NOT depend on SKU — matches variant by name containing the size (e.g. "450g").
 *
 * Usage: npx tsx scripts/update-stock-batch.ts
 * Requires: DATABASE_URL (set to PROD URL to update prod)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface StockUpdate {
  productMatch: { slug?: string; nameLike?: string };
  sizeLabel: string; // e.g. "450g", "250g"
  stock: number;
}

const UPDATES: StockUpdate[] = [
  { productMatch: { nameLike: "Kathal Pickle" }, sizeLabel: "450g", stock: 4 },
  { productMatch: { nameLike: "Kathal Pickle" }, sizeLabel: "250g", stock: 25 },
  { productMatch: { nameLike: "Aam Kuccha Pickle" }, sizeLabel: "400g", stock: 0 },
  { productMatch: { nameLike: "Aam Kuccha Pickle" }, sizeLabel: "450g", stock: 3 },
  { productMatch: { nameLike: "Aam Kuccha Pickle" }, sizeLabel: "200g", stock: 0 },
  { productMatch: { nameLike: "Lemon Pickle" }, sizeLabel: "400g", stock: 0 },
  { productMatch: { nameLike: "Lemon Pickle" }, sizeLabel: "450g", stock: 10 },
  { productMatch: { nameLike: "Green Chilli Kuccha Pickle" }, sizeLabel: "450g", stock: 20 },
  { productMatch: { nameLike: "Green Chilli Kuccha Pickle" }, sizeLabel: "250g", stock: 20 },
];

async function applyUpdate(u: StockUpdate) {
  const product = await prisma.product.findFirst({
    where: u.productMatch.slug
      ? { slug: u.productMatch.slug }
      : { name: { contains: u.productMatch.nameLike!, mode: "insensitive" } },
    include: { variants: true },
  });

  if (!product) {
    console.warn(`  ⚠ Product not found: ${u.productMatch.nameLike ?? u.productMatch.slug}`);
    return;
  }

  // Match variant by size label (e.g. "450g") contained in variant name (case-insensitive, ignore spaces)
  const target = u.sizeLabel.replace(/\s+/g, "").toLowerCase();
  const variant = product.variants.find((v) => {
    const name = v.name.replace(/\s+/g, "").toLowerCase();
    return name.includes(target);
  });

  if (!variant) {
    const variantNames = product.variants.map((v) => v.name).join(", ");
    console.warn(
      `  ⚠ Variant "${u.sizeLabel}" not found for "${product.name}". Available: [${variantNames}]`
    );
    return;
  }

  const prevStock = variant.stock;
  await prisma.productVariant.update({
    where: { id: variant.id },
    data: { stock: u.stock },
  });

  console.log(
    `  ✓ ${product.name} / ${variant.name} [SKU:${variant.sku}] stock ${prevStock} → ${u.stock}`
  );
}

async function main() {
  console.log(`DB: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@")}\n`);
  console.log(`Applying ${UPDATES.length} stock updates…\n`);

  for (const update of UPDATES) {
    await applyUpdate(update);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
