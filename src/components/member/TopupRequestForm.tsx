import { useState } from "react";
import { Coins } from "lucide-react";
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

export default function TopupRequestForm({ currencyName, disabled }: Props) {
    const { toast } = useToast();
    const raiseRequest = useRaiseTopupRequest();
    const { hasPending } = useMyPendingRequest();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseInt(amount);
        if (isNaN(val) || val < 1) return;

        try {
            await raiseRequest.mutateAsync(val);
            toast({
                title: "Request submitted!",
                description: "Visit your admin to complete payment.",
            });
            setOpen(false);
            setAmount("");
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
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                        <p className="text-xs text-blue-700">
                            💡 Hand the cash to your club admin. They will approve your request and the coins will be added to your wallet.
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
