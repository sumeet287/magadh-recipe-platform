import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderNotifications } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  // Allow admin session OR a secret key for testing
  const adminSecret = req.nextUrl.searchParams.get("key");
  const isAdmin = session?.user?.role === "ADMIN";
  const hasValidKey = adminSecret && adminSecret === process.env.NEXTAUTH_SECRET;

  if (!isAdmin && !hasValidKey) {
    return NextResponse.json(
      { error: "Unauthorized", session: session ? { role: session.user.role, email: session.user.email } : null },
      { status: 401 }
    );
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

  // "includeCustomer" query param — default false (admin-only resend).
  // Customer confirmation is sent once during checkout; the resend button is
  // meant to re-deliver admin email + WhatsApp when those are missed.
  const includeCustomer = req.nextUrl.searchParams.get("includeCustomer") === "true";

  console.log(
    `[Admin] Re-triggering notifications for order ${order.orderNumber} | admin=yes customer=${
      includeCustomer ? customerEmail : "skipped"
    }`
  );

  await sendOrderNotifications(order, customerEmail, { skipCustomer: !includeCustomer });

  return NextResponse.json({
    success: true,
    orderNumber: order.orderNumber,
    sentTo: includeCustomer ? customerEmail : null,
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.FROM_EMAIL ?? "magadhrecipe@gmail.com",
    whatsappSent: !!process.env.WHATSAPP_ACCESS_TOKEN,
  });
}
