import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import SuperAdminLayout from "./components/superadmin/SuperAdminLayout";
import { ProtectedRoute, RoleRoute } from "./components/ProtectedRoute";
import { useAuth, getDashboardPath } from "@/lib/auth";

// ─── Pages ──────────────────────────────────────────────────────────────
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import KitchenDisplay from "./pages/KitchenDisplay";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import MemberProfile from "./pages/MemberProfile";
import Billing from "./pages/Billing";
import BillingReports from "./pages/BillingReports";
import Volunteers from "./pages/Volunteers";
import LoyaltyRewards from "./pages/LoyaltyRewards";
import Inventory from "./pages/Inventory";
import ExpiryManagement from "./pages/ExpiryManagement";
import NFCSettings from "./pages/NFCSettings";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

// Super Admin pages
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import ClubsList from "./pages/superadmin/ClubsList";
import CreateClub from "./pages/superadmin/CreateClub";
import ClubDetail from "./pages/superadmin/ClubDetail";
import ConvertToClub from "./pages/superadmin/ConvertToClub";
import PlatformTree from "./pages/superadmin/PlatformTree";

// Owner pages
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerMembersPage from "./pages/owner/MembersPage";
import OwnerMemberProfile from "./pages/owner/MemberProfile";
import MembershipPlansPage from "./pages/owner/MembershipPlansPage";
import WalletApprovalsPage from "./pages/owner/WalletApprovalsPage";
import OwnerVolunteersPage from "./pages/owner/VolunteersPage";
import DownlineClubs from "./pages/owner/DownlineClubs";
import ClubSettingsPage from "./pages/owner/ClubSettingsPage";

// ─── Redirect authenticated users from / to their dashboard ─────────────

function HomeRedirect() {
  const { firebaseUser, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (firebaseUser && role) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return <Landing />;
}

// ─── App ────────────────────────────────────────────────────────────────

const App = () => (
  <>
    <Toaster />
    <Sonner />
    <Routes>
      {/* ── Public routes ──────────────────────────────────────────── */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/kitchen" element={<KitchenDisplay />} />

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
        <Route path="inventory" element={<Inventory />} />
        <Route path="billing" element={<Billing />} />
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
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="attendance" element={<Volunteers />} />
        <Route path="orders" element={<Billing />} />
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
        <Route path="wallet" element={<LoyaltyRewards />} />
        <Route path="orders" element={<Billing />} />
        <Route path="tree" element={<Dashboard />} />
        <Route path="progress" element={<Dashboard />} />
      </Route>

      {/* ── Catch-all ──────────────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

export default App;
