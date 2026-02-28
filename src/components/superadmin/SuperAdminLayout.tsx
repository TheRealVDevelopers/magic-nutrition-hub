import { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
    LayoutDashboard,
    Building2,
    GitBranch,
    LogOut,
    Menu,
    X,
    Shield,
    Settings,
    Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const navItems = [
    { title: "Dashboard", path: "/superadmin/dashboard", icon: LayoutDashboard, dev: false },
    { title: "Clubs", path: "/superadmin/clubs", icon: Building2, dev: false },
    { title: "Platform Tree", path: "/superadmin/tree", icon: GitBranch, dev: false },
    { title: "Settings", path: "/superadmin/settings", icon: Settings, dev: false },
    { title: "Theme Testing", path: "/superadmin/theme-test", icon: Palette, dev: true },
];

export default function SuperAdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { signOut, userProfile } = useAuth();

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        const handler = () => setSidebarOpen(mq.matches);
        handler();
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const handleNavClick = () => {
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Mobile backdrop */}
            <div
                aria-hidden
                className={`fixed inset-0 z-20 bg-black/40 transition-opacity duration-300 md:hidden ${sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={`fixed md:relative inset-y-0 left-0 z-30 h-full w-64 flex-shrink-0 bg-gray-950 transition-transform duration-300 ease-out flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${!sidebarOpen ? "md:w-16" : "md:w-64"}`}
            >
                {/* Brand */}
                <div
                    className={`p-4 border-b border-gray-800 flex items-center gap-3 min-h-[64px] ${!sidebarOpen ? "md:justify-center md:px-2" : ""
                        }`}
                >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    {sidebarOpen && (
                        <div className="overflow-hidden min-w-0">
                            <p className="font-bold text-sm text-white truncate">MNC Platform</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                                Super Admin
                            </p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => {
                        const active =
                            location.pathname === item.path ||
                            (item.path !== "/superadmin/dashboard" &&
                                location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleNavClick}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${!sidebarOpen ? "md:justify-center md:px-2" : ""
                                    } ${active
                                        ? "bg-violet-600 text-white"
                                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                    }`}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && (
                                    <span className="truncate flex-1">{item.title}</span>
                                )}
                                {sidebarOpen && item.dev && (
                                    <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                        DEV
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sign Out */}
                <div className={`p-3 border-t border-gray-800 ${!sidebarOpen ? "md:flex md:justify-center" : ""}`}>
                    {sidebarOpen && userProfile && (
                        <div className="flex items-center gap-2 mb-3 px-2">
                            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {userProfile.name?.[0]?.toUpperCase() || "S"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-white truncate">{userProfile.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">{userProfile.email}</p>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`text-gray-400 hover:text-red-400 hover:bg-gray-800 ${sidebarOpen ? "w-full justify-start" : "w-full justify-center"
                            }`}
                        onClick={() => signOut()}
                    >
                        <LogOut className="w-4 h-4" />
                        {sidebarOpen && <span className="ml-2 text-sm">Sign Out</span>}
                    </Button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 flex-shrink-0 z-10">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg border border-border bg-white text-muted-foreground hover:text-violet-600 transition-all"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
                            SUPER ADMIN
                        </span>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-[1400px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
