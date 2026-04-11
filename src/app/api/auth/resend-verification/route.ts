import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimiter } from "@/lib/rate-limit";
import { sendMail, verificationEmailHtml } from "@/lib/email";

const RESEND_LIMIT = { windowMs: 60 * 60 * 1000, max: 3 };

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const body = await req.json();
    const email = (body.email as string)?.toLowerCase()?.trim();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    if (!rateLimiter.check(`resend-verification:${ip}:${email}`, RESEND_LIMIT)) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid leaking whether the account exists
    if (!user || user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "If an unverified account exists with that email, a new verification link has been sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    await sendMail({
      to: email,
      subject: "Verify your email – Magadh Recipe",
      html: verificationEmailHtml({ name: user.name ?? undefined, verifyUrl }),
    });

    return NextResponse.json({
      success: true,
      message: "If an unverified account exists with that email, a new verification link has been sent.",
    });
  } catch (error) {
    console.error("[ResendVerification] Error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
