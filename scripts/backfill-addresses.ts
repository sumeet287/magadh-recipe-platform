/**
 * Backfill addresses for already-migrated users who are missing addresses.
 * Pulls billing/shipping from WooCommerce API and creates Address records.
 *
 * Usage: npx tsx scripts/backfill-addresses.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WC_URL = "https://magadhrecipe.com/wp-json/wc/v3";
const CK = "ck_12a000a87c0a59ba607de696c0072c9c5f0d7028";
const CS = "cs_d9b5d4fa749a6701f47d9da0b6b0b3f9e9443bea";

const STATE_MAP: Record<string, string> = {
  AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar",
  CG: "Chhattisgarh", GA: "Goa", GJ: "Gujarat", HR: "Haryana",
  HP: "Himachal Pradesh", JH: "Jharkhand", KA: "Karnataka", KL: "Kerala",
  MP: "Madhya Pradesh", MH: "Maharashtra", MN: "Manipur", ML: "Meghalaya",
  MZ: "Mizoram", NL: "Nagaland", OD: "Odisha", PB: "Punjab",
  RJ: "Rajasthan", SK: "Sikkim", TN: "Tamil Nadu", TS: "Telangana",
  TR: "Tripura", UK: "Uttarakhand", UP: "Uttar Pradesh", WB: "West Bengal",
  AN: "Andaman & Nicobar", CH: "Chandigarh", DN: "Dadra & Nagar Haveli",
  DD: "Daman & Diu", DL: "Delhi", JK: "Jammu & Kashmir", LA: "Ladakh",
  LD: "Lakshadweep", PY: "Puducherry",
};

function stateName(code: string): string {
  return STATE_MAP[code] ?? code;
}

interface WcCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  billing: {
    first_name: string; last_name: string; phone: string;
    address_1: string; address_2: string; city: string;
    state: string; postcode: string; country: string;
  };
  shipping: {
    first_name: string; last_name: string; phone: string;
    address_1: string; address_2: string; city: string;
    state: string; postcode: string; country: string;
  };
}

async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const url = `${WC_URL}/${endpoint}?per_page=100&page=${page}&consumer_key=${CK}&consumer_secret=${CS}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data: T[] = await res.json();
    if (data.length === 0) break;
    all.push(...data);
    const totalPages = parseInt(res.headers.get("x-wp-totalpages") ?? "1");
    if (page >= totalPages) break;
    page++;
    await new Promise((r) => setTimeout(r, 300));
  }
  return all;
}

async function main() {
  console.log("📍 Backfilling addresses from WooCommerce...\n");

  const customers = await fetchAllPages<WcCustomer>("customers");
  console.log(`  Fetched ${customers.length} WC customers`);

  let created = 0, skipped = 0, alreadyHas = 0;

  for (const c of customers) {
    if (!c.email) { skipped++; continue; }
    const email = c.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { addresses: true },
    });

    if (!user) { skipped++; continue; }
    if (user.addresses.length > 0) { alreadyHas++; continue; }

    const b = c.billing;
    if (!b?.address_1?.trim()) { skipped++; continue; }

    const name = [b.first_name, b.last_name].filter(Boolean).join(" ") ||
                 [c.first_name, c.last_name].filter(Boolean).join(" ") ||
                 user.name || "Customer";

    await prisma.address.create({
      data: {
        userId: user.id,
        name,
        phone: b.phone || "0000000000",
        addressLine1: b.address_1,
        addressLine2: b.address_2 || null,
        city: b.city || "Unknown",
        state: stateName(b.state),
        pincode: b.postcode || "000000",
        country: "India",
        type: "HOME",
        isDefault: true,
      },
    });
    created++;

    // Also add shipping if different
    const s = c.shipping;
    if (s?.address_1?.trim() && s.address_1 !== b.address_1) {
      const sName = [s.first_name, s.last_name].filter(Boolean).join(" ") || name;
      await prisma.address.create({
        data: {
          userId: user.id,
          name: sName,
          phone: s.phone || b.phone || "0000000000",
          addressLine1: s.address_1,
          addressLine2: s.address_2 || null,
          city: s.city || "Unknown",
          state: stateName(s.state),
          pincode: s.postcode || "000000",
          country: "India",
          type: "HOME",
          isDefault: false,
        },
      });
      created++;
    }
  }

  console.log(`\n  ✅ Addresses created: ${created}`);
  console.log(`  ℹ️  Already had address: ${alreadyHas}`);
  console.log(`  ⏭️  Skipped (no user/no address): ${skipped}`);
  console.log("\n✅ Backfill complete!");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
