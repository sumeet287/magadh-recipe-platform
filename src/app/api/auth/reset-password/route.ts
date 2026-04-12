import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { handleApiError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { token, password } = parsed.data;
    const email = body.email?.toLowerCase();
    if (!email) throw new ValidationError("Email is required");

    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: email, token, expires: { gte: new Date() } },
    });

    if (!verificationToken) {
      throw new ValidationError("Invalid or expired reset link. Please request a new one.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { passwordHash, emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      }),
    ]);

    return NextResponse.json(successResponse(null));
  } catch (err) {
    return handleApiError(err);
  }
}
