import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  const [
    total,
    withPhone,
    withoutPhone,
    marketingOptIn,
    phoneVerified,
    phonePromptDismissed,
    googleUsers,
    googleUsersWithPhone,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { phone: { not: null } } }),
    prisma.user.count({ where: { phone: null } }),
    prisma.user.count({ where: { marketingOptIn: true } }),
    prisma.user.count({ where: { phoneVerified: true } }),
    prisma.user.count({ where: { phonePromptDismissedAt: { not: null } } }),
    prisma.user.count({
      where: { accounts: { some: { provider: "google" } } },
    }),
    prisma.user.count({
      where: {
        accounts: { some: { provider: "google" } },
        phone: { not: null },
      },
    }),
  ]);

  const pctPhone = total === 0 ? 0 : Math.round((withPhone / total) * 100);
  const reachableNow = await prisma.user.count({
    where: {
      phone: { not: null },
      marketingOptIn: true,
    },
  });

  console.log("\n=== USER PHONE NUMBER STATS (Production) ===\n");
  console.log(`Total users:                      ${total}`);
  console.log(`Users with phone:                 ${withPhone}  (${pctPhone}%)`);
  console.log(`Users without phone:              ${withoutPhone}`);
  console.log(`Phone verified (OTP):             ${phoneVerified}`);
  console.log(`Marketing opt-in (any):           ${marketingOptIn}`);
  console.log(`Reachable for broadcast NOW:      ${reachableNow}  (has phone + opted in)`);
  console.log(`Phone prompt dismissed:           ${phonePromptDismissed}`);
  console.log(`Google users (total):             ${googleUsers}`);
  console.log(`Google users with phone:          ${googleUsersWithPhone}`);

  const recent = await prisma.user.findMany({
    where: { phone: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      email: true,
      phone: true,
      marketingOptIn: true,
      phoneVerified: true,
      createdAt: true,
    },
  });

  console.log("\n=== MOST RECENT USERS WITH PHONE (top 5) ===\n");
  for (const u of recent) {
    const masked = u.phone
      ? u.phone.slice(0, 3) + "XXXXXX" + u.phone.slice(-3)
      : "-";
    const email = u.email
      ? u.email.slice(0, 3) + "***@" + u.email.split("@")[1]
      : "(no-email)";
    console.log(
      `  ${email.padEnd(30)} | ${masked.padEnd(15)} | optIn=${u.marketingOptIn} | verified=${u.phoneVerified} | ${u.createdAt.toISOString().slice(0, 10)}`
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
