import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;

  if (!token || !phoneNumberId || !adminPhone) {
    console.error("Missing WhatsApp env vars");
    process.exit(1);
  }

  console.log(`Sending test WhatsApp to: ${adminPhone}`);
  console.log(`Phone Number ID: ${phoneNumberId}`);

  const message = [
    `🛒 *New Order #MR-2026-TEST*`,
    `💰 Amount: ₹510`,
    `💳 Payment: RAZORPAY`,
    ``,
    `📦 *Items:*`,
    `• Khatta Meetha Lemon Pickle (250g) x1`,
    `• Grated Oal Ginger Pickle (250g) x1`,
    ``,
    `👤 Sumeet`,
    `📞 +916207197364`,
    `📍 Patna, Bihar 800014`,
  ].join("\n");

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: adminPhone,
      type: "text",
      text: { body: message },
    }),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (res.ok) {
    console.log("\n✅ WhatsApp message sent! Check your phone.");
  } else {
    console.log("\n❌ Failed. Check the error above.");
  }
}

main().catch(console.error);
