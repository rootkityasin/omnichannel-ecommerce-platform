/**
 * Centralized Type Definitions for Omnichannel Ecommerce Platform
 * Used to resolve no-explicit-any lint errors across the project.
 */

export interface Product {
  id: string;
  name: string;
  name_bn?: string;
  price: string | number;
  price_bn?: string;
  image?: string;
  images?: string[];
  isAvailable?: boolean;
  categoryId?: string;
  cookingImage?: string;
  nutritionImage?: string;
  description?: string;
  description_bn?: string;
  pieces?: number;
  totalSold?: number;
  type?: "SINGLE" | "COMBO";
  comboItems?: {
    quantity: number;
    child?: {
      pieces: number;
      servingSize?: number;
    };
  }[];
  weightOptions?: string[];
  weight?: number;
  servingSize?: number;
  nutrition?: string;
  cookingInstructions?: string;
  stage?: string;
}

// --- Admin Types ---
export type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "HUB_ADMIN"
  | "STAFF"
  | "USER";

export interface Hub {
  id: string;
  name: string;
  location: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  hubId?: string; // If null/undefined, effectively Super Admin access to all
}

export interface AdminOrder {
  id: string; // OrderID (e.g. ORD-...)
  dbId: string;
  date: string;
  customer: string;
  phone: string;
  address?: string;
  items: number;
  itemDetails?: {
    name: string;
    quantity: number;
  }[];
  source: string;
  price: number;
  status: string;
  hubId?: string | null;
  isRepeat: boolean;
  orderCount: number;
  stockDeducted: boolean;
  [key: string]: unknown; // Allow extensibility
}

export interface AdminOrderDetails {
  id: string;
  dbId: string;
  date: string;
  customer: string;
  phone: string;
  email?: string;
  address: string;
  area?: string;
  source: string;
  price: number;
  status: string;
  stockDeducted: boolean;
  paymentMethod?: string;
  couponCode?: string;
  discountAmount?: number;
  transactionId?: string;
  notes?: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
}

export interface StockProduct extends AdminProduct {
  category: { name: string };
  type: "SINGLE" | "COMBO";
  pieces: number;
  weight: number;
  image?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string | Date;
  category: string;
  hub?: { name: string };
}

export interface AdminProduct {
  id: string;
  name: string;
  price: number;
  stock: boolean;
  hubId?: string;
  sections?: { id: string }[];
  // For Kanban Board & Stock List
  pieces?: number;
  stage?: string;
  type?: "SINGLE" | "COMBO";
  comboItems?: {
    quantity: number;
    child?: {
      pieces: number;
    };
  }[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  customDomain?: string | null;
  primaryDomain?: string | null;
  plan: string; // Prisma is String, not enum in some contexts? schema says String @default("FREE"). Enum is not used in schema for plan?
  isActive: boolean;
  setupFeePaid?: boolean;
  createdAt: Date;
  users?: User[];
  siteConfig?: SiteConfig;
  status?: string;
  _count?: {
    users: number;
    orders: number;
    products: number;
  };
}

export interface CartItem extends Product {
  uniqueId: string; // For cart management (uuid)
  quantity: number;
  selectedWeight?: string;
  selectedMetrics?: string; // e.g. "500g"
}

export interface SiteConfig {
  id?: string;
  tenantId?: string;
  shopName: string;
  logoUrl?: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  primaryColor: string;
  secondaryColor: string;
  taxPercentage: number;
  measurementUnit: string;
  allergensText: string;
  certificates: (string | { image: string; link?: string })[]; // URLs or Objects
  privacyPolicy?: string | null;
  refundPolicy?: string | null;
  termsPolicy?: string | null;
  shopType?: string;
  weightUnitValue?: number;
  volumeUnitValue?: number;
  invoiceTheme?: string;
  invoiceDetails?: {
    showSeller?: boolean;
    showBuyer?: boolean;
    showSignature?: boolean;
    watermarkOpacity?: number;
    fontSize?: number;
  };
  shops?: { id: string; name: string }[];

  // SEO Fields
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  twitterCard?: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  jsonLdType?: string | null;
  sitelinks?: { title: string; description: string }[];

  // Social Links
  socialFacebook?: string | null;
  socialInstagram?: string | null;
  socialTwitter?: string | null;
  socialYoutube?: string | null;

  // Meta Pixel
  metaPixelId?: string | null;
  metaAccessToken?: string | null;
  gtmContainerId?: string | null;

  // Tenant / Domain
  customDomain?: string | null;
  tenant?: {
    slug: string;
  };
}

export interface Order {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: string;
  customerEmail?: string | null;
  paymentMethod?: string | null;
  advancePaidAmount?: number;
  advancePaymentStatus?: string;
  transactionId?: string | null;
  createdAt: Date;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  selectedModifiers?: string;
  product?: Product;
}

export interface CheckoutFormData {
  name: string;
  phone: string;
  email: string;
  area: string;
  address: string;
  [key: string]: string;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  estYear: string;
  mascotImage: string;
}

export interface ValuesContent {
  manifestoTitle: string;
  manifestoText: string;
  brandValues: string[];
}

export interface GalleryItem {
  src: string;
  alt: string;
  rotate: number;
}

export interface GallerySectionContent {
  title: string;
  subtitle: string;
  items: GalleryItem[];
}

export interface TeamMember {
  name: string;
  role: string;
  image: string;
  story: string;
}

export interface WholesaleContent {
  title: string;
  description: string;
  whatsappNumber: string;
  image: string;
}

export interface ReviewItem {
  id: number;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ReviewsContent {
  featuredImage: string;
  gridImages: { id: number; src: string; alt: string }[];
  reviews: ReviewItem[];
}

export interface ProductsSectionContent {
  title: string;
  productIds: string[];
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  title: string;
  title_bn?: string | null;
  subtitle?: string | null;
  subtitle_bn?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  isActive: boolean;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  tenantId: string | null;
  animationType: string;
  icon: string;
  _count?: {
    products: number;
  };
}

export interface CartTexts {
  successImage?: string;
  successTitle?: string;
  successMessage?: string;
  backHome?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyImage?: string;
  browseMenu?: string;
  title?: string;
  subtotal?: string;
  deliveryFee?: string;
  total?: string;
  deliveryDetails?: string;
  confirmOrder?: string;
  fields?: { id: string; label: string }[];
}

export interface PaymentConfig {
  codEnabled: boolean;
  bkashEnabled: boolean;
  bkashAppKey?: string | null;
  bkashSecretKey?: string | null;
  bkashUsername?: string | null;
  bkashPassword?: string | null;
  nagadEnabled: boolean;
  nagadMerchantNumber?: string | null;
  nagadPublicKey?: string | null;
  nagadPrivateKey?: string | null;
  selfMfsEnabled: boolean;
  selfMfsType?: string | null;
  selfMfsPhone?: string | null;
  selfMfsInstruction?: string | null;
  selfMfsQrCode?: string | null;
  advancePaymentEnabled: boolean;
  advancePaymentType?: string | null;
  advancePaymentValue?: number | string | null;
  bkashLogo?: string | null;
  nagadLogo?: string | null;
}

export interface WeightBasedCharge {
  min: number;
  max: number;
  charge: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  charge: number;
  type?: string;
  codEnabled?: boolean;
}

export interface Section {
  id: string;
  title: string;
  slug: string;
  order: number;
  isActive: boolean;
  _count?: {
    products: number;
  };
}
export interface DeliveryConfig {
  defaultCharge: number;
  defaultCodEnabled: boolean;
  nonRefundable: boolean;
  weightBasedCharges: WeightBasedCharge[];
  deliveryZones: DeliveryZone[];
  courierPathaoEnabled: boolean;
  courierPathaoCredentials?: {
    store_id: string;
    client_id: string;
    client_secret: string;
    password?: string | null;
    username?: string | null;
  } | null;
  courierSteadfastEnabled: boolean;
  courierSteadfastCredentials?: {
    api_key: string;
    app_secret: string;
  } | null;
  courierRedxEnabled: boolean;
  courierRedxCredentials?: {
    api_key?: string | null;
    username?: string | null;
    password?: string | null;
  } | null;
  courierPaperflyEnabled: boolean;
  courierPaperflyCredentials?: {
    username: string;
    password?: string | null;
  } | null;
}
