import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.json(
      { success: false, error: "Missing token or email." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase();

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: normalizedEmail, token } },
  });

  if (!record) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired verification link." },
      { status: 400 }
    );
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: normalizedEmail, token } },
    });
    return NextResponse.json(
      { success: false, error: "Verification link has expired. Please request a new one." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: normalizedEmail, token } },
  });

  return NextResponse.json({ success: true, message: "Email verified successfully." });
}
