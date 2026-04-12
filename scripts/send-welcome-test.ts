/**
 * Send a test welcome email to a single address for preview.
 *
 * Usage: npx tsx scripts/send-welcome-test.ts sumeetsumanfs@gmail.com
 */

import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const testEmail = process.argv[2];
  if (!testEmail) {
    console.error("Usage: npx tsx scripts/send-welcome-test.ts <email>");
    process.exit(1);
  }

  // Dynamic import so env vars are loaded first
  const { sendMail, welcomeMigratedUserHtml } = await import("../src/lib/email");
  const crypto = await import("crypto");

  const fakeToken = crypto.randomBytes(32).toString("hex");
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${fakeToken}&email=${encodeURIComponent(testEmail)}`;

  const html = welcomeMigratedUserHtml({
    name: "Sumeet",
    resetUrl,
  });

  console.log(`📧 Sending welcome email test to: ${testEmail}`);

  const result = await sendMail({
    to: testEmail,
    subject: "Welcome to the new Magadh Recipe! 🎉 Set your password",
    html,
  });

  if (result.success) {
    console.log(`✅ Email sent! Message ID: ${result.messageId}`);
  } else {
    console.error("❌ Failed:", result.error);
  }
}

main().catch(console.error);
