import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberProfile />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/billing-reports" element={<BillingReports />} />
            <Route path="/volunteers" element={<Volunteers />} />
            <Route path="/loyalty" element={<LoyaltyRewards />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/expiry" element={<ExpiryManagement />} />
            <Route path="/nfc" element={<NFCSettings />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
