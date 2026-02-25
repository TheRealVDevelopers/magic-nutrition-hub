import { useState, useRef } from "react";
import { Shield, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import TopupRequestCard from "@/components/owner/TopupRequestCard";
import { usePendingTopupRequests, useApproveTopup, useRejectTopup, useTopupHistory } from "@/hooks/useOwner";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

const SESSION_TTL = 60 * 60 * 1000; // 1 hour

export default function WalletApprovalsPage() {
    const { toast } = useToast();
    const { firebaseUser } = useAuth();
    const { requests, loading } = usePendingTopupRequests();
    const { data: history, isLoading: historyLoading } = useTopupHistory();
    const approveTopup = useApproveTopup();
    const rejectTopup = useRejectTopup();

    // Session-based password logic
    const sessionRef = useRef<number | null>(null);
    const [passwordDialog, setPasswordDialog] = useState(false);
    const [password, setPassword] = useState("");
    const [verifying, setVerifying] = useState(false);
    const pendingApprovalRef = useRef<{ requestId: string; amount: number } | null>(null);

    const isSessionValid = () => sessionRef.current && Date.now() - sessionRef.current < SESSION_TTL;

    const handleApprove = (requestId: string, amount: number) => {
        if (isSessionValid()) {
            executeApproval(requestId, amount);
        } else {
            pendingApprovalRef.current = { requestId, amount };
            setPasswordDialog(true);
        }
    };

    const executeApproval = (requestId: string, amount: number) => {
        approveTopup.mutate(
            { requestId, approvedAmount: amount, resolvedBy: firebaseUser?.uid || "" },
            {
                onSuccess: () => toast({ title: "Approved!", description: `${amount} credited to member's wallet.` }),
                onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
            }
        );
    };

    const handlePasswordVerify = async () => {
        if (!firebaseUser?.email || !password) return;
        setVerifying(true);
        try {
            const credential = EmailAuthProvider.credential(firebaseUser.email, password);
            await reauthenticateWithCredential(firebaseUser, credential);
            sessionRef.current = Date.now();
            setPasswordDialog(false);
            setPassword("");
            if (pendingApprovalRef.current) {
                executeApproval(pendingApprovalRef.current.requestId, pendingApprovalRef.current.amount);
                pendingApprovalRef.current = null;
            }
        } catch {
            toast({ title: "Wrong password", description: "Please try again.", variant: "destructive" });
        } finally { setVerifying(false); }
    };

    const handleReject = (requestId: string) => {
        rejectTopup.mutate(
            { requestId, resolvedBy: firebaseUser?.uid || "" },
            {
                onSuccess: () => toast({ title: "Request rejected" }),
                onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
            }
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-wellness-forest">Wallet Topup Approvals</h1>
                <Badge variant="secondary">{requests.length} pending</Badge>
            </div>

            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending ({requests.length})</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6 space-y-3">
                    {loading ? (
                        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-16 border border-dashed rounded-2xl bg-white">
                            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">No pending requests 🎉</p>
                        </div>
                    ) : (
                        requests.map((r) => (
                            <TopupRequestCard
                                key={r.id}
                                request={r}
                                onApprove={(amount) => handleApprove(r.id, amount)}
                                onReject={() => handleReject(r.id)}
                                isApproving={approveTopup.isPending}
                                isRejecting={rejectTopup.isPending}
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    {historyLoading ? (
                        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
                    ) : history && history.length > 0 ? (
                        <div className="space-y-2">
                            {history.map((r) => (
                                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border bg-white text-sm">
                                    <div>
                                        <p className="font-medium">{r.memberName}</p>
                                        <p className="text-xs text-muted-foreground">{r.resolvedAt?.toDate?.().toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{r.requestedAmount} → {r.approvedAmount || 0}</p>
                                        <Badge variant={r.status === "approved" ? "outline" : "destructive"} className="text-xs">{r.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No history yet</p>
                    )}
                </TabsContent>
            </Tabs>

            {/* Password Dialog */}
            <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Confirm Identity</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Enter your password to approve</Label>
                            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handlePasswordVerify} disabled={verifying || !password}>{verifying ? "Verifying…" : "Confirm"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
