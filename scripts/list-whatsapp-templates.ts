import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const wabaId = "1401717671760975"; // WhatsApp Business Account ID from screenshot

  if (!token) {
    console.error("Missing WHATSAPP_ACCESS_TOKEN");
    process.exit(1);
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${wabaId}/message_templates?fields=name,status,language,category,components&limit=100`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("Error:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log(`\nFound ${data.data?.length ?? 0} templates:\n`);
  for (const tpl of data.data ?? []) {
    console.log(`• ${tpl.name} [${tpl.status}] (${tpl.language}) — category: ${tpl.category}`);
  }

  const orderTpl = data.data?.find((t: { name: string }) => t.name === "order_notification");
  console.log(
    `\n→ 'order_notification' template: ${
      orderTpl ? `EXISTS, status=${orderTpl.status}` : "NOT FOUND — needs to be created"
    }`
  );
}

main().catch(console.error);
