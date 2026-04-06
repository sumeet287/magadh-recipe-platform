import nodemailer from "nodemailer";

// Resend or SMTP transport — configure via env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.resend.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
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
