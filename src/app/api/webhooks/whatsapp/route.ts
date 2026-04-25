import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

/**
 * Meta WhatsApp Cloud API webhook.
 *
 * GET: signature handshake used by Meta during webhook configuration.
 * POST: incoming events. We handle two categories:
 *   1. Inbound text messages — specifically opt-out keywords ("STOP",
 *      "UNSUBSCRIBE", "OPT OUT"). If the phone maps to a known User we flip
 *      `marketingOptIn` off so future broadcasts skip them. This is required
 *      by Meta policy + Indian DLT-style compliance.
 *   2. Delivery status updates — used to update BroadcastRecipient entries
 *      ("sent" → confirmed by WhatsApp, "delivered", "read", "failed").
 *
 * Meta retries non-2xx responses, so we always return 200 unless payload is
 * unreadable. Individual event failures are logged but never fail the batch.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "magadh_whatsapp_verify_2026";

const OPT_OUT_KEYWORDS = new Set([
  "STOP",
  "UNSUBSCRIBE",
  "UNSUB",
  "OPTOUT",
  "OPT OUT",
  "OPT-OUT",
  "CANCEL",
]);

type MetaIncomingMessage = {
  from?: string;
  type?: string;
  text?: { body?: string };
};

type MetaStatusUpdate = {
  id?: string;
  status?: "sent" | "delivered" | "read" | "failed";
  recipient_id?: string;
  errors?: Array<{ code?: number; title?: string; message?: string }>;
};

type MetaWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: MetaIncomingMessage[];
        statuses?: MetaStatusUpdate[];
      };
    }>;
  }>;
};

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  let body: MetaWebhookPayload;
  try {
    body = (await req.json()) as MetaWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const entries = body.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      for (const msg of value.messages ?? []) {
        await handleIncomingMessage(msg);
      }
      for (const status of value.statuses ?? []) {
        await handleStatusUpdate(status);
      }
    }
  }

  return NextResponse.json({ success: true });
}

async function handleIncomingMessage(msg: MetaIncomingMessage) {
  try {
    if (msg.type !== "text") return;
    const rawBody = msg.text?.body?.trim();
    if (!rawBody) return;

    const normalized = rawBody.toUpperCase().replace(/\s+/g, " ").trim();
    if (!OPT_OUT_KEYWORDS.has(normalized)) return;

    const phone = normalizeWhatsappNumber(msg.from);
    if (!phone) return;

    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) {
      console.log("[WhatsApp Webhook] STOP received from unknown phone:", phone);
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { marketingOptIn: false },
    });
    console.log("[WhatsApp Webhook] User opted out of marketing:", user.id);
  } catch (err) {
    console.error("[WhatsApp Webhook] Failed to handle incoming message:", err);
  }
}

async function handleStatusUpdate(status: MetaStatusUpdate) {
  try {
    if (!status.id) return;

    const recipient = await prisma.broadcastRecipient.findFirst({
      where: { messageId: status.id },
    });
    if (!recipient) return;

    const next: Record<string, unknown> = {};

    switch (status.status) {
      case "delivered":
        if (recipient.status !== "FAILED") next.status = "SENT";
        break;
      case "failed": {
        next.status = "FAILED";
        const err = status.errors?.[0];
        if (err) {
          next.error = [err.code, err.title, err.message]
            .filter(Boolean)
            .join(" | ")
            .slice(0, 500);
        }
        break;
      }
      case "sent":
      case "read":
      default:
        return;
    }

    if (Object.keys(next).length === 0) return;

    await prisma.broadcastRecipient.update({
      where: { id: recipient.id },
      data: next,
    });
  } catch (err) {
    console.error("[WhatsApp Webhook] Failed to handle status update:", err);
  }
}
