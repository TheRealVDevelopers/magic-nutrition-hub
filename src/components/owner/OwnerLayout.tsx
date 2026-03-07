import { useState, ReactNode } from "react";
import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import OwnerSidebar from "./OwnerSidebar";
import InstallPrompt from "../InstallPrompt";

interface OwnerLayoutProps {
    children: ReactNode;
}

// Determine the base mount point from the current URL.
// AdminAccess is mounted at /admin/* or /login/* — derive which one.
function useBasePath(): string {
    const { pathname } = useLocation();
    if (pathname.startsWith("/login")) return "/login";
    if (pathname.startsWith("/admin")) return "/admin";
    return "/admin"; // safe fallback
}

export default function OwnerLayout({ children }: OwnerLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const base = useBasePath();

    return (
        <div
            style={{ display: "flex", height: "100dvh", overflow: "hidden", fontFamily: "'Nunito', sans-serif" }}
        >
            {/* Sidebar */}
            <OwnerSidebar
                base={base}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                {/* Mobile top bar */}
                <header
                    className="md:hidden flex items-center gap-3 px-4 h-14 flex-shrink-0 bg-white border-b"
                    style={{ borderColor: "#e0f0e9" }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl border text-gray-500 hover:text-gray-800 transition-colors"
                        style={{ borderColor: "#e0f0e9" }}
                        aria-label="Open navigation"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-black text-gray-700" style={{ fontFamily: "'Nunito', sans-serif" }}>
                        Menu
                    </span>
                </header>

                {/* Scrollable content area */}
                <main style={{ flex: 1, overflowY: "auto", background: "#f8fafc" }}>
                    <div className="main-content">
                        {children}
                    </div>
                </main>
            </div>
            <InstallPrompt />
        </div>
    );
}
