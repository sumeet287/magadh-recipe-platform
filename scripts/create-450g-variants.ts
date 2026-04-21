/**
 * Creates new 450g variants for Lemon Pickle (LMP-450) and Green Chilli Kuccha
 * Pickle (GCK-450), and sets LMP-400 stock to 0 (out of stock).
 *
 * Pricing follows existing 450g standard seen in DB:
 *   - mrp: 475
 *   - price: 425
 *
 * Usage: DATABASE_URL='...' npx tsx scripts/create-450g-variants.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MRP_450 = 475;
const PRICE_450 = 425;

async function createVariant(productSlug: string, sku: string, stock: number) {
  const product = await prisma.product.findUnique({
    where: { slug: productSlug },
    include: { variants: { orderBy: { sortOrder: "desc" }, take: 1 } },
  });

  if (!product) {
    console.warn(`  ⚠ Product not found: ${productSlug}`);
    return;
  }

  const existing = await prisma.productVariant.findUnique({ where: { sku } });
  if (existing) {
    console.log(`  ℹ SKU ${sku} already exists — updating stock to ${stock}`);
    await prisma.productVariant.update({
      where: { sku },
      data: { stock, isActive: true, mrp: MRP_450, price: PRICE_450 },
    });
    return;
  }

  const nextSortOrder = (product.variants[0]?.sortOrder ?? 0) + 10;

  const v = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: "450g",
      sku,
      mrp: MRP_450,
      price: PRICE_450,
      stock,
      isActive: true,
      isDefault: false,
      sortOrder: nextSortOrder,
    },
  });
  console.log(
    `  ✓ Created ${v.sku} for "${product.name}" — name=450g mrp=${v.mrp} price=${v.price} stock=${v.stock} sortOrder=${v.sortOrder}`
  );
}

async function main() {
  console.log("Creating new 450g variants…\n");

  await createVariant("lemon-pickle", "LMP-450", 10);
  await createVariant("green-chilli-kuccha-pickle", "GCK-450", 20);

  console.log("\nSetting LMP-400 out of stock…");
  const res = await prisma.productVariant.updateMany({
    where: { sku: "LMP-400" },
    data: { stock: 0 },
  });
  if (res.count) console.log(`  ✓ LMP-400 → stock 0`);
  else console.warn("  ⚠ LMP-400 not found");

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
