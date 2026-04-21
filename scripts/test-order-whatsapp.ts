import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE!;

  const orderNumber = "MR-2026-TEST";
  const totalAmount = 510;
  const items = [
    { productName: "Khatta Meetha Lemon Pickle", variantName: "250g", quantity: 1 },
    { productName: "Grated Oal Ginger Pickle", variantName: "250g", quantity: 1 },
  ];
  const shipping = {
    recipientName: "Test Customer",
    phone: "9876543210",
    city: "Patna",
    state: "Bihar",
  };

  const itemsStr = items.map((i) => `${i.productName} (${i.variantName}) x${i.quantity}`).join(", ");
  const customerLine = `${shipping.recipientName}, ${shipping.phone}, ${shipping.city} ${shipping.state}`;
  const details = `${itemsStr} | ${customerLine}`.replace(/\s{2,}/g, " ");

  console.log(`Sending 'order_notification' template to ${adminPhone}...`);

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: adminPhone,
      type: "template",
      template: {
        name: "order_notification",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: `#${orderNumber}` },
              { type: "text", text: `Rs.${totalAmount}` },
              { type: "text", text: details },
            ],
          },
        ],
      },
    }),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(data, null, 2));
  console.log(res.ok ? "\nTemplate sent. Check WhatsApp." : "\nFailed.");
}

main().catch(console.error);
