import { PrismaClient } from "@prisma/client";
import { sendOrderNotifications } from "../src/lib/email";

const PROD_DB_URL =
  "postgresql://neondb_owner:npg_DC2qLfxESl6s@ep-sparkling-boat-a1agznd1.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: PROD_DB_URL } } });

  const pooja = await prisma.user.findFirst({
    where: { email: { contains: "pooja", mode: "insensitive" } },
    select: { id: true, email: true, name: true },
  });

  if (!pooja) {
    console.log("Pooja not found in DB");
    return;
  }
  console.log("Found user:", pooja);

  const order = await prisma.order.findFirst({
    where: { userId: pooja.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      shipping: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!order) {
    console.log("No orders found for Pooja");
    return;
  }

  console.log(`Latest order: #${order.orderNumber} | ₹${order.totalAmount} | ${order.status} | ${order.createdAt}`);
  console.log(`Items: ${order.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")}`);
  console.log(`Shipping to: ${order.shipping?.recipientName} @ ${order.shipping?.city}`);
  console.log(`\nSending emails...`);
  console.log(`FROM_EMAIL = ${process.env.FROM_EMAIL}`);
  console.log(`ADMIN_NOTIFICATION_EMAIL = ${process.env.ADMIN_NOTIFICATION_EMAIL}`);

  await sendOrderNotifications(order, pooja.email);

  console.log("\nDone!");
  await prisma.$disconnect();
}

main().catch(console.error);
