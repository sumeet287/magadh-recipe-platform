import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { contactSchema } from "@/lib/validations/review";
import { rateLimiter, RATE_LIMITS } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimiter.check(`contact:${ip}`, RATE_LIMITS.contact)) {
      return NextResponse.json({ success: false, message: "Too many requests. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    });

    // Notify admin (non-blocking)
    sendMail({
      to: process.env.FROM_EMAIL ?? "hello@magadhrecipe.com",
      subject: `New Contact: ${parsed.data.subject}`,
      html: `<p><strong>From:</strong> ${parsed.data.name} (${parsed.data.email})</p><p>${parsed.data.message}</p>`,
    }).catch(() => {});

    return NextResponse.json(successResponse({ id: inquiry.id }), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
