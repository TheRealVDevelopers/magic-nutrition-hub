import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users, ShoppingCart, BarChart3, HeartHandshake,
  Gift, Package, AlertTriangle, Wifi, Settings, Menu, Bell, ChevronDown, Leaf, X
} from "lucide-react";
import { CLUB_INFO } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Members", path: "/members", icon: Users },
  { title: "Billing (POS)", path: "/billing", icon: ShoppingCart },
  { title: "Billing Reports", path: "/billing-reports", icon: BarChart3 },
  { title: "Volunteers", path: "/volunteers", icon: HeartHandshake },
  { title: "Loyalty & Rewards", path: "/loyalty", icon: Gift },
  { title: "Inventory", path: "/inventory", icon: Package },
  { title: "Expiry Management", path: "/expiry", icon: AlertTriangle },
  { title: "NFC & Device Settings", path: "/nfc", icon: Wifi },
  { title: "Settings", path: "/settings", icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0 md:w-16"
        } flex-shrink-0 bg-card border-r border-border transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* Brand */}
        <div className="p-4 border-b border-border flex items-center gap-2 min-w-[240px]">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-heading font-semibold text-sm text-foreground leading-tight truncate">Magic Nutrition Club</p>
              <p className="text-[10px] text-muted-foreground truncate">Usha Prasad Enterprise</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 min-w-[240px]">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="font-heading font-semibold text-foreground text-sm md:text-base">
              {CLUB_INFO.clubName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </button>
            <Button variant="ghost" size="sm" className="gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">UP</div>
              <span className="hidden md:inline text-foreground">Owner</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
