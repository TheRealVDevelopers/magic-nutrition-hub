/**
 * Receipt builders for all print types.
 * All receipts use ESC/POS commands formatted for 80mm (48-char) thermal paper.
 */

import {
    ALIGN_CENTER, ALIGN_LEFT,
    BOLD_ON, BOLD_OFF,
    SIZE_LARGE, SIZE_NORMAL, SIZE_MEDIUM,
    LF, DIVIDER, DIVIDER_THIN,
    CUT, twoCol, truncate,
} from './escpos';
import { formatINR } from './printReceipt';

// ═══════════════════════════════════════════════
// Club data shape used by all receipts
// ═══════════════════════════════════════════════
export interface ClubPrintData {
    name: string;
    address?: string;
    phone?: string;
    gstNumber?: string;
}

// ═══════════════════════════════════════════════
// HEADER + FOOTER (shared by all receipts)
// ═══════════════════════════════════════════════

export const buildHeader = (club: ClubPrintData): string[] => [
    ALIGN_CENTER,
    BOLD_ON,
    SIZE_LARGE,
    club.name,
    SIZE_NORMAL,
    BOLD_OFF,
    LF,
    ...(club.address ? [club.address] : []),
    ...(club.phone ? [`Ph: ${club.phone}`] : []),
    ...(club.gstNumber ? [`GSTIN: ${club.gstNumber}`] : []),
    DIVIDER,
    ALIGN_LEFT,
];

export const buildFooter = (): string[] => [
    LF,
    DIVIDER,
    ALIGN_CENTER,
    '"Good nutrition is not a luxury,',
    ' it is a necessity of life."',
    '— Mark Hughes, Herbalife Founder',
    LF,
    'Powered by Magic Nutrition Club',
    LF,
    LF,
    CUT,
];

// Helper to format a Date
const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

// ═══════════════════════════════════════════════
// 1. WALLET TOP-UP RECEIPT
// ═══════════════════════════════════════════════

export interface TopUpReceiptData {
    club: ClubPrintData;
    memberName: string;
    memberId: string;
    phone: string;
    amount: number;
    previousBalance: number;
    newBalance: number;
    paymentMethod: string;
    transactionId: string;
    timestamp: Date;
}

export const buildTopUpReceipt = (data: TopUpReceiptData): string[] => [
    ...buildHeader(data.club),
    LF,
    ALIGN_CENTER,
    BOLD_ON,
    'WALLET TOP-UP RECEIPT',
    BOLD_OFF,
    ALIGN_LEFT,
    LF,
    twoCol('Date:', fmtDate(data.timestamp)),
    twoCol('Time:', fmtTime(data.timestamp)),
    twoCol('Receipt No:', data.transactionId),
    DIVIDER_THIN,
    LF,
    BOLD_ON,
    'MEMBER DETAILS',
    BOLD_OFF,
    twoCol('Name:', truncate(data.memberName, 30)),
    twoCol('Member ID:', data.memberId),
    twoCol('Phone:', data.phone),
    DIVIDER_THIN,
    LF,
    BOLD_ON,
    'TRANSACTION DETAILS',
    BOLD_OFF,
    twoCol('Amount Added:', formatINR(data.amount)),
    twoCol('Payment Method:', data.paymentMethod),
    twoCol('Prev Balance:', formatINR(data.previousBalance)),
    DIVIDER_THIN,
    BOLD_ON,
    SIZE_MEDIUM,
    twoCol('NEW BALANCE:', formatINR(data.newBalance)),
    SIZE_NORMAL,
    BOLD_OFF,
    LF,
    ...buildFooter(),
];

// ═══════════════════════════════════════════════
// 2. MEMBERSHIP RECEIPT
// ═══════════════════════════════════════════════

export interface MembershipReceiptData {
    club: ClubPrintData;
    memberName: string;
    memberId: string;
    planName: string;
    amount: number;
    paymentMethod: string;
    startDate: Date;
    endDate: Date;
    timestamp: Date;
    receiptNumber: string;
}

export const buildMembershipReceipt = (data: MembershipReceiptData): string[] => [
    ...buildHeader(data.club),
    LF,
    ALIGN_CENTER,
    BOLD_ON,
    'MEMBERSHIP RECEIPT',
    BOLD_OFF,
    ALIGN_LEFT,
    LF,
    twoCol('Date:', fmtDate(data.timestamp)),
    twoCol('Receipt No:', data.receiptNumber),
    DIVIDER_THIN,
    LF,
    BOLD_ON,
    'MEMBER DETAILS',
    BOLD_OFF,
    twoCol('Name:', truncate(data.memberName, 30)),
    twoCol('Member ID:', data.memberId),
    DIVIDER_THIN,
    LF,
    BOLD_ON,
    'PLAN DETAILS',
    BOLD_OFF,
    twoCol('Plan:', data.planName),
    twoCol('Amount:', formatINR(data.amount)),
    twoCol('Payment:', data.paymentMethod),
    twoCol('Valid From:', fmtDate(data.startDate)),
    twoCol('Valid Until:', fmtDate(data.endDate)),
    LF,
    ...buildFooter(),
];

// ═══════════════════════════════════════════════
// 3. KITCHEN DAILY REPORT
// ═══════════════════════════════════════════════

export interface KitchenDailyData {
    club: ClubPrintData;
    date: string;
    totalShakes: number;
    completedOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    productBreakdown: Array<{ name: string; qty: number }>;
}

export const buildKitchenDailyReceipt = (data: KitchenDailyData): string[] => [
    ...buildHeader(data.club),
    LF,
    ALIGN_CENTER,
    BOLD_ON,
    'KITCHEN DAILY REPORT',
    BOLD_OFF,
    ALIGN_LEFT,
    twoCol('Date:', data.date),
    LF,
    DIVIDER_THIN,
    BOLD_ON,
    'SUMMARY',
    BOLD_OFF,
    twoCol('Total Shakes Sold:', String(data.totalShakes)),
    twoCol('Orders Completed:', String(data.completedOrders)),
    twoCol('Orders Pending:', String(data.pendingOrders)),
    twoCol('Total Revenue:', formatINR(data.totalRevenue)),
    LF,
    DIVIDER_THIN,
    BOLD_ON,
    'PRODUCT BREAKDOWN',
    BOLD_OFF,
    ...data.productBreakdown.map(p =>
        twoCol(truncate(p.name, 32), `${p.qty} sold`)
    ),
    LF,
    ...buildFooter(),
];

// ═══════════════════════════════════════════════
// 4. DAILY SALES REPORT
// ═══════════════════════════════════════════════

export interface DailySalesData {
    club: ClubPrintData;
    date: string;
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    topProducts: Array<{ name: string; count: number }>;
    topMembers: Array<{ name: string; count: number }>;
}

export const buildDailySalesReceipt = (data: DailySalesData): string[] => [
    ...buildHeader(data.club),
    LF,
    ALIGN_CENTER,
    BOLD_ON,
    'DAILY SALES REPORT',
    BOLD_OFF,
    ALIGN_LEFT,
    twoCol('Date:', data.date),
    DIVIDER_THIN,
    BOLD_ON,
    'REVENUE SUMMARY',
    BOLD_OFF,
    twoCol('Total Revenue:', formatINR(data.totalRevenue)),
    twoCol('Total Orders:', String(data.totalOrders)),
    twoCol('Completed:', String(data.completedOrders)),
    twoCol('Cancelled:', String(data.cancelledOrders)),
    DIVIDER_THIN,
    BOLD_ON,
    'TOP PRODUCTS',
    BOLD_OFF,
    ...data.topProducts.map((p, i) =>
        twoCol(`${i + 1}. ${truncate(p.name, 28)}`, `${p.count} sold`)
    ),
    DIVIDER_THIN,
    BOLD_ON,
    'TOP MEMBERS TODAY',
    BOLD_OFF,
    ...data.topMembers.map((m, i) =>
        twoCol(`${i + 1}. ${truncate(m.name, 28)}`, `${m.count} order${m.count > 1 ? 's' : ''}`)
    ),
    LF,
    ...buildFooter(),
];

// ═══════════════════════════════════════════════
// 5. MONTHLY SALES REPORT
// ═══════════════════════════════════════════════

export interface MonthlySalesData {
    club: ClubPrintData;
    monthYear: string; // e.g. "March 2026"
    totalRevenue: number;
    totalOrders: number;
    activeMembers: number;
    newMembers: number;
    topProducts: Array<{ name: string; count: number }>;
    totalTopUps: number;
    topUpCount: number;
}

export const buildMonthlySalesReceipt = (data: MonthlySalesData): string[] => [
    ...buildHeader(data.club),
    LF,
    ALIGN_CENTER,
    BOLD_ON,
    `MONTHLY REPORT — ${data.monthYear}`,
    BOLD_OFF,
    ALIGN_LEFT,
    DIVIDER_THIN,
    twoCol('Total Revenue:', formatINR(data.totalRevenue)),
    twoCol('Total Orders:', String(data.totalOrders)),
    twoCol('Active Members:', String(data.activeMembers)),
    twoCol('New Members:', String(data.newMembers)),
    DIVIDER_THIN,
    BOLD_ON,
    'TOP PRODUCTS THIS MONTH',
    BOLD_OFF,
    ...data.topProducts.map((p, i) =>
        twoCol(`${i + 1}. ${truncate(p.name, 26)}`, `${p.count} sold`)
    ),
    DIVIDER_THIN,
    BOLD_ON,
    'WALLET TOP-UPS',
    BOLD_OFF,
    twoCol('Total Top-ups:', formatINR(data.totalTopUps)),
    twoCol('No. of Top-ups:', String(data.topUpCount)),
    LF,
    ...buildFooter(),
];

// ═══════════════════════════════════════════════
// 6. YEARLY SALES REPORT
// ═══════════════════════════════════════════════

export interface YearlySalesData {
    club: ClubPrintData;
    year: string;
    totalRevenue: number;
    totalOrders: number;
    totalMembers: number;
    monthlyBreakdown: Array<{ month: string; revenue: number }>;
}

export const buildYearlySalesReceipt = (data: YearlySalesData): string[] => [
    ...buildHeader(data.club),
    LF,
    ALIGN_CENTER,
    BOLD_ON,
    `YEARLY REPORT — ${data.year}`,
    BOLD_OFF,
    ALIGN_LEFT,
    DIVIDER_THIN,
    twoCol('Total Revenue:', formatINR(data.totalRevenue)),
    twoCol('Total Orders:', String(data.totalOrders)),
    twoCol('Total Members:', String(data.totalMembers)),
    DIVIDER_THIN,
    BOLD_ON,
    'MONTHLY BREAKDOWN',
    BOLD_OFF,
    ...data.monthlyBreakdown.map(m =>
        twoCol(m.month + ':', formatINR(m.revenue))
    ),
    LF,
    ...buildFooter(),
];

// ═══════════════════════════════════════════════
// 7. MEMBER LIST RECEIPT
// ═══════════════════════════════════════════════

export interface MemberListData {
    club: ClubPrintData;
    date: string;
    totalMembers: number;
    members: Array<{ name: string; plan: string; expires: string }>;
}

export const buildMemberListReceipt = (data: MemberListData): string[] => [
    ...buildHeader(data.club),
    LF,
    ALIGN_CENTER,
    BOLD_ON,
    'ACTIVE MEMBERS LIST',
    BOLD_OFF,
    ALIGN_LEFT,
    twoCol('Date:', data.date),
    twoCol('Total Members:', String(data.totalMembers)),
    DIVIDER_THIN,
    BOLD_ON,
    twoCol('No.  Name', 'Plan    Expires'),
    BOLD_OFF,
    ...data.members.map((m, i) => {
        const num = String(i + 1).padEnd(4);
        const name = truncate(m.name, 16).padEnd(16);
        const plan = truncate(m.plan, 7).padEnd(8);
        const exp = truncate(m.expires, 10);
        return `${num} ${name} ${plan} ${exp}`;
    }),
    LF,
    ...buildFooter(),
];

// ═══════════════════════════════════════════════
// 8. EXPIRED MEMBERSHIPS RECEIPT
// ═══════════════════════════════════════════════

export interface ExpiredMembersData {
    club: ClubPrintData;
    date: string;
    totalExpired: number;
    members: Array<{ name: string; plan: string; expiredOn: string }>;
}

export const buildExpiredMembersReceipt = (data: ExpiredMembersData): string[] => [
    ...buildHeader(data.club),
    LF,
    ALIGN_CENTER,
    BOLD_ON,
    'EXPIRED MEMBERSHIPS',
    BOLD_OFF,
    ALIGN_LEFT,
    twoCol('Date:', data.date),
    twoCol('Total Expired:', String(data.totalExpired)),
    DIVIDER_THIN,
    BOLD_ON,
    twoCol('No.  Name', 'Plan   Expired On'),
    BOLD_OFF,
    ...data.members.map((m, i) => {
        const num = String(i + 1).padEnd(4);
        const name = truncate(m.name, 14).padEnd(14);
        const plan = truncate(m.plan, 7).padEnd(7);
        const exp = truncate(m.expiredOn, 12);
        return `${num} ${name} ${plan} ${exp}`;
    }),
    LF,
    ...buildFooter(),
];

// ═══════════════════════════════════════════════
// 9. TOP-UP HISTORY RECEIPT
// ═══════════════════════════════════════════════

export interface TopUpHistoryData {
    club: ClubPrintData;
    period: string;
    transactions: Array<{ date: string; member: string; amount: number }>;
    totalAmount: number;
    totalCount: number;
}

export const buildTopUpHistoryReceipt = (data: TopUpHistoryData): string[] => [
    ...buildHeader(data.club),
    LF,
    ALIGN_CENTER,
    BOLD_ON,
    'TOP-UP HISTORY REPORT',
    BOLD_OFF,
    ALIGN_LEFT,
    twoCol('Period:', data.period),
    DIVIDER_THIN,
    BOLD_ON,
    'Date     Member         Amount',
    BOLD_OFF,
    ...data.transactions.map(t => {
        const dt = truncate(t.date, 8).padEnd(9);
        const name = truncate(t.member, 14).padEnd(15);
        return `${dt}${name}${formatINR(t.amount)}`;
    }),
    DIVIDER_THIN,
    BOLD_ON,
    twoCol('TOTAL TOP-UPS:', formatINR(data.totalAmount)),
    twoCol('COUNT:', String(data.totalCount)),
    BOLD_OFF,
    LF,
    ...buildFooter(),
];

// ═══════════════════════════════════════════════
// 10. MEMBERSHIP TIER BREAKDOWN RECEIPT
// ═══════════════════════════════════════════════

export interface TierBreakdownData {
    club: ClubPrintData;
    date: string;
    gold: number;
    silver: number;
    bronze: number;
    totalActive: number;
    totalExpired: number;
    totalPending: number;
}

export const buildTierBreakdownReceipt = (data: TierBreakdownData): string[] => [
    ...buildHeader(data.club),
    LF,
    ALIGN_CENTER,
    BOLD_ON,
    'MEMBERSHIP TIER REPORT',
    BOLD_OFF,
    ALIGN_LEFT,
    twoCol('Date:', data.date),
    DIVIDER_THIN,
    BOLD_ON,
    'TIER BREAKDOWN',
    BOLD_OFF,
    twoCol('Gold Members:', String(data.gold)),
    twoCol('Silver Members:', String(data.silver)),
    twoCol('Bronze Members:', String(data.bronze)),
    DIVIDER_THIN,
    BOLD_ON,
    twoCol('TOTAL ACTIVE:', String(data.totalActive)),
    twoCol('TOTAL EXPIRED:', String(data.totalExpired)),
    twoCol('TOTAL PENDING:', String(data.totalPending)),
    BOLD_OFF,
    LF,
    ...buildFooter(),
];
