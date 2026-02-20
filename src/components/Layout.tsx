import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users, ShoppingCart, BarChart3, HeartHandshake,
  Gift, Package, AlertTriangle, Wifi, Settings, Menu, Bell, ChevronDown, Leaf, X, Home
} from "lucide-react";
import { CLUB_INFO } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Landing Page", path: "/", icon: Home },
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Members", path: "/members", icon: Users },
  { title: "Billing (POS)", path: "/billing", icon: ShoppingCart },
  { title: "Billing Reports", path: "/billing-reports", icon: BarChart3 },
  { title: "Volunteers", path: "/volunteers", icon: HeartHandshake },
  { title: "Loyalty & Rewards", path: "/loyalty", icon: Gift },
  { title: "Inventory", path: "/inventory", icon: Package },
  { title: "Expiry Management", path: "/expiry", icon: AlertTriangle },
  { title: "NFC & Settings", path: "/nfc", icon: Wifi },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-wellness-cream">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-72" : "w-0 md:w-20"
          } flex-shrink-0 bg-white border-r border-border transition-all duration-500 overflow-hidden flex flex-col shadow-soft z-20`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-border flex items-center gap-3 min-w-[280px]">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-premium">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden animate-in">
              <p className="font-bold text-base text-wellness-forest leading-tight truncate">Magic Nutrition Club</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary truncate">Usha Prasad Enterprise</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 min-w-[280px] space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== "/" && item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            if (item.path === "/dashboard" && location.pathname === "/dashboard") {
              // explicit check for dashboard
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group ${active
                    ? "bg-primary text-white shadow-premium"
                    : "text-muted-foreground hover:bg-secondary/30 hover:text-primary"
                  }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${active ? "text-white" : "text-primary"}`} />
                {sidebarOpen && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile */}
        {sidebarOpen && (
          <div className="p-4 bg-secondary/20 m-4 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-wellness-forest flex items-center justify-center text-white font-bold">UP</div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-wellness-forest truncate">Usha Prasad</p>
                <p className="text-[10px] text-muted-foreground font-bold truncate">Club Owner</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-border flex items-center justify-between px-8 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl border border-border bg-white text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="font-black text-wellness-forest text-xl md:text-2xl tracking-tight">
                {navItems.find(n => n.path === location.pathname)?.title || "Member Profile"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right mr-2">
              <p className="text-xs font-black text-primary uppercase tracking-wider">Welcome Back</p>
              <p className="text-sm font-bold text-wellness-forest">Manage Your Empire</p>
            </div>
            <button className="p-3 rounded-2xl bg-white border border-border text-muted-foreground hover:text-primary transition-all relative shadow-sm group">
              <Bell className="w-5 h-5 group-hover:animate-bounce" />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white" />
            </button>
            <div className="h-10 w-[1px] bg-border mx-2" />
            <Button variant="ghost" className="gap-3 px-2 hover:bg-transparent">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white text-sm font-black shadow-premium active:scale-95 transition-transform">UP</div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white to-transparent -z-10" />
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
