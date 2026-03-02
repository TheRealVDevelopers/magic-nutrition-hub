import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Wallet, CalendarCheck, GitBranch, UserCircle, Bell } from "lucide-react";
import { useClubContext } from "@/lib/clubDetection";

const GREEN = "#2d9653";

const NAV_ITEMS = [
    { label: "Home", path: "/member/dashboard", icon: Home },
    { label: "Wallet", path: "/member/wallet", icon: Wallet },
    { label: "Attendance", path: "/member/attendance", icon: CalendarCheck },
    { label: "Network", path: "/member/network", icon: GitBranch },
    { label: "Profile", path: "/member/profile", icon: UserCircle },
] as const;

interface MemberLayoutProps { children: ReactNode; }

export default function MemberLayout({ children }: MemberLayoutProps) {
    const { pathname } = useLocation();
    const { club } = useClubContext();

    return (
        <div style={{ fontFamily: "'Nunito', sans-serif", minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#f8fffe" }}>
            {/* Top header */}
            <header className="flex items-center justify-between px-4 py-3 bg-white border-b flex-shrink-0" style={{ borderColor: "#e0f0e9" }}>
                <div className="flex items-center gap-2 min-w-0">
                    {club?.logo ? (
                        <img src={club.logo} alt="" className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: GREEN }}>
                            {(club?.name ?? "C")[0]}
                        </div>
                    )}
                    <span className="text-sm font-bold truncate" style={{ color: GREEN }}>{club?.name ?? "Club"}</span>
                </div>
                <Link to="/member/announcements" className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Bell className="w-5 h-5" style={{ color: pathname === "/member/announcements" ? GREEN : "#9ca3af" }} />
                </Link>
            </header>

            {/* Scrollable content */}
            <main className="flex-1 overflow-y-auto pb-20">
                {children}
            </main>

            {/* Bottom navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex z-40" style={{ borderColor: "#e0f0e9" }}>
                {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                    const active = pathname === path || pathname.startsWith(path + "/");
                    return (
                        <Link
                            key={path}
                            to={path}
                            className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
                            style={{ color: active ? GREEN : "#9ca3af" }}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-bold">{label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
