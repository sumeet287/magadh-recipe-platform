import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        isActive: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!user) return NextResponse.json({ step: "user_lookup", error: "User not found" });
    if (!user.passwordHash) return NextResponse.json({ step: "password_check", error: "No password set" });
    if (!user.isActive) return NextResponse.json({ step: "active_check", error: "User inactive" });

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) return NextResponse.json({ step: "password_compare", error: "Password mismatch" });

    if (!user.emailVerified) return NextResponse.json({ step: "email_verified", error: "Email not verified" });

    return NextResponse.json({
      step: "success",
      user: { id: user.id, email: user.email, role: user.role, emailVerified: !!user.emailVerified },
    });
  } catch (err: unknown) {
    return NextResponse.json({ step: "exception", error: String(err) });
  }
}
