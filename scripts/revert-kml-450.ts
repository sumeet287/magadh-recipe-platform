import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.productVariant.update({
    where: { sku: "KML-450" },
    data: { stock: 60 },
  });
  console.log(`✓ Reverted ${result.sku} → stock ${result.stock}`);
}

main().finally(() => prisma.$disconnect());
