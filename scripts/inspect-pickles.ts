import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: "Lemon", mode: "insensitive" } },
        { name: { contains: "Green Chilli", mode: "insensitive" } },
      ],
    },
    include: { variants: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  for (const p of products) {
    console.log(`\n=== ${p.name} (slug=${p.slug}, id=${p.id}) ===`);
    for (const v of p.variants) {
      console.log(`  • ${v.name} [SKU:${v.sku}] stock=${v.stock} mrp=${v.mrp} price=${v.price} active=${v.isActive}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
