import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import type { WalletTransaction } from "@/types/firestore";

interface Props {
    transaction: WalletTransaction;
    currencyName: string;
}

const REASON_LABELS: Record<string, string> = {
    topup: "Wallet Topup",
    shake_order: "Shake Order",
    membership: "Membership Purchase",
    product: "Product Purchase",
    referral_bonus: "Referral Bonus",
    adjustment: "Admin Adjustment",
};

export default function TransactionItem({ transaction: tx, currencyName }: Props) {
    const isCredit = tx.type === "credit";

    return (
        <div className="flex items-center gap-3 py-3 px-1">
            {/* Icon */}
            <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-emerald-50" : "bg-red-50"
                    }`}
            >
                {isCredit ? (
                    <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                    <ArrowDownCircle className="w-5 h-5 text-red-500" />
                )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                    {REASON_LABELS[tx.reason] || tx.reason}
                </p>
                <p className="text-xs text-muted-foreground">
                    {tx.createdAt?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {tx.note ? ` • ${tx.note}` : ""}
                </p>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${isCredit ? "text-emerald-600" : "text-red-500"}`}>
                    {isCredit ? "+" : "-"}{tx.amount.toLocaleString()} {currencyName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                    Balance: {tx.balanceAfter.toLocaleString()}
                </p>
            </div>
        </div>
    );
}
