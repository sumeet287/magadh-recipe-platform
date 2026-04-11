import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT ?? 465);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.resend.com",
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER ?? "resend",
    pass: process.env.SMTP_PASS ?? process.env.RESEND_API_KEY ?? "",
  },
});

interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendMail(options: SendMailOptions) {
  const { to, subject, html, text, from } = options;
  try {
    const info = await transporter.sendMail({
      from: from ?? `Magadh Recipe <${process.env.FROM_EMAIL ?? "noreply@magadhrecipe.com"}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      text,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return { success: false, error };
  }
}

// ---- Helpers ----

interface PrismaOrderForEmail {
  orderNumber: string;
  subtotalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
  }>;
  shipping?: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
  } | null;
  user?: { name?: string | null; email?: string | null } | null;
}

export function mapOrderToEmailData(order: PrismaOrderForEmail, customerName?: string) {
  const shipping = order.shipping;
  const deliveryAddress = shipping
    ? [shipping.addressLine1, shipping.addressLine2, `${shipping.city}, ${shipping.state} ${shipping.pincode}`]
        .filter(Boolean)
        .join(", ")
    : "N/A";

  return {
    orderNumber: order.orderNumber,
    customerName: customerName ?? shipping?.recipientName ?? order.user?.name ?? "Customer",
    items: order.items.map((item) => ({
      name: item.productName,
      variant: item.variantName,
      qty: item.quantity,
      price: item.unitPrice,
    })),
    subtotal: order.subtotalAmount,
    shipping: order.shippingAmount,
    discount: order.discountAmount,
    total: order.totalAmount,
    deliveryAddress,
  };
}

// ---- Email Templates ----

export function orderConfirmationHtml(data: {
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; variant: string; qty: number; price: number }>;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  deliveryAddress: string;
}): string {
  const { orderNumber, customerName, items, subtotal, shipping, discount, total, deliveryAddress } = data;

  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0e6d6;">${item.name} — ${item.variant}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0e6d6;text-align:center;">${item.qty}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0e6d6;text-align:right;">₹${item.price * item.qty}</td>
        </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmed – Magadh Recipe</title></head>
<body style="margin:0;padding:0;background:#FDF8F0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF8F0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(44,24,16,0.10);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2C1810,#5C2E15);padding:32px 40px;text-align:center;">
            <h1 style="color:#D4843A;margin:0;font-size:28px;letter-spacing:2px;">MAGADH RECIPE</h1>
            <p style="color:#f0c579;margin:8px 0 0;font-size:14px;letter-spacing:1px;">आचार की असली पहचान</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#2C1810;margin:0 0 8px;font-size:22px;">Order Confirmed! 🎉</h2>
            <p style="color:#5C3D2E;margin:0 0 24px;">Hi ${customerName}, your order has been placed successfully.</p>
            
            <div style="background:#FDF8F0;border-radius:8px;padding:16px;margin-bottom:24px;border-left:4px solid #D4843A;">
              <p style="margin:0;color:#2C1810;font-size:18px;font-weight:bold;">Order #${orderNumber}</p>
            </div>

            <h3 style="color:#2C1810;margin:0 0 12px;font-size:16px;">Items Ordered</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0e6d6;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              <thead>
                <tr style="background:#FDF8F0;">
                  <th style="padding:10px 12px;text-align:left;color:#2C1810;font-size:13px;">Item</th>
                  <th style="padding:10px 12px;text-align:center;color:#2C1810;font-size:13px;">Qty</th>
                  <th style="padding:10px 12px;text-align:right;color:#2C1810;font-size:13px;">Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td style="padding:4px 0;color:#5C3D2E;">Subtotal</td><td style="text-align:right;color:#2C1810;">₹${subtotal}</td></tr>
              ${discount > 0 ? `<tr><td style="padding:4px 0;color:#22c55e;">Discount</td><td style="text-align:right;color:#22c55e;">-₹${discount}</td></tr>` : ""}
              <tr><td style="padding:4px 0;color:#5C3D2E;">Shipping</td><td style="text-align:right;color:#2C1810;">${shipping === 0 ? "FREE" : "₹" + shipping}</td></tr>
              <tr><td style="padding:8px 0;color:#2C1810;font-weight:bold;font-size:16px;border-top:2px solid #f0e6d6;">Total</td><td style="text-align:right;color:#D4843A;font-weight:bold;font-size:18px;border-top:2px solid #f0e6d6;">₹${total}</td></tr>
            </table>

            <div style="background:#FDF8F0;border-radius:8px;padding:16px;margin-bottom:24px;">
              <h4 style="margin:0 0 8px;color:#2C1810;">Delivery Address</h4>
              <p style="margin:0;color:#5C3D2E;font-size:14px;line-height:1.6;">${deliveryAddress}</p>
            </div>

            <p style="color:#5C3D2E;margin:0 0 24px;">We'll notify you once your order is shipped. Expected delivery: 3-7 business days.</p>
            
            <div style="text-align:center;">
              <a href="${process.env.NEXTAUTH_URL}/account/orders" 
                 style="display:inline-block;background:#D4843A;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:bold;letter-spacing:1px;">
                TRACK YOUR ORDER
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#2C1810;padding:24px 40px;text-align:center;">
            <p style="color:#f0c579;margin:0 0 8px;font-size:13px;">Questions? Contact us at <a href="mailto:support@magadhrecipe.com" style="color:#D4843A;">support@magadhrecipe.com</a></p>
            <p style="color:#8B6040;margin:0;font-size:12px;">© ${new Date().getFullYear()} Magadh Recipe. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function otpEmailHtml(otp: string, name?: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:32px;background:#FDF8F0;font-family:Georgia,serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 16px rgba(44,24,16,0.10);">
    <h1 style="color:#D4843A;margin:0 0 8px;font-size:24px;">MAGADH RECIPE</h1>
    <h2 style="color:#2C1810;margin:0 0 16px;font-size:18px;">Your Verification Code</h2>
    ${name ? `<p style="color:#5C3D2E;margin:0 0 24px;">Hi ${name},</p>` : ""}
    <p style="color:#5C3D2E;margin:0 0 24px;">Use this OTP to verify your account. It expires in 10 minutes.</p>
    <div style="background:#FDF8F0;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;border:2px dashed #D4843A;">
      <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2C1810;">${otp}</span>
    </div>
    <p style="color:#9B7B5C;font-size:13px;margin:0;">If you didn't request this, please ignore this email.</p>
  </div>
</body>
</html>`;
}

// ---- Email Verification ----

export function verificationEmailHtml(data: { name?: string; verifyUrl: string }): string {
  const { name, verifyUrl } = data;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Verify Your Email – Magadh Recipe</title></head>
<body style="margin:0;padding:0;background:#FDF8F0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF8F0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(44,24,16,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2C1810,#5C2E15);padding:32px 40px;text-align:center;">
            <h1 style="color:#D4843A;margin:0;font-size:28px;letter-spacing:2px;">MAGADH RECIPE</h1>
            <p style="color:#f0c579;margin:8px 0 0;font-size:14px;letter-spacing:1px;">आचार की असली पहचान</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#2C1810;margin:0 0 8px;font-size:22px;">Verify Your Email Address</h2>
            ${name ? `<p style="color:#5C3D2E;margin:0 0 24px;">Hi ${name},</p>` : ""}
            <p style="color:#5C3D2E;margin:0 0 24px;">Thanks for creating an account with Magadh Recipe! Please verify your email address by clicking the button below.</p>

            <div style="text-align:center;margin:32px 0;">
              <a href="${verifyUrl}"
                 style="display:inline-block;background:#D4843A;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:bold;letter-spacing:1px;">
                VERIFY EMAIL
              </a>
            </div>

            <p style="color:#5C3D2E;margin:0 0 16px;font-size:14px;">Or copy and paste this link into your browser:</p>
            <p style="color:#D4843A;margin:0 0 24px;font-size:13px;word-break:break-all;">${verifyUrl}</p>

            <div style="background:#FDF8F0;border-radius:8px;padding:16px;border-left:4px solid #D4843A;">
              <p style="margin:0;color:#5C3D2E;font-size:13px;">This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#2C1810;padding:24px 40px;text-align:center;">
            <p style="color:#f0c579;margin:0 0 8px;font-size:13px;">Questions? Contact us at <a href="mailto:support@magadhrecipe.com" style="color:#D4843A;">support@magadhrecipe.com</a></p>
            <p style="color:#8B6040;margin:0;font-size:12px;">&copy; ${new Date().getFullYear()} Magadh Recipe. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---- Admin New Order Notification ----

export function newOrderAdminHtml(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ name: string; variant: string; qty: number; price: number }>;
  total: number;
  paymentMethod: string;
  deliveryAddress: string;
}): string {
  const { orderNumber, customerName, customerEmail, customerPhone, items, total, paymentMethod, deliveryAddress } = data;

  const itemRows = items
    .map(
      (item) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${item.name} (${item.variant})</td><td style="padding:6px 8px;text-align:center;border-bottom:1px solid #eee;">${item.qty}</td><td style="padding:6px 8px;text-align:right;border-bottom:1px solid #eee;">₹${item.price * item.qty}</td></tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Order – Magadh Recipe</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#2C1810;padding:20px 24px;">
          <h1 style="color:#D4843A;margin:0;font-size:20px;">NEW ORDER RECEIVED</h1>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:15px;"><strong>Order #${orderNumber}</strong> &mdash; <strong style="color:#D4843A;">₹${total}</strong> via ${paymentMethod}</p>
          <h3 style="margin:0 0 8px;font-size:14px;color:#666;">Customer</h3>
          <p style="margin:0 0 16px;font-size:14px;">${customerName}<br/>${customerEmail}<br/>${customerPhone}</p>
          <h3 style="margin:0 0 8px;font-size:14px;color:#666;">Items</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:16px;">
            <thead><tr style="background:#f9f9f9;"><th style="padding:6px 8px;text-align:left;">Item</th><th style="padding:6px 8px;text-align:center;">Qty</th><th style="padding:6px 8px;text-align:right;">Total</th></tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
          <h3 style="margin:0 0 8px;font-size:14px;color:#666;">Delivery Address</h3>
          <p style="margin:0;font-size:14px;">${deliveryAddress}</p>
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:16px 24px;text-align:center;">
          <a href="${process.env.NEXTAUTH_URL}/admin/orders" style="color:#D4843A;font-size:13px;">View in Admin Panel</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---- Order Status Change Emails ----

export function orderShippedHtml(data: {
  orderNumber: string;
  customerName: string;
  trackingNumber?: string;
  trackingUrl?: string;
  courier?: string;
}): string {
  const { orderNumber, customerName, trackingNumber, trackingUrl, courier } = data;
  const trackingBlock = trackingNumber
    ? `<div style="background:#FDF8F0;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #D4843A;">
        <p style="margin:0;font-size:14px;color:#2C1810;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
        ${courier ? `<p style="margin:4px 0 0;font-size:13px;color:#5C3D2E;">Courier: ${courier}</p>` : ""}
        ${trackingUrl ? `<p style="margin:8px 0 0;"><a href="${trackingUrl}" style="color:#D4843A;font-size:13px;">Track your package →</a></p>` : ""}
       </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FDF8F0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF8F0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(44,24,16,0.10);">
        <tr><td style="background:linear-gradient(135deg,#2C1810,#5C2E15);padding:24px 40px;text-align:center;">
          <h1 style="color:#D4843A;margin:0;font-size:24px;letter-spacing:2px;">MAGADH RECIPE</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#2C1810;margin:0 0 8px;">Your Order Has Been Shipped! 📦</h2>
          <p style="color:#5C3D2E;margin:0 0 16px;">Hi ${customerName}, great news — your order <strong>#${orderNumber}</strong> is on its way!</p>
          ${trackingBlock}
          <p style="color:#5C3D2E;margin:16px 0;">Expected delivery: 3-7 business days.</p>
          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.NEXTAUTH_URL}/account/orders" style="display:inline-block;background:#D4843A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:bold;">TRACK ORDER</a>
          </div>
        </td></tr>
        <tr><td style="background:#2C1810;padding:16px 40px;text-align:center;">
          <p style="color:#8B6040;margin:0;font-size:12px;">&copy; ${new Date().getFullYear()} Magadh Recipe. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function orderDeliveredHtml(data: { orderNumber: string; customerName: string }): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FDF8F0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF8F0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(44,24,16,0.10);">
        <tr><td style="background:linear-gradient(135deg,#2C1810,#5C2E15);padding:24px 40px;text-align:center;">
          <h1 style="color:#D4843A;margin:0;font-size:24px;letter-spacing:2px;">MAGADH RECIPE</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#2C1810;margin:0 0 8px;">Order Delivered! 🎉</h2>
          <p style="color:#5C3D2E;margin:0 0 16px;">Hi ${data.customerName}, your order <strong>#${data.orderNumber}</strong> has been delivered successfully.</p>
          <p style="color:#5C3D2E;">We hope you enjoy Maa ke Haath ka Swaad! If you love it, please leave us a review.</p>
          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.NEXTAUTH_URL}/account/orders" style="display:inline-block;background:#D4843A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:bold;">LEAVE A REVIEW</a>
          </div>
        </td></tr>
        <tr><td style="background:#2C1810;padding:16px 40px;text-align:center;">
          <p style="color:#8B6040;margin:0;font-size:12px;">&copy; ${new Date().getFullYear()} Magadh Recipe. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function orderCancelledHtml(data: { orderNumber: string; customerName: string; reason?: string }): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FDF8F0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF8F0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(44,24,16,0.10);">
        <tr><td style="background:linear-gradient(135deg,#2C1810,#5C2E15);padding:24px 40px;text-align:center;">
          <h1 style="color:#D4843A;margin:0;font-size:24px;letter-spacing:2px;">MAGADH RECIPE</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#2C1810;margin:0 0 8px;">Order Cancelled</h2>
          <p style="color:#5C3D2E;margin:0 0 16px;">Hi ${data.customerName}, your order <strong>#${data.orderNumber}</strong> has been cancelled.</p>
          ${data.reason ? `<p style="color:#5C3D2E;">Reason: ${data.reason}</p>` : ""}
          <p style="color:#5C3D2E;">If you paid online, the refund will be processed within 5-7 business days.</p>
          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.NEXTAUTH_URL}" style="display:inline-block;background:#D4843A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:bold;">SHOP AGAIN</a>
          </div>
        </td></tr>
        <tr><td style="background:#2C1810;padding:16px 40px;text-align:center;">
          <p style="color:#8B6040;margin:0;font-size:12px;">&copy; ${new Date().getFullYear()} Magadh Recipe. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---- Helper to send admin + WhatsApp notification for new orders ----

export async function sendOrderNotifications(order: PrismaOrderForEmail, customerEmail?: string) {
  const emailData = mapOrderToEmailData(order);
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.FROM_EMAIL ?? "magadhrecipe@gmail.com";
  const customerPhone = order.shipping?.phone ?? "";

  // Customer confirmation email
  if (customerEmail) {
    sendMail({
      to: customerEmail,
      subject: `Order Confirmed – #${order.orderNumber}`,
      html: orderConfirmationHtml(emailData),
    }).catch((e) => console.error("[Email] Customer confirmation failed:", e));
  }

  // Admin notification email
  sendMail({
    to: adminEmail,
    subject: `🛒 New Order #${order.orderNumber} — ₹${order.totalAmount}`,
    html: newOrderAdminHtml({
      ...emailData,
      customerEmail: customerEmail ?? order.user?.email ?? "N/A",
      customerPhone,
      paymentMethod: order.paymentMethod,
    }),
  }).catch((e) => console.error("[Email] Admin notification failed:", e));

  // WhatsApp notification (if configured)
  sendWhatsAppOrderNotification(order).catch((e) => console.error("[WhatsApp] Notification failed:", e));
}

// ---- WhatsApp Integration ----

export async function sendWhatsAppOrderNotification(order: PrismaOrderForEmail) {
  const apiKey = process.env.WHATSAPP_API_KEY;
  const apiUrl = process.env.WHATSAPP_API_URL;
  const phone = process.env.WHATSAPP_PHONE_NUMBER;

  if (!apiKey || !apiUrl || !phone) return;

  const itemsSummary = order.items.map((i) => `${i.productName} (${i.variantName}) x${i.quantity}`).join(", ");
  const message = `🛒 *New Order #${order.orderNumber}*\n💰 Amount: ₹${order.totalAmount}\n💳 Payment: ${order.paymentMethod}\n📦 Items: ${itemsSummary}\n👤 ${order.shipping?.recipientName ?? "Customer"}\n📍 ${order.shipping?.city ?? ""}, ${order.shipping?.state ?? ""} ${order.shipping?.pincode ?? ""}\n📞 ${order.shipping?.phone ?? "N/A"}`;

  try {
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ phone, message }),
    });
  } catch (error) {
    console.error("[WhatsApp] Failed to send notification:", error);
  }
}
