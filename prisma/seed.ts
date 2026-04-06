import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Admin User ───────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@magadhrecipe.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@magadhrecipe.com",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log("✅ Admin user:", admin.email);

  // ─── Categories ───────────────────────────────────────────────
  const categoriesData = [
    {
      name: "Pickles",
      slug: "pickles",
      description: "Authentic Bihari-style hand-crafted pickles made from fresh fruits and vegetables with traditional spice blends.",
      image: "https://images.unsplash.com/photo-1601932892450-cce2e36be91c?w=400",
      sortOrder: 1,
    },
    {
      name: "Masalas & Spices",
      slug: "masalas-spices",
      description: "Pure, hand-ground spice mixes and masalas sourced from Bihar's finest farms.",
      image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400",
      sortOrder: 2,
    },
    {
      name: "Combo Packs",
      slug: "combo-packs",
      description: "Value combo packs of our best-selling pickles and spices.",
      image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
      sortOrder: 3,
    },
    {
      name: "Gift Boxes",
      slug: "gift-boxes",
      description: "Premium gift-wrapped boxes perfect for festivals, corporate gifting, and special occasions.",
      image: "https://images.unsplash.com/photo-1601721099649-47c1b0a5f8a0?w=400",
      sortOrder: 4,
    },
    {
      name: "Regional Specials",
      slug: "regional-specials",
      description: "Rare and authentic regional specialties from different districts of Bihar.",
      image: "https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=400",
      sortOrder: 5,
    },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true },
    });
    categories[cat.slug] = created.id;
    console.log(`✅ Category: ${cat.name}`);
  }

  // ─── Products ─────────────────────────────────────────────────
  const productsData = [
    {
      name: "Aam Ka Achar (Mango Pickle)",
      slug: "aam-ka-achar-mango-pickle",
      shortDescription: "Traditional raw mango pickle made with mustard oil and hand-ground spices",
      description: "<p>Our signature Aam Ka Achar is made from handpicked raw Dussehri mangoes from Malda, slow-cured in pure mustard oil with our secret 7-spice blend. This recipe has been in our family for over 60 years.</p><p>Each batch is sun-cured for 21 days to develop that perfect tangy flavour that pairs beautifully with dal-chawal, parathas, or any Indian meal.</p>",
      ingredients: "Raw mango, mustard oil, mustard seeds, fenugreek seeds, fennel seeds, nigella seeds, red chilli powder, turmeric, salt",
      nutritionInfo: "Per 100g: Energy 120 kcal, Fat 8g, Carbohydrates 12g, Protein 1g, Sodium 1800mg",
      storageInstructions: "Store in a cool, dry place away from direct sunlight. Always use a dry spoon. Refrigerate after opening.",
      shelfLife: "12 months unopened, 3 months after opening",
      usageSuggestions: "Best with dal-chawal, parathas, curd rice, or as a condiment with any meal.",
      categorySlug: "pickles",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: true,
      region: "Bhojpur, Bihar",
      tags: ["mango", "pickle", "traditional", "bestseller"],
      variants: [
        { name: "250g", sku: "AAA-250", mrp: 199, price: 159, stock: 150, unit: "g", sortOrder: 1 },
        { name: "500g", sku: "AAA-500", mrp: 349, price: 279, stock: 120, unit: "g", sortOrder: 2 },
        { name: "1 kg", sku: "AAA-1000", mrp: 599, price: 479, stock: 80, unit: "g", sortOrder: 3 },
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1601932892450-cce2e36be91c?w=600", altText: "Aam Ka Achar", isPrimary: true, sortOrder: 1 },
        { url: "https://images.unsplash.com/photo-1622907825688-4ae4e34f87a4?w=600", altText: "Mango Pickle Close Up", isPrimary: false, sortOrder: 2 },
      ],
    },
    {
      name: "Lehsun Achar (Garlic Pickle)",
      slug: "lehsun-achar-garlic-pickle",
      shortDescription: "Bold garlic pickle with whole cloves in spiced mustard oil",
      description: "<p>Premium whole garlic cloves preserved in our signature masala blend with cold-pressed mustard oil. The garlic is slow-cured to absorb the spices while retaining its crisp bite.</p><p>Rich in antioxidants and with a bold, pungent flavour — a must-have accompaniment for khichdi and dal tadka.</p>",
      ingredients: "Garlic cloves, mustard oil, mustard seeds, red chilli, turmeric, fenugreek seeds, salt, asafoetida",
      nutritionInfo: "Per 100g: Energy 140 kcal, Fat 9g, Carbohydrates 14g, Protein 2g",
      storageInstructions: "Store in a cool, dry place. Keep away from moisture. Refrigerate after opening.",
      shelfLife: "9 months unopened",
      usageSuggestions: "Excellent with dal, khichdi, rice, or as a side with roti.",
      categorySlug: "pickles",
      spiceLevel: "HOT" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: false,
      region: "Nalanda, Bihar",
      tags: ["garlic", "pickle", "spicy"],
      variants: [
        { name: "250g", sku: "LAA-250", mrp: 189, price: 149, stock: 100, unit: "g", sortOrder: 1 },
        { name: "500g", sku: "LAA-500", mrp: 329, price: 259, stock: 80, unit: "g", sortOrder: 2 },
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600", altText: "Garlic Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Mirchi Ka Achar (Red Chilli Pickle)",
      slug: "mirchi-ka-achar-red-chilli-pickle",
      shortDescription: "Fiery stuffed red chilli pickles for the heat-lovers",
      description: "<p>Bold, fiery red chilli pickle made with desi lal mirchi, stuffed with a tangy masala of mustard, fennel, and amchur. Fire up your taste buds with every bite!</p>",
      ingredients: "Red green chillies, mustard oil, mustard seeds, fennel, amchur, turmeric, salt",
      storageInstructions: "Store away from sunlight. Use dry spoon only.",
      shelfLife: "6 months unopened",
      categorySlug: "pickles",
      spiceLevel: "EXTRA_HOT" as const,
      isVeg: true,
      isBestseller: false,
      isFeatured: true,
      tags: ["chilli", "pickle", "very-spicy", "fiery"],
      variants: [
        { name: "200g", sku: "MKA-200", mrp: 179, price: 139, stock: 60, unit: "g", sortOrder: 1 },
        { name: "400g", sku: "MKA-400", mrp: 299, price: 239, stock: 40, unit: "g", sortOrder: 2 },
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600", altText: "Red Chilli Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Mix Achar (Mixed Pickle)",
      slug: "mix-achar-mixed-pickle",
      shortDescription: "Classic mixed vegetable pickle with 9 seasonal vegetables",
      description: "<p>Our beloved Mix Achar combines 9 fresh seasonal vegetables — mango, carrot, cauliflower, lemon, ginger, garlic, green chilli, and more — all pickled together in one jar. The result is a complex, layered flavour that goes with everything.</p>",
      ingredients: "Raw mango, carrot, cauliflower, lemon, ginger, garlic, green chilli, turnip, mustard oil, spices, salt",
      shelfLife: "12 months unopened",
      storageInstructions: "Store in a cool, dry place. Use dry spoon.",
      categorySlug: "pickles",
      spiceLevel: "MILD" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: true,
      isNewArrival: false,
      tags: ["mixed", "pickle", "mild", "family"],
      variants: [
        { name: "250g", sku: "MXA-250", mrp: 179, price: 139, stock: 200, unit: "g", sortOrder: 1 },
        { name: "500g", sku: "MXA-500", mrp: 319, price: 249, stock: 150, unit: "g", sortOrder: 2 },
        { name: "1 kg", sku: "MXA-1000", mrp: 549, price: 429, stock: 100, unit: "g", sortOrder: 3 },
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600", altText: "Mixed Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Nimbu Ka Achar (Lemon Pickle)",
      slug: "nimbu-ka-achar-lemon-pickle",
      shortDescription: "Sun-dried whole lemon pickle in traditional spiced brine",
      description: "<p>Whole lemons cured in a salty, spicy brine and sun-dried for 30 days, developing a deep umami flavour unique to Bihar-style lemon pickle. This pickle is a digestive powerhouse.</p>",
      ingredients: "Whole lemons, salt, turmeric, red chilli powder, fenugreek, mustard seeds",
      shelfLife: "18 months",
      storageInstructions: "Does not require refrigeration. Store in glass jar.",
      categorySlug: "pickles",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isFeatured: false,
      isNewArrival: true,
      tags: ["lemon", "pickle", "digestive"],
      variants: [
        { name: "250g", sku: "NKA-250", mrp: 159, price: 129, stock: 80, unit: "g", sortOrder: 1 },
        { name: "500g", sku: "NKA-500", mrp: 279, price: 219, stock: 60, unit: "g", sortOrder: 2 },
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1491895200222-0fc4a4c35e18?w=600", altText: "Lemon Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Bihari Masala Mix",
      slug: "bihari-masala-mix",
      shortDescription: "Authentic all-purpose Bihari kitchen masala blend",
      description: "<p>Our signature Bihari Masala Mix is a perfect blend of 14 whole spices, sourced from farms across Bihar and Jharkhand, then stone-ground for maximum aroma. Use in gravies, dals, vegetables, or meat dishes.</p>",
      ingredients: "Coriander, cumin, black pepper, cloves, cardamom, cinnamon, bay leaf, dried red chilli, turmeric, mace, star anise, dried ginger",
      nutritionInfo: "Per 100g: Energy 95 kcal, Fat 3g, Carbohydrates 18g, Protein 4g",
      storageInstructions: "Store in an airtight container away from heat and moisture.",
      shelfLife: "18 months",
      usageSuggestions: "Add 1 tsp per serving in curries, dal, or sprinkle on roasted vegetables.",
      categorySlug: "masalas-spices",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isBestseller: false,
      isFeatured: true,
      isNewArrival: true,
      tags: ["masala", "spices", "cooking", "blend"],
      variants: [
        { name: "100g", sku: "BMM-100", mrp: 149, price: 119, stock: 200, unit: "g", sortOrder: 1 },
        { name: "250g", sku: "BMM-250", mrp: 299, price: 239, stock: 150, unit: "g", sortOrder: 2 },
        { name: "500g", sku: "BMM-500", mrp: 529, price: 419, stock: 80, unit: "g", sortOrder: 3 },
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600", altText: "Bihari Masala Mix", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Sattu Spice Mix",
      slug: "sattu-spice-mix",
      shortDescription: "Ready-to-use spiced sattu powder for drinks, parathas, and litti",
      description: "<p>Premium roasted chana sattu blended with our signature spice mix — perfect for making the beloved Bihari sattu sharbat, stuffed litti, or sattu paratha. Ready to use, no preparation needed.</p>",
      ingredients: "Roasted chana sattu, black salt, cumin, ajwain, dried mango powder, rock salt, green chilli powder",
      shelfLife: "6 months",
      storageInstructions: "Keep in airtight container, consume within 2 months of opening.",
      categorySlug: "masalas-spices",
      spiceLevel: "MILD" as const,
      isVeg: true,
      isBestseller: false,
      isNewArrival: true,
      isFeatured: false,
      tags: ["sattu", "bihari", "healthy", "traditional"],
      variants: [
        { name: "250g", sku: "SSM-250", mrp: 129, price: 99, stock: 100, unit: "g", sortOrder: 1 },
        { name: "500g", sku: "SSM-500", mrp: 229, price: 179, stock: 80, unit: "g", sortOrder: 2 },
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=600", altText: "Sattu Mix", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Magadh Pickle Trio Combo",
      slug: "magadh-pickle-trio-combo",
      shortDescription: "3 best-selling pickles in one value combo pack",
      description: "<p>The perfect starter pack — our top 3 pickles in 250g jars: Aam Ka Achar, Lehsun Achar, and Mix Achar. Save 15% compared to buying individually.</p>",
      storageInstructions: "Individual storage instructions on each jar.",
      shelfLife: "12 months",
      categorySlug: "combo-packs",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isBestseller: false,
      isFeatured: true,
      isNewArrival: false,
      tags: ["combo", "value", "gift"],
      variants: [
        { name: "3 × 250g", sku: "MPC-TRIO", mrp: 597, price: 429, stock: 50, unit: "set", sortOrder: 1 },
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1622907825688-4ae4e34f87a4?w=600", altText: "Pickle Trio", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Festive Gift Hamper",
      slug: "festive-gift-hamper",
      shortDescription: "Premium gift-wrapped hamper with 6 products — perfect for Diwali & Holi",
      description: "<p>The ultimate Magadh Recipe gift hamper — beautifully packaged with 6 of our premium products: 2 pickles, 1 masala, and 3 pickles in elegant gift boxes. Comes with a personalized card. Perfect for Diwali, Holi, weddings, and corporate gifting.</p>",
      shelfLife: "9-12 months",
      storageInstructions: "See individual product instructions.",
      categorySlug: "gift-boxes",
      spiceLevel: "MILD" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: true,
      isNewArrival: false,
      tags: ["gift", "hamper", "diwali", "festive", "corporate"],
      variants: [
        { name: "Standard (6 items)", sku: "FGH-STD", mrp: 1499, price: 1199, stock: 30, unit: "set", sortOrder: 1 },
        { name: "Premium (9 items)", sku: "FGH-PRE", mrp: 2199, price: 1749, stock: 20, unit: "set", sortOrder: 2 },
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1601721099649-47c1b0a5f8a0?w=600", altText: "Festive Gift Hamper", isPrimary: true, sortOrder: 1 },
      ],
    },
  ];

  for (const productData of productsData) {
    const { variants, images, categorySlug, ...product } = productData;
    const categoryId = categories[categorySlug];

    const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
    if (existing) {
      console.log(`⏭️  Skipped (exists): ${product.name}`);
      continue;
    }

    await prisma.product.create({
      data: {
        ...product,
        categoryId,
        status: "ACTIVE",
        variants: { create: variants },
        images: { create: images },
      },
    });
    console.log(`✅ Product: ${product.name}`);
  }

  // ─── Coupons ──────────────────────────────────────────────────
  const couponsData = [
    {
      code: "WELCOME10",
      description: "10% off on your first order",
      type: "PERCENTAGE" as const,
      value: 10,
      maxDiscountAmount: 100,
      minOrderAmount: 199,
      isActive: true,
      startDate: new Date("2024-01-01"),
      perUserLimit: 1,
    },
    {
      code: "FESTIVE10",
      description: "10% festive discount (max ₹150)",
      type: "PERCENTAGE" as const,
      value: 10,
      maxDiscountAmount: 150,
      minOrderAmount: 299,
      isActive: true,
      startDate: new Date("2024-01-01"),
    },
    {
      code: "FREESHIP",
      description: "Free shipping on any order",
      type: "FREE_SHIPPING" as const,
      value: 0,
      minOrderAmount: 0,
      isActive: true,
      startDate: new Date("2024-01-01"),
    },
    {
      code: "MAGADH100",
      description: "Flat ₹100 off on orders above ₹799",
      type: "FIXED" as const,
      value: 100,
      minOrderAmount: 799,
      isActive: true,
      startDate: new Date("2024-01-01"),
    },
  ];

  for (const coupon of couponsData) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon,
    });
    console.log(`✅ Coupon: ${coupon.code}`);
  }

  // ─── Settings ─────────────────────────────────────────────────
  const settings = [
    { key: "site_name", value: "Magadh Recipe", group: "general" },
    { key: "site_tagline", value: "Premium Bihar Pickles & Spices", group: "general" },
    { key: "support_email", value: "support@magadhrecipe.com", group: "contact" },
    { key: "support_phone", value: "+91 98765 43210", group: "contact" },
    { key: "free_shipping_threshold", value: "499", group: "shipping" },
    { key: "standard_shipping_fee", value: "60", group: "shipping" },
    { key: "cod_fee", value: "30", group: "shipping" },
    { key: "gst_rate", value: "5", group: "tax" },
    { key: "maintenance_mode", value: "false", group: "general" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅ Settings (${settings.length})`);

  // ─── Pincode Zones ────────────────────────────────────────────
  const pincodes = [
    { pincode: "800001", city: "Patna", state: "Bihar", zone: "Z1", deliveryDays: 1 },
    { pincode: "800016", city: "Patna", state: "Bihar", zone: "Z1", deliveryDays: 1 },
    { pincode: "110001", city: "New Delhi", state: "Delhi", zone: "Z2", deliveryDays: 3 },
    { pincode: "400001", city: "Mumbai", state: "Maharashtra", zone: "Z3", deliveryDays: 4 },
    { pincode: "700001", city: "Kolkata", state: "West Bengal", zone: "Z2", deliveryDays: 2 },
    { pincode: "226001", city: "Lucknow", state: "Uttar Pradesh", zone: "Z2", deliveryDays: 2 },
    { pincode: "834001", city: "Ranchi", state: "Jharkhand", zone: "Z1", deliveryDays: 2 },
    { pincode: "600001", city: "Chennai", state: "Tamil Nadu", zone: "Z3", deliveryDays: 5 },
    { pincode: "560001", city: "Bengaluru", state: "Karnataka", zone: "Z3", deliveryDays: 4 },
    { pincode: "500001", city: "Hyderabad", state: "Telangana", zone: "Z3", deliveryDays: 5 },
  ];

  for (const pz of pincodes) {
    await prisma.pincodeZone.upsert({
      where: { pincode: pz.pincode },
      update: {},
      create: { ...pz, isActive: true },
    });
  }
  console.log(`✅ Pincode zones (${pincodes.length})`);

  console.log("\n🎉 Seed complete!");
  console.log("Admin login: admin@magadhrecipe.com / Admin@123456");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
