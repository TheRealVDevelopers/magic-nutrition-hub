import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PinGate from "@/components/PinGate";
import { usePinAccess } from "@/hooks/usePinAccess";
import { useClubContext } from "@/lib/clubDetection";
import OwnerLayout from "@/components/owner/OwnerLayout";
import PageSkeleton from "@/components/PageSkeleton";

const OwnerDashboard = lazy(() => import("./owner/OwnerDashboard"));
const Members        = lazy(() => import("./owner/Members"));
const Attendance     = lazy(() => import("./owner/Attendance"));
const Wallet         = lazy(() => import("./owner/Wallet"));
const Orders         = lazy(() => import("./owner/Orders"));
const Menu           = lazy(() => import("./owner/Menu"));
const Announcements  = lazy(() => import("./owner/Announcements"));
const Enquiries      = lazy(() => import("./owner/Enquiries"));
const Reports        = lazy(() => import("./owner/Reports"));
const Settings       = lazy(() => import("./owner/Settings"));
const ClubTree       = lazy(() => import("./owner/ClubTree"));

export default function AdminAccess() {
    const { club, loading: clubLoading } = useClubContext();
    const { isVerified, isLoading, clubName, clubLogo, verify } = usePinAccess("admin");

    // Loading state
    if (isLoading || clubLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    // No club on this domain
    if (!club) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-2xl shadow-lg border p-8 max-w-sm text-center space-y-4">
                    <div className="h-14 w-14 mx-auto rounded-xl bg-red-100 flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">No Club Found</h1>
                    <p className="text-sm text-gray-500">
                        Admin access must be opened from your club's domain.
                        This page is not available on the platform admin domain.
                    </p>
                    <a href="/" className="inline-block text-sm text-emerald-600 hover:underline font-medium">
                        Go to Home
                    </a>
                </div>
            </div>
        );
    }

    // PIN gate
    if (!isVerified) {
        return (
            <PinGate
                type="admin"
                clubName={clubName}
                clubLogo={clubLogo}
                pinLength={8}
                isLoading={false}
                onVerify={verify}
            />
        );
    }

    // Verified — show full owner layout with nested routes
    // Routes are relative to the matched parent path (/login/* or /admin/*)
    return (
        <OwnerLayout>
            <Suspense fallback={<PageSkeleton />}>
                <Routes>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard"     element={<OwnerDashboard />} />
                    <Route path="members"       element={<Members />} />
                    <Route path="attendance"    element={<Attendance />} />
                    <Route path="wallet"        element={<Wallet />} />
                    <Route path="orders"        element={<Orders />} />
                    <Route path="menu"          element={<Menu />} />
                    <Route path="announcements" element={<Announcements />} />
                    <Route path="enquiries"     element={<Enquiries />} />
                    <Route path="reports"       element={<Reports />} />
                    <Route path="settings"      element={<Settings />} />
                    <Route path="tree"          element={<ClubTree />} />
                    <Route path="*"             element={<Navigate to="dashboard" replace />} />
                </Routes>
            </Suspense>
        </OwnerLayout>
    );
}
