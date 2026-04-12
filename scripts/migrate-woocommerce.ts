/**
 * WooCommerce → Magadh Recipe Platform Migration Script
 *
 * Migrates customers (→ Users + Addresses) and orders (→ Orders + Items + Shipping)
 * from the live WooCommerce store via REST API.
 *
 * Usage: npx tsx scripts/migrate-woocommerce.ts
 *
 * Flags:
 *   --dry-run    Print stats without writing to DB
 *   --users-only Migrate only users/addresses
 *   --orders-only Migrate only orders (users must exist)
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Config ───────────────────────────────────────────
const WC_URL = "https://magadhrecipe.com/wp-json/wc/v3";
const CK = "ck_12a000a87c0a59ba607de696c0072c9c5f0d7028";
const CS = "cs_d9b5d4fa749a6701f47d9da0b6b0b3f9e9443bea";
const PER_PAGE = 100;
const DRY_RUN = process.argv.includes("--dry-run");
const USERS_ONLY = process.argv.includes("--users-only");
const ORDERS_ONLY = process.argv.includes("--orders-only");

// ── WC state code → full state name ─────────────────
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

// ── WC order status → our OrderStatus enum ──────────
function mapOrderStatus(wcStatus: string) {
  const map: Record<string, string> = {
    pending: "PENDING",
    processing: "PROCESSING",
    "on-hold": "PENDING",
    completed: "DELIVERED",
    cancelled: "CANCELLED",
    refunded: "REFUNDED",
    failed: "FAILED",
  };
  return map[wcStatus] ?? "PENDING";
}

function mapPaymentStatus(wcStatus: string) {
  const map: Record<string, string> = {
    pending: "PENDING",
    processing: "PAID",
    "on-hold": "PENDING",
    completed: "PAID",
    cancelled: "FAILED",
    refunded: "REFUNDED",
    failed: "FAILED",
  };
  return map[wcStatus] ?? "PENDING";
}

// ── Helpers ──────────────────────────────────────────
async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const url = `${WC_URL}/${endpoint}?per_page=${PER_PAGE}&page=${page}&consumer_key=${CK}&consumer_secret=${CS}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    const data: T[] = await res.json();
    if (data.length === 0) break;
    all.push(...data);
    const totalPages = parseInt(res.headers.get("x-wp-totalpages") ?? "1");
    if (page >= totalPages) break;
    page++;
    await new Promise((r) => setTimeout(r, 300)); // rate limit
  }
  return all;
}

function stateName(code: string): string {
  return STATE_MAP[code] ?? code;
}

function generateOrderNumber(wcOrderId: number): string {
  return `WC-${wcOrderId}`;
}

// ── Migrate Users ────────────────────────────────────
interface WcCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  date_created: string;
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

async function migrateUsers() {
  console.log("\n📦 Fetching WooCommerce customers...");
  const customers = await fetchAllPages<WcCustomer>("customers");
  console.log(`  Found ${customers.length} customers`);

  let created = 0, skipped = 0, addressCount = 0;
  const wcIdToUserId = new Map<number, string>();

  for (const c of customers) {
    if (!c.email || c.email.trim() === "") {
      skipped++;
      continue;
    }

    const email = c.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      wcIdToUserId.set(c.id, existing.id);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [DRY] Would create user: ${email}`);
      created++;
      continue;
    }

    const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || c.username || email.split("@")[0];
    const tempPassword = randomBytes(16).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const rawPhone = c.billing?.phone?.replace(/\D/g, "").slice(-10) || null;
    let phone = rawPhone && rawPhone.length === 10 ? rawPhone : null;

    // Skip phone if already taken by another user
    if (phone) {
      const phoneExists = await prisma.user.findUnique({ where: { phone } });
      if (phoneExists) phone = null;
    }

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          phone,
          role: "CUSTOMER",
          isActive: true,
          emailVerified: null,
          createdAt: new Date(c.date_created),
        },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        console.log(`  ⚠️ Duplicate constraint for ${email}, skipping phone`);
        user = await prisma.user.create({
          data: { email, name, passwordHash, phone: null, role: "CUSTOMER", isActive: true, createdAt: new Date(c.date_created) },
        });
      } else throw err;
    }

    wcIdToUserId.set(c.id, user.id);
    created++;

    // Create addresses from billing/shipping
    const addresses = [];
    const b = c.billing;
    if (b?.address_1?.trim()) {
      addresses.push({
        userId: user.id,
        name: [b.first_name, b.last_name].filter(Boolean).join(" ") || name,
        phone: b.phone || phone || "0000000000",
        addressLine1: b.address_1,
        addressLine2: b.address_2 || null,
        city: b.city || "Unknown",
        state: stateName(b.state),
        pincode: b.postcode || "000000",
        country: "India",
        type: "HOME" as const,
        isDefault: true,
      });
    }

    const s = c.shipping;
    if (s?.address_1?.trim() && s.address_1 !== b?.address_1) {
      addresses.push({
        userId: user.id,
        name: [s.first_name, s.last_name].filter(Boolean).join(" ") || name,
        phone: s.phone || phone || "0000000000",
        addressLine1: s.address_1,
        addressLine2: s.address_2 || null,
        city: s.city || "Unknown",
        state: stateName(s.state),
        pincode: s.postcode || "000000",
        country: "India",
        type: "HOME" as const,
        isDefault: addresses.length === 0,
      });
    }

    for (const addr of addresses) {
      await prisma.address.create({ data: addr });
      addressCount++;
    }
  }

  console.log(`  ✅ Users: ${created} created, ${skipped} skipped`);
  console.log(`  ✅ Addresses: ${addressCount} created`);
  return wcIdToUserId;
}

// ── Migrate Orders ───────────────────────────────────
interface WcOrder {
  id: number;
  status: string;
  currency: string;
  total: string;
  discount_total: string;
  shipping_total: string;
  total_tax: string;
  customer_id: number;
  date_created: string;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  customer_note: string;
  billing: {
    first_name: string; last_name: string; email: string; phone: string;
    address_1: string; address_2: string; city: string;
    state: string; postcode: string; country: string;
  };
  shipping: {
    first_name: string; last_name: string; phone: string;
    address_1: string; address_2: string; city: string;
    state: string; postcode: string; country: string;
  };
  line_items: Array<{
    name: string;
    product_id: number;
    quantity: number;
    total: string;
    sku: string;
    price: number;
    meta_data: Array<{ key: string; value: string; display_value: string }>;
    image: { src: string };
    parent_name: string;
  }>;
}

async function migrateOrders(wcIdToUserId: Map<number, string>) {
  console.log("\n📦 Fetching WooCommerce orders...");
  const orders = await fetchAllPages<WcOrder>("orders");
  console.log(`  Found ${orders.length} orders`);

  // Build SKU → variant/product map from our DB
  const variants = await prisma.productVariant.findMany({
    include: { product: { select: { id: true, name: true } } },
  });
  const skuMap = new Map(variants.map((v) => [v.sku, v]));

  let created = 0, skipped = 0, itemCount = 0, noUserCount = 0;

  for (const o of orders) {
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber: generateOrderNumber(o.id) },
    });
    if (existingOrder) {
      skipped++;
      continue;
    }

    // Resolve user — try mapped ID first, then by billing email
    let userId = wcIdToUserId.get(o.customer_id);
    if (!userId && o.billing?.email) {
      const u = await prisma.user.findUnique({ where: { email: o.billing.email.toLowerCase().trim() } });
      if (u) userId = u.id;
    }

    // For guest orders (customer_id=0), create or find user by email
    if (!userId && o.billing?.email) {
      const email = o.billing.email.toLowerCase().trim();
      let guestUser = await prisma.user.findUnique({ where: { email } });
      if (!guestUser && !DRY_RUN) {
        const guestName = [o.billing.first_name, o.billing.last_name].filter(Boolean).join(" ") || "Guest";
        const tempPw = randomBytes(16).toString("hex");
        guestUser = await prisma.user.create({
          data: {
            email,
            name: guestName,
            passwordHash: await bcrypt.hash(tempPw, 12),
            phone: null,
            role: "CUSTOMER",
            isActive: true,
            createdAt: new Date(o.date_created),
          },
        });
        console.log(`  Created guest user: ${email}`);
      }
      userId = guestUser?.id;
    }

    if (!userId) {
      noUserCount++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [DRY] Would create order WC-${o.id} (${o.status}, ₹${o.total})`);
      created++;
      continue;
    }

    const subtotal = parseFloat(o.total) - parseFloat(o.shipping_total) - parseFloat(o.total_tax) + parseFloat(o.discount_total);
    const orderStatus = mapOrderStatus(o.status);
    const paymentStatus = mapPaymentStatus(o.status);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(o.id),
        userId,
        status: orderStatus as any,
        subtotalAmount: Math.max(subtotal, 0),
        discountAmount: parseFloat(o.discount_total) || 0,
        shippingAmount: parseFloat(o.shipping_total) || 0,
        taxAmount: parseFloat(o.total_tax) || 0,
        totalAmount: parseFloat(o.total) || 0,
        paymentStatus: paymentStatus as any,
        paymentMethod: "UPI" as any,
        notes: o.customer_note || null,
        createdAt: new Date(o.date_created),
      },
    });

    // Order items
    for (const item of o.line_items) {
      const variant = skuMap.get(item.sku);
      const weightMeta = item.meta_data?.find((m) => m.key === "pa_weight");
      const variantName = weightMeta?.display_value || item.name.match(/- (\d+g)$/)?.[1] || "Default";

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: variant?.product.id ?? variants[0]?.productId ?? "",
          variantId: variant?.id ?? variants[0]?.id ?? "",
          productName: item.parent_name || item.name,
          variantName,
          sku: item.sku || "UNKNOWN",
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: parseFloat(item.total) || item.price * item.quantity,
          imageUrl: item.image?.src || null,
        },
      });
      itemCount++;
    }

    // Order shipping address
    const ship = o.shipping?.address_1 ? o.shipping : o.billing;
    if (ship?.address_1) {
      await prisma.orderShipping.create({
        data: {
          orderId: order.id,
          recipientName: [ship.first_name, ship.last_name].filter(Boolean).join(" ") || "Customer",
          phone: (ship as any).phone || o.billing?.phone || "0000000000",
          addressLine1: ship.address_1,
          addressLine2: ship.address_2 || null,
          city: ship.city || "Unknown",
          state: stateName(ship.state),
          pincode: ship.postcode || "000000",
          country: "India",
        },
      });
    }

    // Order status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: orderStatus as any,
        comment: `Migrated from WooCommerce (WC Order #${o.id})`,
        createdAt: new Date(o.date_created),
      },
    });

    // Payment record
    if (["PAID", "REFUNDED"].includes(paymentStatus)) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: parseFloat(o.total) || 0,
          currency: "INR",
          status: paymentStatus as any,
          method: "UPI" as any,
        },
      });
    }

    created++;
  }

  console.log(`  ✅ Orders: ${created} created, ${skipped} skipped`);
  console.log(`  ✅ Order items: ${itemCount} created`);
  if (noUserCount > 0) {
    console.log(`  ⚠️  ${noUserCount} orders skipped (no matching user/email)`);
  }
}

// ── Main ─────────────────────────────────────────────
async function main() {
  console.log("🚀 WooCommerce → Magadh Recipe Migration");
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`   Scope: ${USERS_ONLY ? "Users only" : ORDERS_ONLY ? "Orders only" : "Full (Users + Orders)"}`);
  console.log("");

  let wcIdToUserId = new Map<number, string>();

  if (!ORDERS_ONLY) {
    wcIdToUserId = await migrateUsers();
  }

  if (!USERS_ONLY) {
    // If orders-only, build map from existing users
    if (ORDERS_ONLY) {
      const customers = await fetchAllPages<WcCustomer>("customers");
      for (const c of customers) {
        if (!c.email) continue;
        const u = await prisma.user.findUnique({ where: { email: c.email.toLowerCase().trim() } });
        if (u) wcIdToUserId.set(c.id, u.id);
      }
    }
    await migrateOrders(wcIdToUserId);
  }

  console.log("\n✅ Migration complete!");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
