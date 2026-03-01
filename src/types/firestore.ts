import { Timestamp } from "firebase/firestore";

// ─── /platform/{config} ───────────────────────────────────────────────
export interface PlatformConfig {
    totalClubs: number;
    totalMembers: number;
    lastUpdated: Timestamp;
}

// ─── Landing page images ─────────────────────────────────────────────
export interface LandingImage {
    id: string;
    name: string;
    url: string;
    path: string;
    uploadedAt: Timestamp;
}

// ─── /clubs/{clubId} ──────────────────────────────────────────────────
export interface Club {
    id: string;
    name: string;
    currencyName: string;
    domain: string;
    domains?: string[];
    parentClubId: string | null;
    treePath: string;
    theme: string;
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor: string;
    logo: string;
    heroImage: string;
    tagline: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail?: string;
    ownerUserId: string;
    address?: string;
    status: "active" | "disabled" | "suspended";
    maintenancePaid: boolean;
    maintenanceDueDate: Timestamp;
    monthlyFee?: number;
    kitchenPin: string;
    createdAt: Timestamp;
    createdBy: string;
    referralBonusCoins?: number;
    landingPageUrl: string | null;
    landingPageImages: LandingImage[];
    landingPageHistory?: LandingPageVersion[];
}

// ─── Landing page version history ─────────────────────────────────────
export interface LandingPageVersion {
    version: number;
    url: string;
    publishedAt: Timestamp;
    publishedBy: string;
}

// ─── /clubs/{clubId}/payments/{paymentId} ─────────────────────────────
export interface PaymentRecord {
    id: string;
    clubId: string;
    amount: number;
    date: Timestamp;
    notes: string;
    recordedBy: string;
    createdAt: Timestamp;
}

// ─── /clubs/{clubId}/usageStats ───────────────────────────────────────
export interface UsageStats {
    reads: number;
    writes: number;
    lastUpdated: Timestamp;
}

// ─── /enquiries/{enquiryId} ───────────────────────────────────────────
export interface Enquiry {
    id: string;
    clubId: string;
    name: string;
    phone: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    dob?: string;
    currentWeight?: number;
    targetWeight?: number;
    healthConditions?: string;
    referredBy?: string;
    status: "new" | "contacted" | "converted" | "rejected";
    createdAt: Timestamp;
}

// ─── /platform/settings ───────────────────────────────────────────────
export interface PlatformSettings {
    platformName: string;
    logoUrl: string;
    supportEmail: string;
    supportPhone: string;
    defaultMonthlyFee: number;
    updatedAt: Timestamp;
    updatedBy: string;
}

// ─── /users/{userId} ──────────────────────────────────────────────────
export type UserRole =
    | "superAdmin"
    | "clubOwner"
    | "staff"
    | "member"
    | "kitchenDisplay";

export interface User {
    id: string;
    name: string;
    phone: string;
    email: string;
    photo: string;
    role: UserRole;
    clubId: string;
    parentUserId: string | null;
    treePath: string;
    membershipTier: "gold" | "silver" | "bronze" | null;
    membershipStart: Timestamp | null;
    membershipEnd: Timestamp | null;
    membershipPlanId: string | null;
    status: "active" | "paused" | "expired";
    dob: Timestamp | null;
    anniversary: Timestamp | null;
    qrCode: string;
    isClubOwner: boolean;
    ownedClubId: string | null;
    originalClubId: string;
    referredBy: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ─── /users/{userId}/weightLog/{logId} ────────────────────────────────
export interface WeightLog {
    id: string;
    weight: number;
    date: Timestamp;
    notes: string;
}

// ─── /wallets/{userId} ────────────────────────────────────────────────
export interface Wallet {
    userId: string;
    clubId: string;
    currencyName: string;
    balance: number;
    lastUpdated: Timestamp;
}

// ─── /walletTransactions/{transactionId} ──────────────────────────────
export interface WalletTransaction {
    id: string;
    userId: string;
    clubId: string;
    type: "credit" | "debit";
    amount: number;
    reason:
    | "topup"
    | "shake_order"
    | "membership"
    | "product"
    | "referral_bonus"
    | "adjustment";
    addedBy: string | null;
    note: string;
    createdAt: Timestamp;
    balanceAfter: number;
}

// ─── /topupRequests/{requestId} ───────────────────────────────────────
export interface TopupRequest {
    id: string;
    memberId: string;
    memberName: string;
    memberPhoto: string;
    clubId: string;
    requestedAmount: number;
    approvedAmount: number | null;
    status: "pending" | "approved" | "rejected";
    requestedAt: Timestamp;
    resolvedAt: Timestamp | null;
    resolvedBy: string | null;
}

// ─── /attendance/{attendanceId} ───────────────────────────────────────
export interface Attendance {
    id: string;
    userId: string;
    userName: string;
    userPhoto: string;
    clubId: string;
    type: "member" | "volunteer";
    checkInTime: Timestamp;
    checkOutTime: Timestamp | null;
    hoursWorked: number | null;
    checkInMethod: "qr" | "manual" | "mobile";
    date: string;
}

// ─── /orders/{orderId} ────────────────────────────────────────────────
export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
    notes: string;
}

export interface Order {
    id: string;
    memberId: string;
    memberName: string;
    memberPhoto: string;
    clubId: string;
    staffId: string;
    items: OrderItem[];
    totalCost: number;
    status: "pending" | "preparing" | "served";
    rating: number | null;
    ratingNote: string | null;
    date: string;
    createdAt: Timestamp;
    servedAt: Timestamp | null;
}

// ─── /products/{productId} ────────────────────────────────────────────
export interface Product {
    id: string;
    clubId: string;
    name: string;
    category: "shake" | "supplement" | "snack" | "other";
    price: number;
    stock: number;
    lowStockThreshold: number;
    expiryDate: Timestamp | null;
    photo: string;
    isAvailableToday: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ─── /memberships/{planId} ────────────────────────────────────────────
export interface MembershipPlan {
    id: string;
    clubId: string;
    name: string;
    price: number;
    durationDays: number;
    benefits: string[];
    color: string;
    isActive: boolean;
    createdAt: Timestamp;
}

// ─── /announcements/{announcementId} ──────────────────────────────────
export interface Announcement {
    id: string;
    clubId: string;
    title: string;
    message: string;
    postedBy: string;
    createdAt: Timestamp;
    expiresAt: Timestamp | null;
    isActive: boolean;
}

// ─── /referrals/{referralId} ──────────────────────────────────────────
export interface Referral {
    id: string;
    referrerId: string;
    referredId: string;
    clubId: string;
    bonusCoinsAwarded: number;
    status: "pending" | "rewarded";
    createdAt: Timestamp;
    rewardedAt: Timestamp | null;
}

// ─── /billingPrints/{billId} ──────────────────────────────────────────
export interface BillItem {
    name: string;
    quantity: number;
    pricePerUnit: number;
    total: number;
}

export interface BillingPrint {
    id: string;
    memberId: string;
    memberName: string;
    clubId: string;
    items: BillItem[];
    subtotal: number;
    total: number;
    paidFrom: "wallet" | "cash";
    printedAt: Timestamp;
    printedBy: string;
}
