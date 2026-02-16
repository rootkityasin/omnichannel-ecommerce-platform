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
    weightOptions?: string[];
    weight?: number;
    servingSize?: number;
    nutrition?: string;
    cookingInstructions?: string;
    stage?: string;
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
    certificates: any[]; // JSON
    privacyPolicy?: string | null;
    refundPolicy?: string | null;
    termsPolicy?: string | null;
    shopType?: string;
    weightUnitValue?: number;
    volumeUnitValue?: number;
    invoiceTheme?: string;
    invoiceDetails?: any;
}

export interface Order {
    id: string;
    orderId: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    status: string;
    totalAmount: number;
    discountAmount?: number;
    couponCode?: string;
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
    advancePaymentType?: string | null;
    advancePaymentValue?: number | string | null;
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
    type: 'ZONE' | 'DISTRICT' | 'UPAZILA';
    codEnabled: boolean;
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
