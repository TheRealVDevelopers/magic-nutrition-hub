import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import SuperAdminLayout from "./components/superadmin/SuperAdminLayout";
import { ProtectedRoute, RoleRoute } from "./components/ProtectedRoute";
import { useAuth, getDashboardPath } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import ErrorBoundary from "./components/ErrorBoundary";
import PageSkeleton from "./components/PageSkeleton";

// ─── Lazy Loaded Pages ──────────────────────────────────────────────────
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const KitchenDisplay = lazy(() => import("./pages/KitchenDisplay"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const Billing = lazy(() => import("./pages/Billing"));
const BillingReports = lazy(() => import("./pages/BillingReports"));
const Volunteers = lazy(() => import("./pages/Volunteers"));
const LoyaltyRewards = lazy(() => import("./pages/LoyaltyRewards"));
const Inventory = lazy(() => import("./pages/Inventory"));
const ExpiryManagement = lazy(() => import("./pages/ExpiryManagement"));
const NFCSettings = lazy(() => import("./pages/NFCSettings"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Super Admin pages
const SuperAdminDashboard = lazy(() => import("./pages/superadmin/SuperAdminDashboard"));
const ClubsList = lazy(() => import("./pages/superadmin/ClubsList"));
const CreateClub = lazy(() => import("./pages/superadmin/CreateClub"));
const ClubDetail = lazy(() => import("./pages/superadmin/ClubDetail"));
const ConvertToClub = lazy(() => import("./pages/superadmin/ConvertToClub"));
const PlatformTree = lazy(() => import("./pages/superadmin/PlatformTree"));
const SuperAdminSettings = lazy(() => import("./pages/superadmin/SuperAdminSettings"));
const ThemeTestPage = lazy(() => import("./pages/superadmin/ThemeTestPage"));

// Owner pages
const OwnerDashboard = lazy(() => import("./pages/owner/OwnerDashboard"));
const OwnerMembersPage = lazy(() => import("./pages/owner/MembersPage"));
const OwnerMemberProfile = lazy(() => import("./pages/owner/MemberProfile"));
const MembershipPlansPage = lazy(() => import("./pages/owner/MembershipPlansPage"));
const WalletApprovalsPage = lazy(() => import("./pages/owner/WalletApprovalsPage"));
const OwnerVolunteersPage = lazy(() => import("./pages/owner/VolunteersPage"));
const DownlineClubs = lazy(() => import("./pages/owner/DownlineClubs"));
const ClubSettingsPage = lazy(() => import("./pages/owner/ClubSettingsPage"));

// Member pages
const MemberWalletPage = lazy(() => import("./pages/member/WalletPage"));
const MemberCheckInPage = lazy(() => import("./pages/member/CheckInPage"));

// Attendance & Reception
const AttendancePage = lazy(() => import("./pages/owner/AttendancePage"));
const ReceptionDisplay = lazy(() => import("./pages/ReceptionDisplay"));
const StaffDashboard = lazy(() => import("./pages/staff/StaffDashboard"));

// Orders
const OrdersManagementPage = lazy(() => import("./pages/owner/OrdersManagementPage"));
const OrderEntryPage = lazy(() => import("./pages/staff/OrderEntryPage"));
const TodaysMenuPage = lazy(() => import("./pages/member/TodaysMenuPage"));
const MemberOrdersPage = lazy(() => import("./pages/member/OrdersPage"));

// Billing
const OwnerBillingPage = lazy(() => import("./pages/owner/BillingPage"));
const OwnerBillingReportsPage = lazy(() => import("./pages/owner/BillingReportsPage"));

// Inventory
const InventoryPage = lazy(() => import("./pages/owner/InventoryPage"));
const ExpiryManagementPage = lazy(() => import("./pages/owner/ExpiryManagementPage"));

// MLM & Member Features
const MLMTreePage = lazy(() => import("./pages/member/MLMTreePage"));
const ProgressPage = lazy(() => import("./pages/member/ProgressPage"));
const MemberCardPage = lazy(() => import("./pages/member/MemberCardPage"));
import BirthdayPopup from "./components/mlm/BirthdayPopup";

// ─── Redirect authenticated users from / to their dashboard ─────────────

function HomeRedirect() {
  const { firebaseUser, role, loading: authLoading } = useAuth();
  const { loading: clubLoading } = useClubContext();

  const SUPERADMIN_DOMAINS = [
    "magic-nutrition-club.web.app",
    "magic-nutrition-club.firebaseapp.com",
  ];

  const isSuperAdminDomain = SUPERADMIN_DOMAINS.includes(window.location.hostname);

  // On superadmin domains — only wait for auth, never for club detection
  // On club domains — wait for both auth and club to finish loading
  if (authLoading || (!isSuperAdminDomain && clubLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Superadmin domain routing — club context not needed at all
  if (isSuperAdminDomain) {
    if (firebaseUser && role === "superAdmin") {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    if (firebaseUser && role) {
      // Owner/member logged in on superadmin domain — send to their dashboard
      return <Navigate to={getDashboardPath(role)} replace />;
    }
    // Not logged in — go to login
    return <Navigate to="/login" replace />;
  }

  // Club domain — logged in users go to their dashboard
  if (firebaseUser && role) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  // Club domain — not logged in — show club landing page
  return <Landing />;
}

// ─── App ────────────────────────────────────────────────────────────────

const App = () => (
  <ErrorBoundary>
    <Toaster />
    <Sonner />
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* ── Public routes ──────────────────────────────────────────── */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="/reception" element={<ReceptionDisplay />} />

        {/* ── Super Admin routes ─────────────────────────────────────── */}
        <Route
          path="/superadmin/*"
          element={
            <ProtectedRoute>
              <RoleRoute roles={["superAdmin"]}>
                <SuperAdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="clubs" element={<ClubsList />} />
          <Route path="clubs/new" element={<CreateClub />} />
          <Route path="clubs/:clubId" element={<ClubDetail />} />
          <Route path="clubs/:clubId/convert" element={<ConvertToClub />} />
          <Route path="tree" element={<PlatformTree />} />
          <Route path="settings" element={<SuperAdminSettings />} />
          <Route path="theme-test" element={<ThemeTestPage />} />
        </Route>

        {/* ── Club Owner routes ──────────────────────────────────────── */}
        <Route
          path="/owner/*"
          element={
            <ProtectedRoute>
              <RoleRoute roles={["clubOwner"]}>
                <Layout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="members" element={<OwnerMembersPage />} />
          <Route path="members/:id" element={<OwnerMemberProfile />} />
          <Route path="membership-plans" element={<MembershipPlansPage />} />
          <Route path="wallet-approvals" element={<WalletApprovalsPage />} />
          <Route path="volunteers" element={<OwnerVolunteersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="expiry-management" element={<ExpiryManagementPage />} />
          <Route path="billing" element={<OwnerBillingPage />} />
          <Route path="billing-reports" element={<OwnerBillingReportsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="orders" element={<OrdersManagementPage />} />
          <Route path="downline" element={<DownlineClubs />} />
          <Route path="settings" element={<ClubSettingsPage />} />
        </Route>

        {/* ── Staff routes ───────────────────────────────────────────── */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute>
              <RoleRoute roles={["staff"]}>
                <Layout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="attendance" element={<Volunteers />} />
          <Route path="orders" element={<OrderEntryPage />} />
        </Route>

        {/* ── Member routes ──────────────────────────────────────────── */}
        <Route
          path="/member/*"
          element={
            <ProtectedRoute>
              <RoleRoute roles={["member"]}>
                <Layout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<MemberProfile />} />
          <Route path="wallet" element={<MemberWalletPage />} />
          <Route path="checkin" element={<MemberCheckInPage />} />
          <Route path="menu" element={<TodaysMenuPage />} />
          <Route path="orders" element={<MemberOrdersPage />} />
          <Route path="card" element={<MemberCardPage />} />
          <Route path="tree" element={<MLMTreePage />} />
          <Route path="progress" element={<ProgressPage />} />
        </Route>

        {/* ── Catch-all ──────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BirthdayPopup />
    </Suspense>
  </ErrorBoundary>
);

export default App;
