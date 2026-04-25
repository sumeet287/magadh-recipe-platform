import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

const SAMPLE_SIZE = 10;

function maskPhone(phone: string | null): string {
  if (!phone) return "—";
  const normalized = normalizeWhatsappNumber(phone) ?? phone.replace(/\D/g, "");
  if (normalized.length < 7) return "*".repeat(normalized.length);
  return (
    normalized.slice(0, 3) +
    "X".repeat(Math.max(4, normalized.length - 6)) +
    normalized.slice(-3)
  );
}

function maskEmail(email: string | null): string {
  if (!email) return "(no email)";
  const at = email.indexOf("@");
  if (at <= 0) return email.slice(0, 3) + "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const prefix = local.slice(0, Math.min(3, local.length));
  return `${prefix}***@${domain}`;
}

// GET /api/admin/broadcasts/audience-preview
// Returns funnel counts + a masked sample of who would receive a broadcast
// with the given audience filters. Used by the admin broadcasts page to give
// transparency before pressing send.
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();
    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") throw new ForbiddenError();

    const sp = req.nextUrl.searchParams;
    const optedInOnly = sp.get("optedInOnly") !== "false";
    const includeUnverifiedPhone = sp.get("includeUnverifiedPhone") === "true";

    const currentFilter = {
      ...(optedInOnly ? { marketingOptIn: true } : {}),
      phone: { not: null },
      ...(includeUnverifiedPhone ? {} : { phoneVerified: true }),
    };

    const [
      totalWithPhone,
      verified,
      optedIn,
      reachable,
      current,
      sample,
    ] = await Promise.all([
      prisma.user.count({ where: { phone: { not: null } } }),
      prisma.user.count({
        where: { phone: { not: null }, phoneVerified: true },
      }),
      prisma.user.count({
        where: { phone: { not: null }, marketingOptIn: true },
      }),
      prisma.user.count({
        where: {
          phone: { not: null },
          phoneVerified: true,
          marketingOptIn: true,
        },
      }),
      prisma.user.count({ where: currentFilter }),
      prisma.user.findMany({
        where: currentFilter,
        orderBy: { createdAt: "desc" },
        take: SAMPLE_SIZE,
        select: {
          id: true,
          email: true,
          phone: true,
          phoneVerified: true,
          marketingOptIn: true,
          name: true,
        },
      }),
    ]);

    const maskedSample = sample.map((u) => ({
      id: u.id,
      email: maskEmail(u.email),
      phone: maskPhone(u.phone),
      name: u.name?.split(" ")[0] ?? null,
      verified: u.phoneVerified,
      optedIn: u.marketingOptIn,
    }));

    return NextResponse.json(
      successResponse({
        // Legacy key — older callers read `count` directly.
        count: current,
        baseline: {
          totalWithPhone,
          verified,
          optedIn,
          reachable,
        },
        current,
        sample: maskedSample,
        sampleSize: SAMPLE_SIZE,
      })
    );
  } catch (err) {
    return handleApiError(err);
  }
}
