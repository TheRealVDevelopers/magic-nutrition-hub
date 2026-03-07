import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Wallet, CalendarCheck, GitBranch, UserCircle, Bell } from "lucide-react";
import { useClubContext } from "@/lib/clubDetection";
import { useMyPendingRequest } from "@/hooks/useMemberWallet";
import { useAuth } from "@/lib/auth";
import { useUnreadAnnouncementsCount } from "@/hooks/member/useMemberAnnouncements";
import InstallPrompt from "../InstallPrompt";

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
    const { userProfile } = useAuth();
    const { hasPending } = useMyPendingRequest();
    const unreadCount = useUnreadAnnouncementsCount(
        club?.id ?? null,
        userProfile?.id ?? null,
        userProfile?.memberType,
        userProfile?.membershipTier
    );

    return (
        <div style={{ fontFamily: "'Nunito', sans-serif", minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#f8fffe" }}>
            {/* Top header */}
            <header className="member-header flex items-center justify-between px-4 py-3 bg-white border-b flex-shrink-0" style={{ borderColor: "#e0f0e9" }}>
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
                <Link to="/member/announcements" className="p-2 rounded-lg hover:bg-gray-50 transition-colors relative">
                    <Bell className="w-5 h-5" style={{ color: pathname === "/member/announcements" ? GREEN : "#9ca3af" }} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>
            </header>

            {/* Visiting Member Banner */}
            {userProfile?.memberType === "visiting" && (
                <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-amber-900 bg-amber-50 border-b border-amber-200">
                    <span>🟡</span>
                    <span>You are a <strong>Visiting Member</strong> — top up your wallet to become a Permanent Member!</span>
                    <Link to="/member/wallet" className="ml-auto text-xs underline shrink-0" style={{ color: "#92400e" }}>Top Up →</Link>
                </div>
            )}

            {/* Scrollable content */}
            <main className="member-content flex-1 overflow-y-auto pb-20">
                {children}
            </main>

            {/* Bottom navigation */}
            <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-white border-t flex z-40" style={{ borderColor: "#e0f0e9" }}>
                {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                    const active = pathname === path || pathname.startsWith(path + "/");
                    return (
                        <Link
                            key={path}
                            to={path}
                            className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
                            style={{ color: active ? GREEN : "#9ca3af" }}
                        >
                            <div className="relative">
                                <Icon className="w-5 h-5" />
                                {label === "Wallet" && hasPending && (
                                    <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold">{label}</span>
                        </Link>
                    );
                })}
            </nav>
            <InstallPrompt />
        </div>
    );
}
