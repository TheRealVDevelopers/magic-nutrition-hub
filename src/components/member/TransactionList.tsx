import { Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import TransactionItem from "./TransactionItem";
import type { WalletTransaction } from "@/types/firestore";

interface Props {
    transactions: WalletTransaction[];
    loadMore: () => void;
    hasMore: boolean;
    loading: boolean;
    currencyName: string;
}

export default function TransactionList({ transactions, loadMore, hasMore, loading, currencyName }: Props) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
                    <Inbox className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm text-muted-foreground">No transactions yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Add coins to get started.</p>
            </div>
        );
    }

    // Group by date
    const grouped = groupByDate(transactions);

    return (
        <div className="space-y-4">
            {grouped.map(({ label, items }) => (
                <div key={label}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                        {label}
                    </p>
                    <div className="bg-white rounded-xl border divide-y divide-border">
                        {items.map((tx) => (
                            <TransactionItem key={tx.id} transaction={tx} currencyName={currencyName} />
                        ))}
                    </div>
                </div>
            ))}

            {hasMore && (
                <div className="text-center pt-2">
                    <Button variant="outline" size="sm" onClick={loadMore} className="text-xs">
                        <Loader2 className="w-3 h-3 mr-1" /> Load More
                    </Button>
                </div>
            )}
        </div>
    );
}

function groupByDate(transactions: WalletTransaction[]): { label: string; items: WalletTransaction[] }[] {
    const groups: Record<string, WalletTransaction[]> = {};

    const todayStr = new Date().toDateString();
    const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

    for (const tx of transactions) {
        const date = tx.createdAt?.toDate?.();
        if (!date) continue;
        const dateStr = date.toDateString();
        let label: string;
        if (dateStr === todayStr) label = "Today";
        else if (dateStr === yesterdayStr) label = "Yesterday";
        else label = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

        if (!groups[label]) groups[label] = [];
        groups[label].push(tx);
    }

    return Object.entries(groups).map(([label, items]) => ({ label, items }));
}
