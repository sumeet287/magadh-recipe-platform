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

  // ─── Clear old product data for clean reseed ─────────────────
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  console.log("🗑️  Cleared old product data");

  // ─── Categories ───────────────────────────────────────────────
  const categoriesData = [
    {
      name: "Pickles",
      slug: "pickles",
      description: "Authentic Bihari-style hand-crafted pickles made with cold-pressed mustard oil and traditional recipes.",
      image: "/images/products/lal-mirch-bharua.png",
      sortOrder: 1,
    },
    {
      name: "Masalas & Spices",
      slug: "masalas-spices",
      description: "Pure, hand-ground spice mixes and masalas sourced from Bihar's finest farms.",
      image: "/images/products/garlic.webp",
      sortOrder: 2,
    },
    {
      name: "Combo Packs",
      slug: "combo-packs",
      description: "Value combo packs of our best-selling pickles.",
      image: "/images/products/mixed-vegetable.webp",
      sortOrder: 3,
    },
    {
      name: "Gift Boxes",
      slug: "gift-boxes",
      description: "Premium gift-wrapped boxes perfect for festivals, corporate gifting, and special occasions.",
      image: "/images/products/khatta-meetha-lemon.webp",
      sortOrder: 4,
    },
    {
      name: "Regional Specials",
      slug: "regional-specials",
      description: "Rare and authentic regional specialties from different districts of Bihar.",
      image: "/images/products/kathal.webp",
      sortOrder: 5,
    },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { image: cat.image, description: cat.description },
      create: { ...cat, isActive: true },
    });
    categories[cat.slug] = created.id;
    console.log(`✅ Category: ${cat.name}`);
  }

  // ─── Products (Real Magadh Recipe Products) ──────────────────
  const productsData = [
    {
      name: "Lal Mirch Bharua Achar | Stuffed Red Chilli Pickle",
      slug: "lal-mirch-bharua-achar",
      shortDescription: "Bold stuffed red chilli pickle with hand-ground masala filling",
      description: "<p>Premium stuffed red chillies packed with a tangy-spicy masala of mustard, fennel, and amchur. Each chilli is carefully selected, slit, stuffed, and slow-cured in cold-pressed mustard oil.</p><p>A fiery favourite that adds drama to every plate — from dal-chawal to parathas.</p>",
      ingredients: "Red chillies, mustard oil, mustard seeds, fennel seeds, fenugreek, amchur, turmeric, salt",
      storageInstructions: "Store in a cool, dry place. Use dry spoon only.",
      shelfLife: "12 months unopened",
      usageSuggestions: "Perfect with parathas, dal-chawal, or as a bold side.",
      categorySlug: "pickles",
      spiceLevel: "EXTRA_HOT" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: true,
      isNewArrival: true,
      region: "Magadh, Bihar",
      sortOrder: 1,
      tags: ["chilli", "pickle", "stuffed", "spicy", "bestseller"],
      variants: [
        { name: "250g", sku: "LMB-250", mrp: 250, price: 225, stock: 40, unit: "g", sortOrder: 1, isDefault: true },
        { name: "450g", sku: "LMB-450", mrp: 475, price: 425, stock: 40, unit: "g", sortOrder: 2 },
      ],
      images: [
        { url: "/images/products/lal-mirch-bharua.png", altText: "Lal Mirch Bharua Achar - Stuffed Red Chilli Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Grated Oal Ginger Pickle | ओल बरोबरा",
      slug: "grated-oal-ginger-pickle",
      shortDescription: "Unique grated elephant yam (Suran/Jimikand) pickle with ginger",
      description: "<p>A rare Bihari delicacy — finely grated oal (elephant yam/suran) mixed with fresh ginger and traditional spices. This unique pickle offers a texture and flavour you won't find anywhere else.</p>",
      ingredients: "Oal (Suran/Jimikand), ginger, mustard oil, mustard seeds, fenugreek, turmeric, red chilli, salt",
      storageInstructions: "Store in cool, dry place. Refrigerate after opening.",
      shelfLife: "9 months unopened",
      categorySlug: "regional-specials",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: true,
      region: "Magadh, Bihar",
      sortOrder: 2,
      tags: ["oal", "suran", "jimikand", "ginger", "rare", "regional"],
      variants: [
        { name: "250g", sku: "GOG-250", mrp: 250, price: 225, stock: 120, unit: "g", sortOrder: 1, isDefault: true },
        { name: "450g", sku: "GOG-450", mrp: 475, price: 425, stock: 80, unit: "g", sortOrder: 2 },
      ],
      images: [
        { url: "/images/products/grated-oal.webp", altText: "Grated Oal Ginger Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Karonda Pickle | कारोंदा का अचार",
      slug: "karonda-pickle",
      shortDescription: "Tangy karonda berry pickle — a rare Bihar speciality",
      description: "<p>Small, tart karonda berries pickled in mustard oil with aromatic spices. This seasonal pickle from Bihar is prized for its unique sour-spicy flavour and crunchy texture.</p>",
      ingredients: "Karonda (Christ's thorn), mustard oil, mustard seeds, fenugreek, turmeric, red chilli, salt",
      storageInstructions: "Store in a cool, dry place. Use dry spoon.",
      shelfLife: "12 months unopened",
      categorySlug: "pickles",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: true,
      region: "Magadh, Bihar",
      sortOrder: 3,
      tags: ["karonda", "berry", "tangy", "seasonal"],
      variants: [
        { name: "250g", sku: "KRN-250", mrp: 250, price: 225, stock: 0, unit: "g", sortOrder: 1, isDefault: true },
        { name: "450g", sku: "KRN-450", mrp: 475, price: 425, stock: 0, unit: "g", sortOrder: 2 },
      ],
      images: [
        { url: "/images/products/karonda.webp", altText: "Karonda Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Khatta Meetha Lemon Pickle | खट्टा मीठा नींबू का अचार",
      slug: "khatta-meetha-lemon-pickle",
      shortDescription: "Sweet & sour lemon pickle — perfect balance of tangy and sweet",
      description: "<p>A delightful twist on the classic lemon pickle — whole lemons marinated in a unique sweet-sour-spicy masala blend. The perfect accompaniment for anyone who loves a milder, more complex flavour profile.</p>",
      ingredients: "Lemons, sugar, salt, mustard oil, mustard seeds, fenugreek, turmeric, red chilli",
      storageInstructions: "Store in a cool, dry place. Refrigerate after opening.",
      shelfLife: "12 months unopened",
      categorySlug: "pickles",
      spiceLevel: "MILD" as const,
      isVeg: true,
      isBestseller: false,
      isFeatured: true,
      isNewArrival: true,
      region: "Magadh, Bihar",
      sortOrder: 4,
      tags: ["lemon", "sweet-sour", "mild", "family-friendly"],
      variants: [
        { name: "250g", sku: "KML-250", mrp: 250, price: 225, stock: 90, unit: "g", sortOrder: 1, isDefault: true },
        { name: "450g", sku: "KML-450", mrp: 475, price: 425, stock: 60, unit: "g", sortOrder: 2 },
      ],
      images: [
        { url: "/images/products/khatta-meetha-lemon.webp", altText: "Khatta Meetha Lemon Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Lemon Nimki Pickle | नींबू निमकी अचार",
      slug: "lemon-nimki-pickle",
      shortDescription: "Crunchy lemon pickle with a unique nimki-style texture",
      description: "<p>A Bihar-exclusive style of lemon pickle where lemons are cut into small pieces, sun-dried, and then pickled for a crunchier texture than traditional lemon achars.</p>",
      ingredients: "Lemons, mustard oil, mustard seeds, fenugreek, nigella seeds, turmeric, red chilli, salt",
      storageInstructions: "Store in a cool, dry place. Use dry spoon.",
      shelfLife: "12 months unopened",
      categorySlug: "pickles",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: true,
      region: "Magadh, Bihar",
      sortOrder: 5,
      tags: ["lemon", "nimki", "crunchy", "traditional"],
      variants: [
        { name: "250g", sku: "LNP-250", mrp: 250, price: 225, stock: 70, unit: "g", sortOrder: 1, isDefault: true },
      ],
      images: [
        { url: "/images/products/lemon-nimki.webp", altText: "Lemon Nimki Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Green Chilli Pickle | हरी मिर्च का अचार",
      slug: "green-chilli-pickle",
      shortDescription: "Whole green chillies pickled in mustard oil with aromatic spices",
      description: "<p>Fresh, crunchy green chillies slow-marinated in cold-pressed mustard oil with hand-ground spices. Every bite delivers the perfect amount of heat with a burst of tangy flavour.</p>",
      ingredients: "Green chillies, mustard oil, mustard seeds, fenugreek, fennel, turmeric, amchur, salt",
      storageInstructions: "Store in a cool, dry place.",
      shelfLife: "9 months unopened",
      categorySlug: "pickles",
      spiceLevel: "HOT" as const,
      isVeg: true,
      isBestseller: false,
      isFeatured: true,
      isNewArrival: true,
      region: "Magadh, Bihar",
      sortOrder: 6,
      tags: ["green-chilli", "pickle", "spicy", "fresh"],
      variants: [
        { name: "250g", sku: "GCP-250", mrp: 250, price: 225, stock: 20, unit: "g", sortOrder: 1, isDefault: true },
        { name: "450g", sku: "GCP-450", mrp: 475, price: 425, stock: 20, unit: "g", sortOrder: 2 },
      ],
      images: [
        { url: "/images/products/green-chilli.webp", altText: "Green Chilli Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Kathal Pickle | कटहल का अचार",
      slug: "kathal-pickle",
      shortDescription: "Jackfruit pickle — a treasured Bihar delicacy",
      description: "<p>Tender raw jackfruit chunks pickled in a rich masala of mustard, fenugreek, and nigella seeds. This seasonal speciality from Bihar is a must-try for pickle connoisseurs.</p>",
      ingredients: "Raw jackfruit, mustard oil, mustard seeds, fenugreek, nigella seeds, turmeric, red chilli, salt",
      storageInstructions: "Store in a cool, dry place. Refrigerate after opening.",
      shelfLife: "9 months unopened",
      categorySlug: "regional-specials",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isBestseller: false,
      isFeatured: false,
      region: "Magadh, Bihar",
      sortOrder: 7,
      tags: ["kathal", "jackfruit", "seasonal", "rare", "regional"],
      variants: [
        { name: "200g", sku: "KTH-200", mrp: 225, price: 200, stock: 0, unit: "g", sortOrder: 1 },
        { name: "250g", sku: "KTH-250", mrp: 250, price: 225, stock: 20, unit: "g", sortOrder: 2, isDefault: true },
        { name: "450g", sku: "KTH-450", mrp: 475, price: 425, stock: 0, unit: "g", sortOrder: 3 },
      ],
      images: [
        { url: "/images/products/kathal.webp", altText: "Kathal Pickle - Jackfruit Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Badhal Monkey Jackfruit | बड़हल का अचार",
      slug: "badhal-pickle",
      shortDescription: "Wild monkey jackfruit pickle — extremely rare Bihar speciality",
      description: "<p>Badhal (monkey jackfruit/lakoocha) is a wild fruit found in the forests of Bihar. This ultra-rare pickle has a distinctive tangy flavour that's impossible to find outside Bihar. Made in very limited batches.</p>",
      ingredients: "Badhal (monkey jackfruit), mustard oil, mustard seeds, fenugreek, turmeric, red chilli, salt",
      storageInstructions: "Store in a cool, dry place.",
      shelfLife: "9 months unopened",
      categorySlug: "regional-specials",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: true,
      region: "Magadh, Bihar",
      sortOrder: 8,
      tags: ["badhal", "monkey-jackfruit", "rare", "wild", "regional"],
      variants: [
        { name: "250g", sku: "BDH-250", mrp: 250, price: 225, stock: 40, unit: "g", sortOrder: 1 },
        { name: "450g", sku: "BDH-450", mrp: 475, price: 425, stock: 25, unit: "g", sortOrder: 2, isDefault: true },
      ],
      images: [
        { url: "/images/products/badhal.webp", altText: "Badhal Monkey Jackfruit Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Amra Pickle | अमरा का अचार",
      slug: "amra-pickle",
      shortDescription: "Wild hog plum pickle — seasonal Bihar treasure",
      description: "<p>Amra (hog plum) is a tangy wild fruit found across Bihar. This seasonal pickle captures the unique sour flavour of amra, perfectly balanced with traditional spices and cold-pressed mustard oil.</p>",
      ingredients: "Amra (hog plum), mustard oil, mustard seeds, fenugreek, turmeric, red chilli, salt",
      storageInstructions: "Store in a cool, dry place.",
      shelfLife: "9 months unopened",
      categorySlug: "regional-specials",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isBestseller: false,
      isFeatured: false,
      isNewArrival: true,
      region: "Magadh, Bihar",
      sortOrder: 9,
      tags: ["amra", "hog-plum", "seasonal", "sour", "regional"],
      variants: [
        { name: "250g", sku: "AMR-250", mrp: 250, price: 225, stock: 0, unit: "g", sortOrder: 1 },
        { name: "450g", sku: "AMR-450", mrp: 475, price: 425, stock: 0, unit: "g", sortOrder: 2, isDefault: true },
      ],
      images: [
        { url: "/images/products/amra.webp", altText: "Amra Pickle - Hog Plum Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Aam Kuccha Pickle | आम कुच्चा का अचार",
      slug: "aam-kuccha-pickle",
      shortDescription: "Classic raw mango pickle — the king of achars",
      description: "<p>The quintessential Indian pickle — raw mangoes hand-cut, sun-dried, and marinated in cold-pressed mustard oil with Maa's secret spice blend. This recipe has been in our family for over three decades.</p><p>Each batch is sun-cured for 21 days to develop the perfect tangy depth that pairs beautifully with dal-chawal, parathas, or any Indian meal.</p>",
      ingredients: "Raw mango, mustard oil, mustard seeds, fenugreek, fennel, nigella seeds, red chilli, turmeric, salt",
      storageInstructions: "Store in a cool, dry place. Always use a dry spoon.",
      shelfLife: "12 months unopened",
      usageSuggestions: "Best with dal-chawal, parathas, curd rice, or as a condiment with any meal.",
      categorySlug: "pickles",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: true,
      region: "Magadh, Bihar",
      sortOrder: 10,
      tags: ["mango", "aam", "kuccha", "traditional", "bestseller"],
      variants: [
        { name: "200g", sku: "AKP-200", mrp: 225, price: 200, stock: 1, unit: "g", sortOrder: 1 },
        { name: "250g", sku: "AKP-250", mrp: 250, price: 225, stock: 0, unit: "g", sortOrder: 2, isDefault: true },
        { name: "400g", sku: "AKP-400", mrp: 450, price: 400, stock: 1, unit: "g", sortOrder: 3 },
        { name: "450g", sku: "AKP-450", mrp: 475, price: 425, stock: 2, unit: "g", sortOrder: 4 },
      ],
      images: [
        { url: "/images/products/kuccha-aam.webp", altText: "Aam Kuccha Pickle - Raw Mango Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Garlic Pickle | लहसुन का अचार",
      slug: "garlic-pickle",
      shortDescription: "Bold whole garlic cloves in spiced mustard oil",
      description: "<p>Premium whole garlic cloves preserved in a signature masala blend with cold-pressed mustard oil. The garlic is slow-cured to absorb every layer of spice while retaining its crisp bite.</p><p>Rich in antioxidants and with a bold, pungent flavour — a must-have accompaniment for khichdi and dal tadka.</p>",
      ingredients: "Garlic cloves, mustard oil, mustard seeds, red chilli, turmeric, fenugreek, salt, asafoetida",
      storageInstructions: "Keep away from moisture. Refrigerate after opening.",
      shelfLife: "9 months unopened",
      usageSuggestions: "Excellent with dal, khichdi, rice, or as a side with roti.",
      categorySlug: "pickles",
      spiceLevel: "HOT" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: false,
      isNewArrival: true,
      region: "Magadh, Bihar",
      sortOrder: 11,
      tags: ["garlic", "lahsun", "spicy", "bold"],
      variants: [
        { name: "225g", sku: "GRP-225", mrp: 250, price: 225, stock: 60, unit: "g", sortOrder: 1 },
        { name: "250g", sku: "GRP-250", mrp: 275, price: 250, stock: 70, unit: "g", sortOrder: 2, isDefault: true },
        { name: "450g", sku: "GRP-450", mrp: 475, price: 425, stock: 40, unit: "g", sortOrder: 3 },
      ],
      images: [
        { url: "/images/products/garlic.webp", altText: "Garlic Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Green Chilli Kuccha Pickle | हरी मिर्च कुच्चा अचार",
      slug: "green-chilli-kuccha-pickle",
      shortDescription: "Raw green chilli pickle — Bihar's fiery tradition",
      description: "<p>Fresh, raw green chillies roughly chopped and pickled instantly with mustard oil and a pungent spice mix. Unlike our marinated version, this kuccha style pickle is made fresh and packs a more intense, raw heat.</p>",
      ingredients: "Green chillies, mustard oil, mustard seeds, fenugreek, turmeric, salt",
      storageInstructions: "Refrigerate after opening. Consume within 2 months.",
      shelfLife: "6 months unopened",
      categorySlug: "pickles",
      spiceLevel: "EXTRA_HOT" as const,
      isVeg: true,
      isBestseller: false,
      isFeatured: false,
      isNewArrival: true,
      region: "Magadh, Bihar",
      sortOrder: 12,
      tags: ["green-chilli", "kuccha", "raw", "fiery"],
      variants: [
        { name: "200g", sku: "GCK-200", mrp: 225, price: 200, stock: 20, unit: "g", sortOrder: 1 },
        { name: "250g", sku: "GCK-250", mrp: 250, price: 225, stock: 45, unit: "g", sortOrder: 2, isDefault: true },
        { name: "400g", sku: "GCK-400", mrp: 450, price: 400, stock: 30, unit: "g", sortOrder: 3 },
      ],
      images: [
        { url: "/images/products/chilli-kuccha.webp", altText: "Green Chilli Kuccha Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Mixed Vegetable Pickle | मिक्स्ड वेजिटेबल अचार",
      slug: "mixed-vegetable-pickle",
      shortDescription: "Classic mixed pickle with seasonal vegetables and spices",
      description: "<p>A medley of seasonal vegetables — mango, carrot, cauliflower, lemon, ginger, garlic, green chilli — all pickled together in one jar. The result is a complex, layered flavour that goes with everything.</p>",
      ingredients: "Raw mango, carrot, cauliflower, lemon, ginger, garlic, green chilli, mustard oil, spices, salt",
      storageInstructions: "Store in a cool, dry place. Use dry spoon.",
      shelfLife: "12 months unopened",
      categorySlug: "pickles",
      spiceLevel: "MILD" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: true,
      region: "Magadh, Bihar",
      sortOrder: 13,
      tags: ["mixed", "vegetable", "mild", "family"],
      variants: [
        { name: "200g", sku: "MVP-200", mrp: 225, price: 200, stock: 0, unit: "g", sortOrder: 1 },
        { name: "400g", sku: "MVP-400", mrp: 450, price: 400, stock: 0, unit: "g", sortOrder: 2, isDefault: true },
      ],
      images: [
        { url: "/images/products/mixed-vegetable.webp", altText: "Mixed Vegetable Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Khatta Meetha Mango Pickle | खट्टा मीठा आम अचार",
      slug: "khatta-meetha-mango-pickle",
      shortDescription: "Sweet & tangy mango pickle — a family favourite",
      description: "<p>Mangoes marinated in a unique sweet-sour blend that balances the tartness of raw mango with a touch of jaggery sweetness. Loved by kids and adults alike — the mildest pickle in our collection.</p>",
      ingredients: "Raw mango, jaggery, mustard oil, mustard seeds, fenugreek, turmeric, red chilli, salt",
      storageInstructions: "Store in a cool, dry place.",
      shelfLife: "12 months unopened",
      categorySlug: "pickles",
      spiceLevel: "MILD" as const,
      isVeg: true,
      isBestseller: false,
      isFeatured: false,
      region: "Magadh, Bihar",
      sortOrder: 14,
      tags: ["mango", "sweet-sour", "mild", "kids-friendly"],
      variants: [
        { name: "250g", sku: "KMM-250", mrp: 250, price: 225, stock: 0, unit: "g", sortOrder: 1, isDefault: true },
        { name: "400g", sku: "KMM-400", mrp: 450, price: 400, stock: 0, unit: "g", sortOrder: 2 },
      ],
      images: [
        { url: "/images/products/khatta-meetha-mango.webp", altText: "Khatta Meetha Mango Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Lemon Pickle | नींबू का अचार",
      slug: "lemon-pickle",
      shortDescription: "Sun-dried whole lemon pickle in traditional spiced brine",
      description: "<p>Whole lemons cured in a salty, spicy brine and sun-dried for 30 days, developing a deep umami flavour unique to Bihar-style lemon pickle. This pickle is a digestive powerhouse.</p>",
      ingredients: "Whole lemons, salt, turmeric, red chilli powder, fenugreek, mustard seeds, mustard oil",
      storageInstructions: "Does not require refrigeration. Store in glass jar.",
      shelfLife: "18 months",
      categorySlug: "pickles",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: false,
      region: "Magadh, Bihar",
      sortOrder: 15,
      tags: ["lemon", "nimbu", "digestive", "classic"],
      variants: [
        { name: "250g", sku: "LMP-250", mrp: 250, price: 225, stock: 20, unit: "g", sortOrder: 1, isDefault: true },
        { name: "400g", sku: "LMP-400", mrp: 450, price: 400, stock: 1, unit: "g", sortOrder: 2 },
      ],
      images: [
        { url: "/images/products/lemon.webp", altText: "Lemon Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      name: "Mango Pickle",
      slug: "mango-pickle",
      shortDescription: "Classic mango pickle — whole & sliced raw mango in traditional mustard oil masala",
      description:
        "<p>Raw mangoes pickled in cold-pressed mustard oil with our family spice blend. A versatile everyday achar that pairs with dal-chawal, parathas, and more.</p>",
      ingredients: "Raw mango, mustard oil, mustard seeds, fenugreek, fennel, nigella seeds, red chilli, turmeric, salt",
      storageInstructions: "Store in a cool, dry place. Always use a dry spoon.",
      shelfLife: "12 months unopened",
      categorySlug: "pickles",
      spiceLevel: "MEDIUM" as const,
      isVeg: true,
      isBestseller: true,
      isFeatured: true,
      region: "Magadh, Bihar",
      sortOrder: 16,
      tags: ["mango", "pickle", "traditional", "bestseller"],
      variants: [
        { name: "250g", sku: "MPL-250", mrp: 250, price: 225, stock: 20, unit: "g", sortOrder: 1, isDefault: true },
        { name: "450g", sku: "MPL-450", mrp: 475, price: 425, stock: 20, unit: "g", sortOrder: 2 },
        { name: "800g", sku: "MPL-800", mrp: 900, price: 800, stock: 20, unit: "g", sortOrder: 3 },
      ],
      images: [
        { url: "/images/products/kuccha-aam.webp", altText: "Mango Pickle", isPrimary: true, sortOrder: 1 },
      ],
    },
  ];

  for (const productData of productsData) {
    const { variants, images, categorySlug, ...product } = productData;
    const categoryId = categories[categorySlug];

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
    { key: "site_tagline", value: "माँ के हाथ का स्वाद — Premium Bihar Pickles", group: "general" },
    { key: "support_email", value: "magadhrecipe@gmail.com", group: "contact" },
    { key: "support_phone", value: "+91 620-719-7364", group: "contact" },
    { key: "free_shipping_threshold", value: "499", group: "shipping" },
    { key: "standard_shipping_fee", value: "60", group: "shipping" },
    { key: "cod_fee", value: "30", group: "shipping" },
    { key: "gst_rate", value: "12", group: "tax" },
    { key: "maintenance_mode", value: "false", group: "general" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
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
