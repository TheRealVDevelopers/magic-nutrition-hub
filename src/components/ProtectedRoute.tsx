import { ReactNode, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, getDashboardPath } from "@/lib/auth";
import { isSuperAdminDomain } from "@/lib/clubDetection";
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

// The login path depends on which domain we're on:
// - Superadmin domain → /superadmin/login  (email + password)
// - Club domain       → /login             (PIN gate — but protected routes
//                                           are only used on the superadmin
//                                           domain so this path rarely fires)
const LOGIN_PATH = isSuperAdminDomain() ? "/superadmin/login" : "/login";

// ─── ProtectedRoute ─────────────────────────────────────────────────────
// Wraps any route that requires Firebase Auth.
// If not logged in → redirects to the appropriate login page.
// If logged in but wrong role → redirects to role's correct dashboard.
// Safety net: if role doesn't resolve within 5s → redirect to login.

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { firebaseUser, role, loading } = useAuth();
    const location = useLocation();
    const [timedOut, setTimedOut] = useState(false);

    // 5-second safety net — prevents infinite loading if profile lookup fails
    useEffect(() => {
        if (role) {
            setTimedOut(false);
            return;
        }
        const timer = setTimeout(() => {
            if (!role) setTimedOut(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [role]);

    if (loading && !timedOut) {
        return <LoadingScreen />;
    }

    // Not authenticated at all → go to login
    if (!firebaseUser) {
        const redirectTo = location.pathname.startsWith("/member") ? "/member/login" : LOGIN_PATH;
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Authenticated but role couldn't be determined after timeout → show error (NOT redirect — that creates a loop)
    if (timedOut && !role) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 text-center p-6 max-w-sm">
                    <p className="text-lg font-semibold text-red-600">Unable to load your profile</p>
                    <p className="text-sm text-muted-foreground">
                        Your login succeeded but we couldn't find your user profile.
                        Check the browser console for [AUTH] logs.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Role still loading (but within 5s window)
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
        const dashboardPath = role ? getDashboardPath(role) : LOGIN_PATH;
        return <Navigate to={dashboardPath} replace />;
    }

    return <>{children}</>;
}

