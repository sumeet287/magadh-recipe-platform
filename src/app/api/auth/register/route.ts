import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { handleApiError, ConflictError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { rateLimiter, RATE_LIMITS } from "@/lib/rate-limit";
import { sendMail, verificationEmailHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimiter.check(`register:${ip}`, RATE_LIMITS.auth)) {
      return NextResponse.json({ success: false, message: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { name, email, password, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new ConflictError("An account with this email already exists.");

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash: hashedPassword,
        phone: phone ?? null,
        role: "CUSTOMER",
      },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });
    await prisma.verificationToken.create({
      data: { identifier: normalizedEmail, token, expires },
    });

    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
    const emailRes = await sendMail({
      to: normalizedEmail,
      subject: "Verify your email – Magadh Recipe",
      html: verificationEmailHtml({ name: user.name ?? undefined, verifyUrl }),
    });
    console.log(`[Email] Verification email to ${normalizedEmail} → ${emailRes.success ? "OK" : "FAILED"}`, emailRes.success ? emailRes.messageId : emailRes.error);

    return NextResponse.json(
      successResponse(
        { id: user.id, email: user.email },
        "Registration successful. Please check your email to verify your account."
      ),
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
