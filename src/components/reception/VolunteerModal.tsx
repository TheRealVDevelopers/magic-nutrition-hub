import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useClubContext } from "@/lib/clubDetection";
import { useActiveVolunteers, useCompleteVolunteerSession } from "@/hooks/useVolunteers";
import { X, LogIn, LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { VolunteerSession } from "@/types/firestore";
import { format } from "date-fns";

interface Props {
    onClose: () => void;
}

function formatSince(ts: { toDate: () => Date } | null): string {
    if (!ts) return "";
    const d = ts.toDate();
    return format(d, "h:mm a");
}

function LogoutVolunteerQR({
    session,
    onBack,
}: {
    session: VolunteerSession;
    onBack: () => void;
}) {
    const completeSession = useCompleteVolunteerSession();
    const [done, setDone] = useState(false);
    const [minutes, setMinutes] = useState<number | null>(null);

    // The logout QR encodes a URL that the MEMBER scans from their phone
    // We use a simplified approach: on reception, show the QR and also provide a "mark done" button
    const qrValue = JSON.stringify({ type: "volunteer-logout", sessionId: session.id, memberId: session.memberId });

    const handleManualLogout = async () => {
        const mins = await completeSession.mutateAsync({
            sessionId: session.id,
            loginTime: session.loginTime,
        });
        setMinutes(mins);
        setDone(true);
        setTimeout(() => onBack(), 3000);
    };

    if (done) {
        const hours = Math.floor((minutes ?? 0) / 60);
        const mins = (minutes ?? 0) % 60;
        const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;
        return (
            <div className="text-center py-8 space-y-4">
                <div className="text-5xl">👏</div>
                <h3 className="text-xl font-black text-gray-800">
                    Goodbye {session.memberName}!
                </h3>
                <p className="text-gray-500">You volunteered for {timeStr} today</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
                <h3 className="font-bold text-gray-700">{session.memberName}'s Logout</h3>
            </div>

            <div className="flex flex-col items-center gap-4 py-4">
                <div className="bg-white p-4 rounded-2xl shadow-md border">
                    <QRCodeSVG value={qrValue} size={180} />
                </div>
                <p className="text-sm text-gray-500 text-center">
                    Ask {session.memberName} to scan this QR from their member app
                </p>
                <div className="w-full border-t pt-4">
                    <p className="text-xs text-center text-gray-400 mb-3">— or —</p>
                    <Button
                        onClick={handleManualLogout}
                        disabled={completeSession.isPending}
                        className="w-full rounded-xl text-white"
                        style={{ backgroundColor: "#2d9653" }}
                    >
                        {completeSession.isPending ? "Logging out..." : "Mark as Logged Out"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function VolunteerModal({ onClose }: Props) {
    const { club } = useClubContext();
    const [tab, setTab] = useState<"login" | "logout">("login");
    const [token, setToken] = useState(Date.now().toString());
    const [selectedSession, setSelectedSession] = useState<VolunteerSession | null>(null);
    const { sessions, loading } = useActiveVolunteers();

    // Refresh QR token every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => setToken(Date.now().toString()), 60000);
        return () => clearInterval(interval);
    }, []);

    const qrValue = JSON.stringify({
        type: "volunteer-login",
        clubId: club?.id ?? "",
        token,
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden"
                style={{ fontFamily: "Nunito, sans-serif", maxHeight: "90vh" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-xl font-black text-gray-800">🙋 Volunteer</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    {(["login", "logout"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setSelectedSession(null); }}
                            className={`flex-1 py-3 text-sm font-bold capitalize transition-colors ${tab === t
                                    ? "border-b-2 border-green-600 text-green-700"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {t === "login" ? <><LogIn className="w-4 h-4 inline mr-1" />Login</> : <><LogOut className="w-4 h-4 inline mr-1" />Logout</>}
                        </button>
                    ))}
                </div>

                <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
                    {tab === "login" ? (
                        <div className="flex flex-col items-center gap-5">
                            <h3 className="text-lg font-bold text-gray-700">Volunteer Login</h3>
                            <div className="bg-white p-4 rounded-2xl shadow-md border-2 border-green-200">
                                <QRCodeSVG value={qrValue} size={200} />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-sm text-gray-600 font-medium">
                                    Open your member app → tap Volunteer Login → scan this QR code
                                </p>
                                <Badge variant="outline" className="text-xs text-gray-400">
                                    Refreshes every 60 seconds
                                </Badge>
                            </div>
                        </div>
                    ) : selectedSession ? (
                        <LogoutVolunteerQR
                            session={selectedSession}
                            onBack={() => setSelectedSession(null)}
                        />
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-700">Who's leaving?</h3>
                            {loading ? (
                                <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-400 text-sm">No active volunteers right now</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {sessions.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => setSelectedSession(s)}
                                            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-green-300 hover:bg-green-50 transition-all"
                                        >
                                            <Avatar className="h-16 w-16">
                                                {s.memberPhoto && <AvatarImage src={s.memberPhoto} />}
                                                <AvatarFallback className="bg-green-100 text-green-700 font-bold text-xl">
                                                    {s.memberName[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-sm font-bold text-gray-800 text-center line-clamp-1">
                                                {s.memberName}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                Since {formatSince(s.loginTime as any)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
