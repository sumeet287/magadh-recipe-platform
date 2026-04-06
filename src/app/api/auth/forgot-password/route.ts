import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { handleApiError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { rateLimiter, RATE_LIMITS } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimiter.check(`forgot:${ip}`, RATE_LIMITS.auth)) {
      return NextResponse.json({ success: false, message: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(successResponse(null));
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.upsert({
      where: { identifier_token: { identifier: user.email!, token } },
      create: { identifier: user.email!, token, expires: expiresAt },
      update: { expires: expiresAt },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email!)}`;

    await sendMail({
      to: user.email!,
      subject: "Reset your Magadh Recipe password",
      html: `
        <p>Hi ${user.name ?? "there"},</p>
        <p>You requested a password reset. Click the link below to reset your password (valid for 1 hour):</p>
        <p><a href="${resetUrl}" style="color:#f97316;font-weight:bold;">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>— Magadh Recipe Team</p>
      `,
    });

    return NextResponse.json(successResponse(null));
  } catch (err) {
    return handleApiError(err);
  }
}
