import { useState } from "react";
import { Coins, Banknote, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRaiseTopupRequest, useMyPendingRequest } from "@/hooks/useMemberWallet";

interface Props {
    currencyName: string;
    disabled?: boolean;
}

const METHODS = [
    { id: "Cash", label: "Cash", icon: Banknote, color: "#2d9653" },
    { id: "UPI", label: "UPI", icon: Smartphone, color: "#6366f1" },
] as const;

export default function TopupRequestForm({ currencyName, disabled }: Props) {
    const { toast } = useToast();
    const raiseRequest = useRaiseTopupRequest();
    const { hasPending } = useMyPendingRequest();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
    const [reference, setReference] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseInt(amount);
        if (isNaN(val) || val < 1) return;

        try {
            await raiseRequest.mutateAsync({
                amount: val,
                paymentMethod,
                reference: reference || undefined,
            });
            toast({
                title: "Request submitted!",
                description: paymentMethod === "UPI"
                    ? "Share the UTR with your admin for quick approval."
                    : "Visit your admin to complete payment.",
            });
            setOpen(false);
            setAmount("");
            setReference("");
            setPaymentMethod("Cash");
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const isDisabled = disabled || hasPending;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2" disabled={isDisabled}>
                    <Coins className="w-4 h-4" />
                    {isDisabled ? "Pending Request…" : "Add Coins"}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Request Wallet Topup</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* Payment method tabs */}
                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Payment Method</Label>
                        <div className="flex gap-2">
                            {METHODS.map((m) => {
                                const active = paymentMethod === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setPaymentMethod(m.id)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all"
                                        style={{
                                            borderColor: active ? m.color : "#e5e7eb",
                                            backgroundColor: active ? `${m.color}10` : "transparent",
                                            color: active ? m.color : "#6b7280",
                                        }}
                                    >
                                        <m.icon className="w-4 h-4" />
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label>Amount ({currencyName})</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                min={1}
                                required
                                className="text-lg font-semibold pr-20"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                                {currencyName}
                            </span>
                        </div>
                    </div>

                    {/* UPI Reference field */}
                    {paymentMethod === "UPI" && (
                        <div className="space-y-2">
                            <Label>UTR / Reference Number</Label>
                            <Input
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="e.g. 412345678901"
                                className="font-mono"
                            />
                        </div>
                    )}

                    {/* Info banner */}
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                        <p className="text-xs text-blue-700">
                            {paymentMethod === "UPI"
                                ? "💳 Complete UPI payment to your admin and enter the reference above. Your admin will verify and approve."
                                : "💡 Hand the cash to your club admin. They will approve your request and the coins will be added to your wallet."}
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={raiseRequest.isPending || !amount || parseInt(amount) < 1}
                    >
                        {raiseRequest.isPending ? "Submitting…" : "Request Topup"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
