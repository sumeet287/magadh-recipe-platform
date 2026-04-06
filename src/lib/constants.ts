// ==================== App Constants ====================

export const APP_NAME = "Magadh Recipe";
export const APP_TAGLINE = "आचार की असली पहचान — The Authentic Taste of Magadh";
export const APP_DESCRIPTION =
  "Premium handcrafted pickles, masalas, and regional food products from the heart of Bihar. Pure ingredients, traditional recipes, delivered fresh.";
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
    title: "Authentic Family Recipes",
    body: "Every product is crafted from secret family recipes passed down through generations in the heart of Magadh region.",
  },
  {
    icon: "🌶️",
    title: "Premium Ingredients",
    body: "We source only the finest mustard oil, farm-fresh chilies, and authentic Indian spices directly from Bihar.",
  },
  {
    icon: "💚",
    title: "No Artificial Additives",
    body: "Zero preservatives, zero artificial colors, zero compromise. Just pure, natural goodness in every jar.",
  },
  {
    icon: "👩‍🍳",
    title: "Made with Love",
    body: "Our products are crafted by skilled home cooks who take immense pride in every batch they prepare.",
  },
  {
    icon: "🎁",
    title: "Gift-Worthy Packaging",
    body: "Premium packaging that makes our pickles and masalas the perfect gift for every occasion.",
  },
  {
    icon: "⚡",
    title: "Quick Delivery",
    body: "Fresh batches dispatched within 24 hours of ordering. Delivered pan-India in 3-7 business days.",
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
  title: "The Story of Magadh Recipe",
  subtitle: "From Dadi's Kitchen to Your Doorstep",
  paragraphs: [
    "Born in the culturally rich land of Magadh — a region that once housed the mighty Mauryan empire — Magadh Recipe carries forward a legacy of flavors that have delighted generations of Bihari families.",
    "Our journey began in a small kitchen in Patna, where a grandmother's treasured recipes were made with nothing but love, patience, and the finest local ingredients. What started as sharing with neighbors soon became a movement to preserve and share the authentic tastes of Bihar with the world.",
    "Today, we work with skilled home cooks across Bihar who craft every jar with the same devotion and purity as those original recipes. We use cold-pressed mustard oil, hand-picked spices, and traditional techniques that ensure every product you receive is genuinely homemade.",
    "We believe Indian pickles are not just condiments — they are memories, culture, and heritage in a jar. With Magadh Recipe, we invite you to taste the authentic flavors of Magadh, crafted for the modern table.",
  ],
  stats: [
    { value: "25+", label: "Authentic Products" },
    { value: "50K+", label: "Happy Customers" },
    { value: "100%", label: "Natural Ingredients" },
    { value: "5★", label: "Average Rating" },
  ],
};
