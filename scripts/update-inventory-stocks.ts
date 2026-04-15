/**
 * One-off inventory sync (April 2026). Safe to re-run.
 *
 * Usage: npx tsx scripts/update-inventory-stocks.ts
 * Requires: DATABASE_URL
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setStockBySku(updates: Record<string, number>) {
  for (const [sku, stock] of Object.entries(updates)) {
    const result = await prisma.productVariant.updateMany({
      where: { sku },
      data: { stock },
    });
    if (result.count === 0) {
      console.warn(`  ⚠ SKU not found (skipped): ${sku}`);
    } else {
      console.log(`  ✓ ${sku} → stock ${stock}`);
    }
  }
}

/** Plain "Mango Pickle" — match 250g / 400g / 800g by variant name if SKUs differ from MPL-* */
async function syncMangoPickleClassic() {
  const product =
    (await prisma.product.findFirst({
      where: { slug: "mango-pickle" },
      include: { variants: true },
    })) ??
    (await prisma.product.findFirst({
      where: { name: { equals: "Mango Pickle", mode: "insensitive" } },
      include: { variants: true },
    }));

  if (!product) {
    console.warn("  ⚠ No classic Mango Pickle product (slug mango-pickle or name Mango Pickle)");
    return;
  }

  const want: Record<string, number> = { "250": 20, "400": 20, "800": 20 };
  for (const v of product.variants) {
    const m = v.name.match(/(\d+)\s*g/i) ?? v.name.match(/^(\d+)/);
    const key = m?.[1];
    if (key && key in want) {
      await prisma.productVariant.update({
        where: { id: v.id },
        data: { stock: want[key] },
      });
      console.log(`  ✓ ${product.slug} variant "${v.name}" → stock ${want[key]}`);
      delete want[key];
    }
  }
  const left = Object.keys(want);
  if (left.length) {
    console.warn(`  ⚠ ${product.slug}: could not match sizes: ${left.join(", ")} (check variant names)`);
  }
}

async function main() {
  console.log("Updating variant stocks…\n");

  await setStockBySku({
    // Chilli kuccha — 200g
    "GCK-200": 20,
    // Mango Pickle (canonical SKUs from seed)
    "MPL-250": 20,
    "MPL-400": 20,
    "MPL-800": 20,
    // Sold out
    "KRN-250": 0,
    "KRN-450": 0,
    "AMR-200": 0,
    "AMR-400": 0,
    "KMM-250": 0,
    "KMM-400": 0,
    // Aam kuccha
    "AKP-400": 1,
    "AKP-450": 3,
    // Green chilli (whole)
    "GCP-250": 20,
    "GCP-450": 20,
    // Kathal — only 250g in stock
    "KTH-200": 0,
    "KTH-250": 20,
    "KTH-450": 0,
    // Lal mirch bharua
    "LMB-250": 40,
    "LMB-450": 40,
  });

  console.log("\nMango Pickle — by slug / name (non-MPL SKUs)…");
  await syncMangoPickleClassic();

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
