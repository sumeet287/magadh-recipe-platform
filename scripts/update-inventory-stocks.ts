/**
 * Inventory + catalog SKU sync. Safe to re-run.
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

async function rekeyVariant(
  fromSku: string,
  toSku: string,
  patch: { name: string; mrp: number; price: number; stock?: number }
) {
  const v = await prisma.productVariant.findUnique({ where: { sku: fromSku } });
  if (!v) {
    const existing = await prisma.productVariant.findUnique({ where: { sku: toSku } });
    if (existing) {
      await prisma.productVariant.update({
        where: { sku: toSku },
        data: {
          name: patch.name,
          mrp: patch.mrp,
          price: patch.price,
          ...(patch.stock !== undefined ? { stock: patch.stock } : {}),
        },
      });
      console.log(`  ✓ ${toSku} exists — updated ${patch.name}`);
    }
    return;
  }
  const tmp = `__rk_${fromSku.replace(/[^a-z0-9]/gi, "_")}_${Math.random().toString(36).slice(2, 9)}`;
  await prisma.productVariant.update({ where: { sku: fromSku }, data: { sku: tmp } });
  await prisma.productVariant.update({
    where: { sku: tmp },
    data: {
      sku: toSku,
      name: patch.name,
      mrp: patch.mrp,
      price: patch.price,
      ...(patch.stock !== undefined ? { stock: patch.stock } : {}),
    },
  });
  console.log(`  ✓ Rekey ${fromSku} → ${toSku} (${patch.name})`);
}

/** Plain "Mango Pickle" — match sizes by variant label if SKUs differ */
async function setLemonPickleDefaultVariant() {
  const p = await prisma.product.findFirst({ where: { slug: "lemon-pickle" }, select: { id: true } });
  if (!p) return;
  await prisma.productVariant.updateMany({ where: { productId: p.id }, data: { isDefault: false } });
  const n = await prisma.productVariant.updateMany({ where: { sku: "LMP-250" }, data: { isDefault: true } });
  if (n.count) console.log("  ✓ Lemon Pickle: default → 250g (LMP-250)");
}

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

  const want: Record<string, number> = { "250": 20, "450": 20, "800": 20 };
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
  console.log("Catalog rekeys (SKUs / sizes)…\n");
  await rekeyVariant("LMP-200", "LMP-250", { name: "250g", mrp: 250, price: 225, stock: 20 });
  await rekeyVariant("MPL-400", "MPL-450", { name: "450g", mrp: 475, price: 425, stock: 20 });
  await rekeyVariant("BDH-200", "BDH-250", { name: "250g", mrp: 250, price: 225 });
  await rekeyVariant("BDH-400", "BDH-450", { name: "450g", mrp: 475, price: 425 });
  await rekeyVariant("AMR-200", "AMR-250", { name: "250g", mrp: 250, price: 225, stock: 0 });
  await rekeyVariant("AMR-400", "AMR-450", { name: "450g", mrp: 475, price: 425, stock: 0 });

  console.log("\nDeactivate removed garlic 200g…");
  const g = await prisma.productVariant.updateMany({
    where: { sku: "GRP-200" },
    data: { isActive: false, stock: 0 },
  });
  if (g.count) console.log(`  ✓ GRP-200 deactivated (${g.count})`);
  else console.log("  (GRP-200 not present — ok)");

  console.log("\nUpdating variant stocks…\n");

  await setStockBySku({
    "GCK-200": 20,
    "MPL-250": 20,
    "MPL-450": 20,
    "MPL-800": 20,
    "KRN-250": 0,
    "KRN-450": 0,
    "AMR-250": 0,
    "AMR-450": 0,
    "KMM-250": 0,
    "KMM-400": 0,
    "AKP-200": 1,
    "AKP-250": 0,
    "AKP-400": 1,
    "AKP-450": 2,
    "GCP-250": 20,
    "GCP-450": 20,
    "KTH-200": 0,
    "KTH-250": 20,
    "KTH-450": 0,
    "LMB-250": 40,
    "LMB-450": 40,
    "BDH-250": 40,
    "BDH-450": 25,
    "LMP-250": 20,
    "LMP-400": 1,
  });

  console.log("\nLemon Pickle default size…");
  await setLemonPickleDefaultVariant();

  console.log("\nMango Pickle — by slug / name (fallback)…");
  await syncMangoPickleClassic();

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
