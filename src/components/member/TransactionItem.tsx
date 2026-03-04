import { ArrowUpCircle, ArrowDownCircle, CreditCard, RotateCcw, Award } from "lucide-react";
import type { WalletTransaction } from "@/types/firestore";

interface Props {
    transaction: WalletTransaction;
    currencyName: string;
}

const REASON_CONFIG: Record<string, { label: string; icon: typeof ArrowUpCircle; bgColor: string; iconColor: string }> = {
    topup: { label: "Wallet Topup", icon: ArrowUpCircle, bgColor: "#ecfdf5", iconColor: "#059669" },
    shake_order: { label: "Shake Order", icon: ArrowDownCircle, bgColor: "#fef2f2", iconColor: "#dc2626" },
    membership: { label: "Membership", icon: Award, bgColor: "#eff6ff", iconColor: "#2563eb" },
    product: { label: "Product Purchase", icon: ArrowDownCircle, bgColor: "#fef2f2", iconColor: "#dc2626" },
    referral_bonus: { label: "Referral Bonus", icon: CreditCard, bgColor: "#f0fdf4", iconColor: "#16a34a" },
    adjustment: { label: "Admin Adjustment", icon: RotateCcw, bgColor: "#fefce8", iconColor: "#ca8a04" },
};

export default function TransactionItem({ transaction: tx, currencyName }: Props) {
    const isCredit = tx.type === "credit";
    const config = REASON_CONFIG[tx.reason] || {
        label: tx.reason,
        icon: isCredit ? ArrowUpCircle : ArrowDownCircle,
        bgColor: isCredit ? "#ecfdf5" : "#fef2f2",
        iconColor: isCredit ? "#059669" : "#dc2626",
    };
    const Icon = config.icon;

    // Build detail line
    const details: string[] = [];
    if (tx.createdAt?.toDate?.()) {
        details.push(tx.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }
    if (tx.paymentMethod) details.push(tx.paymentMethod);
    if (tx.note) details.push(tx.note);

    return (
        <div className="flex items-center gap-3 py-3 px-1">
            {/* Styled icon */}
            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: config.bgColor }}
            >
                <Icon className="w-5 h-5" style={{ color: config.iconColor }} />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                    {tx.description || config.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {details.join(" · ")}
                </p>
            </div>

            {/* Amount & balance */}
            <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${isCredit ? "text-emerald-600" : "text-red-500"}`}>
                    {isCredit ? "+" : "-"}{tx.amount.toLocaleString()} {currencyName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                    {tx.balanceBefore !== undefined
                        ? `${tx.balanceBefore.toLocaleString()} → ${tx.balanceAfter.toLocaleString()}`
                        : `Bal: ${tx.balanceAfter.toLocaleString()}`}
                </p>
            </div>
        </div>
    );
}
