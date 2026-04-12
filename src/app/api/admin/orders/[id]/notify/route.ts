import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderNotifications } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      shipping: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const customerEmail = order.user?.email ?? undefined;

  console.log(`[Admin] Re-triggering notifications for order ${order.orderNumber} to ${customerEmail}`);

  await sendOrderNotifications(order, customerEmail);

  return NextResponse.json({
    success: true,
    orderNumber: order.orderNumber,
    sentTo: customerEmail,
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.FROM_EMAIL ?? "magadhrecipe@gmail.com",
  });
}
