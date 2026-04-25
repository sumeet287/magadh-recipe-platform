// ==================== WhatsApp Helpers (Meta Cloud API) ====================
// All outbound WhatsApp messaging flows through this module. We speak to the
// Meta Graph API directly — no third-party provider — because the rest of the
// platform is already using Meta Cloud API for order notifications.

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

const DEFAULT_TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en";

export const WHATSAPP_TEMPLATES = {
  orderNotification:
    process.env.WHATSAPP_TEMPLATE_ORDER_NOTIFICATION ?? "order_notification",
  abandonedCheckoutCoupon:
    process.env.WHATSAPP_TEMPLATE_ABANDONED_CHECKOUT ?? "abandoned_checkout_coupon",
} as const;

export type TemplateParam = { type: "text"; text: string };

/**
 * Ensure a phone is in Meta's E.164-ish format (digits only, country-coded).
 * If the user stored a bare 10-digit Indian number we prefix "91".
 */
export function normalizeWhatsappNumber(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

export type SendTemplateResult =
  | { success: true; messageId?: string }
  | { success: false; error: string; status?: number };

/**
 * Send a generic WhatsApp template message through the Meta Cloud API.
 * `parameters` is the ordered list of {{1}}, {{2}}, ... body substitutions.
 *
 * Returns a structured result so callers can persist send status without
 * throwing (e.g. broadcast recipients loop).
 */
export async function sendWhatsAppTemplate(args: {
  to: string;
  templateName: string;
  parameters?: string[];
  languageCode?: string;
}): Promise<SendTemplateResult> {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    return { success: false, error: "WhatsApp credentials not configured" };
  }

  const normalizedTo = normalizeWhatsappNumber(args.to);
  if (!normalizedTo) {
    return { success: false, error: "Invalid recipient phone number" };
  }

  const parameters: TemplateParam[] = (args.parameters ?? []).map((text) => ({
    type: "text",
    text: sanitizeTemplateParam(text),
  }));

  const payload = {
    messaging_product: "whatsapp" as const,
    to: normalizedTo,
    type: "template" as const,
    template: {
      name: args.templateName,
      language: { code: args.languageCode ?? DEFAULT_TEMPLATE_LANGUAGE },
      components:
        parameters.length > 0
          ? [
              {
                type: "body" as const,
                parameters,
              },
            ]
          : [],
    },
  };

  try {
    const res = await fetch(`${META_GRAPH_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText, status: res.status };
    }

    const body = (await res.json()) as {
      messages?: Array<{ id?: string }>;
    };
    const messageId = body?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * WhatsApp template parameter values cannot contain newlines, tabs, or
 * 4+ consecutive whitespace characters (Meta error 132018). This strips those.
 */
export function sanitizeTemplateParam(value: string): string {
  return String(value)
    .replace(/[\n\r\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ==================== Typed helpers for known templates ====================

export interface OrderForWhatsApp {
  orderNumber: string;
  totalAmount: number;
  items: Array<{ productName: string; variantName: string; quantity: number }>;
  shipping?: {
    recipientName?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
}

export async function sendOrderNotificationToAdmin(order: OrderForWhatsApp): Promise<SendTemplateResult> {
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
  if (!adminPhone) {
    return { success: false, error: "WHATSAPP_ADMIN_PHONE not set" };
  }

  const items = order.items
    .map((i) => `${i.productName} (${i.variantName}) x${i.quantity}`)
    .join(", ");
  const customerLine = [
    order.shipping?.recipientName ?? "Customer",
    order.shipping?.phone ?? "N/A",
    [order.shipping?.city, order.shipping?.state].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  const details = `${items} | ${customerLine}`;

  return sendWhatsAppTemplate({
    to: adminPhone,
    templateName: WHATSAPP_TEMPLATES.orderNotification,
    parameters: [`#${order.orderNumber}`, `Rs.${order.totalAmount}`, details],
  });
}

export interface AbandonedCheckoutPayload {
  to: string;
  customerName: string;
  couponCode: string;
  expiresAt: Date;
  recoveryUrl: string;
}

export async function sendAbandonedCheckoutCoupon(
  payload: AbandonedCheckoutPayload
): Promise<SendTemplateResult> {
  const expiry = payload.expiresAt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return sendWhatsAppTemplate({
    to: payload.to,
    templateName: WHATSAPP_TEMPLATES.abandonedCheckoutCoupon,
    parameters: [
      payload.customerName || "there",
      payload.couponCode,
      expiry,
      payload.recoveryUrl,
    ],
  });
}
