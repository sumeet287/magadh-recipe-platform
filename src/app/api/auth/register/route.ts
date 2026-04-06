import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations/auth";
import { handleApiError, ConflictError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { rateLimiter, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimiter.check(`register:${ip}`, RATE_LIMITS.auth)) {
      return NextResponse.json({ success: false, message: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { name, email, password, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) throw new ConflictError("An account with this email already exists.");

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        phone: phone ?? null,
        role: "CUSTOMER",
      },
    });

    return NextResponse.json(
      successResponse({ id: user.id, name: user.name, email: user.email }),
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
