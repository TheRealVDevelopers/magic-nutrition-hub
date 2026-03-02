import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useMemberAuth } from "@/hooks/member/useMemberAuth";
import { Loader2 } from "lucide-react";

export default function MemberProtectedRoute({ children }: { children: ReactNode }) {
    const { member, loading, error } = useMemberAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fffe" }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#2d9653" }} />
            </div>
        );
    }

    if (!member) {
        return <Navigate to="/member/login" replace />;
    }

    return <>{children}</>;
}
