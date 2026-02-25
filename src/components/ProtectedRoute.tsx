import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, getDashboardPath } from "@/lib/auth";
import type { UserRole } from "@/types/firestore";

// ─── Loading spinner ────────────────────────────────────────────────────

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground text-sm">Loading…</p>
            </div>
        </div>
    );
}

// ─── ProtectedRoute ─────────────────────────────────────────────────────
// Wraps any route that requires authentication.
// If not logged in → redirects to /login
// If logged in but wrong role → redirects to role's correct dashboard

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { firebaseUser, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!firebaseUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If role hasn't loaded yet but user is authenticated, wait
    if (!role) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
}

// ─── RoleRoute ──────────────────────────────────────────────────────────
// Only renders children if the user's role is in the allowed list.
// Otherwise redirects them to their correct dashboard.

interface RoleRouteProps {
    roles: UserRole[];
    children: ReactNode;
}

export function RoleRoute({ roles, children }: RoleRouteProps) {
    const { role, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!role || !roles.includes(role)) {
        // Redirect to the user's correct dashboard
        const dashboardPath = role ? getDashboardPath(role) : "/login";
        return <Navigate to={dashboardPath} replace />;
    }

    return <>{children}</>;
}
