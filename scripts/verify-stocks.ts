import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHECK_SKUS = [
  "KTH-450",
  "KTH-250",
  "AKP-200",
  "AKP-400",
  "AKP-450",
  "LMP-400",
  "LMP-450",
  "GCK-250",
  "GCK-450",
  "KML-450",
];

async function main() {
  const variants = await prisma.productVariant.findMany({
    where: { sku: { in: CHECK_SKUS } },
    include: { product: { select: { name: true } } },
    orderBy: { sku: "asc" },
  });
  console.log("\nFinal stock verification:\n");
  for (const v of variants) {
    console.log(`  ${v.sku.padEnd(9)} ${v.name.padEnd(5)} stock=${String(v.stock).padStart(3)} active=${v.isActive}  — ${v.product.name}`);
  }
  const found = new Set(variants.map((v) => v.sku));
  const missing = CHECK_SKUS.filter((s) => !found.has(s));
  if (missing.length) console.log(`\n  Missing: ${missing.join(", ")}`);
}

main().finally(() => prisma.$disconnect());
