// ==================== Shared TypeScript Types ====================

import type {
  User,
  Product,
  ProductVariant,
  ProductImage,
  Category,
  Cart,
  CartItem,
  Order,
  OrderItem,
  OrderShipping,
  Payment,
  Address,
  Review,
  Coupon,
  Banner,
  WishlistItem,
} from "@prisma/client";

// ==================== Extended Types ====================

export type ProductWithDetails = Product & {
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
  reviews: (Review & { user: Pick<User, "id" | "name" | "image"> })[];
  _count?: { reviews: number; wishlistItems: number; orderItems: number };
  avgRating?: number;
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  spiceLevel: string;
  isVeg: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  category: { name: string; slug: string };
  images: { url: string; altText?: string | null; isPrimary: boolean }[];
  variants: {
    id: string;
    name: string;
    price: number;
    mrp: number;
    stock: number;
    isDefault: boolean;
  }[];
  avgRating?: number;
  reviewCount?: number;
};

export type CartWithItems = Cart & {
  items: (CartItem & {
    product: Pick<Product, "id" | "name" | "slug"> & {
      images: ProductImage[];
    };
    variant: ProductVariant;
  })[];
};

export type CartItemDisplay = {
  id: string;
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    image?: string;
  };
  variant: {
    id: string;
    name: string;
    price: number;
    mrp: number;
    stock: number;
    sku: string;
  };
};

export type OrderWithDetails = Order & {
  items: (OrderItem & {
    product: Pick<Product, "id" | "name" | "slug">;
    variant: Pick<ProductVariant, "id" | "name">;
  })[];
  shipping: OrderShipping | null;
  payment: Payment | null;
};

export type UserWithAddresses = User & {
  addresses: Address[];
};

// ==================== Cart State ====================

export type CartState = {
  items: CartItemDisplay[];
  coupon: CouponData | null;
  subtotal: number;
  discount: number;
  couponDiscount: number;
  shippingCharge: number;
  taxAmount: number;
  total: number;
  itemCount: number;
};

// ==================== Coupon ====================

export type CouponData = {
  id: string;
  code: string;
  type: string;
  value: number;
  description?: string | null;
  maxDiscountAmount?: number | null;
  discountAmount: number;
};

// ==================== Admin Dashboard ====================

export type DashboardMetrics = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  revenueToday: number;
  ordersToday: number;
  lowStockItems: number;
  topProducts: {
    id: string;
    name: string;
    totalSold: number;
    revenue: number;
    image?: string;
  }[];
  revenueByDay: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  ordersByStatus: {
    status: string;
    count: number;
  }[];
};

// ==================== Product Filter State ====================

export type ProductFilters = {
  category?: string;
  search?: string;
  spiceLevel?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isVeg?: boolean;
  minRating?: number;
  sort: string;
  page: number;
  limit: number;
};

// ==================== Checkout ====================

export type CheckoutAddress = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type CheckoutState = {
  step: "address" | "payment" | "review";
  selectedAddressId?: string;
  newAddress?: CheckoutAddress;
  paymentMethod: "RAZORPAY" | "COD" | "UPI";
  couponCode?: string;
  giftNote?: string;
  isGiftOrder: boolean;
};

// ==================== Pagination ====================

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

// ==================== Next Auth Extensions ====================

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      phone?: string | null;
      phoneVerified?: boolean;
      marketingOptIn?: boolean;
      phonePromptDismissedAt?: string | null;
    };
  }
  interface User {
    role?: string;
    id?: string;
    phone?: string | null;
    phoneVerified?: boolean;
    marketingOptIn?: boolean;
  }
  interface JWT {
    id: string;
    role: string;
    phone?: string | null;
    phoneVerified?: boolean;
    marketingOptIn?: boolean;
    phonePromptDismissedAt?: string | null;
  }
}
