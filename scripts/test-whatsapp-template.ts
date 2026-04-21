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

  console.log(`Sending template 'hello_world' to: ${adminPhone}`);

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: adminPhone,
      type: "template",
      template: {
        name: "hello_world",
        language: { code: "en_US" },
      },
    }),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (res.ok) {
    console.log("\n✅ Template message sent! Check your phone.");
  } else {
    console.log("\n❌ Failed.");
  }
}

main().catch(console.error);
