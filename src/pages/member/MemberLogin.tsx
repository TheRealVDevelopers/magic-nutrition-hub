import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useClubContext } from "@/lib/clubDetection";
import { useMemberAuth } from "@/hooks/member/useMemberAuth";

const GREEN = "#2d9653";

export default function MemberLogin() {
    const { club } = useClubContext();
    const { member, signIn, resetPassword } = useMemberAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    // If already logged in, go to saved redirect or dashboard
    if (member) {
        const redirect = sessionStorage.getItem('mnc_redirect') || '/member/dashboard';
        sessionStorage.removeItem('mnc_redirect');
        navigate(redirect, { replace: true });
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await signIn(email, password);
            const redirect = sessionStorage.getItem('mnc_redirect') || '/member/dashboard';
            sessionStorage.removeItem('mnc_redirect');
            navigate(redirect, { replace: true });
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = async () => {
        if (!email) { setError("Enter your email first"); return; }
        try {
            await resetPassword(email);
            setResetSent(true);
            setError(null);
        } catch {
            setError("Failed to send reset email");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ fontFamily: "'Nunito', sans-serif", background: "#f8fffe" }}>
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-5" style={{ borderColor: "#e0f0e9" }}>
                    <div className="text-center space-y-2">
                        {club?.logo ? (
                            <img src={club.logo} alt="" className="h-14 w-14 mx-auto rounded-xl object-cover" />
                        ) : (
                            <div className="h-14 w-14 mx-auto rounded-xl flex items-center justify-center text-white text-2xl font-bold" style={{ background: GREEN }}>
                                {(club?.name ?? "C")[0]}
                            </div>
                        )}
                        <h1 className="text-xl font-black text-gray-900">Member Login</h1>
                        <p className="text-xs text-gray-400">{club?.name ?? "Club"}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-600">Email</Label>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="h-12" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-600">Password</Label>
                            <div className="relative">
                                <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="h-12 pr-10" />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                        {resetSent && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">Password reset email sent!</p>}

                        <Button type="submit" disabled={submitting} className="w-full h-12 text-white font-bold" style={{ background: GREEN }}>
                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in…</> : "Sign In"}
                        </Button>
                    </form>

                    <button onClick={handleReset} className="text-xs font-bold w-full text-center" style={{ color: GREEN }}>
                        Forgot password?
                    </button>
                </div>
            </div>
        </div>
    );
}
