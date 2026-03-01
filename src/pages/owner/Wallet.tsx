import { useState, useMemo } from "react";
import { Wallet as WalletIcon, Search, ArrowUpCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useWallets, useTopUp } from "@/hooks/owner/useWallet";
import { useMembers } from "@/hooks/owner/useMembers";
import { useClubContext } from "@/lib/clubDetection";
import { useToast } from "@/hooks/use-toast";
import type { Wallet } from "@/types/firestore";
import type { User } from "@/types/firestore";

type SortOption = "lowest" | "highest" | "name";

type WalletWithMember = (Wallet & { id: string }) & { member?: User };

export default function Wallet() {
    const { club } = useClubContext();
    const clubId = club?.id ?? null;
    const { data: wallets, isLoading } = useWallets(clubId);
    const { data: members } = useMembers(clubId);
    const topUp = useTopUp();
    const { toast } = useToast();

    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<SortOption>("lowest");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selected, setSelected] = useState<WalletWithMember | null>(null);
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");

    const memberMap = useMemo(() => {
        const m = new Map<string, User>();
        (members ?? []).forEach((u) => m.set(u.id, u));
        return m;
    }, [members]);

    const walletsWithMembers = useMemo((): WalletWithMember[] => {
        if (!wallets) return [];
        return wallets.map((w) => ({
            ...w,
            member: memberMap.get(w.userId),
        }));
    }, [wallets, memberMap]);

    const filtered = useMemo(() => {
        let list = walletsWithMembers;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (w) =>
                    w.member?.name?.toLowerCase().includes(q) ||
                    w.member?.phone?.includes(q)
            );
        }
        const sorted = [...list].sort((a, b) => {
            if (sort === "lowest") return a.balance - b.balance;
            if (sort === "highest") return b.balance - a.balance;
            return (a.member?.name ?? "").localeCompare(b.member?.name ?? "");
        });
        return sorted;
    }, [walletsWithMembers, search, sort]);

    const totalBalance = useMemo(
        () => (wallets ?? []).reduce((s, w) => s + w.balance, 0),
        [wallets]
    );
    const lowBalanceCount = useMemo(
        () => (wallets ?? []).filter((w) => w.balance < 100).length,
        [wallets]
    );

    const openTopUp = (w?: WalletWithMember) => {
        setSelected(w ?? null);
        setAmount("");
        setPaymentMethod("Cash");
        setReference("");
        setNotes("");
        setDialogOpen(true);
    };

    const handleTopUp = async () => {
        const amt = parseFloat(amount);
        if (!selected || isNaN(amt) || amt <= 0) {
            toast({ title: "Invalid amount", variant: "destructive" });
            return;
        }
        if (!clubId) return;
        try {
            await topUp.mutateAsync({
                memberId: selected.userId,
                walletDocId: selected.id,
                clubId,
                amount: amt,
                paymentMethod,
                reference: reference || undefined,
                notes: notes || undefined,
                currentBalance: selected.balance,
            });
            toast({ title: "Top up successful!", description: `₹${amt} added to wallet.` });
            setDialogOpen(false);
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const currentBalance = selected?.balance ?? 0;
    const amountNum = parseFloat(amount) || 0;
    const newBalance = currentBalance + amountNum;

    return (
        <div className="space-y-6 p-5" style={{ fontFamily: "'Nunito', sans-serif" }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold" style={{ color: "#2d9653" }}>
                    Wallet Management
                </h1>
                <Button
                    onClick={() => openTopUp()}
                    className="gap-2"
                    style={{ backgroundColor: "#2d9653" }}
                >
                    <ArrowUpCircle className="w-4 h-4" /> Top Up
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-white p-5 shadow-sm border">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <WalletIcon className="w-4 h-4" /> Total Club Wallet
                        </div>
                        <p className="text-2xl font-bold mt-1" style={{ color: "#2d9653" }}>
                            ₹{totalBalance.toLocaleString()}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm border">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <TrendingUp className="w-4 h-4" /> Members
                        </div>
                        <p className="text-2xl font-bold mt-1">{wallets?.length ?? 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm border">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            Low balance (&lt; ₹100)
                        </div>
                        <p className="text-2xl font-bold mt-1 text-amber-600">
                            {lowBalanceCount}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rounded-xl"
                    />
                </div>
                <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                    <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lowest">Lowest balance</SelectItem>
                        <SelectItem value="highest">Highest balance</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-12 rounded-2xl bg-white p-5">
                    No members yet
                </p>
            ) : (
                <div className="space-y-3">
                    {filtered.map((w) => (
                        <div
                            key={w.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar className="h-10 w-10 shrink-0">
                                    {w.member?.photo ? (
                                        <AvatarImage src={w.member.photo} />
                                    ) : null}
                                    <AvatarFallback
                                        className="font-bold text-sm"
                                        style={{
                                            backgroundColor: "#e8f5e9",
                                            color: "#2d9653",
                                        }}
                                    >
                                        {(w.member?.name ?? "?")[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="font-semibold truncate">
                                        {w.member?.name ?? "Unknown"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {w.member?.phone ?? "-"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 sm:ml-auto">
                                <div className="text-right">
                                    <p
                                        className="text-xl font-bold"
                                        style={{ color: "#2d9653" }}
                                    >
                                        ₹{w.balance.toLocaleString()}
                                    </p>
                                    {w.balance < 100 && (
                                        <Badge
                                            variant="destructive"
                                            className="text-xs mt-1"
                                        >
                                            Low balance
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => openTopUp(w)}
                                    className="gap-1 shrink-0"
                                    style={{ backgroundColor: "#2d9653" }}
                                >
                                    <ArrowUpCircle className="w-4 h-4" /> Top Up
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle>Top Up Wallet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        {selected ? (
                            <div>
                                <Label>Member</Label>
                                <p className="font-medium mt-1">
                                    {selected.member?.name ?? "Unknown"}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <Label>Select member</Label>
                                <Select
                                    value={selected?.userId ?? ""}
                                    onValueChange={(v) => {
                                        const w = walletsWithMembers.find(
                                            (x) => x.userId === v
                                        );
                                        setSelected(w ?? null);
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl mt-1">
                                        <SelectValue placeholder="Choose member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {walletsWithMembers.map((w) => (
                                            <SelectItem
                                                key={w.id}
                                                value={w.userId}
                                            >
                                                {w.member?.name ?? w.userId}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div>
                            <Label>Amount (₹) *</Label>
                            <Input
                                type="number"
                                min={1}
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="rounded-xl mt-1"
                            />
                        </div>

                        <div>
                            <Label>Payment method</Label>
                            <Select
                                value={paymentMethod}
                                onValueChange={setPaymentMethod}
                            >
                                <SelectTrigger className="rounded-xl mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="Card">Card</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Reference number (optional)</Label>
                            <Input
                                placeholder="e.g. UPI ref"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="rounded-xl mt-1"
                            />
                        </div>

                        <div>
                            <Label>Notes (optional)</Label>
                            <Input
                                placeholder="Any notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="rounded-xl mt-1"
                            />
                        </div>

                        {selected && (
                            <div className="flex justify-between text-sm py-2 border-t">
                                <span className="text-muted-foreground">
                                    Current balance:
                                </span>
                                <span className="font-semibold">
                                    ₹{currentBalance.toLocaleString()}
                                </span>
                            </div>
                        )}
                        {selected && amount && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    New balance:
                                </span>
                                <span
                                    className="font-bold"
                                    style={{ color: "#2d9653" }}
                                >
                                    ₹{newBalance.toLocaleString()}
                                </span>
                            </div>
                        )}

                        <Button
                            className="w-full rounded-xl"
                            style={{ backgroundColor: "#2d9653" }}
                            onClick={handleTopUp}
                            disabled={
                                topUp.isPending ||
                                !selected ||
                                !amount ||
                                parseFloat(amount) <= 0
                            }
                        >
                            {topUp.isPending ? "Processing..." : "Confirm Top Up"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
