// ==================== App Constants ====================

export const APP_NAME = "Magadh Recipe";
export const APP_TAGLINE = "माँ के हाथ का स्वाद — A Mother's Love, in Every Jar";
export const APP_DESCRIPTION =
  "Born from a mother's kitchen in the heart of Bihar — premium handcrafted pickles, achars, masalas & regional delicacies. No preservatives, cold-pressed mustard oil, authentic family recipes lovingly passed down through generations. Delivered fresh across India.";
export const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
export const SUPPORT_EMAIL = "support@magadhrecipe.com";
export const SUPPORT_PHONE = "+91-9876543210";
export const BRAND_ADDRESS = "Patna, Bihar, India - 800001";

// ==================== Commerce ====================

export const FREE_SHIPPING_THRESHOLD = 499; // INR
export const STANDARD_SHIPPING_FEE = 60;    // INR
export const COD_FEE = 30;                  // INR
export const GST_RATE = 5;                  // Percentage

export const PAGINATION = {
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 48,
  ADMIN_LIMIT: 20,
};

// ==================== Spice Levels ====================

export const SPICE_LEVEL_CONFIG = {
  MILD: { label: "Mild", emoji: "🌶️", color: "#22c55e", count: 1 },
  MEDIUM: { label: "Medium", emoji: "🌶️🌶️", color: "#f59e0b", count: 2 },
  HOT: { label: "Hot", emoji: "🌶️🌶️🌶️", color: "#ef4444", count: 3 },
  EXTRA_HOT: { label: "Extra Hot", emoji: "🌶️🌶️🌶️🌶️", color: "#dc2626", count: 4 },
};

// ==================== Order Status Config ====================

export const ORDER_STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "gray", description: "Order placed, awaiting confirmation" },
  CONFIRMED: { label: "Confirmed", color: "blue", description: "Order confirmed" },
  PAID: { label: "Paid", color: "green", description: "Payment received" },
  PROCESSING: { label: "Processing", color: "yellow", description: "Being prepared" },
  PACKED: { label: "Packed", color: "yellow", description: "Order packed and ready" },
  SHIPPED: { label: "Shipped", color: "blue", description: "Out for delivery" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "blue", description: "With delivery partner" },
  DELIVERED: { label: "Delivered", color: "green", description: "Delivered successfully" },
  RETURN_REQUESTED: { label: "Return Requested", color: "orange", description: "Customer requested a return" },
  RETURNED: { label: "Returned", color: "orange", description: "Product returned to seller" },
  CANCELLED: { label: "Cancelled", color: "red", description: "Order cancelled" },
  REFUND_INITIATED: { label: "Refund Initiated", color: "orange", description: "Refund in process" },
  REFUNDED: { label: "Refunded", color: "purple", description: "Amount refunded" },
  FAILED: { label: "Failed", color: "red", description: "Payment/order failed" },
};

// ==================== Product Regions ====================

export const PRODUCT_REGIONS = [
  "Patna",
  "Gaya",
  "Nalanda",
  "Vaishali",
  "Muzaffarpur",
  "Bhagalpur",
  "Magadh",
  "Mithila",
  "Pan-Bihar",
];

// ==================== Sort Options ====================

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Best Rated" },
  { value: "popularity", label: "Most Popular" },
];

// ==================== Social Links ====================

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/magadhrecipe",
  facebook: "https://facebook.com/magadhrecipe",
  twitter: "https://twitter.com/magadhrecipe",
  youtube: "https://youtube.com/@magadhrecipe",
  whatsapp: "https://wa.me/919876543210",
};

// ==================== Trust Badges ====================

export const TRUST_BADGES = [
  {
    icon: "🏺",
    title: "100% Homemade",
    description: "Prepared in hygienic home kitchens with love",
  },
  {
    icon: "🌿",
    title: "No Preservatives",
    description: "Pure ingredients, natural preservation",
  },
  {
    icon: "📦",
    title: "Secure Packaging",
    description: "Air-tight, leak-proof packaging",
  },
  {
    icon: "🚚",
    title: "Pan-India Delivery",
    description: "Delivered across India in 3-7 days",
  },
  {
    icon: "↩️",
    title: "Easy Returns",
    description: "7-day hassle-free return policy",
  },
  {
    icon: "⭐",
    title: "Quality Assured",
    description: "FSSAI certified kitchens",
  },
];

// ==================== WHY CHOOSE US ====================

export const WHY_CHOOSE_US = [
  {
    icon: "🏺",
    title: "Maa ki Recipe",
    body: "Every jar carries a mother's secret recipe — lovingly perfected over decades in the Magadh kitchens of Bihar.",
  },
  {
    icon: "🌶️",
    title: "Handpicked Ingredients",
    body: "Only kachi ghani mustard oil, farm-fresh chilies, and stone-ground spices sourced directly from Bihar's fields.",
  },
  {
    icon: "💚",
    title: "Zero Preservatives",
    body: "No artificial colors, no chemicals, no shortcuts. Just pure, honest, natural goodness — exactly like homemade.",
  },
  {
    icon: "👩‍🍳",
    title: "Crafted with Love",
    body: "Each batch is prepared by skilled home cooks who pour their heart and soul into every jar they seal.",
  },
  {
    icon: "🎁",
    title: "Gift-Worthy Packaging",
    body: "Beautifully packaged in premium glass jars — perfect for gifting on festivals, weddings, and special occasions.",
  },
  {
    icon: "⚡",
    title: "Farm-Fresh Delivery",
    body: "Prepared fresh on order and dispatched within 48 hours. Delivered pan-India with care in 3-7 business days.",
  },
];

// ==================== Testimonials ====================

export const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    location: "Mumbai",
    rating: 5,
    text: "The mango pickle from Magadh Recipe is absolutely divine! It tastes exactly like what my nani used to make. I've ordered 4 times already!",
    product: "Aam Ka Achar",
    avatar: "/images/avatars/avatar-1.jpg",
  },
  {
    name: "Rohit Kumar",
    location: "Bangalore",
    rating: 5,
    text: "Being a Bihari living in Bangalore, I was craving authentic home-style pickle. Magadh Recipe delivered exactly that. The lemon pickle is outstanding!",
    product: "Nimbu Ka Achar",
    avatar: "/images/avatars/avatar-2.jpg",
  },
  {
    name: "Anita Singh",
    location: "Delhi",
    rating: 5,
    text: "Ordered the gift hamper for my parents and they absolutely loved it! Excellent packaging, fresh products, and the taste is absolutely authentic.",
    product: "Gift Hamper",
    avatar: "/images/avatars/avatar-3.jpg",
  },
  {
    name: "Vikram Prasad",
    location: "Hyderabad",
    rating: 5,
    text: "The stuffed red chilli pickle is a masterpiece. Never tasted anything like this outside Bihar. Thank you Magadh Recipe for bringing a piece of home!",
    product: "Bharwa Mirch Achar",
    avatar: "/images/avatars/avatar-4.jpg",
  },
  {
    name: "Kavya Mishra",
    location: "Pune",
    rating: 5,
    text: "Best pickles I've had in years! The quality is consistent, delivery is fast, and the packaging is premium. Highly recommend to every pickle lover!",
    product: "Mixed Pickle",
    avatar: "/images/avatars/avatar-5.jpg",
  },
];

// ==================== Brand Story ====================

export const BRAND_STORY = {
  title: "A Mother's Kitchen, Your Table",
  subtitle: "माँ के हाथ का स्वाद — A taste only a mother's hands can create",
  paragraphs: [
    "Magadh Recipe was born from the most honest kitchen in the world — a mother's. In the ancient land of Magadh, where the Mauryan empire once flourished, our Maa has been perfecting these recipes for over three decades, filling our home with aromas that became the flavour of our childhood.",
    "What began as jars lovingly packed for family and neighbours became something bigger when people simply couldn't stop asking for more. Her mango pickle, her garlic achar, her secret masala blends — each one a masterpiece that no factory could ever replicate.",
    "Today, every single jar is still made under her watchful eye. We use the same cold-pressed mustard oil, the same hand-ground spices, the same clay vessel marination that she has always insisted upon. No machines. No preservatives. No compromise.",
    "This isn't just a pickle brand — it's a mother's legacy in a jar. When you open a jar of Magadh Recipe, you're tasting generations of love, tradition, and the unmistakable warmth of a Bihari maa's kitchen.",
  ],
  stats: [
    { value: "25+", label: "Authentic Products" },
    { value: "50K+", label: "Happy Families" },
    { value: "100%", label: "Natural Ingredients" },
    { value: "5★", label: "Average Rating" },
  ],
};
